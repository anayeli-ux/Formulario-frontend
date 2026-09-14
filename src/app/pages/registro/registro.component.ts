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
        nombre: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/),
            Validators.minLength(2),
            Validators.maxLength(50)
          ]
        ],
        primer_apellido: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/),
            Validators.maxLength(50)
          ]
        ],
        segundo_apellido: [
          '',
          [
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/),
            Validators.maxLength(50)
          ]
        ],
        fecha_nacimiento: [
          '',
          [
            Validators.required,
            this.fechaNoFutura
          ]
        ]
      }),

      datosContacto: this.fb.group({
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
        estado: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/)
          ]
        ],
        municipio: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/)
          ]
        ],
        direccion: [
          '',
          [
            Validators.required,
            Validators.pattern(/\S/),
            Validators.maxLength(150)
          ]
        ]
      }),

      datosAdicionales: this.fb.group({
        animal_favorito: [
          '',
          [
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/),
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

  enviarRegistro(): void {
    this.mensajeError = '';

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const datosPersonales = this.registroForm.value.datosPersonales;
    const datosContacto = this.registroForm.value.datosContacto;
    const datosAdicionales = this.registroForm.value.datosAdicionales;

    const datosAEnviar: UsuarioRequest = {
      nombre: datosPersonales.nombre,
      primerApellido: datosPersonales.primer_apellido,
      segundoApellido: datosPersonales.segundo_apellido || '',
      telefono: datosContacto.telefono,
      codigoPostal: datosContacto.codigo_postal,
      direccion: datosContacto.direccion,
      fechaNacimiento: datosPersonales.fecha_nacimiento,
      animalFavorito: datosAdicionales.animal_favorito
    };

    console.log('Enviando datos al backend (8081):', datosAEnviar);

    this.usuarioService.crearUsuario(datosAEnviar).subscribe({
      next: (response) => {
        console.log('¡Guardado exitosamente!', response);
        alert('¡Usuario registrado con éxito!');
        this.registroForm.reset();
      },
      error: (err) => {
        console.error('Error al registrar:', err);
        console.error('Respuesta del backend:', err.error);

        if (err.status === 400) {
          alert('Hay datos incorrectos o incompletos. Revisa el formulario.');
        } else if (err.status === 409) {
          alert('El teléfono ingresado ya está registrado.');
        } else if (err.status === 503) {
          alert('No fue posible consultar el código postal.');
        } else if (err.status === 0) {
          alert('No fue posible conectarse con el servidor.');
        } else {
          alert('Ocurrió un error al registrar el usuario.');
        }
      }
    });
  }
}