import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DatosPersonalesComponent } from './datos-personales.component';
import { UsuarioFormService } from '../../services/usuario-form.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, DatosPersonalesComponent],
  template: '<form [formGroup]="form"><div formGroupName="datosPersonales"><app-datos-personales></app-datos-personales></div></form>'
})
class DatosPersonalesHostComponent {
  form: FormGroup;

  constructor(formService: UsuarioFormService) {
    this.form = formService.crearFormulario();
  }
}

describe('DatosPersonalesComponent', () => {
  let component: DatosPersonalesComponent;
  let fixture: ComponentFixture<DatosPersonalesHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatosPersonalesHostComponent],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatosPersonalesHostComponent);
    component = fixture.debugElement.query(By.directive(DatosPersonalesComponent)).componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the selected and loaded birth date as yyyy-MM-dd without timezone conversion', () => {
    const control = fixture.componentInstance.form.get('datosPersonales.fecha_nacimiento');

    control?.setValue('1990-05-15');
    expect(component.fechaNacimientoDate?.getFullYear()).toBe(1990);
    expect(component.fechaNacimientoDate?.getMonth()).toBe(4);
    expect(component.fechaNacimientoDate?.getDate()).toBe(15);

    component.actualizarFechaNacimientoDesdeTexto('15/5/1990');

    expect(control?.value).toBe('1990-05-15');
    expect(control?.valid).toBeTrue();
  });

  it('preserves the majority-age validator for datepicker selections', () => {
    const control = fixture.componentInstance.form.get('datosPersonales.fecha_nacimiento');

    component.actualizarFechaNacimiento(new Date(2010, 4, 15, 12));

    expect(control?.hasError('menorDeEdad')).toBeTrue();
  });

  it('accepts the backend ISO format as manual input without timezone conversion', () => {
    const control = fixture.componentInstance.form.get('datosPersonales.fecha_nacimiento');

    component.actualizarFechaNacimientoDesdeTexto('1990-05-15');

    expect(control?.value).toBe('1990-05-15');
    expect(component.fechaNacimientoInvalida).toBeFalse();
  });

  it('rejects impossible and non-date manual input with a clear material error', () => {
    const control = fixture.componentInstance.form.get('datosPersonales.fecha_nacimiento');

    component.actualizarFechaNacimientoDesdeTexto('2/31/2000');
    component.marcarFechaNacimientoTocada();
    fixture.detectChanges();

    expect(control?.value).toBe('');
    expect(control?.hasError('required')).toBeTrue();
    expect(component.fechaNacimientoInvalida).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Ingresa una fecha válida.');

    component.actualizarFechaNacimientoDesdeTexto('texto inválido');
    expect(control?.value).toBe('');
    expect(component.fechaNacimientoInvalida).toBeTrue();
  });

  it('validates the text emitted by the actual datepicker input event', () => {
    const input = fixture.nativeElement.querySelector('#fecha_nacimiento') as HTMLInputElement;
    const control = fixture.componentInstance.form.get('datosPersonales.fecha_nacimiento');
    input.value = '2/31/2000';

    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(component.fechaNacimientoInvalida).toBeTrue();
    expect(control?.value).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Ingresa una fecha válida.');
  });

  it('continues to reject future dates through the existing minimum-age validator', () => {
    const control = fixture.componentInstance.form.get('datosPersonales.fecha_nacimiento');
    const futureYear = new Date().getFullYear() + 1;

    component.actualizarFechaNacimientoDesdeTexto(`15/5/${futureYear}`);

    expect(control?.value).toBe(`${futureYear}-05-15`);
    expect(control?.hasError('menorDeEdad')).toBeTrue();
  });
});
