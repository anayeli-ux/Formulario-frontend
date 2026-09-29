import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.obtenerSesion().pipe(
        take(1), // <--- Cierra la suscripción tras el primer valor
        map((usuario) => {
            const esAdministrador = usuario?.rol === 'ADMIN';

            if (esAdministrador) {
                return true;
            }

            return router.parseUrl('/usuario');
        }),
        catchError(() => {
            return of(router.parseUrl('/login'));
        })
    );
};