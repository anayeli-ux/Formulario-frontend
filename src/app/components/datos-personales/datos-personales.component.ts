import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ControlContainer, FormGroupName, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-datos-personales',
  standalone: true, // <-- Volvemos el componente standalone
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule
  ],
  templateUrl: './datos-personales.component.html',
  styleUrls: ['./datos-personales.component.css'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupName }
  ]
})
export class DatosPersonalesComponent {
  @Input() passwordOpcional = false;
  mostrarPassword = false;

  constructor(public controlContainer: ControlContainer) {}

  control(nombre: string): AbstractControl | null {
    return this.controlContainer.control?.get(nombre) ?? null;
  }

  get fechaNacimientoDate(): Date | null {
    const value = this.control('fecha_nacimiento')?.value;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  }

  actualizarFechaNacimiento(date: Date | null): void {
    const control = this.control('fecha_nacimiento');
    if (!control) return;

    const value = date && Number.isFinite(date.getTime())
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : '';
    control.setValue(value);
    control.markAsDirty();
    control.markAsTouched();
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