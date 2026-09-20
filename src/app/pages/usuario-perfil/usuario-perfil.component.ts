import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { PostaliaService } from '../../services/postalia.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuario-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-perfil.component.html',
  styleUrl: './usuario-perfil.component.css'
})
export class UsuarioPerfilComponent implements OnInit {
  private readonly enlaceCambioDeRol =
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1';

  usuario?: Usuario;
  cargando = true;
  errorMensaje = '';

  constructor(
    private usuarioService: UsuarioService,
    private postaliaService: PostaliaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioService.obtenerMiPerfil().subscribe({
      next: usuario => {
        this.usuario = usuario;

        if (!usuario.codigoPostal) {
          this.cargando = false;
          return;
        }

        this.postaliaService.buscarCodigoPostal(usuario.codigoPostal).subscribe({
          next: ubicacion => {
            this.usuario = {
              ...usuario,
              estado: ubicacion.estado,
              municipio: ubicacion.municipio
            };
            this.cargando = false;
          },
          error: error => {
            console.error('Error al consultar el código postal:', error);
            this.cargando = false;
          }
        });
      },
      error: error => {
        console.error('Error al cargar el perfil:', error);
        this.errorMensaje = 'No fue posible cargar tus datos.';
        this.cargando = false;
      }
    });
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  cambiarDeRol(): void {
    window.location.href = this.enlaceCambioDeRol;
  }
}
