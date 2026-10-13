import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService, UsuarioSesion } from '../services/auth.service';

type ResultadoGuard = boolean | UrlTree;
type DecidirGuard = (usuario: UsuarioSesion | null, router: Router) => ResultadoGuard;
type DecidirError = (router: Router) => ResultadoGuard;

export function crearGuardSesion(
    decidir: DecidirGuard,
    decidirError: DecidirError = router => router.parseUrl('/login')
): CanActivateFn {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        return authService.obtenerSesion().pipe(
            map(usuario => decidir(usuario, router)),
            catchError(() => of(decidirError(router)))
        );
    };
}