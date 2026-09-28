import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { finalize } from 'rxjs';
import { ContactosUsuarioComponent } from '../../components/contactos-usuario/contactos-usuario.component';

@Component({
  selector: 'app-usuario-perfil',
  standalone: true,
  imports: [CommonModule, ContactosUsuarioComponent],
  templateUrl: './usuario-perfil.component.html',
  styleUrl: './usuario-perfil.component.css'
})
export class UsuarioPerfilComponent implements OnInit {
  private readonly enlaceCambioDeRol =
    'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0';

  usuario = signal<Usuario | undefined>(undefined);
  cargando = signal(true);
  errorMensaje = signal('');
  avisoEdicionVisible = signal(false);
  modalVisible = signal(false);
  youtubeEmbedUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.enlaceCambioDeRol);

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  private cargarPerfil(): void {
    this.usuarioService.obtenerMiPerfil().pipe(
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: usuario => this.usuario.set(usuario),
      error: () => this.errorMensaje.set('No fue posible cargar tus datos.')
    });
  }

  mostrarAvisoEdicion(): void {
    this.avisoEdicionVisible.set(true);
  }

  cerrarAvisoEdicion(): void {
    this.avisoEdicionVisible.set(false);
  }

  cerrarSesion(): void {
    if (this.cargando()) {
      return;
    }

    this.cargando.set(true);

    this.authService.cerrarSesion().pipe(
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.limpiarSesionLocal();
        this.router.navigate(['/login']);
      }
    });
  }

  cambiarDeRol(): void {
    this.modalVisible.set(true);
  }

  cerrarVideo(): void {
    this.modalVisible.set(false);
  }
}
