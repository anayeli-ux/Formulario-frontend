import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { obtenerCsrf: () => undefined } }]
    });
    service = TestBed.inject(UsuarioService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('maps nested primary contacts to the flat fields used by admin', () => {
    let result: any;
    service.listarUsuarios().subscribe(usuarios => result = usuarios[0]);

    httpTesting.expectOne('http://localhost:8081/api/usuarios').flush([{
      id: 3,
      nombre: 'Ana',
      primerApellido: 'Lopez',
      fechaNacimiento: '1990-05-15',
      fechaBaja: null,
      rol: 'USER',
      telefonos: [
        { id: 1, tipo: 'Principal', valor: '7711234567' },
        { id: 2, tipo: 'Trabajo', valor: '7717654321' }
      ],
      correos: [{ id: 3, tipo: 'Principal', valor: 'ana@example.com' }],
      direcciones: [{ id: 4, tipo: 'Principal', valor: 'Calle Uno', codigoPostal: '42000' }]
    }]);

    expect(result.telefono).toBe('7711234567');
    expect(result.codigoPostal).toBe('42000');
    expect(result.direccion).toBe('Calle Uno');
    expect(result.email).toBe('ana@example.com');
    expect(result.telefonos.length).toBe(2);
    expect(result.activo).toBeTrue();
  });

  it('does not fail when historical contacts have no category', () => {
    let result: any;
    service.listarUsuariosEliminados().subscribe(usuarios => result = usuarios[0]);

    httpTesting.expectOne('http://localhost:8081/api/usuarios/eliminados').flush([{
      id: 8,
      nombre: 'Jose',
      primerApellido: 'Perez',
      fechaNacimiento: '1980-01-01',
      fechaBaja: '2025-01-01T10:00:00',
      telefonos: [{ id: 5, tipo: null, valor: '7711111111' }],
      correos: [{ id: 6, tipo: 'Principal', valor: 'jose@example.com' }],
      direcciones: [{ id: 7, tipo: null, valor: 'Calle Antigua', codigoPostal: '42000' }]
    }]);

    expect(result.telefono).toBe('7711111111');
    expect(result.direccion).toBe('Calle Antigua');
    expect(result.telefonos[0].tipo).toBe('Sin categoría');
    expect(result.direcciones[0].tipo).toBe('Sin categoría');
    expect(result.activo).toBeFalse();
  });
});