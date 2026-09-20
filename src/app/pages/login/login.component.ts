import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMensaje: string = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      identificador: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onLogin(): void {
    if (this.cargando) {
      return;
    }

    if (this.loginForm.valid) {
      this.cargando = true;
      const credenciales = {
        identificador: this.loginForm.value.identificador.trim(),
        password: this.loginForm.value.password
      };

      this.authService.login(credenciales).pipe(
        finalize(() => this.cargando = false)
      ).subscribe({
        next: (response) => {
          console.log('Login exitoso', response);

          if (response.acceso === false) {
            this.errorMensaje = 'Credenciales incorrectas.';
            return;
          }

          const destino = response.usuario.rol === 'ADMIN'
            ? '/admin'
            : '/usuario';

          this.router.navigate([destino]);
        },
        error: (err) => {
          console.error('Error de autenticación', err);
          this.errorMensaje = 'Credenciales incorrectas o error en el servidor.';
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }


  
}