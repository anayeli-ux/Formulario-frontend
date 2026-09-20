import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

import {
  UsuarioService,
  UsuarioRequest
} from '../../services/usuario.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

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
  mensajeError = '';
  cargando = false;


  // =========================
  // MODAL
  // =========================

  modalVisible = false;

  modalTipo: TipoModal = 'exito';

  modalTitulo = '';

  modalMensaje = '';

  esRegistroExitoso = false;

  private redireccionTimer?: ReturnType<typeof setTimeout>;

  private controlInvalidoPendiente = '';

  @ViewChild('registroFormElement')
  private registroFormElement?: ElementRef<HTMLFormElement>;


  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}


  ngOnInit(): void {

    this.registroForm =
      this.fb.group({


        // =========================
        // DATOS PERSONALES
        // =========================

        datosPersonales:
          this.fb.group({

            nombre: [
              '',
              [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(50)
              ]
            ],

            primer_apellido: [
              '',
              [
                Validators.required,
                Validators.maxLength(50)
              ]
            ],

            password: [
              '',
              [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
              ]
            ],

            fecha_nacimiento: [
              '',
              [
                Validators.required,
                this.fechaNoFutura.bind(this)
              ]
            ],

            email: [
              '',
              [
                Validators.required,
                Validators.email,
                Validators.maxLength(150)
              ]
            ]

          }),


        // =========================
        // DATOS DE CONTACTO
        // =========================

        datosContacto:
          this.fb.group({

            telefono: [
              '',
              [
                Validators.required,
                Validators.pattern(/^\d{10}$/)
              ]
            ],

            codigo_postal: [
              '',
              [
                Validators.required,
                Validators.pattern(/^\d{5}$/)
              ]
            ],


            // Estado vuelve a aparecer
            // en el formulario.
            estado: [
              '',
              [
                Validators.required,
                Validators.maxLength(100)
              ]
            ],


            // Municipio vuelve a aparecer
            // en el formulario.
            municipio: [
              '',
              [
                Validators.required,
                Validators.maxLength(100)
              ]
            ],


            direccion: [
              '',
              [
                Validators.required,
                Validators.maxLength(150)
              ]
            ]

          }),


      });

  }

  ngOnDestroy(): void {
    if (this.redireccionTimer) {
      clearTimeout(this.redireccionTimer);
    }
  }

  private fechaNoFutura(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const fecha = new Date(`${control.value}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha > hoy ? { fechaFutura: true } : null;
  }


  // =========================
  // MOSTRAR MODAL
  // =========================

  mostrarModal(
    tipo: TipoModal,
    titulo: string,
    mensaje: string
  ): void {

    this.modalTipo = tipo;

    this.modalTitulo = titulo;

    this.modalMensaje = mensaje;

    this.esRegistroExitoso = tipo === 'exito';

    this.modalVisible = true;

  }


  // =========================
  // CERRAR MODAL
  // =========================

  cerrarModal(): void {

    this.modalVisible = false;

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


  // =========================
  // ENVIAR REGISTRO
  // =========================

  enviarRegistro(): void {
    if (this.cargando) {
      return;
    }

    this.mensajeError = '';

    /*
     * Si hay algún campo incorrecto,
     * mostramos la advertencia.
     */
    if (this.registroForm.invalid) {

      this.registroForm
        .markAllAsTouched();

      this.controlInvalidoPendiente =
        this.obtenerPrimerControlInvalido(
          this.registroForm
        );

      this.enfocarControlInvalido();

      this.mostrarModal(
        'advertencia',
        'Datos incorrectos',
        'Hay datos incorrectos o incompletos. Revisa el formulario.'
      );

      return;

    }


    const datosPersonales =
      this.registroForm
        .value
        .datosPersonales;


    const datosContacto =
      this.registroForm
        .value
        .datosContacto;



    /*
     * El backend recibe un objeto plano.
     *
     * Estado y municipio NO se envían
     * por ahora, ya que el backend
     * continúa obteniéndolos mediante
     * su lógica actual.
     */
    const datosAEnviar:
      UsuarioRequest = {

        nombre:
          datosPersonales.nombre,

        primerApellido:
          datosPersonales.primer_apellido,

        password:
          datosPersonales.password,

        telefono:
          datosContacto.telefono,

        codigoPostal:
          datosContacto.codigo_postal,

        direccion:
          datosContacto.direccion,

        fechaNacimiento:
          datosPersonales.fecha_nacimiento,

        email:
          datosPersonales.email

      };


    console.log('Enviando datos al backend (8081):', datosAEnviar);


    /*
     * Solo para comprobar lo escrito
     * por el usuario en el formulario.
     */
    console.log(
      'Estado escrito:',
      datosContacto.estado
    );

    console.log(
      'Municipio escrito:',
      datosContacto.municipio
    );


    this.cargando = true;

    this.usuarioService
      .crearUsuario(datosAEnviar)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({


        // =========================
        // REGISTRO EXITOSO
        // =========================

        next: (response) => {

          console.log(
            '¡Guardado exitosamente!',
            response
          );


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

          console.error(
            'Error al registrar:',
            err
          );

          console.error(
            'Respuesta del backend:',
            err.error
          );


          // =========================
          // ERROR 400
          // =========================

          if (err.status === 400) {

            this.mostrarModal(
              'advertencia',
              'Datos incorrectos',
              err.error?.mensaje ||
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
              err.error?.mensaje ||
              'El teléfono ingresado ya está registrado.'
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
              err.error?.mensaje ||
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
              err.error?.mensaje ||
              'Ocurrió un error al registrar el usuario.'
            );

          }

      }
    });
  }
}