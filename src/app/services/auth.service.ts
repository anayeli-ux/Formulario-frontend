import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Observable,
  tap,
  switchMap
} from 'rxjs';

import { environment } from '../../environments/environment';

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

  private usuarioActual: UsuarioSesion | null = null;


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
            this.usuarioActual = response.usuario;
          } else {
            this.usuarioActual = null;
          }
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
          this.usuarioActual = usuario;
        })
      );
  }

  getUsuarioActual(): UsuarioSesion | null {
    return this.usuarioActual;
  }
  haySesion(): boolean {
    return this.usuarioActual !== null;
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
        this.usuarioActual = null;
      })
    );
  }

  limpiarSesionLocal(): void {
    this.usuarioActual = null;
  }
}