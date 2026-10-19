import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set a red invalid credentials message when login fails', () => {
    authService.login.and.returnValue(of({
      acceso: false,
      usuario: { id: 1, email: 'test@test.com', rol: 'USER' }
    }));

    component.loginForm.setValue({
      identificador: 'correo@ejemplo.com',
      password: '123456'
    });

    component.onLogin();

    expect(component.loginError()).toEqual({
      mensaje: 'Datos incorrectos. Verifica tu correo y contraseña.',
      campo: 'general'
    });
  });

  it('shows and hides the password without submitting the form', () => {
    const input = fixture.nativeElement.querySelector('#password') as HTMLInputElement;
    const button = fixture.nativeElement.querySelector('.password-visibility') as HTMLButtonElement;

    expect(input.type).toBe('password');
    expect(button.getAttribute('aria-label')).toBe('Mostrar contraseña');

    button.click();
    fixture.detectChanges();

    expect(input.type).toBe('text');
    expect(button.getAttribute('aria-label')).toBe('Ocultar contraseña');
    expect(authService.login).not.toHaveBeenCalled();

    button.click();
    fixture.detectChanges();

    expect(input.type).toBe('password');
  });

  it('sends admin and user logins through the role-aware root route', () => {
    const navegar = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    component.loginForm.setValue({ identificador: 'admin@example.com', password: 'clave' });
    authService.login.and.returnValue(of({
      acceso: true,
      usuario: { id: 1, email: 'admin@example.com', rol: '2' }
    }));

    component.onLogin();

    authService.login.and.returnValue(of({
      acceso: true,
      usuario: { id: 2, email: 'user@example.com', rol: 'USER' }
    }));
    component.onLogin();

    expect(navegar.calls.allArgs()).toEqual([[['/']], [['/']]]);
  });
});
