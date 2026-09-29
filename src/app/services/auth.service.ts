import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Observable,
  tap,
  switchMap,
  catchError,
  throwError,
  of,
  map,
  finalize,
  shareReplay
} from 'rxjs';

import { environment } from '../../environments/environment';
import { limpiarCacheUsuariosPersistida } from './usuario-cache.storage';
import { Usuario } from '../models/usuario.model';

export interface LoginResponse {
  acceso: boolean;

  usuario: {
    id: number;
    email: string;
    rol: string;
  };
}
export interface UsuarioSesion {
  id: number;
  email: string;
  rol: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl =
    `${environment.apiUrl}${environment.auth.login}`;

  private logoutUrl =
    `${environment.apiUrl}${environment.auth.logout}`;

  private perfilUrl =
    `${environment.apiUrl}${environment.auth.perfil}`;

  private csrfUrl =
    `${environment.apiUrl}${environment.auth.csrf}`;

  private readonly estadoUsuarioActual = signal<UsuarioSesion | null>(null);
  readonly usuarioActual = this.estadoUsuarioActual.asReadonly();
  readonly haySesion = computed(() => this.usuarioActual() !== null);
  private readonly estadoPerfilActual = signal<Usuario | null>(null);
  readonly perfilActual = this.estadoPerfilActual.asReadonly();
  private sesionVerificada = false;
  private solicitudPerfil?: Observable<Usuario>;


  constructor(
    private http: HttpClient
  ) {}

  login(
    credenciales: {
      identificador: string;
      password: string;
    }
  ): Observable<LoginResponse> {
    const datosAEnviar = {
      usuario: credenciales.identificador,
      password: credenciales.password
    };

    return this.http
      .post<LoginResponse>(
        this.authUrl,
        datosAEnviar,
        {
          withCredentials: true
        }
      )
      .pipe(
        tap(response => {
          this.estadoPerfilActual.set(null);
          this.sesionVerificada = true;
          if (response?.acceso === true) {
            limpiarCacheUsuariosPersistida();
          }
          this.estadoUsuarioActual.set(response?.acceso === true ? response.usuario : null);
        })
      );
  }

  obtenerCsrf(): Observable<void> {
    return this.http.get<void>(
      this.csrfUrl,
      {
        withCredentials: true
      }
    );
  }

  obtenerPerfil(): Observable<Usuario> {
    const perfil = this.perfilActual();
    if (perfil) {
      return of(perfil);
    }

    if (this.solicitudPerfil) {
      return this.solicitudPerfil;
    }

    const solicitud = this.http.get<Usuario>(
      this.perfilUrl,
      { withCredentials: true }
    ).pipe(
      tap(usuario => {
        this.estadoPerfilActual.set(usuario);
        if (usuario.id !== undefined && usuario.rol) {
          this.estadoUsuarioActual.set({
            id: usuario.id,
            email: usuario.correos?.find(contacto => contacto.tipo === 'PRINCIPAL')?.valor ?? '',
            rol: usuario.rol
          });
        } else {
          this.estadoUsuarioActual.set(null);
        }
        this.sesionVerificada = true;
      }),
      catchError(error => {
        this.estadoPerfilActual.set(null);
        this.estadoUsuarioActual.set(null);
        this.sesionVerificada = true;
        return throwError(() => error);
      }),
      finalize(() => this.solicitudPerfil = undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.solicitudPerfil = solicitud;
    return solicitud;
  }

  actualizarPerfilSesion(usuario: Usuario): void {
    const sesion = this.usuarioActual();
    if (!sesion || usuario.id !== sesion.id) {
      return;
    }

    const perfilActualizado = {
      ...(this.perfilActual() ?? {}),
      ...usuario,
      id: sesion.id
    };
    const correoPrincipal = perfilActualizado.correos
      ?.find(contacto => contacto.tipo === 'PRINCIPAL')?.valor ?? sesion.email;

    this.estadoPerfilActual.set(perfilActualizado);
    this.estadoUsuarioActual.set({
      id: sesion.id,
      email: correoPrincipal,
      rol: perfilActualizado.rol ?? sesion.rol
    });
  }

  verificarSesion(): Observable<UsuarioSesion> {
    return this.obtenerPerfil().pipe(
      map(() => this.usuarioActual()!)
    );
  }

  obtenerSesion(): Observable<UsuarioSesion | null> {
    const usuario = this.usuarioActual();
    if (usuario) {
      return of(usuario);
    }
    return this.sesionVerificada ? of(null) : this.verificarSesion();
  }

  cerrarSesion(): Observable<void> {
    return this.obtenerCsrf().pipe(
      switchMap(() =>
        this.http.post<void>(
          this.logoutUrl,
          {},
          {
            withCredentials: true
          }
        )
      ),

      tap(() => {
        limpiarCacheUsuariosPersistida();
        this.estadoPerfilActual.set(null);
        this.estadoUsuarioActual.set(null);
        this.sesionVerificada = true;
      })
    );
  }

  limpiarSesionLocal(): void {
    limpiarCacheUsuariosPersistida();
    this.estadoPerfilActual.set(null);
    this.estadoUsuarioActual.set(null);
    this.sesionVerificada = true;
  }
}