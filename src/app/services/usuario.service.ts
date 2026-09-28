import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  finalize,
  of,
  Observable,
  shareReplay,
  switchMap,
  tap
} from 'rxjs';

import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

import { AuthService } from './auth.service';
import { USUARIO_CACHE_STORAGE_PREFIX } from './usuario-cache.storage';

interface CacheUsuariosPersistida {
  usuarioId: number;
  guardadoEn: number;
  usuarios: Usuario[];
}


/**
 * Datos que Spring Boot permite recibir
 * para crear o actualizar un usuario.
 */
interface UsuarioRequestBase {

  nombre: string;

  primerApellido: string;

  fechaNacimiento: string;

  telefonos: Array<{
    tipo: string;
    valor: string;
  }>;

  correos: Array<{
    tipo: string;
    valor: string;
  }>;

  direcciones: Array<{
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


@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  // =========================
  // URL BASE
  // =========================

  private apiUrl =
    `${environment.apiUrl}/usuarios`;

  private readonly cacheUsuariosActivos = signal<Usuario[] | null>(null);
  private readonly cacheUsuariosEliminados = signal<Usuario[] | null>(null);
  private solicitudUsuariosActivos?: Observable<Usuario[]>;
  private solicitudUsuariosEliminados?: Observable<Usuario[]>;
  private readonly cacheTtlMs = 5 * 60 * 1000;


  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}


  // =========================
  // OBTENER USUARIOS ACTIVOS
  // =========================

