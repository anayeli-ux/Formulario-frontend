import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.obtenerSesion().pipe(
        take(1), // <--- Cierra la suscripción tras el primer valor
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