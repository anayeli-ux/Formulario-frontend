import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }]
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    service.limpiarSesionLocal();
  });

  afterEach(() => httpTesting.verify());

  it('should report no active session when no user is cached in memory', () => {
    expect(service.haySesion()).toBeFalse();
  });

  it('should publish the authenticated user as a signal after login', () => {
    service.login({ identificador: 'admin@test.com', password: 'secret' }).subscribe();

    const request = httpTesting.expectOne('http://localhost:8081/api/auth/login');
    request.flush({
      acceso: true,
      usuario: { id: 1, email: 'admin@test.com', rol: 'ADMIN' }
    });

    expect(service.haySesion()).toBeTrue();
    expect(service.usuarioActual()?.email).toBe('admin@test.com');
  });

  it('should reuse the authenticated session without requesting the profile again', () => {
    service.login({ identificador: 'admin@test.com', password: 'secret' }).subscribe();
    httpTesting.expectOne('http://localhost:8081/api/auth/login').flush({
      acceso: true,
      usuario: { id: 1, email: 'admin@test.com', rol: 'ADMIN' }
    });

    service.obtenerSesion().subscribe(usuario => {
      expect(usuario.rol).toBe('ADMIN');
    });

    httpTesting.expectNone('http://localhost:8081/api/usuarios/me');
  });
});