import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';

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

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      datosPersonales: this.fb.group({
        nombre: ['', [Validators.required]],
        primer_apellido: ['', [Validators.required]],
        segundo_apellido: [''],
        fecha_nacimiento: ['', [Validators.required]]
      }),
      datosContacto: this.fb.group({
        telefono: ['', [Validators.required, Validators.maxLength(15)]],
        codigo_postal: ['', [Validators.required]],
        estado: ['', [Validators.required]],
        municipio: ['', [Validators.required]],
        direccion: ['', [Validators.required]]
      }),
      datosAdicionales: this.fb.group({
        animal_favorito: ['']
      })
    });
  }

  enviarRegistro(): void {
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
          alert('Ocurrió un error al conectar con el servidor.');
        }
      });
    } else {
      this.registroForm.markAllAsTouched();
    }
  }
}