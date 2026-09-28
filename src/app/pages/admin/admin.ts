import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { Usuario } from '../../models/usuario.model';

import { UsuarioService } from '../../services/usuario.service';

import { AuthService } from '../../services/auth.service';
import { PostaliaService } from '../../services/postalia.service';
import { UsuarioFormService } from '../../services/usuario-form.service';
import { DatosPersonalesComponent } from '../../components/datos-personales/datos-personales.component';
import { DatosContactoComponent } from '../../components/datos-contacto/datos-contacto.component';

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
    FormsModule,
    ReactiveFormsModule,
    DatosPersonalesComponent,
    DatosContactoComponent
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

  editando = signal(false);

  modalEditarAbierto = signal(false);

  usuarioEditandoId = signal<number | undefined>(undefined);

  usuarioForm!: FormGroup;


  /* =========================
     MODAL DE MENSAJES
     ========================= */

  modalMensajeVisible = signal(false);

  modalTipo = signal<TipoModal>('exito');

  modalTitulo = signal('');

  modalMensaje = signal('');

  cargando = signal(false);


  /*
   * Guarda temporalmente una acción
   * que se ejecutará al confirmar.
   */
  private accionConfirmada:
    (() => void) | null = null;


  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private postaliaService: PostaliaService,
    private usuarioFormService: UsuarioFormService
  ) {}


  ngOnInit(): void {

    this.usuarioForm = this.usuarioFormService.crearFormulario();

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

    this.modalTipo.set(tipo);

    this.modalTitulo.set(titulo);

    this.modalMensaje.set(mensaje);

    this.modalMensajeVisible.set(true);

  }


  cerrarModalMensaje(): void {

    this.modalMensajeVisible.set(false);

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

    this.modalTipo.set('confirmacion');

    this.modalTitulo.set(titulo);

    this.modalMensaje.set(mensaje);

    this.accionConfirmada = accion;

    this.modalMensajeVisible.set(true);

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
    this.modalMensajeVisible.set(false);

    this.accionConfirmada = null;

    accion();

  }


  cancelarConfirmacion(): void {

    this.modalMensajeVisible.set(false);

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

  abrirCrearUsuario(): void {
    this.editando.set(false);
    this.usuarioEditandoId.set(undefined);
    this.usuarioForm = this.usuarioFormService.crearFormulario();
    this.modalEditarAbierto.set(true);
  }

  crearUsuario(): void {

    if (this.cargando()) {
      return;
    }

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const usuario = this.usuarioFormService.crearRequest(this.usuarioForm);

    this.cargando.set(true);

    this.usuarioService
      .crearUsuario(usuario)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({

        next: () => {

          this.modalEditarAbierto.set(false);
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

    this.editando.set(true);

    this.modalEditarAbierto.set(true);

    this.usuarioEditandoId.set(usuario.id);

    this.usuarioForm = this.usuarioFormService.crearFormulario(true);
    this.usuarioFormService.cargarUsuario(this.usuarioForm, usuario);

    const estado = this.usuarioForm.get('datosContacto.estado')?.value;
    const municipio = this.usuarioForm.get('datosContacto.municipio')?.value;
    if (!estado || !municipio) {
      this.actualizarUbicacion();
    }

  }

  actualizarUbicacion(codigoPostal: string = this.usuarioForm.get('datosContacto.codigo_postal')?.value): void {

    if (!/^\d{5}$/.test(codigoPostal)) {
      this.usuarioForm.get('datosContacto.estado')?.setValue('');
      this.usuarioForm.get('datosContacto.municipio')?.setValue('');
      return;
    }

    this.postaliaService.buscarCodigoPostal(codigoPostal).subscribe({
      next: ubicacion => {
        if (this.usuarioForm.get('datosContacto.codigo_postal')?.value !== codigoPostal) {
          return;
        }
        this.usuarioForm.get('datosContacto.estado')?.setValue(ubicacion.estado);
        this.usuarioForm.get('datosContacto.municipio')?.setValue(ubicacion.municipio);
      },
      error: () => undefined
    });
  }


  /* =========================
     CERRAR MODAL DE EDICIÓN
     ========================= */

  cerrarModalEditar(): void {

    this.modalEditarAbierto.set(false);

    this.limpiarFormulario();

  }


  cancelarEdicion(): void {

    this.cerrarModalEditar();

  }


  /* =========================
     ACTUALIZAR USUARIO
     ========================= */

  actualizarUsuario(): void {

    if (this.cargando()) {
      return;
    }

    if (this.usuarioEditandoId() === undefined) {
      return;
    }

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const usuario = this.usuarioFormService.crearRequest(this.usuarioForm, false);


    this.cargando.set(true);

    this.usuarioService
      .actualizarUsuario(
        this.usuarioEditandoId()!,
        usuario
      )
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({

        next: () => {

          this.modalEditarAbierto.set(false);

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

    this.cargando.set(true);

    this.usuarioService
      .eliminarUsuario(id)
      .pipe(finalize(() => this.cargando.set(false)))
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

    this.cargando.set(true);

    /*
     * Este método requiere que
     * usuario.service.ts tenga:
     *
     * reactivarUsuario(id: number)
     */

    this.usuarioService
      .reactivarUsuario(id)
      .pipe(finalize(() => this.cargando.set(false)))
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
        usuario.estado,
        usuario.municipio,
        ...(usuario.telefonos ?? []).flatMap(contacto => [contacto.tipo, contacto.valor]),
        ...(usuario.direcciones ?? []).flatMap(contacto => [contacto.tipo, contacto.valor, contacto.codigoPostal]),
        ...(usuario.correos ?? []).flatMap(contacto => [contacto.tipo, contacto.valor])
      ];

      return valores.some(valor => this.normalizarTexto(String(valor ?? '')).includes(termino));
    });
  }

  obtenerTelefonoPrincipal(usuario: Usuario): string {
    return usuario.telefonos?.find(contacto => contacto.tipo === 'PRINCIPAL')?.valor ?? '';
  }

  obtenerCorreoPrincipal(usuario: Usuario): string {
    return usuario.correos?.find(contacto => contacto.tipo === 'PRINCIPAL')?.valor ?? '';
  }

  obtenerDireccionPrincipal(usuario: Usuario): string {
    return usuario.direcciones?.find(direccion => direccion.tipo === 'PRINCIPAL')?.valor ?? '';
  }

  obtenerCodigoPostalPrincipal(usuario: Usuario): string {
    return usuario.direcciones?.find(direccion => direccion.tipo === 'PRINCIPAL')?.codigoPostal ?? '';
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

    this.editando.set(false);

    this.usuarioEditandoId.set(undefined);

    this.usuarioForm = this.usuarioFormService.crearFormulario();
  }


  /* =========================
     CERRAR SESIÓN
     ========================= */

  cerrarSesion(): void {

    if (this.cargando()) {
      return;
    }

    this.cargando.set(true);

    this.authService.cerrarSesion().pipe(
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.limpiarSesionLocal();
        this.router.navigate(['/login']);
      }
    });

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
      const codigoPostal = this.obtenerCodigoPostalPrincipal(usuario);
      if (!codigoPostal) {
        return usuario;
      }

      this.postaliaService.buscarCodigoPostal(codigoPostal).subscribe({
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


}