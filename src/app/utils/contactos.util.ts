export interface ContactoPrincipal {
  tipo: string;
  valor: string;
}

export function obtenerContactoPrincipal<T extends ContactoPrincipal>(
  contactos: T[] | undefined
): T | undefined {
  return contactos?.find(contacto => contacto.tipo === 'PRINCIPAL') ?? contactos?.[0];
}