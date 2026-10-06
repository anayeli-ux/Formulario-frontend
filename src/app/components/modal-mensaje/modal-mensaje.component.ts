import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';

export type TipoModal =
  | 'exito'
  | 'error'
  | 'advertencia'
  | 'confirmacion';

@Component({
  selector: 'app-modal-mensaje',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-mensaje.component.html',
  styleUrl: './modal-mensaje.component.css'
})
export class ModalMensajeComponent {

  // Controla si el modal se muestra.
  @Input() visible = false;

  // Define la apariencia del modal.
  @Input() tipo: TipoModal = 'exito';

  // Información que mostrará el modal.
  @Input() titulo = '';
  @Input() mensaje = '';

  // Imagen opcional, por ejemplo el gatito del registro.
  @Input() imagen: string | null = null;
  @Input() imagenAlt = 'Mensaje';

  // Permite impedir que el modal se cierre.
  @Input() bloquearCierre = false;

  // Eventos que recibirá el componente padre.
  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();


  cerrarModal(): void {

    if (this.bloquearCierre) {
      return;
    }

    this.cerrar.emit();
  }


  confirmarAccion(): void {
    this.confirmar.emit();
  }


  cancelarAccion(): void {
    this.cancelar.emit();
  }


  obtenerIcono(): string {

    switch (this.tipo) {

      case 'exito':
        return '✓';

      case 'confirmacion':
        return '?';

      case 'advertencia':
      case 'error':
        return '!';

      default:
        return '';
    }
  }

}