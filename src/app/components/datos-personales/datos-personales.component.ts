import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ControlContainer, FormGroupName, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-datos-personales',
  standalone: true, // <-- Volvemos el componente standalone
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-personales.component.html',
  styleUrls: ['./datos-personales.component.css'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupName }
  ]
})
export class DatosPersonalesComponent {
  mostrarPassword = false;

  constructor(public controlContainer: ControlContainer) {}

  control(nombre: string): AbstractControl | null {
    return this.controlContainer.control?.get(nombre) ?? null;
  }

  get passwordStrength(): number {
    const password = this.control('password')?.value ?? '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Za-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z\d]/.test(password)) strength++;

    return strength;
  }

  get passwordStrengthLabel(): string {
    return ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'][this.passwordStrength];
  }
}