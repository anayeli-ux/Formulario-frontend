import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
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
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ConfirmacionAdminDialogComponent } from '../../components/confirmacion-admin-dialog/confirmacion-admin-dialog.component';
import { AdminIconsService } from '../../services/admin-icons.service';

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
    MatSnackBarModule
  ],

  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  nombreAdministrador = computed(() => {
    const perfil = this.authService.perfilActual();
    return [perfil?.nombre, perfil?.primerApellido].filter(Boolean).join(' ');
  });

  correoAdministrador = computed(() =>
    this.authService.perfilActual()?.correos?.find(contacto => contacto.tipo === 'PRINCIPAL')?.valor
      ?? this.authService.usuarioActual()?.email
      ?? ''
  );

  /* =========================
     USUARIOS
     ========================= */

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

  totalUsuariosActivos =
    computed(
      () => this.usuariosActivos().filter(usuario => usuario.rol !== 'ADMIN').length
    );

  totalUsuariosEliminados =
    computed(
      () => this.usuariosEliminados().filter(usuario => usuario.rol !== 'ADMIN').length
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
    private usuarioFormService: UsuarioFormService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private adminIcons: AdminIconsService
  ) {
    this.adminIcons.registrar();
  }


  ngOnInit(): void {

    this.usuarioForm = this.usuarioFormService.crearFormulario();

    this.cargarUsuarios();

  }

  cambiarVista(vista: 'activos' | 'eliminados'): void {
    this.vistaActual.set(vista);
    if (vista === 'eliminados' && this.usuarioService.usuariosEliminados() === null) {
      this.cargarUsuariosEliminados();
    }
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

    this.usuarioService
      .listarUsuarios()
      .subscribe({

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

  private obtenerConflictoContacto(excluirUsuarioId?: number): string | null {
    const usuariosExistentes = [
      ...(this.usuarioService.usuariosActivos() ?? []),
      ...(this.usuarioService.usuariosEliminados() ?? [])
    ].filter(usuario => usuario.id !== excluirUsuarioId);
    const tiposDuplicados: string[] = [];

    for (const tipo of ['telefono', 'correo'] as const) {
      const contactos = this.controlesContacto(tipo);
      const valoresExistentes = new Set(usuariosExistentes.flatMap(usuario =>
        ((tipo === 'telefono' ? usuario.telefonos : usuario.correos) ?? [])
          .map(contacto => tipo === 'telefono'
            ? contacto.valor.replace(/\D/g, '')
            : contacto.valor.trim().toLowerCase())
          .filter(Boolean)
      ));
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
        if (valoresExistentes.has(contacto.valor)) {
          mensajes.push('Ya está registrado en otro usuario.');
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

    this.limpiarErroresDuplicadosContacto();

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const conflictoContacto = this.obtenerConflictoContacto(this.usuarioEditandoId());
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
      next: () => {
        this.usuarioService.invalidarCacheListas();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.usuarioService.invalidarCacheListas();
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

}