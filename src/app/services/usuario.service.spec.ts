import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { UsuarioActualizarRequest, UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpTesting: HttpTestingController;
  const authServiceMock = {
    obtenerCsrf: () => of(undefined),
    usuarioActual: () => ({ id: 1, email: 'admin@test.com', rol: 'ADMIN' })
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    });
    service = TestBed.inject(UsuarioService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('does not request administrative lists just because the service is injected', () => {
    expect(service.usuariosActivos()).toEqual([]);
    expect(service.usuariosEliminados()).toEqual([]);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios/eliminados`);
  });

  it('shares an active-list GET between concurrent subscribers and stores the result in its signal', () => {
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

    expect(resultados).toEqual([[usuario], [usuario]]);
    expect(service.usuariosActivos()).toEqual([usuario]);
  });

  it('issues a new GET when explicitly asked to reload the list', () => {
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
    service.listarUsuarios().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([usuario]);
    expect(service.usuariosActivos()).toEqual([usuario]);
  });

  it('updates the matching Signal only after a successful PUT response', () => {
    const existente: Usuario = {
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [],
      correos: [],
      direcciones: []
    };
    const actualizado: Usuario = {
      ...existente,
      nombre: 'Ana Maria'
    };
    const solicitudUsuario: UsuarioActualizarRequest = {
      nombre: 'Luis',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [],
      correos: [],
      direcciones: []
    };

    service.listarUsuarios().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([existente]);

    let cambiosObservados: Usuario[][] = [];
    service.actualizarUsuario(1, solicitudUsuario).subscribe();
    const put = httpTesting.expectOne(`${environment.apiUrl}/usuarios/1`);
    expect(service.usuariosActivos()).toEqual([existente]);
    put.flush(actualizado);
    cambiosObservados = [service.usuariosActivos()];

    expect(cambiosObservados).toEqual([[actualizado]]);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`);
  });

  it('updates the active-list signal from the saved user response without refetching', () => {
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
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/1`).flush(actualizado);

    expect(service.usuariosActivos()).toEqual([actualizado]);
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