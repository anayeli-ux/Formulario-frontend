import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { UsuarioRequest, UsuarioService } from './usuario.service';
import { USUARIO_CACHE_STORAGE_PREFIX } from './usuario-cache.storage';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpTesting: HttpTestingController;
  const authServiceMock = {
    obtenerCsrf: () => of(undefined),
    usuarioActual: () => ({ id: 1, email: 'admin@test.com', rol: 'ADMIN' }),
    actualizarPerfilSesion: jasmine.createSpy('actualizarPerfilSesion')
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    });
    service = TestBed.inject(UsuarioService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  it('shares an in-flight list request and reuses its signal cache', () => {
    const usuario: Usuario = {
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [],
      correos: [],
      direcciones: []
    };
    const resultados: Usuario[][] = [];

    service.listarUsuarios().subscribe(valor => resultados.push(valor));
    service.listarUsuarios().subscribe(valor => resultados.push(valor));

    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([usuario]);
    service.listarUsuarios().subscribe(valor => resultados.push(valor));

    expect(resultados).toEqual([[usuario], [usuario], [usuario]]);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`);
  });

  it('reuses the session cache after the service is recreated on page reload', () => {
    const usuario: Usuario = {
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [],
      correos: [],
      direcciones: []
    };

    service.listarUsuarios().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([usuario]);

    const servicioTrasRecarga = new UsuarioService(
      TestBed.inject(HttpClient),
      authServiceMock as unknown as AuthService
    );
    let resultado: Usuario[] = [];

    servicioTrasRecarga.listarUsuarios().subscribe(usuarios => resultado = usuarios);

    expect(resultado).toEqual([usuario]);
    expect(sessionStorage.getItem(`${USUARIO_CACHE_STORAGE_PREFIX}1:activos`)).toContain('Ana');
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`);
  });

  it('updates the active-list cache after creating a user', () => {
    const existente: Usuario = {
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [],
      correos: [],
      direcciones: []
    };
    const nuevo: Usuario = {
      ...existente,
      id: 2,
      nombre: 'Luis'
    };
    const solicitudUsuario: UsuarioRequest = {
      nombre: 'Luis',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      password: 'validPassword!1',
      telefonos: [],
      correos: [],
      direcciones: []
    };

    service.listarUsuarios().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([existente]);

    service.crearUsuario(solicitudUsuario).subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush(nuevo);

    service.listarUsuarios().subscribe(usuarios => expect(usuarios).toEqual([existente, nuevo]));
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`);
  });

  it('updates the active-list signal from the request after a 204 response without refetching', () => {
    const existente: Usuario = {
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [],
      correos: [],
      direcciones: []
    };
    const actualizado = { ...existente, nombre: 'Ana Maria' };

    service.listarUsuarios().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([existente]);

    service.actualizarUsuario(1, {
      nombre: actualizado.nombre,
      primerApellido: actualizado.primerApellido,
      fechaNacimiento: actualizado.fechaNacimiento,
      telefonos: [],
      correos: [],
      direcciones: []
    }).subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/1`).flush(null, {
      status: 204,
      statusText: 'No Content'
    });

    expect(service.usuariosActivos()).toEqual([actualizado]);
    expect(authServiceMock.actualizarPerfilSesion).toHaveBeenCalledWith(actualizado);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`);
  });

  it('moves users between cached lists after delete and reactivate responses', () => {
    const usuario: Usuario = {
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      activo: true,
      telefonos: [],
      correos: [],
      direcciones: []
    };

    service.listarUsuarios().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([usuario]);
    service.listarUsuariosEliminados().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/eliminados`).flush([]);

    service.eliminarUsuario(1).subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/1`).flush(null);
    expect(service.usuariosActivos()).toEqual([]);
    expect(service.usuariosEliminados()).toEqual([{ ...usuario, activo: false }]);

    service.reactivarUsuario(1).subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/1/reactivar`).flush(usuario);
    expect(service.usuariosActivos()).toEqual([usuario]);
    expect(service.usuariosEliminados()).toEqual([]);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios/eliminados`);
  });
});