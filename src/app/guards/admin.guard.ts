import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const usuario = localStorage.getItem('usuario');

    let esAdministrador = false;
    if (usuario) {
        try {
            esAdministrador = JSON.parse(usuario).rol === 'ADMIN';
        } catch {
            esAdministrador = false;
        }
    }

    if (authService.haySesion() && esAdministrador) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};