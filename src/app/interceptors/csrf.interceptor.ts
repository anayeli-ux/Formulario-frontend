import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';
export const csrfInterceptor: HttpInterceptorFn = (
    req,
    next
) => {
    const metodoProtegido = [
        'POST',
        'PUT',
        'PATCH',
        'DELETE'
    ].includes(
        req.method.toUpperCase()
    );
    const esNuestroBackend =
        req.url.startsWith(environment.apiUrl);
    if (
        !metodoProtegido ||
        !esNuestroBackend
    ) {
        return next(req);
    }
    const csrfToken =
        obtenerCookie('XSRF-TOKEN');
    if (csrfToken) {
        const requestConCsrf = req.clone({
            setHeaders: {
                'X-XSRF-TOKEN': csrfToken
            }
        });
        return next(requestConCsrf);
    }
    return next(req);
};

function obtenerCookie(
    nombre: string
): string | null {
    const cookies =
        document.cookie.split(';');
    for (const cookie of cookies) {
        const partes =
            cookie.trim().split('=');
        const nombreCookie =
            partes.shift();
        const valorCookie =
            partes.join('=');
        if (nombreCookie === nombre) {
            return decodeURIComponent(
                valorCookie
            );
        }
    }
    return null;
}