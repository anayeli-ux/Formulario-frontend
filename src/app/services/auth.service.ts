import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  acceso: boolean;
  usuario: {
    id: number;
    email: string;
    rol: string;
  };
}

/**
 * Usuario autenticado que devuelve el backend
 * al consultar el perfil de la sesión.
 */
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

  /**
   * Caché en memoria del usuario autenticado.
   *
   * Es solo una comodidad para no repetir la petición en cada
   * navegación. NUNCA es la fuente de verdad ni se persiste:
   * la sesión la decide siempre el backend a través de la
   * cookie HttpOnly. Si el backend responde 401/403, esta caché
   * se invalida.
   */
  private usuarioActual: UsuarioSesion | null = null;

  constructor(
    private http: HttpClient
  ) {}

  // =========================
  // INICIAR SESIÓN
  // =========================

  /**
   * El backend responde con Set-Cookie (HttpOnly) y el navegador
   * guarda la cookie. El frontend NO recibe ni almacena el token.
   */
  login(
    credenciales: { identificador: string; password: string }
  ): Observable<LoginResponse> {
    const datosAEnviar = {
      usuario: credenciales.identificador,
      password: credenciales.password
    };

    return this.http
      .post<LoginResponse>(
        `${this.authUrl}/login`,
        datosAEnviar,
        { withCredentials: true }
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

  // =========================
  // VERIFICAR SESIÓN (ASÍNCRONO)
  // =========================

  /**
   * Pregunta al backend si la cookie de sesión sigue siendo válida
   * y devuelve el usuario autenticado.
   *
   * Con cookie HttpOnly el frontend no puede leer el token, por lo
   * que esta llamada es la ÚNICA forma legítima de conocer el estado
   * de la sesión. Si el backend responde con error, la sesión no es
   * válida.
   */
  verificarSesion(): Observable<UsuarioSesion> {
    return this.http
      .get<UsuarioSesion>(
        this.perfilUrl,
        { withCredentials: true }
      )
      .pipe(
        tap(usuario => {
          this.usuarioActual = usuario;
        })
      );
  }

  /**
   * Devuelve el usuario ya verificado en memoria.
   * Es null hasta que se haya resuelto `verificarSesion()`.
   */
  getUsuarioActual(): UsuarioSesion | null {
    return this.usuarioActual;
  }

  /**
   * Compatibilidad con código legado que aún invoca una comprobación
   * de sesión. En la estrategia con cookie HttpOnly la fuente de verdad
   * es la respuesta del backend, no un valor del navegador.
   */
  haySesion(): boolean {
    return this.usuarioActual !== null;
  }

  // =========================
  // CERRAR SESIÓN
  // =========================

  /**
   * Solicita al backend invalidar la sesión (borrar la cookie).
   * El frontend no puede borrar una cookie HttpOnly por sí mismo.
   */
  cerrarSesion(): Observable<void> {
    this.usuarioActual = null;

    return this.http.post<void>(
      this.logoutUrl,
      {},
      { withCredentials: true }
    );
  }

  /**
   * Limpia únicamente el estado en memoria.
   * Se usa cuando el backend confirma que la sesión ya no es válida
   * (401/403), sin necesidad de volver a llamar al logout.
   */
  limpiarSesionLocal(): void {
    this.usuarioActual = null;
  }

}