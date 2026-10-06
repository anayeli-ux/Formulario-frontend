import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminIconsService } from '../../services/admin-icons.service';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent implements OnInit {
  @Input() etiqueta = '';
  @Input() titulo = '';
  @Input() tituloId = '';
  @Input() descripcion = '';
  @Input() nombreUsuario = '';
  @Input() correoUsuario = '';
  @Input() nivelTitulo: 1 | 2 = 2;
  @Input() variante: 'principal' | 'login' | 'registro' = 'registro';
  @Output() cerrarSesion = new EventEmitter<void>();

  constructor(private adminIcons: AdminIconsService) {}

  ngOnInit(): void {
    this.adminIcons.registrar();
  }
}