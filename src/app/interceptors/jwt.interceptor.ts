import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    if (token) {
        // Clonamos la petición y agregamos el header Authorization con el Bearer token
        const clonedReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedReq);
    }

    return next(req);
};