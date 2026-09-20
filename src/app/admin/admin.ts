import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { Usuario } from '../models/usuario.model';

import {
  UsuarioService,
  UsuarioRequest
} from '../services/usuario.service';

import { AuthService } from '../services/auth.service';
import { PostaliaService } from '../services/postalia.service';

type TipoModal =
  | 'exito'
  | 'advertencia'
  | 'error'
  | 'confirmacion';

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

  /* =========================
     USUARIOS
     ========================= */

  usuarios = signal<Usuario[]>([]);

  usuariosEliminados =
    signal<Usuario[]>([]);

  totalUsuariosActivos =
    computed(
      () => this.usuarios().length
    );

  totalUsuariosEliminados =
    computed(
      () => this.usuariosEliminados().length
    );


  /* =========================
     MODAL DE EDICIÓN
     ========================= */

  editando = false;

  modalEditarAbierto = false;

  usuarioEditandoId?: number;

  usuarioFormulario: Usuario =
    this.crearUsuarioVacio();


  /* =========================
     MODAL DE MENSAJES
     ========================= */

  modalMensajeVisible = false;

  modalTipo: TipoModal = 'exito';

  modalTitulo = '';

  modalMensaje = '';

  cargando = false;


  /*
   * Guarda temporalmente una acción
   * que se ejecutará al confirmar.
   */
  private accionConfirmada:
    (() => void) | null = null;


  /* =========================
     FECHA MÁXIMA
     ========================= */

  fechaMaximaAdulto =
    this.obtenerFechaMaximaAdulto();


  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private postaliaService: PostaliaService
  ) {}


  ngOnInit(): void {

    this.cargarUsuarios();

    this.cargarUsuariosEliminados();

  }


  /* =========================
     MODAL DE MENSAJES
     ========================= */

  mostrarModal(
    tipo: TipoModal,
    titulo: string,
    mensaje: string
  ): void {

    this.modalTipo = tipo;

    this.modalTitulo = titulo;

    this.modalMensaje = mensaje;

    this.modalMensajeVisible = true;

  }


  cerrarModalMensaje(): void {

    this.modalMensajeVisible = false;

    this.accionConfirmada = null;

  }


  /* =========================
     MODAL DE CONFIRMACIÓN
     ========================= */

  mostrarConfirmacion(
    titulo: string,
    mensaje: string,
    accion: () => void
  ): void {

    this.modalTipo = 'confirmacion';

    this.modalTitulo = titulo;

    this.modalMensaje = mensaje;

    this.accionConfirmada = accion;

    this.modalMensajeVisible = true;

  }


  confirmarAccion(): void {

    if (!this.accionConfirmada) {
      return;
    }

    const accion = this.accionConfirmada;

    /*
     * Primero cerramos el modal
     * y después ejecutamos la acción.
     */
    this.modalMensajeVisible = false;

    this.accionConfirmada = null;

    accion();

  }


  cancelarConfirmacion(): void {

    this.modalMensajeVisible = false;

    this.accionConfirmada = null;

  }


  /* =========================
     USUARIOS ACTIVOS
     ========================= */

  cargarUsuarios(): void {

    this.usuarioService
      .listarUsuarios()
      .subscribe({

        next: (usuarios: Usuario[]) => {

          this.usuarios.set(
            this.ordenarPorId(
              this.completarUbicaciones(usuarios)
            )
          );

        },

        error: (error: any) => {

          console.error(
            'Error al cargar usuarios:',
            error
          );

          this.mostrarModal(
            'error',
            'Error al cargar usuarios',
            'No fue posible obtener la lista de usuarios activos.'
          );

        }

      });

  }


  /* =========================
     USUARIOS ELIMINADOS
     ========================= */

  cargarUsuariosEliminados(): void {

    this.usuarioService
      .listarUsuariosEliminados()
      .subscribe({

        next: (usuarios: Usuario[]) => {

          this.usuariosEliminados.set(
            this.ordenarPorId(
              this.completarUbicaciones(usuarios)
            )
          );

        },

        error: (error: any) => {

          console.error(
            'Error al cargar usuarios eliminados:',
            error
          );

          this.mostrarModal(
            'error',
            'Error al cargar usuarios',
            'No fue posible obtener la lista de usuarios eliminados.'
          );

        }

      });

  }


  /* =========================
    CREAR USUARIO
     ========================= */

  crearUsuario(form?: NgForm): void {

    if (this.cargando) {
      return;
    }

    if (form && form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    if (!this.validarEdad()) {
      return;
    }

    const usuario =
      this.prepararUsuario();

    console.log('ADMIN enviando:', usuario);
    console.log('CP enviado:', usuario.codigoPostal);

    this.cargando = true;

    this.usuarioService
      .crearUsuario(usuario)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({

        next: () => {

          this.limpiarFormulario();

          this.cargarUsuarios();

          this.mostrarModal(
            'exito',
            'Usuario registrado',
            'El usuario fue creado correctamente.'
          );

        },

        error: (error: any) => {

          console.error(
            'Error al crear usuario:',
            error
          );

          this.mostrarErrorHttp(
            error,
            'No se pudo crear el usuario.'
          );

        }

      });

  }


  /* =========================
     ABRIR MODAL DE EDICIÓN
     ========================= */

  editarUsuario(
    usuario: Usuario
  ): void {

    this.editando = true;

    this.modalEditarAbierto = true;

    this.usuarioEditandoId =
      usuario.id;

    /*
     * Copia los datos del usuario
     * seleccionado al formulario.
     */
    this.usuarioFormulario = {
      ...usuario
    };

    this.actualizarUbicacion();

  }

  actualizarUbicacion(): void {
    const codigoPostal = this.usuarioFormulario.codigoPostal;

    if (!/^\d{5}$/.test(codigoPostal)) {
      this.usuarioFormulario = {
        ...this.usuarioFormulario,
        estado: '',
        municipio: ''
      };
      return;
    }

    this.postaliaService.buscarCodigoPostal(codigoPostal).subscribe({
      next: ubicacion => {
        this.usuarioFormulario = {
          ...this.usuarioFormulario,
          estado: ubicacion.estado,
          municipio: ubicacion.municipio
        };
      },
      error: error => {
        console.error('Error al consultar el código postal:', error);
        this.usuarioFormulario = {
          ...this.usuarioFormulario,
          estado: '',
          municipio: ''
        };
      }
    });
  }


  /* =========================
     CERRAR MODAL DE EDICIÓN
     ========================= */

  cerrarModalEditar(): void {

    this.modalEditarAbierto = false;

    this.limpiarFormulario();

  }


  cancelarEdicion(): void {

    this.cerrarModalEditar();

  }


  /* =========================
     ACTUALIZAR USUARIO
     ========================= */

  actualizarUsuario(): void {

    if (this.cargando) {
      return;
    }

    if (
      this.usuarioEditandoId === undefined
    ) {
      return;
    }

    if (!this.validarEdad()) {
      return;
    }

    const usuario =
      this.prepararUsuario();
      

    this.cargando = true;

    this.usuarioService
      .actualizarUsuario(
        this.usuarioEditandoId,
        usuario
      )
      .pipe(finalize(() => this.cargando = false))
      .subscribe({

        next: () => {

          this.modalEditarAbierto = false;

          this.limpiarFormulario();

          this.cargarUsuarios();

          this.mostrarModal(
            'exito',
            'Usuario actualizado',
            'Los datos del usuario fueron actualizados correctamente.'
          );

        },

        error: (error: any) => {

          console.error(
            'Error al actualizar usuario:',
            error
          );

          this.mostrarErrorHttp(
            error,
            'No se pudo actualizar el usuario.'
          );

        }

      });

  }


  /* =========================
     SOLICITAR ELIMINACIÓN
     ========================= */

  eliminarUsuario(
    id: number
  ): void {

    this.mostrarConfirmacion(
      '¿Eliminar usuario?',
      'El usuario será marcado como inactivo y aparecerá en la sección de usuarios eliminados.',
      () => this.confirmarEliminacion(id)
    );

  }


  /* =========================
     CONFIRMAR ELIMINACIÓN
     ========================= */

  private confirmarEliminacion(
    id: number
  ): void {

    this.cargando = true;

    this.usuarioService
      .eliminarUsuario(id)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({

        next: () => {

          this.cargarUsuarios();

          this.cargarUsuariosEliminados();

          this.mostrarModal(
            'exito',
            'Usuario eliminado',
            'El usuario fue eliminado correctamente.'
          );

        },

        error: (error: any) => {

          console.error(
            'Error al eliminar usuario:',
            error
          );

          this.mostrarErrorHttp(
            error,
            'No se pudo eliminar el usuario.'
          );

        }

      });

  }


  /* =========================
     REACTIVAR USUARIO
     ========================= */

  reactivarUsuario(
    id: number
  ): void {

    this.mostrarConfirmacion(
      '¿Reactivar usuario?',
      'El usuario volverá a aparecer en la lista de usuarios activos.',
      () => this.confirmarReactivacion(id)
    );

  }


  private confirmarReactivacion(
    id: number
  ): void {

    this.cargando = true;

    /*
     * Este método requiere que
     * usuario.service.ts tenga:
     *
     * reactivarUsuario(id: number)
     */

    this.usuarioService
      .reactivarUsuario(id)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({

        next: () => {

          this.cargarUsuarios();

          this.cargarUsuariosEliminados();

          this.mostrarModal(
            'exito',
            'Usuario reactivado',
            'El usuario fue reactivado correctamente.'
          );

        },

        error: (error: any) => {

          console.error(
            'Error al reactivar usuario:',
            error
          );

          this.mostrarErrorHttp(
            error,
            'No se pudo reactivar el usuario.'
          );

        }

      });

  }


  /* =========================
     ERRORES HTTP
     ========================= */

  private mostrarErrorHttp(
    error: any,
    mensajePredeterminado: string
  ): void {

    const mensajeBackend =
      error?.error?.mensaje;


    if (error.status === 400) {

      this.mostrarModal(
        'advertencia',
        'Datos incorrectos',
        mensajeBackend ||
        'Hay datos incorrectos o incompletos.'
      );

    }

    else if (error.status === 404) {

      this.mostrarModal(
        'error',
        'Usuario no encontrado',
        mensajeBackend ||
        'El usuario solicitado no fue encontrado.'
      );

    }

    else if (error.status === 409) {

      this.mostrarModal(
        'advertencia',
        'Conflicto de datos',
        mensajeBackend ||
        'Ya existe un usuario con esos datos.'
      );

    }

    else if (error.status === 503) {

      this.mostrarModal(
        'error',
        'Servicio no disponible',
        mensajeBackend ||
        'No fue posible consultar el código postal.'
      );

    }

    else if (error.status === 0) {

      this.mostrarModal(
        'error',
        'Sin conexión',
        'No fue posible conectarse con el servidor.'
      );

    }

    else {

      this.mostrarModal(
        'error',
        'Ocurrió un error',
        mensajeBackend ||
        mensajePredeterminado
      );

    }

  }


  /* =========================
     PREPARAR DATOS
     ========================= */

  private prepararUsuario():
    UsuarioRequest {

    return {

      nombre:
        this.usuarioFormulario.nombre,

      primerApellido:
        this.usuarioFormulario.primerApellido,

      password:
        this.usuarioFormulario.password ?? '',

      telefono:
        this.usuarioFormulario.telefono,

      codigoPostal:
        this.usuarioFormulario.codigoPostal,

      direccion:
        this.usuarioFormulario.direccion,

      fechaNacimiento:
        this.usuarioFormulario.fechaNacimiento,

      email:
        this.usuarioFormulario.email

    };

  }


  /* =========================
     LIMPIAR FORMULARIO
     ========================= */

  limpiarFormulario(): void {

    this.editando = false;

    this.usuarioEditandoId =
      undefined;

    this.usuarioFormulario =
      this.crearUsuarioVacio();

  }

  get passwordStrength(): number {
    const password = this.usuarioFormulario.password ?? '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Za-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z\d]/.test(password)) strength++;

    return strength;
  }

  get passwordStrengthLabel(): string {
    return ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'][this.passwordStrength];
  }


  /* =========================
     CERRAR SESIÓN
     ========================= */

  cerrarSesion(): void {

    this.authService
      .cerrarSesion();

    this.router
      .navigate(['/']);

  }


  /* =========================
     VALIDAR EDAD
     ========================= */

  private validarEdad(): boolean {

    if (
      this.esMayorDeEdad(
        this.usuarioFormulario
          .fechaNacimiento
      )
    ) {

      return true;

    }

    this.mostrarModal(
      'advertencia',
      'Edad no válida',
      'El usuario debe tener al menos 18 años.'
    );

    return false;

  }


  /* =========================
     ORDENAR POR ID
     ========================= */

  private ordenarPorId(
    usuarios: Usuario[]
  ): Usuario[] {

    return [...usuarios].sort(
      (a, b) =>
        (a.id ?? 0) -
        (b.id ?? 0)
    );

  }

  private completarUbicaciones(
    usuarios: Usuario[]
  ): Usuario[] {

    return usuarios.map(usuario => {
      if (!usuario.codigoPostal) {
        return usuario;
      }

      this.postaliaService.buscarCodigoPostal(usuario.codigoPostal).subscribe({
        next: ubicacion => {
          const actualizar = (lista: Usuario[]) => lista.map(item =>
            item.id === usuario.id
              ? { ...item, estado: ubicacion.estado, municipio: ubicacion.municipio }
              : item
          );

          this.usuarios.update(actualizar);
          this.usuariosEliminados.update(actualizar);
        },
        error: error => console.error(
          'Error al consultar el código postal del usuario:',
          error
        )
      });

      return usuario;
    });
  }


  /* =========================
     FECHA MÁXIMA
     ========================= */

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


  /* =========================
     COMPROBAR EDAD
     ========================= */

  private esMayorDeEdad(
    fechaNacimiento: string
  ): boolean {

    return (
      !!fechaNacimiento &&
      fechaNacimiento <=
        this.fechaMaximaAdulto
    );

  }


  /* =========================
     USUARIO VACÍO
     ========================= */

  private crearUsuarioVacio():
    Usuario {

    return {

      nombre: '',

      primerApellido: '',

      password: '',

      telefono: '',

      codigoPostal: '',

      /*
       * Se conservan porque Usuario
       * los utiliza para mostrar
       * información recibida del backend.
       */
      estado: '',

      municipio: '',

      direccion: '',

      fechaNacimiento: '',

      email: '',

      activo: true

    };

  }

}