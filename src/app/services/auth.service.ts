import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Observable,
  map,
  tap,
  switchMap,
  catchError,
  throwError,
  of,
  finalize,
  shareReplay
} from 'rxjs';

import { environment } from '../../environments/environment';
import { limpiarCacheUsuariosPersistida } from './usuario-cache.storage';
import { Usuario } from '../models/usuario.model';
import { ApiResponse } from '../models/api-response.model';

export interface LoginResponse {
  acceso: boolean;

  usuario: {
    id: number;
    email: string;
    rol: string;
    nombre?: string;
    primerApellido?: string;
  };
}
export interface UsuarioSesion {
  id: number;
  email: string;
  rol: string;
  nombre?: string;
  primerApellido?: string;
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

  private identidadUrl =
    `${environment.apiUrl}${environment.auth.identidad}`;

  private csrfUrl =
    `${environment.apiUrl}${environment.auth.csrf}`;

  private readonly estadoUsuarioActual = signal<UsuarioSesion | null>(null);
  readonly usuarioActual = this.estadoUsuarioActual.asReadonly();
  private readonly estadoPerfilActual = signal<Usuario | null>(null);
  private sesionVerificada = false;
  private solicitudPerfil?: Observable<Usuario>;
  private solicitudIdentidad?: Observable<UsuarioSesion>;


  constructor(
    private http: HttpClient
  ) {}

  login(
    credenciales: {
      identificador: string;
      password: string;
    }
  ): Observable<ApiResponse<LoginResponse>> {
    const datosAEnviar = {
      usuario: credenciales.identificador,
      password: credenciales.password
    };

    return this.http
      .post<ApiResponse<LoginResponse>>(
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
          if (response.data?.acceso === true) {
            limpiarCacheUsuariosPersistida();
          }
          this.estadoUsuarioActual.set(response.data?.acceso === true ? response.data.usuario : null);
        })
      );
  }

  obtenerCsrf(): Observable<void> {
    return this.http.get<ApiResponse<unknown>>(
      this.csrfUrl,
      {
        withCredentials: true
      }
    ).pipe(map(() => undefined));
  }

  obtenerPerfil(): Observable<Usuario> {
    const perfil = this.estadoPerfilActual();
    if (perfil) {
      return of(perfil);
    }

    if (this.solicitudPerfil) {
      return this.solicitudPerfil;
    }

    const solicitud = this.http.get<ApiResponse<Usuario>>(
      this.perfilUrl,
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      tap(usuario => {
        this.estadoPerfilActual.set(usuario);
        if (usuario.id !== undefined && usuario.rol) {
          this.estadoUsuarioActual.set({
            id: usuario.id,
            email: usuario.correos?.find(contacto => contacto.tipo === 'PRINCIPAL')?.valor ?? '',
            rol: usuario.rol,
            nombre: usuario.nombre,
            primerApellido: usuario.primerApellido
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

    const correoPrincipal = usuario.correos
      ?.find(contacto => contacto.tipo === 'PRINCIPAL')?.valor ?? sesion.email;

    this.estadoPerfilActual.set(null);
    this.estadoUsuarioActual.set({
      id: sesion.id,
      email: correoPrincipal,
      rol: usuario.rol ?? sesion.rol,
      nombre: usuario.nombre,
      primerApellido: usuario.primerApellido
    });
  }

  private consultarIdentidad(): Observable<UsuarioSesion> {
    const identidad = this.usuarioActual();
    if (identidad?.nombre) return of(identidad);
    if (this.solicitudIdentidad) return this.solicitudIdentidad;

    const solicitud = this.http.get<ApiResponse<UsuarioSesion>>(this.identidadUrl, { withCredentials: true }).pipe(
      map(response => response.data),
      tap(usuario => {
        this.estadoUsuarioActual.set(usuario);
        this.sesionVerificada = true;
      }),
      catchError(error => {
        this.estadoUsuarioActual.set(null);
        this.estadoPerfilActual.set(null);
        this.sesionVerificada = true;
        return throwError(() => error);
      }),
      finalize(() => this.solicitudIdentidad = undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    this.solicitudIdentidad = solicitud;
    return solicitud;
  }

  obtenerSesion(): Observable<UsuarioSesion | null> {
    const usuario = this.usuarioActual();
    if (usuario) {
      return of(usuario);
    }
    return this.sesionVerificada ? of(null) : this.consultarIdentidad();
  }

  cerrarSesion(): Observable<void> {
    return this.obtenerCsrf().pipe(
      switchMap(() =>
        this.http.post<ApiResponse<null>>(
          this.logoutUrl,
          {},
          {
            withCredentials: true
          }
        ).pipe(map(() => undefined))
      ),
      tap(() => this.limpiarSesionLocal())
    );
  }

  limpiarSesionLocal(): void {
    limpiarCacheUsuariosPersistida();
    this.estadoPerfilActual.set(null);
    this.estadoUsuarioActual.set(null);
    this.sesionVerificada = true;
  }
}