  listarUsuarios(): Observable<Usuario[]> {
    const cache = this.cacheUsuariosActivos() ?? this.leerCachePersistida('activos');
    if (cache) {
      this.cacheUsuariosActivos.set(cache);
      return of(cache);
    }

    if (this.solicitudUsuariosActivos) {
      return this.solicitudUsuariosActivos;
    }

    const solicitud = this.http.get<Usuario[]>(
      this.apiUrl,
      {
        withCredentials: true
      }
    ).pipe(
      tap(usuarios => {
        this.cacheUsuariosActivos.set(usuarios);
        this.guardarCachePersistida('activos', usuarios);
      }),
      finalize(() => this.solicitudUsuariosActivos = undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.solicitudUsuariosActivos = solicitud;
    return solicitud;

  }


  // =========================
  // OBTENER USUARIOS ELIMINADOS
  // =========================

  listarUsuariosEliminados(): Observable<Usuario[]> {
    const cache = this.cacheUsuariosEliminados() ?? this.leerCachePersistida('eliminados');
    if (cache) {
      this.cacheUsuariosEliminados.set(cache);
      return of(cache);
    }

    if (this.solicitudUsuariosEliminados) {
      return this.solicitudUsuariosEliminados;
    }

    const solicitud = this.http.get<Usuario[]>(
      `${this.apiUrl}/eliminados`,
      {
        withCredentials: true
      }
    ).pipe(
      tap(usuarios => {
        this.cacheUsuariosEliminados.set(usuarios);
        this.guardarCachePersistida('eliminados', usuarios);
      }),
      finalize(() => this.solicitudUsuariosEliminados = undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.solicitudUsuariosEliminados = solicitud;
    return solicitud;
  }

  invalidarCacheListas(): void {
    this.cacheUsuariosActivos.set(null);
    this.cacheUsuariosEliminados.set(null);
    this.solicitudUsuariosActivos = undefined;
    this.solicitudUsuariosEliminados = undefined;
    this.eliminarCachePersistida('activos');
    this.eliminarCachePersistida('eliminados');
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
    ).pipe(
      tap(usuarioCreado => {
        this.cacheUsuariosActivos.update(usuarios => {
          if (!usuarios) {
            return null;
          }
          const actualizados = [...usuarios, usuarioCreado];
          this.guardarCachePersistida('activos', actualizados);
          return actualizados;
        });
      })
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
    ).pipe(
      tap(usuarioActualizado => {
        const actualizado = { ...usuarioActualizado, id: usuarioActualizado.id ?? id };
        const actualizarLista = (usuarios: Usuario[] | null) =>
          usuarios?.map(item => item.id === id ? { ...item, ...actualizado } : item) ?? null;

        this.cacheUsuariosActivos.update(actualizarLista);
        this.cacheUsuariosEliminados.update(actualizarLista);
        this.persistirCacheActual();
      })
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
    ).pipe(
      tap(() => {
        const usuarioEliminado = this.cacheUsuariosActivos()
          ?.find(usuario => usuario.id === id);

        this.cacheUsuariosActivos.update(usuarios =>
          usuarios?.filter(usuario => usuario.id !== id) ?? null
        );

        if (usuarioEliminado) {
          this.cacheUsuariosEliminados.update(usuarios => {
            if (!usuarios) {
              return null;
            }
            return usuarios.some(usuario => usuario.id === id)
              ? usuarios.map(usuario => usuario.id === id ? { ...usuario, activo: false } : usuario)
              : [...usuarios, { ...usuarioEliminado, activo: false }];
          });
        }
        this.persistirCacheActual();
      })
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
    ).pipe(
      tap(usuario => {
        const reactivado = { ...usuario, id: usuario.id ?? id, activo: true };
        this.cacheUsuariosEliminados.update(usuarios =>
          usuarios?.filter(item => item.id !== id) ?? null
        );
        this.cacheUsuariosActivos.update(usuarios => {
          if (!usuarios) {
            return null;
          }
          return usuarios.some(item => item.id === id)
            ? usuarios.map(item => item.id === id ? { ...item, ...reactivado } : item)
            : [...usuarios, reactivado];
        });
        this.persistirCacheActual();
      })
    );

  }

  private leerCachePersistida(tipo: 'activos' | 'eliminados'): Usuario[] | null {
    const usuarioId = this.authService.usuarioActual()?.id;
    const clave = this.obtenerClaveCache(tipo, usuarioId);

    if (!clave || typeof window === 'undefined') {
      return null;
    }

    try {
      const serializado = window.sessionStorage.getItem(clave);
      if (!serializado) {
        return null;
      }

      const cache = JSON.parse(serializado) as CacheUsuariosPersistida;
      const vigente = cache.usuarioId === usuarioId
        && Date.now() - cache.guardadoEn < this.cacheTtlMs
        && Array.isArray(cache.usuarios);

      if (!vigente) {
        window.sessionStorage.removeItem(clave);
        return null;
      }

      return cache.usuarios;
    } catch {
      try {
        window.sessionStorage.removeItem(clave);
      } catch {
        return null;
      }
      return null;
    }
  }

  private guardarCachePersistida(tipo: 'activos' | 'eliminados', usuarios: Usuario[]): void {
    const usuarioId = this.authService.usuarioActual()?.id;
    const clave = this.obtenerClaveCache(tipo, usuarioId);

    if (!clave || typeof window === 'undefined') {
      return;
    }

    try {
      const cache: CacheUsuariosPersistida = {
        usuarioId: usuarioId!,
        guardadoEn: Date.now(),
        usuarios
      };
      window.sessionStorage.setItem(clave, JSON.stringify(cache));
    } catch {
      // El cache en memoria sigue disponible aunque falle el almacenamiento.
    }
  }

  private eliminarCachePersistida(tipo: 'activos' | 'eliminados'): void {
    const clave = this.obtenerClaveCache(tipo, this.authService.usuarioActual()?.id);
    if (!clave || typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.removeItem(clave);
    } catch {
      // El cache en memoria se limpia aunque falle el almacenamiento.
    }
  }

  private obtenerClaveCache(tipo: 'activos' | 'eliminados', usuarioId?: number): string | null {
    return usuarioId === undefined
      ? null
      : `${USUARIO_CACHE_STORAGE_PREFIX}${usuarioId}:${tipo}`;
  }

  private persistirCacheActual(): void {
    const activos = this.cacheUsuariosActivos();
    const eliminados = this.cacheUsuariosEliminados();

    if (activos) {
      this.guardarCachePersistida('activos', activos);
    }
    if (eliminados) {
      this.guardarCachePersistida('eliminados', eliminados);
    }
  }

}