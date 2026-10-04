import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Usuario } from '../models/usuario.model';
import { UsuarioFormService } from './usuario-form.service';

describe('UsuarioFormService', () => {
  let service: UsuarioFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [UsuarioFormService]
    });

    service = TestBed.inject(UsuarioFormService);
  });

  it('should allow editing a complete user without changing the password', () => {
    const user: Usuario = {
      id: 12,
      nombre: 'Ana',
      primerApellido: 'Lopez',
      fechaNacimiento: '1990-05-15',
      telefonos: [
        { tipo: 'PRINCIPAL', valor: '7711234567' },
        { tipo: 'TRABAJO', valor: '7717654321' }
      ],
      direcciones: [
        { tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' },
        { tipo: 'TRABAJO', valor: 'Calle Secundaria 20', codigoPostal: '42010' }
      ],
      correos: [
        { tipo: 'PRINCIPAL', valor: 'ana@example.com' },
        { tipo: 'TRABAJO', valor: 'ana.trabajo@example.com' }
      ]
    };
    const form = service.crearFormulario(true);

    service.cargarUsuario(form, user);

    expect(form.valid).toBeTrue();
    expect(form.get('datosPersonales.password')?.valid).toBeTrue();

    const request = service.crearRequest(form, false);

    expect(request.password).toBeUndefined();
    expect(request.telefonos).toEqual([
      { tipo: 'PRINCIPAL', valor: '7711234567' },
      { tipo: 'TRABAJO', valor: '7717654321' }
    ]);
    expect(request.direcciones).toEqual([
      { tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' },
      { tipo: 'TRABAJO', valor: 'Calle Secundaria 20', codigoPostal: '42010' }
    ]);
    expect(request.correos).toEqual([
      { tipo: 'PRINCIPAL', valor: 'ana@example.com' },
      { tipo: 'TRABAJO', valor: 'ana.trabajo@example.com' }
    ]);
    expect(request).not.toEqual(jasmine.objectContaining({
      telefono: jasmine.anything(),
      email: jasmine.anything(),
      direccion: jasmine.anything(),
      codigoPostal: jasmine.anything(),
      estado: jasmine.anything(),
      municipio: jasmine.anything()
    }));
  });

  it('should require a password when creating a user', () => {
    const form = service.crearFormulario();

    expect(form.get('datosPersonales.password')?.hasError('required')).toBeTrue();
  });

  it('should not block a valid edit when postal lookup did not provide location labels', () => {
    const user: Usuario = {
      nombre: 'Ana',
      primerApellido: 'Lopez',
      fechaNacimiento: '1990-05-15',
      telefonos: [{ tipo: 'PRINCIPAL', valor: '7711234567' }],
      direcciones: [{ tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' }],
      correos: [{ tipo: 'PRINCIPAL', valor: 'ana@example.com' }]
    };
    const form = service.crearFormulario(true);

    service.cargarUsuario(form, user);

    expect(form.valid).toBeTrue();
  });

  it('should allow editing users with missing or duplicate principal contacts', () => {
    const user: Usuario = {
      nombre: 'Ana',
      primerApellido: 'Lopez',
      fechaNacimiento: '1990-05-15',
      telefonos: [
        { tipo: 'PRINCIPAL', valor: '7711234567' },
        { tipo: 'PRINCIPAL', valor: '7717654321' }
      ],
      direcciones: [{ tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' }],
      correos: [{ tipo: 'TRABAJO', valor: 'ana@example.com' }]
    };
    const form = service.crearFormulario(true);

    service.cargarUsuario(form, user);

    expect(form.valid).toBeTrue();
    expect(form.get('datosContacto.telefono')?.value).toBe('7711234567');
    expect(form.get('datosPersonales.email')?.value).toBe('ana@example.com');

    const request = service.crearRequest(form, false);

    expect(request.telefonos).toEqual([
      { tipo: 'PRINCIPAL', valor: '7711234567' },
      { tipo: 'PERSONAL', valor: '7717654321' }
    ]);
    expect(request.correos).toEqual([
      { tipo: 'PRINCIPAL', valor: 'ana@example.com' }
    ]);
  });
});