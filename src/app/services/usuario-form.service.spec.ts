import { TestBed } from '@angular/core/testing';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
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

  function userWithPersistentContact(): Usuario {
    return {
      nombre: 'Ana',
      primerApellido: 'Lopez',
      fechaNacimiento: '1990-05-15',
      telefonos: [
        { id: 21, tipo: 'PRINCIPAL', valor: '7711234567' },
        { id: 23, tipo: 'PERSONAL', valor: '7717654321' }
      ],
      direcciones: [
        { id: 22, tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' },
        { id: 26, tipo: 'CASA', valor: 'Calle Secundaria 20', codigoPostal: '42010' }
      ],
      correos: [
        { id: 24, tipo: 'PRINCIPAL', valor: 'ana@example.com' },
        { id: 25, tipo: 'PERSONAL', valor: 'aldo2@gmail.com' }
      ]
    };
  }

  function formWithPersistentContact(): FormGroup {
    const form = service.crearFormulario(true);
    service.cargarUsuario(form, userWithPersistentContact());
    return form;
  }

  it('should allow editing a complete user without changing the password', () => {
    const user: Usuario = {
      id: 12,
      nombre: 'Ana',
      primerApellido: 'Lopez',
      fechaNacimiento: '1990-05-15',
      telefonos: [
        { id: 11, tipo: 'PRINCIPAL', valor: '7711234567' },
        { id: 12, tipo: 'TRABAJO', valor: '7717654321' }
      ],
      direcciones: [
        { id: 13, tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' },
        { id: 14, tipo: 'TRABAJO', valor: 'Calle Secundaria 20', codigoPostal: '42010' }
      ],
      correos: [
        { id: 15, tipo: 'PRINCIPAL', valor: 'ana@example.com' },
        { id: 25, tipo: 'TRABAJO', valor: 'ana.trabajo@example.com' }
      ]
    };
    const form = service.crearFormulario(true);

    service.cargarUsuario(form, user);

    expect(form.valid).toBeTrue();
    expect(form.get('datosPersonales.password')?.valid).toBeTrue();

    const request = service.crearRequest(form, false);

    expect(request.password).toBeUndefined();
    expect(request.telefonos).toEqual([
      { id: 11, tipo: 'PRINCIPAL', valor: '7711234567' },
      { id: 12, tipo: 'TRABAJO', valor: '7717654321' }
    ]);
    expect(request.direcciones).toEqual([
      { id: 13, tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' },
      { id: 14, tipo: 'TRABAJO', valor: 'Calle Secundaria 20', codigoPostal: '42010' }
    ]);
    expect(request.correos).toEqual([
      { id: 15, tipo: 'PRINCIPAL', valor: 'ana@example.com' },
      { id: 25, tipo: 'TRABAJO', valor: 'ana.trabajo@example.com' }
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

  it('keeps an additional contact ID when only its MatSelect category changes', () => {
    const form = formWithPersistentContact();
    const additionalEmail = form.get('datosContacto.correos.0') as FormGroup;

    additionalEmail.get('tipo')?.setValue('Trabajo');

    expect(service.crearRequest(form, false).correos[1]).toEqual({
      id: 25,
      tipo: 'TRABAJO',
      valor: 'aldo2@gmail.com'
    });
  });

  it('keeps an additional contact ID when only its value changes', () => {
    const form = formWithPersistentContact();
    const additionalEmail = form.get('datosContacto.correos.0') as FormGroup;

    additionalEmail.get('valor')?.setValue('nuevo@example.com');

    expect(service.crearRequest(form, false).correos[1]).toEqual({
      id: 25,
      tipo: 'PERSONAL',
      valor: 'nuevo@example.com'
    });
  });

  it('keeps an additional contact ID when its category and value both change', () => {
    const form = formWithPersistentContact();
    const additionalEmail = form.get('datosContacto.correos.0') as FormGroup;

    additionalEmail.patchValue({ tipo: 'Trabajo', valor: 'nuevo@example.com' });

    expect(service.crearRequest(form, false).correos[1]).toEqual({
      id: 25,
      tipo: 'TRABAJO',
      valor: 'nuevo@example.com'
    });
  });

  it('keeps principal and additional IDs through load and request creation', () => {
    const form = service.crearFormulario(true);
    service.cargarUsuario(form, userWithPersistentContact());

    expect(form.get('datosContacto.telefonoId')?.value).toBe(21);
    expect(form.get('datosPersonales.emailId')?.value).toBe(24);
    expect(form.get('datosContacto.direccionId')?.value).toBe(22);
    expect(form.get('datosContacto.telefonos.0.id')?.value).toBe(23);
    expect(form.get('datosContacto.correos.0.id')?.value).toBe(25);
    expect(form.get('datosContacto.direcciones.0.id')?.value).toBe(26);

    const request = service.crearRequest(form, false);
    expect(request.telefonos[0].id).toBe(21);
    expect(request.correos[0].id).toBe(24);
    expect(request.direcciones[0].id).toBe(22);
    expect(request.telefonos[1].id).toBe(23);
    expect(request.correos[1].id).toBe(25);
    expect(request.direcciones[1].id).toBe(26);
  });

  it('omits deleted additional contacts from the request', () => {
    const form = service.crearFormulario(true);
    service.cargarUsuario(form, userWithPersistentContact());
    (form.get('datosContacto.telefonos') as FormArray).removeAt(0);
    (form.get('datosContacto.correos') as FormArray).removeAt(0);
    (form.get('datosContacto.direcciones') as FormArray).removeAt(0);

    const request = service.crearRequest(form, false);
    expect(request.telefonos).toEqual([{ id: 21, tipo: 'PRINCIPAL', valor: '7711234567' }]);
    expect(request.correos).toEqual([{ id: 24, tipo: 'PRINCIPAL', valor: 'ana@example.com' }]);
    expect(request.direcciones).toEqual([{
      id: 22,
      tipo: 'PRINCIPAL',
      valor: 'Calle Principal 10',
      codigoPostal: '42000'
    }]);
  });

  it('creates new-user requests without inventing contact IDs', () => {
    const form = service.crearFormulario();
    form.patchValue({
      datosPersonales: {
        nombre: 'Ana',
        primer_apellido: 'Lopez',
        password: 'validPassword!1',
        fecha_nacimiento: '1990-05-15',
        email: 'ana@example.com'
      },
      datosContacto: {
        telefono: '7711234567',
        codigo_postal: '42000',
        direccion: 'Calle Principal 10'
      }
    });

    const request = service.crearRequest(form);

    expect(request.telefonos).toEqual([{ tipo: 'PRINCIPAL', valor: '7711234567' }]);
    expect(request.correos).toEqual([{ tipo: 'PRINCIPAL', valor: 'ana@example.com' }]);
    expect(request.direcciones).toEqual([{
      tipo: 'PRINCIPAL',
      valor: 'Calle Principal 10',
      codigoPostal: '42000'
    }]);
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