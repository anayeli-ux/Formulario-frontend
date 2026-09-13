import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-datos-personales',
  standalone: true, // <-- Volvemos el componente standalone
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-personales.component.html',
  styleUrls: ['./datos-personales.component.css'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective }
  ]
})
export class DatosPersonalesComponent {}