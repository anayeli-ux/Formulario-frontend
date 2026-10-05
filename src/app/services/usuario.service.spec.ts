import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { RespuestaUsuariosIncompatibleError, UsuarioActualizarRequest, UsuarioService } from './usuario.service';

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

  it('requests only the requested page and search term for active users', () => {
    service.listarUsuarios(2, 5, '42000').subscribe();
    const request = httpTesting.expectOne(item => item.url === `${environment.apiUrl}/usuarios`);

    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('5');
    expect(request.request.params.get('search')).toBe('42000');
    request.flush({ content: [], totalElements: 0, number: 2, size: 5 });
  });

  it('defaults active user pages to five rows', () => {
    service.listarUsuarios().subscribe();
    const request = httpTesting.expectOne(item => item.url === `${environment.apiUrl}/usuarios`);
    expect(request.request.params.get('size')).toBe('5');
    request.flush({ content: [], totalElements: 0, number: 0, size: 5 });
  });

  it('accepts numeric role IDs in a paginated summary response', () => {
    let respuesta: unknown;
    service.listarUsuarios().subscribe(value => respuesta = value);
    httpTesting.expectOne(item => item.url === `${environment.apiUrl}/usuarios`).flush({
      content: [{
        id: 1,
        nombre: 'Ana',
        primerApellido: 'Perez',
        rol: 1,
        telefono: null,
        correo: null,
        codigoPostal: null
      }],
      totalElements: 1,
      number: 0,
      size: 5
    });

    expect((respuesta as { content: Array<{ rol: string | number }> }).content[0].rol).toBe(1);
  });

  it('requests only a five-user page of active or deleted administrators', () => {
    service.listarAdministradores(2, true).subscribe();
    const request = httpTesting.expectOne(item => item.url === `${environment.apiUrl}/usuarios/administradores`);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('5');
    expect(request.request.params.get('eliminados')).toBe('true');
    request.flush({ content: [], totalElements: 0, number: 2, size: 5 });
  });

  it('rejects the old full-array response instead of presenting it as an empty page', () => {
    let error: unknown;
    service.listarUsuarios().subscribe({ error: received => error = received });
    httpTesting.expectOne(item => item.url === `${environment.apiUrl}/usuarios`).flush([{
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [],
      correos: [],
      direcciones: []
    }]);

    expect(error).toEqual(jasmine.any(RespuestaUsuariosIncompatibleError));
  });

  it('requests full details only for an explicitly selected user', () => {
    service.obtenerUsuario(17).subscribe();
    const request = httpTesting.expectOne(`${environment.apiUrl}/usuarios/17`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 17,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [],
      correos: [],
      direcciones: []
    });
  });

  it('requests only displayed contact fields for the information modal', () => {
    service.obtenerContactosUsuario(17).subscribe();
    const request = httpTesting.expectOne(`${environment.apiUrl}/usuarios/17/contactos`);
    expect(request.request.method).toBe('GET');
    request.flush({ id: 17, nombre: 'Ana', primerApellido: 'Perez', telefonos: [], correos: [], direcciones: [] });
  });

  it('sends persistent contact IDs unchanged in the update PUT body', () => {
    const request: UsuarioActualizarRequest = {
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [
        { id: 31, tipo: 'PRINCIPAL', valor: '7711234567' },
        { id: 32, tipo: 'TRABAJO', valor: '7717654321' }
      ],
      correos: [
        { id: 33, tipo: 'PRINCIPAL', valor: 'ana@example.com' },
        { id: 25, tipo: 'TRABAJO', valor: 'aldo2@gmail.com' }
      ],
      direcciones: [
        { id: 34, tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' },
        { id: 35, tipo: 'CASA', valor: 'Calle Secundaria 20', codigoPostal: '42010' }
      ]
    };

    service.actualizarUsuario(1, request).subscribe();

    const put = httpTesting.expectOne(`${environment.apiUrl}/usuarios/1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(request);
    put.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('loads deleted summaries using their own page and search parameters', () => {
    service.listarUsuariosEliminados(1, 25, 'Lopez').subscribe();
    const request = httpTesting.expectOne(item => item.url === `${environment.apiUrl}/usuarios/eliminados`);
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('25');
    expect(request.request.params.get('search')).toBe('Lopez');
    request.flush({ content: [], totalElements: 0, number: 1, size: 25 });
  });

  it('sends delete and reactivation requests without retaining full-list data', () => {
    service.eliminarUsuario(1).subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/1`).flush(null);
    service.reactivarUsuario(1).subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/1/reactivar`).flush({
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [],
      correos: [],
      direcciones: []
    });
  });
});