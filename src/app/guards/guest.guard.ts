import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { UsuarioService } from '../services/usuario.service';

export const guestGuard: CanActivateFn = () => {
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);

  return usuarioService.obtenerMiPerfil().pipe(
    map(usuario =>
      router.parseUrl(usuario?.rol === 'ADMIN' ? '/admin' : '/usuario')
    ),
    catchError(() => of(true))
  );
};
