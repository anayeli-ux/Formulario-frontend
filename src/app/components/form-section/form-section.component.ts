import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'app-form-section',
  standalone: true,
  imports: [],
  templateUrl: './form-section.component.html',
  styleUrl: './form-section.component.css'
})
export class FormSectionComponent {

  @Input() numero = '';

  @Input() titulo = '';

  @Input() descripcion = '';
}