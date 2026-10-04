import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ControlContainer, FormGroupName, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInput, MatInputModule } from '@angular/material/input';

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
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-MX' },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupName }
  ]
})
export class DatosPersonalesComponent {
  @Input() passwordOpcional = false;
  mostrarPassword = false;
  fechaNacimientoInvalida = false;

  readonly fechaNacimientoErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => {
      const control = this.control('fecha_nacimiento');
      return !!control && control.touched && (control.invalid || this.fechaNacimientoInvalida);
    }
  };

  private fechaNacimientoCacheValue: unknown;
  private fechaNacimientoCache: Date | null = null;

  @ViewChild('fechaNacimientoInput', { read: MatInput })
  private fechaNacimientoInput?: MatInput;

  constructor(public controlContainer: ControlContainer) {}

  control(nombre: string): AbstractControl | null {
    return this.controlContainer.control?.get(nombre) ?? null;
  }

  get fechaNacimientoDate(): Date | null {
    const value = this.control('fecha_nacimiento')?.value;
    if (value === this.fechaNacimientoCacheValue) {
      return this.fechaNacimientoCache;
    }

    this.fechaNacimientoCacheValue = value;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      this.fechaNacimientoCache = null;
      return this.fechaNacimientoCache;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12);
    this.fechaNacimientoCache = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
    return this.fechaNacimientoCache;
  }

  actualizarFechaNacimiento(date: Date | null): void {
    if (!date || !Number.isFinite(date.getTime())) {
      this.actualizarFechaNacimientoDesdeTexto('');
      return;
    }

    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    this.actualizarFechaNacimientoDesdeTexto(value);
  }

  actualizarFechaNacimientoDesdeTexto(value: string): void {
    const control = this.control('fecha_nacimiento');
    if (!control) return;

    const texto = value.trim();
    const date = texto ? this.parsearFechaLocal(texto) : null;
    this.fechaNacimientoInvalida = !!texto && !date;

    const fechaISO = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : '';
    control.setValue(fechaISO);
    control.markAsDirty();
    if (date) control.markAsTouched();
    this.fechaNacimientoInput?.updateErrorState();
  }

  marcarFechaNacimientoTocada(): void {
    this.control('fecha_nacimiento')?.markAsTouched();
    this.fechaNacimientoInput?.updateErrorState();
  }

  private parsearFechaLocal(value: string): Date | null {
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const localMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (!isoMatch && !localMatch) return null;

    const year = Number(isoMatch?.[1] ?? localMatch?.[3]);
    const month = Number(isoMatch?.[2] ?? localMatch?.[2]);
    const day = Number(isoMatch?.[3] ?? localMatch?.[1]);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(12, 0, 0, 0);

    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
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