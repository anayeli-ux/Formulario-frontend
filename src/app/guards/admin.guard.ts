import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Aquí verificamos si hay sesión y si el rol o tipo de usuario corresponde
    if (authService.haySesion()) {
        // Si tuvieras un método para validar rol, lo pondrías aquí. 
        // Por ahora validamos que exista sesión activa:
        return true;
    }

    router.navigate(['/login']);
    return false;
};