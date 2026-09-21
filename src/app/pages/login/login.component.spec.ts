import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set a red invalid credentials message when login fails', () => {
    authService.login.and.returnValue(of({
      acceso: false,
      token: '',
      usuario: { id: 1, email: 'test@test.com', rol: 'USER' },
      mensaje: 'Datos incorrectos'
    }));

    component.loginForm.setValue({
      identificador: 'correo@ejemplo.com',
      password: '123456'
    });

    component.onLogin();

    expect(component.loginError).toEqual({
      mensaje: 'Datos incorrectos',
      campo: 'general'
    });
  });
});
