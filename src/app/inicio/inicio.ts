import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AuthService
} from '../services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class InicioComponent {

  usuario = '';
  password = '';

  mensajeError = '';

  cargando = false;

  mostrarPassword = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  iniciarSesion(): void {

    this.mensajeError = '';

    this.usuario = this.usuario.trim();
    this.password = this.password.trim();

    if (this.usuario.length < 3) {

      this.mensajeError = 'El usuario es obligatorio y debe tener al menos 3 caracteres.';

      return;
    }

    if (this.password.length < 6) {

      this.mensajeError = 'La contraseña es obligatoria y debe tener al menos 6 caracteres.';

      return;
    }

    this.cargando = true;

    this.authService
      .login({
        identificador: this.usuario,
        password: this.password
      })
      .subscribe({

        next: respuesta => {

          this.cargando = false;

          if (respuesta.acceso === false) {
            this.mensajeError =
              'Usuario o contraseña incorrectos.';
          } else {
            this.router.navigate(['/admin']);
          }

        },

        error: error => {

          console.error(
            'Error al iniciar sesión:',
            error
          );

          this.cargando = false;

          this.mensajeError =
            'No se pudo conectar con el servidor.';

        }

      });

  }

  irRegistro(): void {

    this.router.navigate(['/registro']);

  }

}