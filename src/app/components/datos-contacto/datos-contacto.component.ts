import { Component } from '@angular/core';
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

  nuevoContacto(tipo = 'Personal'): FormGroup {
    return this.fb.group({
      tipo: new FormControl(tipo, Validators.required),
      valor: new FormControl('', Validators.required)
    });
  }

  agregarTelefono(): void {
    this.telefonos.push(this.nuevoContacto('Personal'));
  }

  agregarCorreo(): void {
    this.correos.push(this.nuevoContacto('Personal'));
  }

  agregarDireccion(): void {
    this.direcciones.push(this.nuevoContacto('Personal'));
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