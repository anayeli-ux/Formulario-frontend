export interface ContactoItem {
  tipo: string;
  valor: string;
}

export interface DireccionItem extends ContactoItem {
  codigoPostal: string;
}

export interface Usuario {
  id?: number;
  nombre: string;
  primerApellido: string;
  password?: string;
  fechaNacimiento: string;
  estado?: string;
  municipio?: string;
  activo?: boolean;
  rol?: string;
  telefonos: ContactoItem[];
  correos: ContactoItem[];
  direcciones: DireccionItem[];
}