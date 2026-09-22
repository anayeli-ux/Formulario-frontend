import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { UsuarioService } from '../services/usuario.service';

export const authGuard: CanActivateFn = (route, state) => {
    const usuarioService = inject(UsuarioService);
    const router = inject(Router);

    return usuarioService.obtenerMiPerfil().pipe(
        map(() => true),
        catchError(() => {
            router.navigate(['/login']);
            return of(false);
        })
    );
};