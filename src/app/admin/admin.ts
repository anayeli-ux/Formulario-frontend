import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Usuario } from '../models/usuario.model';

import {
  UsuarioService,
  UsuarioRequest
} from '../services/usuario.service';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  // Usuarios activos y eliminados
  usuarios = signal<Usuario[]>([]);

  usuariosEliminados =
    signal<Usuario[]>([]);

  totalUsuariosActivos =
    computed(() => this.usuarios().length);

  totalUsuariosEliminados =
    computed(
      () => this.usuariosEliminados().length
    );

  // Control del modal
  editando = false;

  modalEditarAbierto = false;

  usuarioEditandoId?: number;

  usuarioFormulario: Usuario =
    this.crearUsuarioVacio();

  // Fecha máxima permitida
  fechaMaximaAdulto =
    this.obtenerFechaMaximaAdulto();

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    this.cargarUsuarios();

    this.cargarUsuariosEliminados();

  }

  // =========================
  // USUARIOS ACTIVOS
  // =========================

  cargarUsuarios(): void {

    this.usuarioService
      .listarUsuarios()
      .subscribe({

        next: (usuarios: Usuario[]) => {

          this.usuarios.set(
            this.ordenarPorId(usuarios)
          );

        },

        error: (error: unknown) => {

          console.error(
            'Error al cargar usuarios:',
            error
          );

        }

      });

  }

  // =========================
  // USUARIOS ELIMINADOS
  // =========================

  cargarUsuariosEliminados(): void {

    this.usuarioService
      .listarUsuariosEliminados()
      .subscribe({

        next: (usuarios: Usuario[]) => {

          this.usuariosEliminados.set(
            this.ordenarPorId(usuarios)
          );

        },

        error: (error: unknown) => {

          console.error(
            'Error al cargar usuarios eliminados:',
            error
          );

        }

      });

  }

  // =========================
  // CREAR USUARIO
  // =========================

  crearUsuario(): void {

    if (!this.validarEdad()) {
      return;
    }

    const usuario =
      this.prepararUsuario();

    this.usuarioService
      .crearUsuario(usuario)
      .subscribe({

        next: () => {

          alert(
            'Usuario creado correctamente.'
          );

          this.limpiarFormulario();

          this.cargarUsuarios();

        },

        error: (error: unknown) => {

          console.error(
            'Error al crear usuario:',
            error
          );

          alert(
            'No se pudo crear el usuario.'
          );

        }

      });

  }

  // =========================
  // ABRIR MODAL
  // =========================

  editarUsuario(
    usuario: Usuario
  ): void {

    this.editando = true;

    this.modalEditarAbierto = true;

    this.usuarioEditandoId =
      usuario.id;

    // Copia los datos del usuario
    // seleccionado al formulario
    this.usuarioFormulario = {
      ...usuario
    };

  }

  // =========================
  // CERRAR MODAL
  // =========================

  cerrarModalEditar(): void {

    this.modalEditarAbierto = false;

    this.limpiarFormulario();

  }

  cancelarEdicion(): void {

    this.cerrarModalEditar();

  }

  // =========================
  // ACTUALIZAR USUARIO
  // =========================

  actualizarUsuario(): void {

    if (
      this.usuarioEditandoId === undefined
    ) {
      return;
    }

    if (!this.validarEdad()) {
      return;
    }

    /*
     * Preparamos únicamente los campos
     * que acepta Spring Boot.
     */
    const usuario =
      this.prepararUsuario();

    this.usuarioService
      .actualizarUsuario(
        this.usuarioEditandoId,
        usuario
      )
      .subscribe({

        next: () => {

          alert(
            'Usuario actualizado correctamente.'
          );

          this.modalEditarAbierto = false;

          this.limpiarFormulario();

          // Refresca la tabla
          this.cargarUsuarios();

        },

        error: (error: unknown) => {

          console.error(
            'Error al actualizar usuario:',
            error
          );

          alert(
            'No se pudo actualizar el usuario.'
          );

        }

      });

  }

  // =========================
  // ELIMINACIÓN LÓGICA
  // =========================

  eliminarUsuario(
    id: number
  ): void {

    const confirmar = confirm(
      '¿Quieres eliminar este usuario?'
    );

    if (!confirmar) {
      return;
    }

    this.usuarioService
      .eliminarUsuario(id)
      .subscribe({

        next: () => {

          alert(
            'Usuario eliminado correctamente.'
          );

          this.cargarUsuarios();

          this.cargarUsuariosEliminados();

        },

        error: (error: unknown) => {

          console.error(
            'Error al eliminar usuario:',
            error
          );

          alert(
            'No se pudo eliminar el usuario.'
          );

        }

      });

  }

  // =========================
  // PREPARAR DATOS
  // =========================

  private prepararUsuario():
    UsuarioRequest {

    return {

      nombre:
        this.usuarioFormulario.nombre,

      primerApellido:
        this.usuarioFormulario.primerApellido,

      segundoApellido:
        this.usuarioFormulario.segundoApellido,

      telefono:
        this.usuarioFormulario.telefono,

      codigoPostal:
        this.usuarioFormulario.codigoPostal,

      direccion:
        this.usuarioFormulario.direccion,

      fechaNacimiento:
        this.usuarioFormulario.fechaNacimiento,

      animalFavorito:
        this.usuarioFormulario.animalFavorito

    };

  }

  // =========================
  // LIMPIAR FORMULARIO
  // =========================

  limpiarFormulario(): void {

    this.editando = false;

    this.usuarioEditandoId =
      undefined;

    this.usuarioFormulario =
      this.crearUsuarioVacio();

  }

  // =========================
  // CERRAR SESIÓN
  // =========================

  cerrarSesion(): void {

    this.authService
      .cerrarSesion();

    this.router
      .navigate(['/']);

  }

  // =========================
  // VALIDAR EDAD
  // =========================

  private validarEdad(): boolean {

    if (
      this.esMayorDeEdad(
        this.usuarioFormulario
          .fechaNacimiento
      )
    ) {

      return true;

    }

    alert(
      'El usuario debe tener al menos 18 años.'
    );

    return false;

  }

  // =========================
  // ORDENAR POR ID
  // =========================

  private ordenarPorId(
    usuarios: Usuario[]
  ): Usuario[] {

    return [...usuarios].sort(
      (a, b) =>
        (a.id ?? 0) -
        (b.id ?? 0)
    );

  }

  // =========================
  // FECHA MÁXIMA
  // =========================

  private obtenerFechaMaximaAdulto():
    string {

    const hoy = new Date();

    const fecha = new Date(
      hoy.getFullYear() - 18,
      hoy.getMonth(),
      hoy.getDate()
    );

    const anio =
      fecha.getFullYear();

    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(2, '0');

    const dia =
      String(
        fecha.getDate()
      ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;

  }

  // =========================
  // COMPROBAR EDAD
  // =========================

  private esMayorDeEdad(
    fechaNacimiento: string
  ): boolean {

    return (
      !!fechaNacimiento &&
      fechaNacimiento <=
        this.fechaMaximaAdulto
    );

  }

  // =========================
  // USUARIO VACÍO
  // =========================

  private crearUsuarioVacio():
    Usuario {

    return {

      nombre: '',
      primerApellido: '',
      segundoApellido: '',
      telefono: '',
      codigoPostal: '',

      // Se conservan porque Usuario
      // los utiliza al mostrar información
      estado: '',
      municipio: '',

      direccion: '',
      fechaNacimiento: '',
      animalFavorito: '',
      activo: true

    };

  }

}