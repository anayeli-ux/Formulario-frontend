export const USUARIO_CACHE_STORAGE_PREFIX = 'formulario:usuarios:v1:';

export function limpiarCacheUsuariosPersistida(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const claves = Object.keys(window.sessionStorage)
      .filter(clave => clave.startsWith(USUARIO_CACHE_STORAGE_PREFIX));

    claves.forEach(clave => window.sessionStorage.removeItem(clave));
  } catch {
    // El almacenamiento puede estar deshabilitado por el navegador.
  }
}