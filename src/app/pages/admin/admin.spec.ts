import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Admin } from './admin';
import { UsuariosTablaComponent } from '../../components/usuarios-tabla/usuarios-tabla.component';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../models/usuario.model';

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;
  let httpTesting: HttpTestingController;
  let overlayContainer: OverlayContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Admin, HttpClientTestingModule, RouterTestingModule],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    overlayContainer = TestBed.inject(OverlayContainer);
  });

  afterEach(() => {
    httpTesting.verify();
    fixture.destroy();
  });

  it('should create', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([]);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios/eliminados`);
    expect(component).toBeTruthy();
  });

  it('loads deleted users only once when that view is first selected', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([]);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios/eliminados`);

    component.cambiarVista('eliminados');
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/eliminados`).flush([]);
    component.cambiarVista('activos');
    component.cambiarVista('eliminados');

    httpTesting.expectNone(`${environment.apiUrl}/usuarios/eliminados`);
    expect(component.vistaActual()).toBe('eliminados');
  });

  it('warns when the new user email already belongs to another user', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([{
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [{ tipo: 'PRINCIPAL', valor: '1112223333' }],
      correos: [{ tipo: 'PRINCIPAL', valor: 'ana@example.com' }],
      direcciones: []
    }]);

    component.abrirCrearUsuario();
    component.usuarioForm.patchValue({
      datosPersonales: {
        nombre: 'Luis',
        primer_apellido: 'Lopez',
        fecha_nacimiento: '1990-01-01',
        email: 'ANA@example.com',
        password: 'ValidPass!1'
      },
      datosContacto: {
        telefono: '4445556666',
        codigo_postal: '12345',
        direccion: 'Calle 1'
      }
    });

    component.crearUsuario();

    expect(component.modalMensajeVisible()).toBeTrue();
    expect(component.modalTitulo()).toBe('Datos de contacto duplicados');
    expect(component.modalMensaje()).toContain('correo');
    expect(component.usuarioForm.get('datosPersonales.email')?.getError('duplicadoContacto'))
      .toContain('Ya está registrado en otro usuario.');
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`, 'No debe enviar el alta si el correo ya existe.');
  });

  it('warns when the new user phone already belongs to another user', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([{
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      telefonos: [{ tipo: 'PRINCIPAL', valor: '(111) 222-3333' }],
      correos: [{ tipo: 'PRINCIPAL', valor: 'ana@example.com' }],
      direcciones: []
    }]);

    component.abrirCrearUsuario();
    component.usuarioForm.patchValue({
      datosPersonales: {
        nombre: 'Luis',
        primer_apellido: 'Lopez',
        fecha_nacimiento: '1990-01-01',
        email: 'luis@example.com',
        password: 'ValidPass!1'
      },
      datosContacto: {
        telefono: '1112223333',
        codigo_postal: '12345',
        direccion: 'Calle 1'
      }
    });

    component.crearUsuario();

    expect(component.modalMensajeVisible()).toBeTrue();
    expect(component.modalMensaje()).toContain('teléfono');
    expect(component.usuarioForm.get('datosContacto.telefono')?.getError('duplicadoContacto'))
      .toContain('Ya está registrado en otro usuario.');
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`, 'No debe enviar el alta si el teléfono ya existe.');
  });

  it('marks both primary and additional fields when contacts repeat in the form', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([]);

    component.abrirCrearUsuario();
    component.usuarioForm.patchValue({
      datosPersonales: {
        nombre: 'Luis',
        primer_apellido: 'Lopez',
        fecha_nacimiento: '1990-01-01',
        email: 'luis@example.com',
        password: 'ValidPass!1'
      },
      datosContacto: {
        telefono: '4445556666',
        codigo_postal: '12345',
        direccion: 'Calle 1'
      }
    });
    (component.usuarioForm.get('datosContacto.telefonos') as FormArray).push(new FormGroup({
      tipo: new FormControl('Trabajo', Validators.required),
      valor: new FormControl('4445556666', [Validators.required, Validators.pattern(/^\d{10}$/)])
    }));
    (component.usuarioForm.get('datosContacto.correos') as FormArray).push(new FormGroup({
      tipo: new FormControl('Trabajo', Validators.required),
      valor: new FormControl('luis@example.com', [Validators.required, Validators.email, Validators.maxLength(150)])
    }));

    component.crearUsuario();
    fixture.detectChanges();

    expect(component.usuarioForm.get('datosPersonales.email')?.getError('duplicadoContacto'))
      .toContain('Se repite en este formulario.');
    expect(component.usuarioForm.get('datosContacto.telefono')?.getError('duplicadoContacto'))
      .toContain('Se repite en este formulario.');
    expect(fixture.nativeElement.querySelector('#email').classList.contains('ng-invalid')).toBeTrue();
    expect(fixture.nativeElement.querySelector('#email').classList.contains('ng-touched')).toBeTrue();
    expect(fixture.nativeElement.querySelector('#telefono').classList.contains('ng-invalid')).toBeTrue();
    expect(fixture.nativeElement.querySelector('#telefono').classList.contains('ng-touched')).toBeTrue();
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`, 'No debe enviar el alta con contactos repetidos.');
  });

  it('checks duplicate contacts while editing but ignores the current user', () => {
    const usuario: Usuario = {
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      estado: 'Hidalgo',
      municipio: 'Pachuca',
      telefonos: [{ tipo: 'PRINCIPAL', valor: '1112223333' }],
      correos: [{ tipo: 'PRINCIPAL', valor: 'ana@example.com' }],
      direcciones: [{ tipo: 'PRINCIPAL', valor: 'Calle 1', codigoPostal: '42000' }]
    };

    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([
      usuario,
      {
        ...usuario,
        id: 2,
        nombre: 'Luis',
        telefonos: [{ tipo: 'PRINCIPAL', valor: '4445556666' }],
        correos: [{ tipo: 'PRINCIPAL', valor: 'luis@example.com' }]
      }
    ]);

    component.editarUsuario(usuario);
    component.usuarioForm.get('datosContacto.telefono')?.setValue('4445556666');
    component.actualizarUsuario();

    expect(component.modalMensajeVisible()).toBeTrue();
    expect(component.modalMensaje()).toContain('teléfono');
    expect(component.usuarioForm.get('datosContacto.telefono')?.getError('duplicadoContacto'))
      .toContain('Ya está registrado en otro usuario.');
    expect(component.usuarioForm.get('datosPersonales.email')?.getError('duplicadoContacto')).toBeNull();
    httpTesting.expectNone(`${environment.apiUrl}/usuarios/1`);
  });

  it('continues filtering by postal code while its column is hidden', () => {
    fixture.detectChanges();
    const usuario = {
      id: 21,
      nombre: 'Ana',
      primerApellido: 'Lopez',
      fechaNacimiento: '1990-05-15',
      estado: 'Hidalgo',
      municipio: 'Pachuca',
      telefonos: [{ tipo: 'PRINCIPAL', valor: '7711234567' }],
      correos: [{ tipo: 'PRINCIPAL', valor: 'ana@example.com' }],
      direcciones: [{ tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' }]
    };
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([usuario]);
    fixture.detectChanges();

    const tabla = fixture.debugElement.query(By.directive(UsuariosTablaComponent)).componentInstance as UsuariosTablaComponent;
    expect(tabla.columnasVisibles).not.toContain('codigoPostal');

    component.busquedaUsuarios.set('42000');
    fixture.detectChanges();

    expect(tabla.columnasVisibles).not.toContain('codigoPostal');
    expect(component.usuariosFiltrados()).toEqual([usuario]);
    expect(tabla.usuarios).toEqual([usuario]);
  });

  it('runs a destructive action only after the dialog is confirmed', async () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([]);
    let actionCount = 0;

    component.mostrarConfirmacion('¿Eliminar usuario?', 'Confirmación de prueba.', () => actionCount++);
    fixture.detectChanges();
    const overlay = overlayContainer.getContainerElement();
    const cancelButton = Array.from(overlay.querySelectorAll('button'))
      .find(button => button.textContent?.trim() === 'Cancelar');
    expect(cancelButton).toBeTruthy();
    cancelButton?.click();
    await fixture.whenStable();
    expect(actionCount).toBe(0);

    component.mostrarConfirmacion('¿Eliminar usuario?', 'Confirmación de prueba.', () => actionCount++);
    fixture.detectChanges();
    const confirmButton = overlay.querySelector('button.confirm-action') as HTMLButtonElement | null;
    expect(confirmButton).toBeTruthy();
    confirmButton?.click();
    await fixture.whenStable();
    expect(actionCount).toBe(1);
  });
});
