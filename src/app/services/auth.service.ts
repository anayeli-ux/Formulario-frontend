import {
  Inject,
  Injectable,
  PLATFORM_ID
} from '@angular/core';

import {
  isPlatformBrowser
} from '@angular/common';

import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  acceso?: boolean;
  token?: string;
  usuario?: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl = `${environment.apiUrl}/auth`;

  constructor(
    @Inject(PLATFORM_ID)
    private platformId: Object,
    private http: HttpClient
  ) {}

  // Conexión real al backend para iniciar sesión
  login(credenciales: { identificador: string; password: string }): Observable<LoginResponse> {
    const datosAEnviar = {
      usuario: credenciales.identificador,
      password: credenciales.password
    };

    return this.http.post<LoginResponse>(`${this.authUrl}/admin`, datosAEnviar).pipe(
      tap(response => {
        if (
          isPlatformBrowser(this.platformId) &&
          response &&
          (response.acceso === true || response.token)
        ) {
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
          localStorage.setItem('adminSesion', 'true');
          localStorage.setItem('usuario', JSON.stringify(response.usuario || {}));
        }
      })
    );
  }

  iniciarSesion(): void {
    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {
      localStorage.setItem(
        'adminSesion',
        'true'
      );
    }
  }

  haySesion(): boolean {
    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return false;
    }

    return (
      localStorage.getItem(
        'adminSesion'
      ) === 'true' || !!localStorage.getItem('token')
    );
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('token');
  }

  cerrarSesion(): void {
    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {
      localStorage.removeItem(
        'adminSesion'
      );
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  }

}