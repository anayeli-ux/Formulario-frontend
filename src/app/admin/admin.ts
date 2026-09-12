import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { Usuario } from '../models/usuario.model';
import { UsuarioService } from '../services/usuario.service';
import { PostaliaService } from '../services/postalia.service';
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

  // Datos de las tablas
  usuarios = signal<Usuario[]>([]);
  usuariosEliminados = signal<Usuario[]>([]);

  totalUsuariosActivos =
    computed(() => this.usuarios().length);

  totalUsuariosEliminados =
    computed(() => this.usuariosEliminados().length);

  editando = false;
  modalEditarAbierto = false;
  usuarioEditandoId?: number;

  usuarioFormulario: Usuario =
    this.crearUsuarioVacio();

  cpLoading = false;
  cpError = '';
  colonias: string[] = [];

  // Fecha máxima para validar 18 años
  fechaMaximaAdulto =
    this.obtenerFechaMaximaAdulto();

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private postaliaService: PostaliaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarUsuariosEliminados();
  }

  cargarUsuarios(): void {
    this.usuarios.set([]);

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

  cargarUsuariosEliminados(): void {
    this.usuariosEliminados.set([]);

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

  guardarUsuario(): void {
    if (this.editando) {
      this.actualizarUsuario();
    } else {
      this.crearUsuario();
    }
  }

  crearUsuario(): void {
    if (!this.validarEdad()) {
      return;
    }

    this.usuarioService
      .crearUsuario(
        this.usuarioFormulario
      )
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

  editarUsuario(usuario: Usuario): void {
    this.editando = true;
    this.modalEditarAbierto = true;
    this.usuarioEditandoId = usuario.id;

    this.usuarioFormulario = {
      ...usuario
    };

    this.limpiarCodigoPostal();
  }

  cerrarModalEditar(): void {
    this.modalEditarAbierto = false;
    this.limpiarFormulario();
  }

  actualizarUsuario(): void {
    if (
      this.usuarioEditandoId === undefined
    ) {
      return;
    }

    if (!this.validarEdad()) {
      return;
    }

    this.usuarioService
      .actualizarUsuario(
        this.usuarioEditandoId,
        this.usuarioFormulario
      )
      .subscribe({
        next: () => {
          alert(
            'Usuario actualizado correctamente.'
          );

          this.modalEditarAbierto = false;

          this.limpiarFormulario();
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

  // Eliminación lógica
  eliminarUsuario(id: number): void {
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

  buscarCodigoPostal(): void {
    this.cpError = '';
    this.colonias = [];

    const cp =
      this.usuarioFormulario
        .codigoPostal
        .trim();

    if (!/^\d{5}$/.test(cp)) {
      this.usuarioFormulario.estado = '';
      this.usuarioFormulario.municipio = '';
      return;
    }

    this.cpLoading = true;

    this.postaliaService
      .buscarCodigoPostal(cp)
      .subscribe({
        next: (respuesta) => {
          this.usuarioFormulario.estado =
            respuesta.estado;

          this.usuarioFormulario.municipio =
            respuesta.municipio;

          this.colonias =
            respuesta.colonias.map(
              colonia => colonia.nombre
            );

          this.cpLoading = false;
        },

        error: (error: unknown) => {
          if (
            error instanceof HttpErrorResponse &&
            error.status === 404
          ) {
            this.cpError =
              'Código postal no encontrado.';
          } else {
            this.cpError =
              'No se pudo consultar el código postal.';
          }

          this.usuarioFormulario.estado = '';
          this.usuarioFormulario.municipio = '';
          this.cpLoading = false;
        }
      });
  }

  cancelarEdicion(): void {
    this.cerrarModalEditar();
  }

  limpiarFormulario(): void {
    this.editando = false;
    this.usuarioEditandoId = undefined;

    this.usuarioFormulario =
      this.crearUsuarioVacio();

    this.limpiarCodigoPostal();
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/']);
  }

  private validarEdad(): boolean {
    if (
      this.esMayorDeEdad(
        this.usuarioFormulario.fechaNacimiento
      )
    ) {
      return true;
    }

    alert(
      'El usuario debe tener al menos 18 años.'
    );

    return false;
  }

  private ordenarPorId(
    usuarios: Usuario[]
  ): Usuario[] {
    return [...usuarios].sort(
      (a, b) =>
        (a.id ?? 0) - (b.id ?? 0)
    );
  }

  private limpiarCodigoPostal(): void {
    this.cpError = '';
    this.cpLoading = false;
    this.colonias = [];
  }

  private obtenerFechaMaximaAdulto(): string {
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

  private esMayorDeEdad(
    fechaNacimiento: string
  ): boolean {
    return (
      !!fechaNacimiento &&
      fechaNacimiento <=
        this.fechaMaximaAdulto
    );
  }

  private crearUsuarioVacio(): Usuario {
    return {
      nombre: '',
      primerApellido: '',
      segundoApellido: '',
      telefono: '',
      codigoPostal: '',
      estado: '',
      municipio: '',
      direccion: '',
      fechaNacimiento: '',
      animalFavorito: '',
      activo: true
    };
  }
}