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
      telefono: '7711234567',
      codigoPostal: '42000',
      estado: 'Hidalgo',
      municipio: 'Pachuca',
      direccion: 'Calle Principal 10',
      fechaNacimiento: '1990-05-15',
      email: 'ana@example.com',
      telefonos: [{ tipo: 'Trabajo', valor: '7717654321' }],
      direcciones: [{ tipo: 'Trabajo', valor: 'Calle Secundaria 20', codigoPostal: '42010' }],
      correos: [{ tipo: 'Trabajo', valor: 'ana.trabajo@example.com' }]
    };
    const form = service.crearFormulario(true);

    service.cargarUsuario(form, user);

    expect(form.valid).toBeTrue();
    expect(form.get('datosPersonales.password')?.valid).toBeTrue();

    const request = service.crearRequest(form, false);

    expect(request.password).toBeUndefined();
    expect(request.telefonos).toContain({ tipo: 'Trabajo', valor: '7717654321' });
    expect(request.direcciones).toContain({ tipo: 'Trabajo', valor: 'Calle Secundaria 20', codigoPostal: '42010' });
    expect(request.correos).toContain({ tipo: 'Trabajo', valor: 'ana.trabajo@example.com' });
  });

  it('should require a password when creating a user', () => {
    const form = service.crearFormulario();

    expect(form.get('datosPersonales.password')?.hasError('required')).toBeTrue();
  });

  it('should not block a valid edit when postal lookup did not provide location labels', () => {
    const user: Usuario = {
      nombre: 'Ana',
      primerApellido: 'Lopez',
      telefono: '7711234567',
      codigoPostal: '42000',
      estado: '',
      municipio: '',
      direccion: 'Calle Principal 10',
      fechaNacimiento: '1990-05-15',
      email: 'ana@example.com'
    };
    const form = service.crearFormulario(true);

    service.cargarUsuario(form, user);

    expect(form.valid).toBeTrue();
  });
});