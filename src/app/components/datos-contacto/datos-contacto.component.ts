import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ControlContainer, FormArray, FormBuilder, FormControl, FormGroup, FormGroupName, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-datos-contacto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-contacto.component.html',
  styleUrls: ['./datos-contacto.component.css'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupName }
  ]
})
export class DatosContactoComponent {
  @Output() codigoPostalChange = new EventEmitter<string>();

  readonly tiposPredeterminados = ['Personal', 'Trabajo', 'Casa', 'Emergencia'];

  constructor(
    public controlContainer: ControlContainer,
    private fb: FormBuilder
  ) {}

  control(nombre: string): AbstractControl | null {
    return this.controlContainer.control?.get(nombre) ?? null;
  }

  get telefonos(): FormArray {
    return (this.controlContainer.control?.get('telefonos') as FormArray) ?? new FormArray([]);
  }

  get correos(): FormArray {
    return (this.controlContainer.control?.get('correos') as FormArray) ?? new FormArray([]);
  }

  get direcciones(): FormArray {
    return (this.controlContainer.control?.get('direcciones') as FormArray) ?? new FormArray([]);
  }

  nuevoContacto(tipo = 'Personal', correo = false): FormGroup {
    return this.fb.group({
      tipo: new FormControl(tipo, Validators.required),
      valor: new FormControl('', correo
        ? [Validators.required, Validators.email, Validators.maxLength(150)]
        : [Validators.required, Validators.pattern(/^\d{10}$/)]
      )
    });
  }

  nuevoDireccion(tipo = 'Personal'): FormGroup {
    return this.fb.group({
      tipo: new FormControl(tipo, Validators.required),
      valor: new FormControl('', [Validators.required, Validators.maxLength(150)]),
      codigoPostal: new FormControl('', [Validators.required, Validators.pattern(/^\d{5}$/)])
    });
  }

  agregarTelefono(): void {
    this.telefonos.push(this.nuevoContacto('Personal'));
  }

  agregarCorreo(): void {
    this.correos.push(this.nuevoContacto('Personal', true));
  }

  agregarDireccion(): void {
    this.direcciones.push(this.nuevoDireccion('Personal'));
  }

  quitarTelefono(index: number): void {
    this.telefonos.removeAt(index);
  }

  quitarCorreo(index: number): void {
    this.correos.removeAt(index);
  }

  quitarDireccion(index: number): void {
    this.direcciones.removeAt(index);
  }
}