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

    component.actualizarFechaNacimiento(new Date(1990, 4, 15, 12));

    expect(control?.value).toBe('1990-05-15');
    expect(control?.valid).toBeTrue();
  });

  it('preserves the majority-age validator for datepicker selections', () => {
    const control = fixture.componentInstance.form.get('datosPersonales.fecha_nacimiento');

    component.actualizarFechaNacimiento(new Date(2010, 4, 15, 12));

    expect(control?.hasError('menorDeEdad')).toBeTrue();
  });

  it('clears an invalid datepicker value instead of storing an invalid date string', () => {
    const control = fixture.componentInstance.form.get('datosPersonales.fecha_nacimiento');

    component.actualizarFechaNacimiento(new Date(Number.NaN));

    expect(control?.value).toBe('');
    expect(control?.hasError('required')).toBeTrue();
  });
});
