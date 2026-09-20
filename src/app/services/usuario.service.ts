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
      this.apiUrl
    );

  }


  // =========================
  // OBTENER USUARIOS ELIMINADOS
  // =========================

  listarUsuariosEliminados(): Observable<Usuario[]> {

    return this.http.get<Usuario[]>(
      `${this.apiUrl}/eliminados`
    );

  }

  obtenerMiPerfil(): Observable<Usuario> {

    return this.http.get<Usuario>(
      `${this.apiUrl}/me`
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
      usuario
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
      usuario
    );

  }


  // =========================
  // ELIMINACIÓN LÓGICA
  // =========================

  eliminarUsuario(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
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
      {}
    );

  }

}