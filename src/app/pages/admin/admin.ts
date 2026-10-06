import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, finalize, Subject } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AdministradorResumen, PaginaAdministradores, PaginaUsuarios, Usuario, UsuarioContactos, UsuarioResumen } from '../../models/usuario.model';

import { RespuestaUsuariosIncompatibleError, UsuarioService } from '../../services/usuario.service';

import { AuthService } from '../../services/auth.service';
import { PostaliaService } from '../../services/postalia.service';
import { UsuarioFormService } from '../../services/usuario-form.service';
import { DatosPersonalesComponent } from '../../components/datos-personales/datos-personales.component';
import { DatosContactoComponent } from '../../components/datos-contacto/datos-contacto.component';
import { UsuariosTablaComponent } from '../../components/usuarios-tabla/usuarios-tabla.component';
import { ContactosUsuarioComponent } from '../../components/contactos-usuario/contactos-usuario.component';
import {
  ModalMensajeComponent
} from '../../components/modal-mensaje/modal-mensaje.component';

import {
  FormSectionComponent
} from '../../components/form-section/form-section.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ConfirmacionAdminDialogComponent } from '../../components/confirmacion-admin-dialog/confirmacion-admin-dialog.component';
import { AdminIconsService } from '../../services/admin-icons.service';
import { esAdministrador } from '../../utils/rol.util';

type TipoModal =
  | 'exito'
  | 'advertencia'
  | 'error'
  | 'confirmacion';

function crearPaginadorSoloPaginas(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = '';
  intl.getRangeLabel = (page, pageSize, length) => {
    const totalPages = Math.ceil(length / pageSize);
    return `Página ${totalPages ? page + 1 : 0} de ${totalPages}`;
  };
  return intl;
}

