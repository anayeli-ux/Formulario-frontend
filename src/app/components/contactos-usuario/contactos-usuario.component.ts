import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Usuario, UsuarioContactos } from '../../models/usuario.model';

@Component({
  selector: 'app-contactos-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contactos-usuario.component.html',
  styleUrl: './contactos-usuario.component.css'
})
export class ContactosUsuarioComponent {
  @Input({ required: true }) usuario!: Usuario | UsuarioContactos;
  @Input() presentacion: 'modal' | 'perfil' = 'perfil';
}