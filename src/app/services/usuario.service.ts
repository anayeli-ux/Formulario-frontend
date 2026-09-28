import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Observable,
  map,
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

  password?: string;

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
    codigoPostal: string;
  }>;

}

interface UsuarioApiResponse {
  id?: number;
  nombre: string;
  primerApellido: string;
  fechaNacimiento: string;
  fechaBaja?: string | null;
  rol?: string;
  telefono?: string;
  codigoPostal?: string;
  direccion?: string;
  email?: string;
  telefonos?: Array<{ tipo?: string | null; valor?: string | null }>;
  correos?: Array<{ tipo?: string | null; valor?: string | null }>;
  direcciones?: Array<{ tipo?: string | null; valor?: string | null; codigoPostal?: string | null }>;
}

function contactoPrincipal<T extends { tipo?: string | null }>(contactos: T[] = []): T | undefined {
  return contactos.find(contacto => contacto.tipo?.trim().toLowerCase() === 'principal') ?? contactos[0];
}

function mapearUsuario(usuario: UsuarioApiResponse): Usuario {
  const telefono = contactoPrincipal(usuario.telefonos);
  const correo = contactoPrincipal(usuario.correos);
  const direccion = contactoPrincipal(usuario.direcciones);

  return {
    ...usuario,
    telefono: usuario.telefono ?? telefono?.valor ?? '',
    email: usuario.email ?? correo?.valor ?? '',
    direccion: usuario.direccion ?? direccion?.valor ?? '',
    codigoPostal: usuario.codigoPostal ?? direccion?.codigoPostal ?? '',
    estado: '',
    municipio: '',
    activo: usuario.fechaBaja == null,
    telefonos: (usuario.telefonos ?? []).map(item => ({
      ...item,
      tipo: item.tipo?.trim() || 'Sin categoría',
      valor: item.valor ?? ''
    })),
    correos: (usuario.correos ?? []).map(item => ({
      ...item,
      tipo: item.tipo?.trim() || 'Sin categoría',
      valor: item.valor ?? ''
    })),
    direcciones: (usuario.direcciones ?? []).map(item => ({
      ...item,
      tipo: item.tipo?.trim() || 'Sin categoría',
      valor: item.valor ?? '',
      codigoPostal: item.codigoPostal ?? ''
    }))
  };
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

    return this.http.get<UsuarioApiResponse[]>(
      this.apiUrl,
      {
        withCredentials: true
      }
    ).pipe(map(usuarios => usuarios.map(mapearUsuario)));

  }


  // =========================
  // OBTENER USUARIOS ELIMINADOS
  // =========================

  listarUsuariosEliminados(): Observable<Usuario[]> {

    return this.http.get<UsuarioApiResponse[]>(
      `${this.apiUrl}/eliminados`,
      {
        withCredentials: true
      }
    ).pipe(map(usuarios => usuarios.map(mapearUsuario)));

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

    return this.http.get<UsuarioApiResponse>(
      `${this.apiUrl}/me`,
      {
        withCredentials: true
      }
    ).pipe(map(mapearUsuario));

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

        this.http.post<UsuarioApiResponse>(
          this.apiUrl,
          usuario,
          {
            withCredentials: true
          }
        ).pipe(map(mapearUsuario))

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

        this.http.put<UsuarioApiResponse>(
          `${this.apiUrl}/${id}`,
          usuario,
          {
            withCredentials: true
          }
        ).pipe(map(mapearUsuario))

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

        this.http.put<UsuarioApiResponse>(
          `${this.apiUrl}/${id}/reactivar`,
          {},
          {
            withCredentials: true
          }
        ).pipe(map(mapearUsuario))

      )

    );

  }

}