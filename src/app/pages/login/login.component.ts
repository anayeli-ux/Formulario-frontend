import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoginError, LoginErrorField } from '../../models/login.model';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingOverlayComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loginError = signal<LoginError | null>(null);
  cargando = signal(false);

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

  getFieldError(controlName: string): string {
    const control = this.loginForm.get(controlName) as AbstractControl | null;

    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return controlName === 'identificador'
        ? 'El correo o usuario es obligatorio.'
        : 'La contraseña es obligatoria.';
    }

    return '';
  }

  setLoginError(mensaje: string, campo: LoginErrorField = 'general'): void {
    this.loginError.set({ mensaje, campo });
  }

  clearLoginError(): void {
    this.loginError.set(null);
  }

  onLogin(): void {
    if (this.cargando()) {
      return;
    }

    this.clearLoginError();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      const identificadorControl = this.loginForm.get('identificador');
      const passwordControl = this.loginForm.get('password');

      if (identificadorControl?.invalid) {
        this.setLoginError('El correo o usuario es obligatorio.', 'identificador');
      } else if (passwordControl?.invalid) {
        this.setLoginError('La contraseña es obligatoria.', 'password');
      }
      return;
    }

    this.cargando.set(true);
    const credenciales = {
      identificador: this.loginForm.value.identificador.trim(),
      password: this.loginForm.value.password
    };

    this.authService.login(credenciales).pipe(
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: (response) => {
        if (response.acceso === false) {
          this.setLoginError('Datos incorrectos. Verifica tu correo y contraseña.', 'general');
          return;
        }

        const destino = response.usuario.rol === 'ADMIN'
          ? '/admin'
          : '/usuario';

        this.router.navigate([destino]);
      },
      error: () => {
        this.setLoginError('Datos incorrectos. Verifica tu correo y contraseña.', 'general');
      }
    });
  }
}