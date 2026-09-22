import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UsuarioService } from '../services/usuario.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const usuarioService = inject(UsuarioService);
    const router = inject(Router);

    return usuarioService.obtenerMiPerfil().pipe(
        map((usuario) => {
            const esAdministrador = usuario?.rol === 'ADMIN';

            if (esAdministrador) {
                authService['usuarioActual'] = {
                    id: usuario.id ?? 0,
                    email: usuario.email,
                    rol: usuario.rol ?? 'USER'
                };
                return true;
            }

            authService.cerrarSesion().subscribe();
            router.navigate(['/login']);
            return false;
        }),
        catchError(() => {
            authService.cerrarSesion().subscribe();
            router.navigate(['/login']);
            return of(false);
        })
    );
};