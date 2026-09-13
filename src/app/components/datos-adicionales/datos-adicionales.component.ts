import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-datos-adicionales',
  standalone: true, // <-- Volvemos el componente standalone
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-adicionales.component.html',
  styleUrls: ['./datos-adicionales.component.css'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective }
  ]
})
export class DatosAdicionalesComponent {}