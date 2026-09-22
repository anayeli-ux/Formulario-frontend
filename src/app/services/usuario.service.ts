import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Observable,
  switchMap
} from 'rxjs';

import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

import { AuthService } from './auth.service';


/**
 * Datos que Spring Boot permite recibir
 * para crear o actualizar un usuario.
 */
export interface UsuarioRequest {

  nombre: string;

  primerApellido: string;

  password: string;

  telefono: string;

  codigoPostal: string;

  direccion: string;

  fechaNacimiento: string;

  email: string;


  telefonos?: Array<{
    tipo: string;
    valor: string;
  }>;


  correos?: Array<{
    tipo: string;
    valor: string;
  }>;


  direcciones?: Array<{
    tipo: string;
    valor: string;
  }>;

}


@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  // =========================
  // URL BASE
  // =========================

  private apiUrl =
    `${environment.apiUrl}/usuarios`;


  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}


  // =========================
  // OBTENER USUARIOS ACTIVOS
  // =========================

  listarUsuarios(): Observable<Usuario[]> {

    return this.http.get<Usuario[]>(
      this.apiUrl,
      {
        withCredentials: true
      }
    );

  }


  // =========================
  // OBTENER USUARIOS ELIMINADOS
  // =========================

  listarUsuariosEliminados(): Observable<Usuario[]> {

    return this.http.get<Usuario[]>(
      `${this.apiUrl}/eliminados`,
      {
        withCredentials: true
      }
    );

  }


  // =========================
  // OBTENER MI PERFIL
  // =========================

  /**
   * GET /api/usuarios/me
   *
   * La cookie HttpOnly que contiene el JWT
   * se envía automáticamente.
   *
   * Angular NO lee el JWT.
   */
  obtenerMiPerfil(): Observable<Usuario> {

    return this.http.get<Usuario>(
      `${this.apiUrl}/me`,
      {
        withCredentials: true
      }
    );

  }


  // =========================
  // CREAR USUARIO
  // =========================

  /**
   * Primero solicita CSRF.
   *
   * Después realiza el POST.
   */
  crearUsuario(
    usuario: UsuarioRequest
  ): Observable<Usuario> {

    return this.authService.obtenerCsrf().pipe(

      switchMap(() =>

        this.http.post<Usuario>(
          this.apiUrl,
          usuario,
          {
            withCredentials: true
          }
        )

      )

    );

  }


  // =========================
  // ACTUALIZAR USUARIO
  // =========================

  /**
   * Primero solicita CSRF.
   *
   * Después realiza el PUT.
   */
  actualizarUsuario(
    id: number,
    usuario: UsuarioRequest
  ): Observable<Usuario> {

    return this.authService.obtenerCsrf().pipe(

      switchMap(() =>

        this.http.put<Usuario>(
          `${this.apiUrl}/${id}`,
          usuario,
          {
            withCredentials: true
          }
        )

      )

    );

  }


  // =========================
  // ELIMINACIÓN LÓGICA
  // =========================

  /**
   * Primero solicita CSRF.
   *
   * Después realiza el DELETE.
   */
  eliminarUsuario(
    id: number
  ): Observable<void> {

    return this.authService.obtenerCsrf().pipe(

      switchMap(() =>

        this.http.delete<void>(
          `${this.apiUrl}/${id}`,
          {
            withCredentials: true
          }
        )

      )

    );

  }


  // =========================
  // REACTIVAR USUARIO
  // =========================

  /**
   * Reactivar modifica información.
   *
   * Por eso también solicita primero
   * un token CSRF.
   */
  reactivarUsuario(
    id: number
  ): Observable<Usuario> {

    return this.authService.obtenerCsrf().pipe(

      switchMap(() =>

        this.http.put<Usuario>(
          `${this.apiUrl}/${id}/reactivar`,
          {},
          {
            withCredentials: true
          }
        )

      )

    );

  }

}