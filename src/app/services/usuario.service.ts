import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';


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
  telefonos?: Array<{ tipo: string; valor: string }>;
  correos?: Array<{ tipo: string; valor: string }>;
  direcciones?: Array<{ tipo: string; valor: string }>;
}


@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  // URL base del backend
  private apiUrl =
    `${environment.apiUrl}/usuarios`;


  constructor(
    private http: HttpClient
  ) {}


  // =========================
  // OBTENER USUARIOS ACTIVOS
  // =========================

  listarUsuarios(): Observable<Usuario[]> {

    return this.http.get<Usuario[]>(
      this.apiUrl,
      { withCredentials: true }
    );

  }


  // =========================
  // OBTENER USUARIOS ELIMINADOS
  // =========================

  listarUsuariosEliminados(): Observable<Usuario[]> {

    return this.http.get<Usuario[]>(
      `${this.apiUrl}/eliminados`,
      { withCredentials: true }
    );

  }

  obtenerMiPerfil(): Observable<Usuario> {

    return this.http.get<Usuario>(
      `${this.apiUrl}/me`,
      { withCredentials: true }
    );

  }


  // =========================
  // CREAR USUARIO
  // =========================

  crearUsuario(
    usuario: UsuarioRequest
  ): Observable<Usuario> {

    return this.http.post<Usuario>(
      this.apiUrl,
      usuario,
      { withCredentials: true }
    );

  }


  // =========================
  // ACTUALIZAR USUARIO
  // =========================

  actualizarUsuario(
    id: number,
    usuario: UsuarioRequest
  ): Observable<Usuario> {

    return this.http.put<Usuario>(
      `${this.apiUrl}/${id}`,
      usuario,
      { withCredentials: true }
    );

  }


  // =========================
  // ELIMINACIÓN LÓGICA
  // =========================

  eliminarUsuario(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      { withCredentials: true }
    );

  }


  // =========================
  // REACTIVAR USUARIO
  // =========================

  reactivarUsuario(
    id: number
  ): Observable<Usuario> {

    return this.http.put<Usuario>(
      `${this.apiUrl}/${id}/reactivar`,
      {},
      { withCredentials: true }
    );

  }

}