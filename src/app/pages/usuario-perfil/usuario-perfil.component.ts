import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { finalize } from 'rxjs';
import { ContactosUsuarioComponent } from '../../components/contactos-usuario/contactos-usuario.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-usuario-perfil',
  standalone: true,
  imports: [CommonModule, ContactosUsuarioComponent, PageHeaderComponent],
  templateUrl: './usuario-perfil.component.html',
  styleUrl: './usuario-perfil.component.css'
})
export class UsuarioPerfilComponent implements OnInit {
  usuario = signal<Usuario | undefined>(undefined);
  nombreUsuario = computed(() => {
    const usuario = this.usuario();
    return usuario ? `${usuario.nombre} ${usuario.primerApellido}`.trim() : '';
  });
  correoUsuario = computed(() =>
    this.usuario()?.correos?.find(contacto => contacto.tipo === 'PRINCIPAL')?.valor ?? ''
  );
  cargando = signal(true);
  errorMensaje = signal('');

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router
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

}
