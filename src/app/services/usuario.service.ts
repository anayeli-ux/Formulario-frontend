import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, shareReplay, switchMap, tap } from 'rxjs';

import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

interface UsuarioRequestBase {
  nombre: string;
  primerApellido: string;
  fechaNacimiento: string;
  telefonos: Array<{ tipo: string; valor: string }>;
  correos: Array<{ tipo: string; valor: string }>;
  direcciones: Array<{ tipo: string; valor: string; codigoPostal: string }>;
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

  private apiUrl = `${environment.apiUrl}/usuarios`;

  readonly usuariosActivos = signal<Usuario[]>([]);
  readonly usuariosEliminados = signal<Usuario[]>([]);
  private solicitudUsuariosActivos?: Observable<Usuario[]>;
  private solicitudUsuariosEliminados?: Observable<Usuario[]>;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  listarUsuarios(): Observable<Usuario[]> {
    if (this.solicitudUsuariosActivos) {
      return this.solicitudUsuariosActivos;
    }

    const solicitud = this.http.get<Usuario[]>(this.apiUrl, { withCredentials: true }).pipe(
      tap(usuarios => this.usuariosActivos.set(this.ordenarPorId(usuarios))),
      finalize(() => this.solicitudUsuariosActivos = undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.solicitudUsuariosActivos = solicitud;
    return solicitud;
  }

  listarUsuariosEliminados(): Observable<Usuario[]> {
    if (this.solicitudUsuariosEliminados) {
      return this.solicitudUsuariosEliminados;
    }

    const solicitud = this.http.get<Usuario[]>(`${this.apiUrl}/eliminados`, { withCredentials: true }).pipe(
      tap(usuarios => this.usuariosEliminados.set(this.ordenarPorId(usuarios))),
      finalize(() => this.solicitudUsuariosEliminados = undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.solicitudUsuariosEliminados = solicitud;
    return solicitud;
  }

  limpiarListas(): void {
    this.usuariosActivos.set([]);
    this.usuariosEliminados.set([]);
    this.solicitudUsuariosActivos = undefined;
    this.solicitudUsuariosEliminados = undefined;
  }

  obtenerMiPerfil(): Observable<Usuario> {
    return this.authService.obtenerPerfil();
  }

  crearUsuario(usuario: UsuarioRequest): Observable<Usuario> {
    return this.authService.obtenerCsrf().pipe(
      switchMap(() => this.http.post<Usuario>(this.apiUrl, usuario, { withCredentials: true })),
      tap(usuarioCreado => {
        this.usuariosActivos.update(usuarios => {
          const actualizados = this.ordenarPorId([...usuarios, usuarioCreado]);
          return actualizados;
        });
      })
    );
  }

  actualizarUsuario(id: number, usuario: UsuarioActualizarRequest): Observable<Usuario> {
    return this.authService.obtenerCsrf().pipe(
      switchMap(() => this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario, { withCredentials: true })),
      tap(usuarioActualizado => {
        const actualizado = { ...usuarioActualizado, id: usuarioActualizado.id ?? id };
        const actualizarLista = (usuarios: Usuario[]) =>
          this.ordenarPorId(usuarios.map(item => item.id === id ? { ...item, ...actualizado } : item));

        this.usuariosActivos.update(usuarios => {
          const res = actualizarLista(usuarios);
          return res;
        });

        this.usuariosEliminados.update(usuarios => {
          const res = actualizarLista(usuarios);
          return res;
        });
      })
    );
  }

  eliminarUsuario(id: number): Observable<void> {
    return this.authService.obtenerCsrf().pipe(
      switchMap(() => this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true })),
      tap(() => {
        const usuarioEliminado = this.usuariosActivos()?.find(usuario => usuario.id === id);

        this.usuariosActivos.update(usuarios => {
          const res = usuarios.filter(usuario => usuario.id !== id);
          return res;
        });

        if (usuarioEliminado) {
          this.usuariosEliminados.update(usuarios => {
            const res = usuarios.some(usuario => usuario.id === id)
              ? usuarios.map(usuario => usuario.id === id ? { ...usuario, activo: false } : usuario)
              : [...usuarios, { ...usuarioEliminado, activo: false }];
            const ordenados = this.ordenarPorId(res);
            return ordenados;
          });
        }
      })
    );
  }

  reactivarUsuario(id: number): Observable<Usuario> {
    return this.authService.obtenerCsrf().pipe(
      switchMap(() => this.http.put<Usuario>(`${this.apiUrl}/${id}/reactivar`, {}, { withCredentials: true })),
      tap(usuario => {
        const reactivado = { ...usuario, id: usuario.id ?? id, activo: true };

        this.usuariosEliminados.update(usuarios => {
          const res = usuarios.filter(item => item.id !== id);
          return res;
        });

        this.usuariosActivos.update(usuarios => {
          const res = usuarios.some(item => item.id === id)
            ? usuarios.map(item => item.id === id ? { ...item, ...reactivado } : item)
            : [...usuarios, reactivado];
          const ordenados = this.ordenarPorId(res);
          return ordenados;
        });
      })
    );
  }

  private ordenarPorId(usuarios: Usuario[]): Usuario[] {
    return [...usuarios].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }
}