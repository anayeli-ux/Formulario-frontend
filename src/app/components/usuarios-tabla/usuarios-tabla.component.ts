import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Usuario } from '../../models/usuario.model';
import { obtenerContactoPrincipal } from '../../utils/contactos.util';

@Component({
  selector: 'app-usuarios-tabla',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios-tabla.component.html',
  styleUrl: './usuarios-tabla.component.css'
})
export class UsuariosTablaComponent {
  @Input() usuarios: Usuario[] = [];
  @Input() busqueda = '';
  @Input() total = 0;
  @Input() cargando = false;
  @Input() inactivos = false;

  @Output() busquedaChange = new EventEmitter<string>();
  @Output() registrar = new EventEmitter<void>();
  @Output() ver = new EventEmitter<Usuario>();
  @Output() editar = new EventEmitter<Usuario>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() reactivar = new EventEmitter<number>();

  actualizarBusqueda(event: Event): void {
    this.busquedaChange.emit((event.target as HTMLInputElement).value);
  }

  obtenerTelefonoPrincipal(usuario: Usuario): string {
    return obtenerContactoPrincipal(usuario.telefonos)?.valor ?? '';
  }

  obtenerCorreoPrincipal(usuario: Usuario): string {
    return obtenerContactoPrincipal(usuario.correos)?.valor ?? '';
  }

  obtenerCodigoPostalPrincipal(usuario: Usuario): string {
    return obtenerContactoPrincipal(usuario.direcciones)?.codigoPostal ?? '';
  }
}