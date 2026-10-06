export type RolUsuario = string | number | null | undefined;

export function obtenerIdRol(rol: RolUsuario): number | null {
  if (typeof rol === 'number' && Number.isInteger(rol)) {
    return rol;
  }

  const valor = String(rol ?? '').trim().toUpperCase();
  if (valor === '1' || valor === 'USER') return 1;
  if (valor === '2' || valor === 'ADMIN') return 2;
  return null;
}

export function esAdministrador(rol: RolUsuario): boolean {
  return obtenerIdRol(rol) === 2;
}