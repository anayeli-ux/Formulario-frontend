import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ControlContainer, FormGroupName, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-datos-adicionales',
  standalone: true, // <-- Volvemos el componente standalone
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-adicionales.component.html',
  styleUrls: ['./datos-adicionales.component.css'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupName }
  ]
})
export class DatosAdicionalesComponent {
  constructor(public controlContainer: ControlContainer) {}

  control(nombre: string): AbstractControl | null {
    return this.controlContainer.control?.get(nombre) ?? null;
  }
}