import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  map,
  Observable,
  switchMap,
  tap
} from 'rxjs';

import { PaginaAdministradores, PaginaUsuarios, Usuario, UsuarioContactos } from '../models/usuario.model';
import { environment } from '../../environments/environment';

import { AuthService } from './auth.service';

/**
 * Datos que Spring Boot permite recibir
 * para crear o actualizar un usuario.
 */
interface UsuarioRequestBase {

  nombre: string;

  primerApellido: string;

  fechaNacimiento: string;

  telefonos: Array<{
    id?: number;
    tipo: string;
    valor: string;
  }>;

  correos: Array<{
    id?: number;
    tipo: string;
    valor: string;
  }>;

  direcciones: Array<{
    id?: number;
    tipo: string;
    valor: string;
    codigoPostal: string;
  }>;

}

export interface UsuarioRequest extends UsuarioRequestBase {
  password: string;
}

export interface UsuarioActualizarRequest extends UsuarioRequestBase {
  password?: string;
}

export class RespuestaUsuariosIncompatibleError extends Error {
  constructor() {
    super('La API está devolviendo la lista antigua. Reinicia el backend para aplicar la respuesta paginada y compacta.');
    this.name = 'RespuestaUsuariosIncompatibleError';
  }
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

  listarUsuarios(page = 0, size = 5, search = ''): Observable<PaginaUsuarios> {
    return this.http.get<unknown>(
      this.apiUrl,
      {
        withCredentials: true,
        params: { page, size, search }
      }
    ).pipe(map(respuesta => this.validarPaginaUsuarios(respuesta)));
  }


  // =========================
  // OBTENER USUARIOS ELIMINADOS
  // =========================

  listarUsuariosEliminados(page = 0, size = 5, search = ''): Observable<PaginaUsuarios> {
    return this.http.get<unknown>(
      `${this.apiUrl}/eliminados`,
      {
        withCredentials: true,
        params: { page, size, search }
      }
    ).pipe(map(respuesta => this.validarPaginaUsuarios(respuesta)));
  }

  listarAdministradores(page = 0, eliminados = false): Observable<PaginaAdministradores> {
    return this.http.get<unknown>(`${this.apiUrl}/administradores`, {
      withCredentials: true,
      params: { page, size: 5, eliminados }
    }).pipe(map(respuesta => this.validarPaginaAdministradores(respuesta)));
  }

  obtenerUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  obtenerContactosUsuario(id: number): Observable<UsuarioContactos> {
    return this.http.get<UsuarioContactos>(`${this.apiUrl}/${id}/contactos`, { withCredentials: true });
  }

  private validarPaginaUsuarios(respuesta: unknown): PaginaUsuarios {
    if (!respuesta || typeof respuesta !== 'object') {
      throw new RespuestaUsuariosIncompatibleError();
    }

    const pagina = respuesta as Partial<PaginaUsuarios>;
    const camposResumen = new Set([
      'id', 'nombre', 'primerApellido', 'rol', 'telefono', 'correo', 'codigoPostal'
    ]);
    const contenidoValido = Array.isArray(pagina.content)
      && pagina.content.every(usuario =>
        usuario !== null
        && typeof usuario === 'object'
        && typeof usuario.id === 'number'
        && typeof usuario.nombre === 'string'
        && typeof usuario.primerApellido === 'string'
        && (typeof usuario.rol === 'string' || typeof usuario.rol === 'number')
        && Object.keys(usuario).every(campo => camposResumen.has(campo))
      );

    if (!contenidoValido || typeof pagina.totalElements !== 'number') {
      throw new RespuestaUsuariosIncompatibleError();
    }

    return pagina as PaginaUsuarios;
  }

  private validarPaginaAdministradores(respuesta: unknown): PaginaAdministradores {
    if (!respuesta || typeof respuesta !== 'object') {
      throw new RespuestaUsuariosIncompatibleError();
    }
    const pagina = respuesta as Partial<PaginaAdministradores>;
    const campos = new Set(['id', 'nombre', 'primerApellido', 'correo']);
    const contenidoValido = Array.isArray(pagina.content)
      && pagina.content.every(administrador =>
        administrador !== null
        && typeof administrador === 'object'
        && typeof administrador.id === 'number'
        && typeof administrador.nombre === 'string'
        && typeof administrador.primerApellido === 'string'
        && Object.keys(administrador).every(campo => campos.has(campo))
      );
    if (!contenidoValido || typeof pagina.totalElements !== 'number') {
      throw new RespuestaUsuariosIncompatibleError();
    }
    return pagina as PaginaAdministradores;
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
    return this.authService.obtenerPerfil();
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
    usuario: UsuarioActualizarRequest
  ): Observable<void> {

    return this.authService.obtenerCsrf().pipe(
      switchMap(() =>
        this.http.put<void>(
          `${this.apiUrl}/${id}`,
          usuario,
          {
            withCredentials: true
          }
        )
      )
    ).pipe(tap(() => this.authService.actualizarPerfilSesion({
      id,
      nombre: usuario.nombre,
      primerApellido: usuario.primerApellido,
      fechaNacimiento: usuario.fechaNacimiento,
      telefonos: usuario.telefonos,
      correos: usuario.correos,
      direcciones: usuario.direcciones
    })));

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