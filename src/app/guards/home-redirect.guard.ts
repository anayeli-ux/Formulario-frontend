import { esAdministrador } from '../utils/rol.util';
import { crearGuardSesion } from './guard-sesion';

export const homeRedirectGuard = crearGuardSesion((usuario, router) => {
  if (!usuario) {
    return router.parseUrl('/login');
  }

  return router.parseUrl(esAdministrador(usuario.rol) ? '/admin' : '/usuario');
});