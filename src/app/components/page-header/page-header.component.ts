import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  @Input() etiqueta = '';
  @Input() titulo = '';
  @Input() descripcion = '';
  @Input() nivelTitulo: 1 | 2 = 2;
  @Input() variante: 'admin' | 'login' | 'registro' | 'perfil' = 'registro';
  @Input() mostrarAcciones = false;
  @Input() idTitulo = '';
}