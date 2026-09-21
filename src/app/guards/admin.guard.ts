import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UsuarioService } from '../services/usuario.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const usuarioService = inject(UsuarioService);
    const router = inject(Router);

    if (!authService.haySesion()) {
        router.navigate(['/login']);
        return false;
    }

    return usuarioService.obtenerMiPerfil().pipe(
        map((usuario) => {
            const esAdministrador = usuario?.rol === 'ADMIN';

            if (esAdministrador) {
                return true;
            }

            authService.cerrarSesion();
            router.navigate(['/login']);
            return false;
        }),
        catchError(() => {
            authService.cerrarSesion();
            router.navigate(['/login']);
            return of(false);
        })
    );
};