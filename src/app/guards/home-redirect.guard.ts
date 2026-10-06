import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { esAdministrador } from '../utils/rol.util';

export const homeRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.obtenerSesion().pipe(
    map(usuario => router.parseUrl(
      !usuario ? '/login' : esAdministrador(usuario.rol) ? '/admin' : '/usuario'
    )),
    catchError(() => of(router.parseUrl('/login')))
  );
};