@Component({
  selector: 'app-admin',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatosPersonalesComponent,
    DatosContactoComponent,
    UsuariosTablaComponent,
    ContactosUsuarioComponent,
    ModalMensajeComponent,
    FormSectionComponent,
    PageHeaderComponent,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    MatSnackBarModule
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: crearPaginadorSoloPaginas }],

  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  nombreAdministrador = computed(() => {
    const perfil = this.authService.usuarioActual();
    return [perfil?.nombre, perfil?.primerApellido].filter(Boolean).join(' ');
  });

  correoAdministrador = computed(() =>
    this.authService.usuarioActual()?.email
      ?? ''
  );

  /* =========================
     USUARIOS
     ========================= */

  vistaActual = signal<'activos' | 'eliminados'>('activos');
  private paginaActiva = signal<PaginaUsuarios | null>(null);
  private paginaEliminada = signal<PaginaUsuarios | null>(null);
  paginaIndexActivos = signal(0);
  paginaIndexEliminados = signal(0);
  pageSizeActivos = signal(5);
  pageSizeEliminados = signal(5);
  private paginaAdministradores = signal<PaginaAdministradores | null>(null);
  private totalPaginasAdministradoresGuardado = signal(0);
  private endpointAdministradoresDisponible = signal<boolean | null>(null);
  paginaIndexAdministradores = signal(0);
  private administradoresEnPaginaActual = computed<AdministradorResumen[]>(() => {
    const usuariosPagina = this.vistaActual() === 'eliminados'
      ? this.usuariosEliminados()
      : this.usuariosActivos();
    return usuariosPagina
      .filter(usuario => esAdministrador(usuario.rol))
      .map(usuario => ({
        id: usuario.id,
        nombre: usuario.nombre,
        primerApellido: usuario.primerApellido,
        correo: usuario.correo
      }));
  });
  administradores = computed(() => {
    const porId = new Map<number, AdministradorResumen>();
    for (const administrador of this.paginaAdministradores()?.content ?? []) {
      porId.set(administrador.id, administrador);
    }
    for (const administrador of this.administradoresEnPaginaActual()) {
      porId.set(administrador.id, administrador);
    }
    return [...porId.values()];
  });
  totalPaginasAdministradores = computed(() => this.endpointAdministradoresDisponible() === false
    ? Number(this.administradoresEnPaginaActual().length > 0)
    : this.totalPaginasAdministradoresGuardado());
  private totalPaginasActivosGuardado = signal(0);
  private totalPaginasEliminadosGuardado = signal(0);
  totalPaginasActivos = this.totalPaginasActivosGuardado.asReadonly();
  totalPaginasEliminados = this.totalPaginasEliminadosGuardado.asReadonly();
  cargandoAdministradores = signal(false);

  usuarioInformacion = signal<UsuarioContactos | null>(null);

  busquedaUsuarios = signal('');

  busquedaUsuariosEliminados = signal('');

  columnasOpcionalesUsuarios = signal<string[]>(['telefono', 'correo']);

  usuariosActivos = computed(() => this.paginaActiva()?.content ?? []);
  usuariosEliminados = computed(() => this.paginaEliminada()?.content ?? []);
  usuariosFiltrados = computed(() => this.usuariosActivos().filter(usuario => !esAdministrador(usuario.rol)));
  usuariosEliminadosFiltrados = computed(() => this.usuariosEliminados().filter(usuario => !esAdministrador(usuario.rol)));


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
  detalleCargando = signal(false);
  private readonly cambiosBusquedaActivos = new Subject<string>();
  private readonly cambiosBusquedaEliminados = new Subject<string>();
  private secuenciaActivos = 0;
  private secuenciaEliminados = 0;
  private secuenciaAdministradores = 0;


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
    private usuarioFormService: UsuarioFormService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private adminIcons: AdminIconsService
  ) {
    this.adminIcons.registrar();
  }


  ngOnInit(): void {
    this.usuarioForm = this.usuarioFormService.crearFormulario();
    this.cambiosBusquedaActivos.pipe(debounceTime(300)).subscribe(() => {
      this.paginaIndexActivos.set(0);
      this.cargarUsuarios();
    });
    this.cambiosBusquedaEliminados.pipe(debounceTime(300)).subscribe(() => {
      this.paginaIndexEliminados.set(0);
      this.cargarUsuariosEliminados();
    });
    this.cargarUsuarios();
    this.cargarAdministradores();
  }

  cambiarVista(vista: 'activos' | 'eliminados'): void {
    if (vista === this.vistaActual()) return;
    this.secuenciaActivos++;
    this.secuenciaEliminados++;
    this.secuenciaAdministradores++;
    this.vistaActual.set(vista);
    this.paginaActiva.set(null);
    this.paginaEliminada.set(null);
    this.paginaAdministradores.set(null);
    this.totalPaginasActivosGuardado.set(0);
    this.totalPaginasEliminadosGuardado.set(0);
    this.totalPaginasAdministradoresGuardado.set(0);
    this.paginaIndexAdministradores.set(0);
    this.cargarAdministradores();
    if (vista === 'activos') {
      this.paginaIndexActivos.set(0);
      this.cargarUsuarios();
    } else {
      this.paginaIndexEliminados.set(0);
      this.cargarUsuariosEliminados();
    }
  }

  buscarUsuarios(busqueda: string, vista: 'activos' | 'eliminados'): void {
    if (vista === 'activos') {
      this.secuenciaActivos++;
      this.paginaActiva.set(null);
      this.cambiosBusquedaActivos.next(busqueda);
    } else {
      this.secuenciaEliminados++;
      this.paginaEliminada.set(null);
      this.cambiosBusquedaEliminados.next(busqueda);
    }
  }

  cambiarPagina(event: PageEvent, vista: 'activos' | 'eliminados'): void {
    if (vista === 'activos') {
      this.paginaIndexActivos.set(event.pageIndex);
      this.pageSizeActivos.set(event.pageSize);
      this.paginaActiva.set(null);
      this.cargarUsuarios();
    } else {
      this.paginaIndexEliminados.set(event.pageIndex);
      this.pageSizeEliminados.set(event.pageSize);
      this.paginaEliminada.set(null);
      this.cargarUsuariosEliminados();
    }
  }

  cambiarPaginaAdministradores(event: PageEvent): void {
    this.paginaIndexAdministradores.set(event.pageIndex);
    this.paginaAdministradores.set(null);
    this.cargarAdministradores();
  }

  cargarAdministradores(): void {
    if (this.endpointAdministradoresDisponible() === false) return;
    const secuencia = ++this.secuenciaAdministradores;
    this.cargandoAdministradores.set(true);
    this.usuarioService.listarAdministradores(
      this.paginaIndexAdministradores(),
      this.vistaActual() === 'eliminados'
    ).pipe(finalize(() => {
      if (secuencia === this.secuenciaAdministradores) {
        this.cargandoAdministradores.set(false);
      }
    }))
      .subscribe({
        next: pagina => {
          if (secuencia !== this.secuenciaAdministradores) return;
          this.endpointAdministradoresDisponible.set(true);
          this.paginaAdministradores.set(pagina);
          this.totalPaginasAdministradoresGuardado.set(pagina.totalPages);
        },
        error: () => {
          if (secuencia !== this.secuenciaAdministradores) return;
          this.endpointAdministradoresDisponible.set(false);
          this.paginaAdministradores.set(null);
          this.totalPaginasAdministradoresGuardado.set(0);
        }
      });
  }

  actualizarColumnasOpcionales(columnas: string[]): void {
    this.columnasOpcionalesUsuarios.set(columnas);
  }


  /* =========================
     MODAL DE MENSAJES
     ========================= */

  mostrarModal(
    tipo: TipoModal,
    titulo: string,
    mensaje: string
  ): void {

    if (tipo === 'exito') {
      this.snackBar.open(`${titulo}: ${mensaje}`, 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['admin-snackbar-success']
      });
      return;
    }

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

    this.accionConfirmada = accion;

    this.dialog.open(ConfirmacionAdminDialogComponent, {
      width: 'min(100%, 440px)',
      panelClass: 'admin-confirm-dialog-panel',
      data: { titulo, mensaje }
    }).afterClosed().subscribe(confirmada => {
      if (confirmada) {
        this.confirmarAccion();
      } else {
        this.cancelarConfirmacion();
      }
    });

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
    const secuencia = ++this.secuenciaActivos;
    this.usuarioService
      .listarUsuarios(this.paginaIndexActivos(), this.pageSizeActivos(), this.busquedaUsuarios())
      .subscribe({
        next: pagina => {
          if (secuencia !== this.secuenciaActivos) return;
          this.paginaActiva.set(pagina);
          this.totalPaginasActivosGuardado.set(pagina.totalPages);
        },
        error: error => {
          if (secuencia !== this.secuenciaActivos) return;
          this.paginaActiva.set(null);
          this.totalPaginasActivosGuardado.set(0);
          if (error instanceof RespuestaUsuariosIncompatibleError) {
            this.mostrarModal('error', 'Backend desactualizado', error.message);
            return;
          }
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
    const secuencia = ++this.secuenciaEliminados;
    this.usuarioService
      .listarUsuariosEliminados(this.paginaIndexEliminados(), this.pageSizeEliminados(), this.busquedaUsuariosEliminados())
      .subscribe({
        next: pagina => {
          if (secuencia !== this.secuenciaEliminados) return;
          this.paginaEliminada.set(pagina);
          this.totalPaginasEliminadosGuardado.set(pagina.totalPages);
        },
        error: error => {
          if (secuencia !== this.secuenciaEliminados) return;
          this.paginaEliminada.set(null);
          this.totalPaginasEliminadosGuardado.set(0);
          if (error instanceof RespuestaUsuariosIncompatibleError) {
            this.mostrarModal('error', 'Backend desactualizado', error.message);
            return;
          }
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

  private controlesContacto(tipo: 'telefono' | 'correo'): Array<{ control: AbstractControl; valor: string }> {
    const rutaPrincipal = tipo === 'telefono' ? 'datosContacto.telefono' : 'datosPersonales.email';
    const rutaAdicional = tipo === 'telefono' ? 'datosContacto.telefonos' : 'datosContacto.correos';
    const principal = this.usuarioForm.get(rutaPrincipal);
    const adicionales = this.usuarioForm.get(rutaAdicional) as FormArray;
    const controles = [principal, ...adicionales.controls.map(fila => fila.get('valor'))]
      .filter((control): control is AbstractControl => control !== null);

    return controles
      .map(control => ({
        control,
        valor: tipo === 'telefono'
          ? String(control.value ?? '').replace(/\D/g, '')
          : String(control.value ?? '').trim().toLowerCase()
      }))
      .filter(contacto => Boolean(contacto.valor));
  }

  private limpiarErroresDuplicadosContacto(): void {
    for (const tipo of ['telefono', 'correo'] as const) {
      for (const { control } of this.controlesContacto(tipo)) {
        if (!control.hasError('duplicadoContacto')) {
          continue;
        }

        const errores = { ...control.errors };
        delete errores['duplicadoContacto'];
        control.setErrors(Object.keys(errores).length ? errores : null);
      }
    }
  }

  private obtenerConflictoContacto(): string | null {
    const tiposDuplicados: string[] = [];

    for (const tipo of ['telefono', 'correo'] as const) {
      const contactos = this.controlesContacto(tipo);
      const frecuencias = new Map<string, number>();

      for (const contacto of contactos) {
        frecuencias.set(contacto.valor, (frecuencias.get(contacto.valor) ?? 0) + 1);
      }

      let hayDuplicados = false;
      for (const contacto of contactos) {
        const mensajes: string[] = [];
        if ((frecuencias.get(contacto.valor) ?? 0) > 1) {
          mensajes.push(`Se repite en este formulario.`);
        }
        if (mensajes.length) {
          contacto.control.setErrors({
            ...contacto.control.errors,
            duplicadoContacto: mensajes.join(' ')
          });
          contacto.control.markAsTouched();
          hayDuplicados = true;
        }
      }

      if (hayDuplicados) {
        tiposDuplicados.push(tipo === 'telefono' ? 'teléfono' : 'correo');
      }
    }

    if (!tiposDuplicados.length) {
      return null;
    }

    return `Hay datos duplicados en ${tiposDuplicados.join(' y ')}. Revisa los campos marcados.`;
  }

  crearUsuario(): void {

    if (this.cargando()) {
      return;
    }

    this.limpiarErroresDuplicadosContacto();

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const conflictoContacto = this.obtenerConflictoContacto();
    if (conflictoContacto) {
      this.mostrarModal('advertencia', 'Datos de contacto duplicados', conflictoContacto);
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
          this.recargarVistaActual();

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

  editarUsuario(resumen: Pick<UsuarioResumen | AdministradorResumen, 'id'>): void {
    this.detalleCargando.set(true);
    this.usuarioService.obtenerUsuario(resumen.id)
      .pipe(finalize(() => this.detalleCargando.set(false)))
      .subscribe({
        next: usuario => this.prepararEdicion(usuario),
        error: error => this.mostrarErrorHttp(error, 'No fue posible cargar los datos completos del usuario.')
      });
  }

  private prepararEdicion(usuario: Usuario): void {
    this.editando.set(true);
    this.modalEditarAbierto.set(true);
    this.usuarioEditandoId.set(usuario.id);
    this.usuarioForm = this.usuarioFormService.crearFormulario(true);
    this.usuarioFormService.cargarUsuario(this.usuarioForm, usuario);

    const estado = this.usuarioForm.get('datosContacto.estado')?.value;
    const municipio = this.usuarioForm.get('datosContacto.municipio')?.value;
    if (!estado || !municipio) this.actualizarUbicacion();
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
    this.usuarioInformacion.set(null);

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

    this.limpiarErroresDuplicadosContacto();

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const conflictoContacto = this.obtenerConflictoContacto();
    if (conflictoContacto) {
      this.mostrarModal('advertencia', 'Datos de contacto duplicados', conflictoContacto);
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
          this.recargarVistaActual();

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
          this.recargarVistaActual();

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
          this.recargarVistaActual();

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

    else if (error.status === 403) {

      const detalle = typeof error.error === 'string'
        ? error.error
        : error.error?.mensaje || error.error?.message || '';

      this.mostrarModal(
        'error',
        'Acceso denegado',
        detalle || 'El servidor rechazó la actualización. Verifica que la sesión tenga permisos de administrador y que el backend permita actualizar este usuario.'
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
        'Datos de contacto duplicados',
        mensajeBackend ||
        'El correo o el teléfono ya está registrado en otro usuario.'
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

  abrirInformacion(resumen: UsuarioResumen): void {
    this.detalleCargando.set(true);
    this.usuarioService.obtenerContactosUsuario(resumen.id)
      .pipe(finalize(() => this.detalleCargando.set(false)))
      .subscribe({
        next: usuario => this.usuarioInformacion.set(usuario),
        error: error => this.mostrarErrorHttp(error, 'No fue posible cargar la información del usuario.')
      });
  }

  cerrarInformacion(): void {
    this.usuarioInformacion.set(null);
  }

  private recargarVistaActual(): void {
    this.paginaActiva.set(null);
    this.paginaEliminada.set(null);
    this.paginaAdministradores.set(null);
    this.paginaIndexAdministradores.set(0);
    this.cargarAdministradores();
    if (this.vistaActual() === 'activos') this.cargarUsuarios();
    else this.cargarUsuariosEliminados();
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
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.limpiarSesionLocal();
        this.router.navigate(['/login']);
      }
    });

  }


}