import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';

import { AuthService } from './auth.service';
import { Usuario } from '../models/usuario.model';

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
      expect(usuario?.rol).toBe('ADMIN');
    });

    httpTesting.expectNone('http://localhost:8081/api/usuarios/me/resumen');
  });

  it('should verify the session with compact identity data and load full profile only on request', () => {
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
    httpTesting.expectOne('http://localhost:8081/api/usuarios/me/resumen').flush({
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      email: 'admin@test.com',
      rol: 'ADMIN'
    });

    service.obtenerPerfil().subscribe(usuario => expect(usuario).toEqual(perfil));
    httpTesting.expectOne('http://localhost:8081/api/usuarios/me').flush(perfil);
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
    httpTesting.expectOne('http://localhost:8081/api/usuarios/me/resumen').flush({
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      email: 'admin@test.com',
      rol: 'ADMIN'
    });

    service.actualizarPerfilSesion(actualizado);

    expect(service.perfilActual()).toBeNull();
    expect(service.usuarioActual()?.email).toBe('ana.maria@test.com');
    expect(service.usuarioActual()?.nombre).toBe('Ana Maria');
  });

  it('should not verify the same rejected session again during a redirect', () => {
    service.obtenerSesion().subscribe({ error: () => undefined });
    httpTesting.expectOne('http://localhost:8081/api/usuarios/me/resumen').flush(
      {},
      { status: 403, statusText: 'Forbidden' }
    );

    service.obtenerSesion().subscribe(usuario => expect(usuario).toBeNull());
    httpTesting.expectNone('http://localhost:8081/api/usuarios/me/resumen');
  });
});