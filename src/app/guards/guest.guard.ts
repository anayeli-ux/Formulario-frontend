import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.obtenerSesion().pipe(
    take(1),
    map(usuario =>
      usuario
        ? router.parseUrl(usuario.rol === 'ADMIN' ? '/admin' : '/usuario')
        : true
    ),
    catchError(() => of(true))
  );
};