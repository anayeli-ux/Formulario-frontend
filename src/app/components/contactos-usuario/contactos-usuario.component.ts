import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-contactos-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contactos-usuario.component.html',
  styleUrl: './contactos-usuario.component.css'
})
export class ContactosUsuarioComponent {
  @Input({ required: true }) usuario!: Usuario;
  @Input() presentacion: 'modal' | 'perfil' = 'perfil';

  get datosPersonales(): Usuario | null {
    return 'fechaNacimiento' in this.usuario ? this.usuario : null;
  }
}