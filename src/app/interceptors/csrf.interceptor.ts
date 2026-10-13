import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

const METODOS_PROTEGIDOS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const COOKIE_CSRF = 'XSRF-TOKEN';
const CABECERA_CSRF = 'X-XSRF-TOKEN';

// Adjunta el token CSRF solo a cambios enviados a nuestra API.
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
    const metodoProtegido = METODOS_PROTEGIDOS.has(req.method.toUpperCase());
    const esNuestroBackend = req.url.startsWith(environment.apiUrl);

    if (!metodoProtegido || !esNuestroBackend) {
        return next(req);
    }

    const token = obtenerCookie(COOKIE_CSRF);
    if (!token) {
        return next(req);
    }

    return next(req.clone({
        setHeaders: { [CABECERA_CSRF]: token }
    }));
};

function obtenerCookie(nombre: string): string | null {
    const cookie = document.cookie
        .split(';')
        .find(parte => parte.trim().startsWith(`${nombre}=`));

    if (!cookie) {
        return null;
    }

    const valor = cookie.trim().slice(nombre.length + 1);
    return decodeURIComponent(valor);
}