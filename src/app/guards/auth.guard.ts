import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { UsuarioService } from '../services/usuario.service';

export const authGuard: CanActivateFn = (route, state) => {
    const usuarioService = inject(UsuarioService);
    const router = inject(Router);

    return usuarioService.obtenerMiPerfil().pipe(
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