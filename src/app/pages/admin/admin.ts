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

import { Usuario } from '../../models/usuario.model';

import {
  UsuarioService,
  UsuarioRequest
} from '../../services/usuario.service';

import { AuthService } from '../../services/auth.service';
import { PostaliaService } from '../../services/postalia.service';

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

  busquedaUsuarios = signal('');

  busquedaUsuariosEliminados = signal('');

  usuariosFiltrados = computed(() =>
    this.filtrarUsuarios(this.usuarios(), this.busquedaUsuarios())
  );

  usuariosEliminadosFiltrados = computed(() =>
    this.filtrarUsuarios(this.usuariosEliminados(), this.busquedaUsuariosEliminados())
  );

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

        error: () => {
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

        error: () => {
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
      this.prepararUsuario(true);

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
      ...usuario,
      password: '',
      telefonos: usuario.telefonos ?? [],
      direcciones: usuario.direcciones ?? [],
      correos: usuario.correos ?? []
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
      error: () => {
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

  actualizarUsuario(form?: NgForm): void {

    if (this.cargando) {
      return;
    }

    if (this.usuarioEditandoId === undefined) {
      return;
    }

    form?.form.markAllAsTouched();

    if (form?.invalid) {
      return;
    }

    if (!this.formularioEdicionValido()) {
      return;
    }

    if (!this.validarEdad()) {
      return;
    }

    const usuario =
      this.prepararUsuario(false);
      

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

    const mensajeBackend = this.obtenerMensajeError(error);


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

  private prepararUsuario(incluirPassword = true):
    UsuarioRequest {

    const usuario: UsuarioRequest = {

      nombre:
        this.usuarioFormulario.nombre,

      primerApellido:
        this.usuarioFormulario.primerApellido,

      telefono:
        this.usuarioFormulario.telefono,

      codigoPostal:
        this.usuarioFormulario.codigoPostal,

      direccion:
        this.usuarioFormulario.direccion,

      fechaNacimiento:
        this.usuarioFormulario.fechaNacimiento,

      email:
        this.usuarioFormulario.email,

      telefonos: this.usuarioFormulario.telefonos,

      direcciones: (this.usuarioFormulario.direcciones ?? []).map(direccion => ({
        tipo: direccion.tipo,
        valor: direccion.valor,
        codigoPostal: direccion.codigoPostal || this.usuarioFormulario.codigoPostal
      })),

      correos: this.usuarioFormulario.correos

    };

    if (incluirPassword) {
      usuario.password = this.usuarioFormulario.password ?? '';
    }

    return usuario;

  }

  private formularioEdicionValido(): boolean {
    const password = this.usuarioFormulario.password ?? '';

    if (password && !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)) {
      this.mostrarModal('advertencia', 'Datos incorrectos', 'La contraseña debe tener 8 caracteres, una letra, un número y un símbolo.');
      return false;
    }

    if (!this.usuarioFormulario.nombre.trim() || !this.usuarioFormulario.primerApellido.trim() ||
        !/^\d{10}$/.test(this.usuarioFormulario.telefono) ||
        !/^\d{5}$/.test(this.usuarioFormulario.codigoPostal) ||
        !this.usuarioFormulario.direccion.trim() ||
        !/^\S+@\S+\.\S+$/.test(this.usuarioFormulario.email)) {
      this.mostrarModal('advertencia', 'Datos incorrectos', 'Revisa los campos obligatorios y sus formatos.');
      return false;
    }

    const contactosInvalidos = [
      ...(this.usuarioFormulario.telefonos ?? []),
      ...(this.usuarioFormulario.direcciones ?? []),
      ...(this.usuarioFormulario.correos ?? [])
    ].some(contacto => !contacto.tipo?.trim() || !contacto.valor?.trim());

    const direccionesConFormatoInvalido =
      (this.usuarioFormulario.direcciones ?? []).some(direccion =>
        !!direccion.codigoPostal && !/^\d{5}$/.test(direccion.codigoPostal)
      );

    if (contactosInvalidos || direccionesConFormatoInvalido) {
      this.mostrarModal('advertencia', 'Datos incorrectos', 'Completa correctamente todos los teléfonos, direcciones y correos adicionales.');
      return false;
    }

    return true;
  }

  private obtenerMensajeError(error: any): string {
    const respuesta = error?.error;

    if (typeof respuesta === 'string') {
      return respuesta;
    }

    return respuesta?.mensaje || respuesta?.message || error?.message || '';
  }

  private filtrarUsuarios(usuarios: Usuario[], busqueda: string): Usuario[] {
    const termino = this.normalizarTexto(busqueda);

    if (!termino) {
      return usuarios;
    }

    return usuarios.filter(usuario => {
      const valores = [
        usuario.id,
        usuario.nombre,
        usuario.primerApellido,
        usuario.telefono,
        usuario.codigoPostal,
        usuario.estado,
        usuario.municipio,
        usuario.direccion,
        usuario.email,
        ...(usuario.telefonos ?? []).flatMap(contacto => [contacto.tipo, contacto.valor]),
        ...(usuario.direcciones ?? []).flatMap(contacto => [contacto.tipo, contacto.valor, contacto.codigoPostal]),
        ...(usuario.correos ?? []).flatMap(contacto => [contacto.tipo, contacto.valor])
      ];

      return valores.some(valor => this.normalizarTexto(String(valor ?? '')).includes(termino));
    });
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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

    if (this.cargando) {
      return;
    }

    this.cargando = true;

    this.authService.cerrarSesion().pipe(
      finalize(() => this.cargando = false)
    ).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.limpiarSesionLocal();
        this.router.navigate(['/login']);
      }
    });

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
        error: () => undefined
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