import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { UsuarioRequest, UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { obtenerCsrf: () => of(undefined) } }]
    });
    service = TestBed.inject(UsuarioService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

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
});