import { Component, OnInit } from '@angular/core';
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

import {
  DatosPersonalesComponent
} from '../../components/datos-personales/datos-personales.component';

import {
  DatosContactoComponent
} from '../../components/datos-contacto/datos-contacto.component';

import {
  DatosAdicionalesComponent
} from '../../components/datos-adicionales/datos-adicionales.component';


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
    DatosAdicionalesComponent
  ],

  templateUrl: './registro.component.html',

  styleUrls: [
    './registro.component.css'
  ]
})


export class RegistroComponent implements OnInit {

  registroForm!: FormGroup;
  mensajeError = '';


  // =========================
  // MODAL
  // =========================

  modalVisible = false;

  modalTipo: TipoModal = 'exito';

  modalTitulo = '';

  modalMensaje = '';


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

            segundo_apellido: [
              '',
              [
                Validators.maxLength(50)
              ]
            ],

            fecha_nacimiento: [
              '',
              [
                Validators.required
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


        // =========================
        // DATOS ADICIONALES
        // =========================

        datosAdicionales:
          this.fb.group({

            animal_favorito: [
              '',
              [
                Validators.required,
                Validators.maxLength(50)
              ]
            ]

          })

      });

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

    this.modalVisible = true;

  }


  // =========================
  // CERRAR MODAL
  // =========================

  cerrarModal(): void {

    this.modalVisible = false;

  }


  // =========================
  // ENVIAR REGISTRO
  // =========================

  enviarRegistro(): void {
    this.mensajeError = '';

    /*
     * Si hay algún campo incorrecto,
     * mostramos la advertencia.
     */
    if (this.registroForm.invalid) {

      this.registroForm
        .markAllAsTouched();

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


    const datosAdicionales =
      this.registroForm
        .value
        .datosAdicionales;


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

        segundoApellido:
          datosPersonales.segundo_apellido || '',

        telefono:
          datosContacto.telefono,

        codigoPostal:
          datosContacto.codigo_postal,

        direccion:
          datosContacto.direccion,

        fechaNacimiento:
          datosPersonales.fecha_nacimiento,

        animalFavorito:
          datosAdicionales.animal_favorito

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


    this.usuarioService
      .crearUsuario(datosAEnviar)
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


          this.router.navigate(['/exito']);

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