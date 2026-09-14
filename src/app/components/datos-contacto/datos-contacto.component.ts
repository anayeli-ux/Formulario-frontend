import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormGroupName, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-datos-contacto',
  standalone: true, // <-- Volvemos el componente standalone
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-contacto.component.html',
  styleUrls: ['./datos-contacto.component.css'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupName }
  ]
})
export class DatosContactoComponent {}