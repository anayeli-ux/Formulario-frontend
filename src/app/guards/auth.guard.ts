import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.obtenerSesion().pipe(
        map(usuario =>
            usuario?.rol === 'ADMIN'
                ? router.parseUrl('/admin')
                : true
        ),
        catchError(() => {
            return of(router.parseUrl('/login'));
        })
    );
};