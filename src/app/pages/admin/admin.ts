import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, filter, finalize, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { PostaliaService } from '../../services/postalia.service';
import { UsuarioFormService } from '../../services/usuario-form.service';
import { DatosPersonalesComponent } from '../../components/datos-personales/datos-personales.component';
import { DatosContactoComponent } from '../../components/datos-contacto/datos-contacto.component';
import { UsuariosTablaComponent } from '../../components/usuarios-tabla/usuarios-tabla.component';
import { ContactosUsuarioComponent } from '../../components/contactos-usuario/contactos-usuario.component';
import { obtenerContactoPrincipal } from '../../utils/contactos.util';
import {
  ModalMensajeComponent
} from '../../components/modal-mensaje/modal-mensaje.component';

import {
  FormSectionComponent
} from '../../components/form-section/form-section.component';
import { ConfirmacionAdminDialogComponent } from '../../components/confirmacion-admin-dialog/confirmacion-admin-dialog.component';
import { AdminIconsService } from '../../services/admin-icons.service';

type TipoModal = 'exito' | 'advertencia' | 'error' | 'confirmacion';

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
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  private readonly codigoPostalCambios = new Subject<string>();

  vistaActual = signal<'activos' | 'eliminados'>('activos');

  usuariosActivos = computed(() =>
    this.ordenarPorId(this.usuarioService.usuariosActivos() ?? [])
  );

  usuariosEliminados = computed(() =>
    this.ordenarPorId(this.usuarioService.usuariosEliminados() ?? [])
  );
  usuarioInformacion = signal<Usuario | null>(null);
  busquedaUsuarios = signal('');
  busquedaUsuariosEliminados = signal('');

  columnasOpcionalesUsuarios = signal<string[]>(['telefono', 'correo']);

  usuariosFiltrados = computed(() =>
    this.filtrarUsuarios(
      this.usuariosActivos().filter(usuario => usuario.rol !== 'ADMIN'),
      this.busquedaUsuarios()
    )
  );

  administradoresActivos = computed(() =>
    this.usuariosActivos().filter(usuario => usuario.rol === 'ADMIN')
  );

  administradoresEliminados = computed(() =>
    this.usuariosEliminados().filter(usuario => usuario.rol === 'ADMIN')
  );

  usuariosEliminadosFiltrados = computed(() =>
    this.filtrarUsuarios(
      this.usuariosEliminados().filter(usuario => usuario.rol !== 'ADMIN'),
      this.busquedaUsuariosEliminados()
    )
  );

  totalUsuariosActivos = computed(
    () => this.usuariosActivos().filter(usuario => usuario.rol !== 'ADMIN').length
  );

  totalUsuariosEliminados = computed(
    () => this.usuariosEliminados().filter(usuario => usuario.rol !== 'ADMIN').length
  );

  editando = signal(false);
  modalEditarAbierto = signal(false);
  usuarioEditandoId = signal<number | undefined>(undefined);
  usuarioForm!: FormGroup;

  modalMensajeVisible = signal(false);
  modalTipo = signal<TipoModal>('exito');
  modalTitulo = signal('');
  modalMensaje = signal('');
  cargando = signal(false);

  private accionConfirmada: (() => void) | null = null;
  private eliminadosCargados = false;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private postaliaService: PostaliaService,
    private usuarioFormService: UsuarioFormService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private adminIcons: AdminIconsService,
    private destroyRef: DestroyRef
  ) {
    this.adminIcons.registrar();
  }

  ngOnInit(): void {
    this.usuarioForm = this.usuarioFormService.crearFormulario();
    this.cargarUsuarios();

    this.codigoPostalCambios.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(codigoPostal => /^\d{5}$/.test(codigoPostal)),
      switchMap(codigoPostal => this.postaliaService.buscarCodigoPostal(codigoPostal).pipe(
        catchError(() => EMPTY)
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(ubicacion => {
      const codigoPostal = this.usuarioForm.get('datosContacto.codigo_postal')?.value;
      this.aplicarUbicacion(codigoPostal, ubicacion);
    });
  }

  cambiarVista(vista: 'activos' | 'eliminados'): void {
    this.vistaActual.set(vista);
    if (vista === 'eliminados' && !this.eliminadosCargados) {
      this.cargarUsuariosEliminados();
    }
  }

  actualizarColumnasOpcionales(columnas: string[]): void {
    this.columnasOpcionalesUsuarios.set(columnas);
  }

  private cargarUsuarios(): void {
    this.usuarioService.listarUsuarios().subscribe({
      error: () => this.mostrarModal(
        'error',
        'Error al cargar usuarios',
        'No fue posible obtener la lista de usuarios activos.'
      )
    });
  }

  private cargarUsuariosEliminados(): void {
    this.usuarioService.listarUsuariosEliminados().subscribe({
      next: () => this.eliminadosCargados = true,
      error: () => this.mostrarModal(
        'error',
        'Error al cargar usuarios',
        'No fue posible obtener la lista de usuarios eliminados.'
      )
    });
  }

  mostrarModal(tipo: TipoModal, titulo: string, mensaje: string): void {
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
    if (!this.accionConfirmada) return;
    const accion = this.accionConfirmada;
    this.modalMensajeVisible.set(false);
    this.accionConfirmada = null;
    accion();
  }

  cancelarConfirmacion(): void {
    this.modalMensajeVisible.set(false);
    this.accionConfirmada = null;
  }

  abrirCrearUsuario(): void {
    this.editando.set(false);
    this.usuarioEditandoId.set(undefined);
    this.usuarioForm = this.usuarioFormService.crearFormulario();
    this.modalEditarAbierto.set(true);
  }

  crearUsuario(): void {
    if (this.cargando() || this.usuarioForm.invalid) {
      if (this.usuarioForm.invalid) this.usuarioForm.markAllAsTouched();
      return;
    }

    const usuario = this.usuarioFormService.crearRequest(this.usuarioForm);
    this.cargando.set(true);

    this.usuarioService.crearUsuario(usuario)
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.modalEditarAbierto.set(false);
          this.limpiarFormulario();
          this.mostrarModal('exito', 'Usuario registrado', 'El usuario fue creado correctamente.');
        },
        error: (error: any) => {
          this.mostrarErrorHttp(error, 'No se pudo crear el usuario.');
        }
      });
  }

  editarUsuario(usuario: Usuario): void {
    this.editando.set(true);
    this.modalEditarAbierto.set(true);
    this.usuarioEditandoId.set(usuario.id);

    this.usuarioForm = this.usuarioFormService.crearFormulario(true);
    this.usuarioFormService.cargarUsuario(this.usuarioForm, usuario);

    const estado = this.usuarioForm.get('datosContacto.estado')?.value;
    const municipio = this.usuarioForm.get('datosContacto.municipio')?.value;
    if (!estado || !municipio) {
      this.consultarUbicacionAlEditar(this.usuarioForm.get('datosContacto.codigo_postal')?.value);
    }
  }

  actualizarUbicacion(codigoPostal: string): void {
    if (!/^\d{5}$/.test(codigoPostal)) {
      this.usuarioForm.get('datosContacto.estado')?.setValue('');
      this.usuarioForm.get('datosContacto.municipio')?.setValue('');
      return;
    }

    this.usuarioForm.get('datosContacto.estado')?.setValue('');
    this.usuarioForm.get('datosContacto.municipio')?.setValue('');
    this.codigoPostalCambios.next(codigoPostal);
  }

  private consultarUbicacionAlEditar(codigoPostal: string): void {
    if (!/^\d{5}$/.test(codigoPostal)) return;

    this.postaliaService.buscarCodigoPostal(codigoPostal)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ubicacion => this.aplicarUbicacion(codigoPostal, ubicacion),
        error: () => undefined
      });
  }

  private aplicarUbicacion(codigoPostal: string, ubicacion: { estado: string; municipio: string }): void {
    if (this.usuarioForm.get('datosContacto.codigo_postal')?.value !== codigoPostal) return;
    this.usuarioForm.get('datosContacto.estado')?.setValue(ubicacion.estado);
    this.usuarioForm.get('datosContacto.municipio')?.setValue(ubicacion.municipio);
  }

  cerrarModalEditar(): void {
    this.modalEditarAbierto.set(false);
    this.limpiarFormulario();
  }

  cancelarEdicion(): void {
    this.cerrarModalEditar();
  }

  actualizarUsuario(): void {
    if (this.cargando() || this.usuarioEditandoId() === undefined || this.usuarioForm.invalid) {
      if (this.usuarioForm.invalid) this.usuarioForm.markAllAsTouched();
      return;
    }

    const usuario = this.usuarioFormService.crearRequest(this.usuarioForm, false);
    this.cargando.set(true);

    this.usuarioService.actualizarUsuario(this.usuarioEditandoId()!, usuario)
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.modalEditarAbierto.set(false);
          this.limpiarFormulario();
          this.mostrarModal('exito', 'Usuario actualizado', 'Los datos del usuario fueron actualizados correctamente.');
        },
        error: (error: any) => {
          this.mostrarErrorHttp(error, 'No se pudo actualizar el usuario.');
        }
      });
  }

  eliminarUsuario(id: number): void {
    this.mostrarConfirmacion(
      '¿Eliminar usuario?',
      'El usuario será marcado como inactivo y aparecerá en la sección de usuarios eliminados.',
      () => this.confirmarEliminacion(id)
    );
  }

  private confirmarEliminacion(id: number): void {
    this.cargando.set(true);

    this.usuarioService.eliminarUsuario(id)
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.mostrarModal('exito', 'Usuario eliminado', 'El usuario fue eliminado correctamente.');
        },
        error: (error: any) => {
          this.mostrarErrorHttp(error, 'No se pudo eliminar el usuario.');
        }
      });
  }

  reactivarUsuario(id: number): void {
    this.mostrarConfirmacion(
      '¿Reactivar usuario?',
      'El usuario volverá a aparecer en la lista de usuarios activos.',
      () => this.confirmarReactivacion(id)
    );
  }

  private confirmarReactivacion(id: number): void {
    this.cargando.set(true);

    this.usuarioService.reactivarUsuario(id)
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.mostrarModal('exito', 'Usuario reactivado', 'El usuario fue reactivado correctamente.');
        },
        error: (error: any) => {
          this.mostrarErrorHttp(error, 'No se pudo reactivar el usuario.');
        }
      });
  }

  private mostrarErrorHttp(error: any, mensajePredeterminado: string): void {
    const mensajeBackend = this.obtenerMensajeError(error);

    if (error.status === 400) {
      this.mostrarModal('advertencia', 'Datos incorrectos', mensajeBackend || 'Hay datos incorrectos o incompletos.');
    } else if (error.status === 403) {
      const detalle = typeof error.error === 'string' ? error.error : error.error?.mensaje || error.error?.message || '';
      this.mostrarModal('error', 'Acceso denegado', detalle || 'El servidor rechazó la actualización.');
    } else if (error.status === 404) {
      this.mostrarModal('error', 'Usuario no encontrado', mensajeBackend || 'El usuario solicitado no fue encontrado.');
    } else if (error.status === 409) {
      this.mostrarModal('advertencia', 'Conflicto de datos', mensajeBackend || 'Ya existe un usuario con esos datos.');
    } else if (error.status === 503) {
      this.mostrarModal('error', 'Servicio no disponible', mensajeBackend || 'No fue posible consultar el código postal.');
    } else if (error.status === 0) {
      this.mostrarModal('error', 'Sin conexión', 'No fue posible conectarse con el servidor.');
    } else {
      this.mostrarModal('error', 'Ocurrió un error', mensajeBackend || mensajePredeterminado);
    }
  }

  private obtenerMensajeError(error: any): string {
    const respuesta = error?.error;
    if (typeof respuesta === 'string') return respuesta;
    return respuesta?.mensaje || respuesta?.message || error?.message || '';
  }

  private filtrarUsuarios(usuarios: Usuario[], busqueda: string): Usuario[] {
    const termino = this.normalizarTexto(busqueda);
    if (!termino) return usuarios;

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

  obtenerCorreoPrincipal(usuario: Usuario): string {
    return obtenerContactoPrincipal(usuario.correos)?.valor ?? '';
  }

  obtenerCodigoPostalPrincipal(usuario: Usuario): string {
    return usuario.direcciones?.find(direccion => direccion.tipo === 'PRINCIPAL')?.codigoPostal ?? '';
  }

  abrirInformacion(usuario: Usuario): void {
    this.usuarioInformacion.set(usuario);
  }

  cerrarInformacion(): void {
    this.usuarioInformacion.set(null);
  }

  private normalizarTexto(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private ordenarPorId(usuarios: Usuario[]): Usuario[] {
    return [...usuarios].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }

  limpiarFormulario(): void {
    this.editando.set(false);
    this.usuarioEditandoId.set(undefined);
    this.usuarioForm = this.usuarioFormService.crearFormulario();
  }

  cerrarSesion(): void {
    if (this.cargando()) return;
    this.cargando.set(true);

    this.authService.cerrarSesion().pipe(
      finalize(() => this.cargando.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.usuarioService.limpiarListas();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.usuarioService.limpiarListas();
        this.authService.limpiarSesionLocal();
        this.router.navigate(['/login']);
      }
    });
  }
}