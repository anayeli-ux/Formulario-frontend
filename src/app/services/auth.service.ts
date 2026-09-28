import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Observable,
  tap,
  switchMap,
  catchError,
  throwError,
  of
} from 'rxjs';

import { environment } from '../../environments/environment';
import { limpiarCacheUsuariosPersistida } from './usuario-cache.storage';

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

  verificarSesion(): Observable<UsuarioSesion> {
    return this.http
      .get<UsuarioSesion>(
        this.perfilUrl,
        {
          withCredentials: true
        }
      )
      .pipe(
        tap(usuario => {
          this.estadoUsuarioActual.set(usuario);
        }),
        catchError(error => {
          this.estadoUsuarioActual.set(null);
          return throwError(() => error);
        })
      );
  }

  obtenerSesion(): Observable<UsuarioSesion> {
    const usuario = this.usuarioActual();
    return usuario ? of(usuario) : this.verificarSesion();
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
        this.estadoUsuarioActual.set(null);
      })
    );
  }

  limpiarSesionLocal(): void {
    limpiarCacheUsuariosPersistida();
    this.estadoUsuarioActual.set(null);
  }
}