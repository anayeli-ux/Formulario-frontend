import { esAdministrador } from '../utils/rol.util';
import { crearGuardSesion } from './guard-sesion';

export const adminGuard = crearGuardSesion((usuario, router) => {
    return usuario && esAdministrador(usuario.rol)
        ? true
        : router.parseUrl('/usuario');
});