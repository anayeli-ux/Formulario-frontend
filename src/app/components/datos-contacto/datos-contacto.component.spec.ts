import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DatosContactoComponent } from './datos-contacto.component';
import { UsuarioFormService } from '../../services/usuario-form.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, DatosContactoComponent],
  template: '<form [formGroup]="form"><div formGroupName="datosContacto"><app-datos-contacto></app-datos-contacto></div></form>'
})
class DatosContactoHostComponent {
  form: FormGroup;

  constructor(formService: UsuarioFormService) {
    this.form = formService.crearFormulario();
  }
}

describe('DatosContactoComponent', () => {
  let component: DatosContactoComponent;
  let fixture: ComponentFixture<DatosContactoHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatosContactoHostComponent],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatosContactoHostComponent);
    component = fixture.debugElement.query(By.directive(DatosContactoComponent)).componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
