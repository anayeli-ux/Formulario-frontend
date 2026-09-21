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
  acceso: boolean;
  token: string;
  usuario: {
    id: number;
    email: string;
    rol: string;
  };
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

  private guardarSesion(usuario: LoginResponse['usuario'] | null | undefined, token?: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
    }

  }

  // Conexión real al backend para iniciar sesión
  login(credenciales: { identificador: string; password: string }): Observable<LoginResponse> {
    const datosAEnviar = {
      usuario: credenciales.identificador,
      password: credenciales.password
    };

    return this.http.post<LoginResponse>(`${this.authUrl}/login`, datosAEnviar).pipe(
      tap(response => {
        if (
          isPlatformBrowser(this.platformId) &&
          response &&
          response.acceso === true
        ) {
          this.guardarSesion(response.usuario, response.token);
        }
      })
    );
  }

  haySesion(): boolean {
    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return false;
    }

    return !!localStorage.getItem('token');
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
      localStorage.removeItem('token');
    }
  }

}