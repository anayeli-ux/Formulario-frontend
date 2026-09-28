import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ContactoItem, DireccionItem, Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { PostaliaService } from '../../services/postalia.service';
import { UsuarioService } from '../../services/usuario.service';
import { catchError, finalize, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-usuario-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-perfil.component.html',
  styleUrl: './usuario-perfil.component.css'
})
export class UsuarioPerfilComponent implements OnInit {
  private readonly enlaceCambioDeRol =
    'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0';

  usuario = signal<Usuario | undefined>(undefined);
  telefonosMostrar = computed<ContactoItem[]>(() => {
    const usuario = this.usuario();
    if (!usuario) return [];
    if (usuario.telefonos?.length) return usuario.telefonos;
    return usuario.telefono ? [{ tipo: 'Principal', valor: usuario.telefono }] : [];
  });
  correosMostrar = computed<ContactoItem[]>(() => {
    const usuario = this.usuario();
    if (!usuario) return [];
    if (usuario.correos?.length) return usuario.correos;
    return usuario.email ? [{ tipo: 'Principal', valor: usuario.email }] : [];
  });
  direccionesMostrar = computed<DireccionItem[]>(() => {
    const usuario = this.usuario();
    if (!usuario) return [];
    if (usuario.direcciones?.length) return usuario.direcciones;
    return usuario.direccion
      ? [{ tipo: 'Principal', valor: usuario.direccion, codigoPostal: usuario.codigoPostal }]
      : [];
  });
  cargando = signal(true);
  errorMensaje = signal('');
  modalVisible = signal(false);
  youtubeEmbedUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.enlaceCambioDeRol);

  constructor(
    private usuarioService: UsuarioService,
    private postaliaService: PostaliaService,
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.usuarioService.obtenerMiPerfil().pipe(
      switchMap(usuario => {
        if (!usuario.codigoPostal) {
          return of(usuario);
        }

        return this.postaliaService.buscarCodigoPostal(usuario.codigoPostal).pipe(
          map(ubicacion => ({
            ...usuario,
            estado: ubicacion.estado,
            municipio: ubicacion.municipio
          })),
          catchError(() => of(usuario))
        );
      }),
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

  cambiarDeRol(): void {
    this.modalVisible.set(true);
  }

  cerrarVideo(): void {
    this.modalVisible.set(false);
  }
}
