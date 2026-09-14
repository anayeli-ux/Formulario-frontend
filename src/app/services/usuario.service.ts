import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

/*
 * Datos que Spring Boot permite recibir
 * para crear o actualizar un usuario.
 */
export interface UsuarioRequest {
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  codigoPostal: string;
  direccion: string;
  fechaNacimiento: string;
  animalFavorito: string;
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

  // Obtener usuarios activos
  listarUsuarios(): Observable<Usuario[]> {

    return this.http.get<Usuario[]>(
      this.apiUrl
    );

  }

  // Obtener usuarios eliminados
  listarUsuariosEliminados(): Observable<Usuario[]> {

    return this.http.get<Usuario[]>(
      `${this.apiUrl}/eliminados`
    );

  }

  // Crear usuario
  crearUsuario(
    usuario: UsuarioRequest
  ): Observable<Usuario> {

    return this.http.post<Usuario>(
      this.apiUrl,
      usuario
    );

  }

  // Actualizar usuario
  actualizarUsuario(
    id: number,
    usuario: UsuarioRequest
  ): Observable<Usuario> {

    return this.http.put<Usuario>(
      `${this.apiUrl}/${id}`,
      usuario
    );

  }

  // Eliminación lógica
  eliminarUsuario(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );

  }

}