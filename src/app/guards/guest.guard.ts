import { esAdministrador } from '../utils/rol.util';
import { crearGuardSesion } from './guard-sesion';

export const guestGuard = crearGuardSesion(
  (usuario, router) => !usuario
    ? true
    : esAdministrador(usuario.rol)
      ? true
      : router.parseUrl('/usuario'),
  () => true
);
