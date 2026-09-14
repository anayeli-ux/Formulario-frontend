import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
<<<<<<< Updated upstream
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import {
  UsuarioService,
  UsuarioRequest
} from '../../services/usuario.service';
=======
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
>>>>>>> Stashed changes

import { DatosPersonalesComponent } from '../../components/datos-personales/datos-personales.component';
import { DatosContactoComponent } from '../../components/datos-contacto/datos-contacto.component';
import { DatosAdicionalesComponent } from '../../components/datos-adicionales/datos-adicionales.component';

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
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnInit {

  registroForm!: FormGroup;
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {

    this.registroForm = this.fb.group({

      datosPersonales: this.fb.group({
<<<<<<< Updated upstream

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

=======
        nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/)]],
        primer_apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/)]],
        segundo_apellido: ['', [Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/)]],
        fecha_nacimiento: ['', [Validators.required, this.fechaNoFutura]]
>>>>>>> Stashed changes
      }),

      datosContacto: this.fb.group({
<<<<<<< Updated upstream

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

        direccion: [
          '',
          [
            Validators.required,
            Validators.maxLength(150)
          ]
        ]

=======
        telefono: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
        codigo_postal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        estado: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/)]],
        municipio: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/)]],
        direccion: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]]
>>>>>>> Stashed changes
      }),

      datosAdicionales: this.fb.group({
<<<<<<< Updated upstream

        animal_favorito: [
          '',
          [
            Validators.required,
            Validators.maxLength(50)
          ]
        ]

=======
        animal_favorito: ['', [Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/)]]
>>>>>>> Stashed changes
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

  enviarRegistro(): void {
<<<<<<< Updated upstream

    // Si el formulario tiene errores,
    // marcamos todos los campos para mostrar validaciones.
    if (this.registroForm.invalid) {

=======
    this.mensajeError = '';
    if (this.registroForm.valid) {
      const datosAEnviar = this.registroForm.value;
      console.log('Enviando datos al backend (8081):', datosAEnviar);

      this.usuarioService.crearUsuario(datosAEnviar).subscribe({
        next: (response) => {
          console.log('¡Guardado exitosamente!', response);
          alert('¡Usuario registrado con éxito!');
          this.registroForm.reset();
        },
        error: (err) => {
          console.error('Error al registrar:', err);
          this.mensajeError = err.error?.message || 'No se pudo registrar el usuario. Revisa los datos e inténtalo de nuevo.';
        }
      });
    } else {
>>>>>>> Stashed changes
      this.registroForm.markAllAsTouched();

      return;
    }

    const datosPersonales =
      this.registroForm.value.datosPersonales;

    const datosContacto =
      this.registroForm.value.datosContacto;

    const datosAdicionales =
      this.registroForm.value.datosAdicionales;

    /*
     * El formulario de Angular está dividido
     * en tres grupos.
     *
     * El backend necesita recibir un solo
     * objeto plano.
     */
    const datosAEnviar: UsuarioRequest = {

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

    console.log(
      'Enviando datos al backend (8081):',
      datosAEnviar
    );

    this.usuarioService
      .crearUsuario(datosAEnviar)
      .subscribe({

        next: (response) => {

          console.log(
            '¡Guardado exitosamente!',
            response
          );

          alert(
            '¡Usuario registrado con éxito!'
          );

          this.registroForm.reset();

        },

        error: (err) => {

          console.error(
            'Error al registrar:',
            err
          );

          console.error(
            'Respuesta del backend:',
            err.error
          );

          /*
           * Por ahora mostramos el error
           * según el código HTTP.
           */
          if (err.status === 400) {

            alert(
              'Hay datos incorrectos o incompletos. Revisa el formulario.'
            );

          } else if (err.status === 409) {

            alert(
              'El teléfono ingresado ya está registrado.'
            );

          } else if (err.status === 503) {

            alert(
              'No fue posible consultar el código postal.'
            );

          } else if (err.status === 0) {

            alert(
              'No fue posible conectarse con el servidor.'
            );

          } else {

            alert(
              'Ocurrió un error al registrar el usuario.'
            );

          }

        }

      });

  }

}