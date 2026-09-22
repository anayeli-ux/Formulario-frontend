import { HttpInterceptorFn } from '@angular/common/http';
export const jwtInterceptor: HttpInterceptorFn = (
    req,
    next
) => {
    const requestConCredenciales = req.clone({
        withCredentials: true
    });
    return next(requestConCredenciales);
};