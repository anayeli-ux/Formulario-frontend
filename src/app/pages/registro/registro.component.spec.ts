import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatStepper } from '@angular/material/stepper';
import { environment } from '../../../environments/environment';

import { RegistroComponent } from './registro.component';

describe('RegistroComponent', () => {
  let component: RegistroComponent;
  let fixture: ComponentFixture<RegistroComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not advance from an invalid personal step', () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper)).componentInstance as MatStepper;
    const group = component.registroForm.get('datosPersonales');

    stepper.next();
    expect(stepper.selectedIndex).toBe(0);

    component.avanzarPaso(stepper, 'datosPersonales');

    expect(stepper.selectedIndex).toBe(0);
    expect(group?.touched).toBeTrue();
  });

  it('blocks an invalid contact step and preserves personal values when going back', () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper)).componentInstance as MatStepper;
    const personal = component.registroForm.get('datosPersonales');
    personal?.patchValue({
      nombre: 'Ana',
      primer_apellido: 'Lopez',
      password: 'Test123!',
      fecha_nacimiento: '1990-05-15',
      email: 'ana@example.com'
    });

    component.avanzarPaso(stepper, 'datosPersonales');
    expect(stepper.selectedIndex).toBe(1);

    stepper.next();
    expect(stepper.selectedIndex).toBe(1);

    component.avanzarPaso(stepper, 'datosContacto');
    expect(stepper.selectedIndex).toBe(1);
    expect(component.registroForm.get('datosContacto')?.touched).toBeTrue();

    stepper.previous();
    expect(stepper.selectedIndex).toBe(0);
    expect(personal?.get('nombre')?.value).toBe('Ana');
    expect(personal?.get('fecha_nacimiento')?.value).toBe('1990-05-15');
  });

  it('submits the original request shape after confirmation', () => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper)).componentInstance as MatStepper;
    component.registroForm.patchValue({
      datosPersonales: {
        nombre: 'Ana',
        primer_apellido: 'Lopez',
        password: 'Test123!',
        fecha_nacimiento: '1990-05-15',
        email: 'ana@example.com'
      },
      datosContacto: {
        telefono: '7711234567',
        codigo_postal: '42000',
        estado: 'Hidalgo',
        municipio: 'Pachuca',
        direccion: 'Calle Principal 10'
      }
    });

    component.avanzarPaso(stepper, 'datosPersonales');
    component.avanzarPaso(stepper, 'datosContacto');
    expect(stepper.selectedIndex).toBe(2);

    component.enviarRegistro();
    httpTesting.expectOne(`${environment.apiUrl}${environment.auth.csrf}`).flush(null);

    const request = httpTesting.expectOne(`${environment.apiUrl}/usuarios`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Ana',
      primerApellido: 'Lopez',
      fechaNacimiento: '1990-05-15',
      telefonos: [{ tipo: 'PRINCIPAL', valor: '7711234567' }],
      direcciones: [{ tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' }],
      correos: [{ tipo: 'PRINCIPAL', valor: 'ana@example.com' }],
      password: 'Test123!'
    });
    request.flush({});

    expect(component.modalVisible()).toBeTrue();
    expect(component.modalTipo()).toBe('exito');
  });
});
