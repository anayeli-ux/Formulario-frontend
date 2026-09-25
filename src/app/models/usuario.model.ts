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
  telefono: string;
  codigoPostal: string;
  estado: string;
  municipio: string;
  direccion: string;
  fechaNacimiento: string;
  email: string;
  activo?: boolean;
  rol?: string;
  telefonos?: ContactoItem[];
  correos?: ContactoItem[];
  direcciones?: DireccionItem[];
}