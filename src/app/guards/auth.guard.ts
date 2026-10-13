import { crearGuardSesion } from './guard-sesion';

export const authGuard = crearGuardSesion((usuario, router) =>
    usuario ? true : router.parseUrl('/login')
);