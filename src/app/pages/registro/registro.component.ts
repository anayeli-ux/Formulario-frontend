import { Component, computed, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  UsuarioService,
  UsuarioRequest
} from '../../services/usuario.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UsuarioFormService } from '../../services/usuario-form.service';

import {
  DatosPersonalesComponent
} from '../../components/datos-personales/datos-personales.component';

import {
  DatosContactoComponent
} from '../../components/datos-contacto/datos-contacto.component';



type TipoModal =
  | 'exito'
  | 'advertencia'
  | 'error';


@Component({
  selector: 'app-registro',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatosPersonalesComponent,
    DatosContactoComponent,
  ],

  templateUrl: './registro.component.html',

  styleUrls: [
    './registro.component.css'
  ]
})


export class RegistroComponent implements OnInit, OnDestroy {

  registroForm!: FormGroup;
  cargando = signal(false);


  // =========================
  // MODAL
  // =========================

  modalVisible = signal(false);

  modalTipo = signal<TipoModal>('exito');

  modalTitulo = signal('');

  modalMensaje = signal('');

  esRegistroExitoso = computed(() => this.modalTipo() === 'exito');

  private redireccionTimer?: ReturnType<typeof setTimeout>;

  private controlInvalidoPendiente = '';

  @ViewChild('registroFormElement')
  private registroFormElement?: ElementRef<HTMLFormElement>;


  constructor(
    private usuarioService: UsuarioService,
    private usuarioFormService: UsuarioFormService,
    private router: Router
  ) {}


  ngOnInit(): void {

    this.registroForm = this.usuarioFormService.crearFormulario();
  }

  ngOnDestroy(): void {
    if (this.redireccionTimer) {
      clearTimeout(this.redireccionTimer);
    }
  }

  // =========================
  // MOSTRAR MODAL
  // =========================

  mostrarModal(
    tipo: TipoModal,
    titulo: string,
    mensaje: string
  ): void {

    this.modalTipo.set(tipo);

    this.modalTitulo.set(titulo);

    this.modalMensaje.set(mensaje);

    this.modalVisible.set(true);

  }


  // =========================
  // CERRAR MODAL
  // =========================

  cerrarModal(): void {

    this.modalVisible.set(false);

    if (this.redireccionTimer) {
      clearTimeout(this.redireccionTimer);
      this.redireccionTimer = undefined;
    }

    this.enfocarControlInvalido();

  }

  private obtenerPrimerControlInvalido(
    grupo: FormGroup
  ): string {
    for (const nombre of Object.keys(grupo.controls)) {
      const control = grupo.controls[nombre];

      if (control instanceof FormGroup) {
        const controlHijo = this.obtenerPrimerControlInvalido(control);

        if (controlHijo) {
          return controlHijo;
        }
      } else if (control.invalid) {
        return nombre;
      }
    }

    return '';
  }

  private enfocarControlInvalido(): void {
    if (!this.controlInvalidoPendiente || !this.registroFormElement) {
      return;
    }

    const control = this.registroFormElement.nativeElement.querySelector(
      `[formControlName="${this.controlInvalidoPendiente}"]`
    );

    if (control instanceof HTMLElement) {
      control.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      control.focus();
      this.controlInvalidoPendiente = '';
    }
  }

  private obtenerMensajeError(error: any): string {
    if (typeof error?.error === 'string') {
      return error.error;
    }

    return error?.error?.mensaje || error?.error?.message || error?.message || '';
  }


  // =========================
  // ENVIAR REGISTRO
  // =========================

  enviarRegistro(): void {
    if (this.cargando()) {
      return;
    }

    // Marca todos los campos para mostrar sus mensajes específicos.
    if (this.registroForm.invalid) {

      this.registroForm
        .markAllAsTouched();

      this.controlInvalidoPendiente =
        this.obtenerPrimerControlInvalido(
          this.registroForm
        );

      this.enfocarControlInvalido();

      return;

    }


    const datosAEnviar: UsuarioRequest = this.usuarioFormService.crearRequest(this.registroForm);


    this.cargando.set(true);

    this.usuarioService
      .crearUsuario(datosAEnviar)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({


        // =========================
        // REGISTRO EXITOSO
        // =========================

        next: () => {
          this.registroForm
            .reset();


          this.mostrarModal(
            'exito',
            '¡Lo lograste!',
            'Tu registro se completó correctamente. Serás redirigido al inicio de sesión.'
          );

          this.redireccionTimer = setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);

        },


        // =========================
        // ERROR
        // =========================

        error: (err) => {
          // =========================
          // ERROR 400
          // =========================

          if (err.status === 400) {

            this.mostrarModal(
              'advertencia',
              'Datos incorrectos',
              this.obtenerMensajeError(err) ||
              'Hay datos incorrectos o incompletos. Revisa el formulario.'
            );

          }


          // =========================
          // ERROR 409
          // =========================

          else if (
            err.status === 409
          ) {

            this.mostrarModal(
              'advertencia',
              'Usuario ya registrado',
              this.obtenerMensajeError(err) ||
              'Ya existe un usuario con los datos ingresados. Revisa el teléfono y el correo electrónico.'
            );

          }


          // =========================
          // ERROR 503
          // =========================

          else if (
            err.status === 503
          ) {

            this.mostrarModal(
              'error',
              'Servicio no disponible',
              this.obtenerMensajeError(err) ||
              'No fue posible consultar el código postal.'
            );

          }


          // =========================
          // SIN CONEXIÓN
          // =========================

          else if (
            err.status === 0
          ) {

            this.mostrarModal(
              'error',
              'Sin conexión',
              'No fue posible conectarse con el servidor.'
            );

          }


          // =========================
          // OTROS ERRORES
          // =========================

          else {

            this.mostrarModal(
              'error',
              'Error al registrar',
              this.obtenerMensajeError(err) ||
              'Ocurrió un error al registrar el usuario.'
            );

          }

      }
    });
  }
}