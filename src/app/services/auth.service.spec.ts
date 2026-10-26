import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';

import { AuthService } from './auth.service';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

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
  });

  afterEach(() => httpTesting.verify());

  it('should have no current user before the session is loaded', () => {
    expect(service.usuarioActual()).toBeNull();
  });

  it('should publish the authenticated user as a signal after login', () => {
    service.login({ identificador: 'admin@test.com', password: 'secret' }).subscribe();

    const request = httpTesting.expectOne('http://localhost:8081/api/auth/login');
    request.flush({
      success: true,
      message: 'Inicio de sesión correcto',
      data: {
        acceso: true,
        usuario: { id: 1, email: 'admin@test.com', rol: 'ADMIN' }
      },
      errors: null
    });

    expect(service.usuarioActual()?.email).toBe('admin@test.com');
  });

  it('should reuse the authenticated session without requesting the profile again', () => {
    service.login({ identificador: 'admin@test.com', password: 'secret' }).subscribe();
    httpTesting.expectOne('http://localhost:8081/api/auth/login').flush({
      success: true,
      message: 'Inicio de sesión correcto',
      data: {
        acceso: true,
        usuario: { id: 1, email: 'admin@test.com', rol: 'ADMIN' }
      },
      errors: null
    });

    service.obtenerSesion().subscribe(usuario => {
      expect(usuario?.rol).toBe('ADMIN');
    });

    httpTesting.expectNone(`${environment.apiUrl}${environment.auth.identidad}`);
  });

  it('should verify the session with compact identity data and load full profile only on request', () => {
    expect(environment.auth.identidad).toBe('/usuarios/me/resumen');

    const perfil: Usuario = {
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      rol: 'ADMIN',
      telefonos: [],
      correos: [{ tipo: 'PRINCIPAL', valor: 'admin@test.com' }],
      direcciones: []
    };

    service.obtenerSesion().subscribe(usuario => expect(usuario?.rol).toBe('ADMIN'));
    httpTesting.expectOne(`${environment.apiUrl}${environment.auth.identidad}`).flush({
      success: true,
      message: 'Identidad obtenida',
      data: {
        id: 1,
        nombre: 'Ana',
        primerApellido: 'Perez',
        email: 'admin@test.com',
        rol: 'ADMIN'
      },
      errors: null
    });

    service.obtenerPerfil().subscribe(usuario => expect(usuario).toEqual(perfil));
    httpTesting.expectOne(`${environment.apiUrl}${environment.auth.perfil}`).flush({
      success: true, message: 'Perfil obtenido', data: perfil, errors: null
    });
  });

  it('should update the minimal session identity and discard the full profile after editing', () => {
    const perfil: Usuario = {
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      rol: 'ADMIN',
      telefonos: [],
      correos: [{ tipo: 'PRINCIPAL', valor: 'admin@test.com' }],
      direcciones: []
    };
    const actualizado: Usuario = {
      ...perfil,
      nombre: 'Ana Maria',
      correos: [{ tipo: 'PRINCIPAL', valor: 'ana.maria@test.com' }]
    };

    service.obtenerSesion().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}${environment.auth.identidad}`).flush({
      success: true,
      message: 'Identidad obtenida',
      data: {
        id: 1,
        nombre: 'Ana',
        primerApellido: 'Perez',
        email: 'admin@test.com',
        rol: 'ADMIN'
      },
      errors: null
    });

    service.obtenerPerfil().subscribe(usuario => expect(usuario).toEqual(perfil));
    httpTesting.expectOne(`${environment.apiUrl}${environment.auth.perfil}`).flush({
      success: true, message: 'Perfil obtenido', data: perfil, errors: null
    });

    service.actualizarPerfilSesion(actualizado);

    expect(service.usuarioActual()?.email).toBe('ana.maria@test.com');
    expect(service.usuarioActual()?.nombre).toBe('Ana Maria');

    service.obtenerPerfil().subscribe(usuario => expect(usuario).toEqual(actualizado));
    httpTesting.expectOne(`${environment.apiUrl}${environment.auth.perfil}`).flush({
      success: true, message: 'Perfil obtenido', data: actualizado, errors: null
    });
  });

  it('should not verify the same rejected session again during a redirect', () => {
    service.obtenerSesion().subscribe({ error: () => undefined });
    httpTesting.expectOne(`${environment.apiUrl}${environment.auth.identidad}`).flush(
      {},
      { status: 403, statusText: 'Forbidden' }
    );

    service.obtenerSesion().subscribe(usuario => expect(usuario).toBeNull());
    httpTesting.expectNone(`${environment.apiUrl}${environment.auth.identidad}`);
  });
});