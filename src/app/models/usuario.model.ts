export interface ContactoItem {
  id?: number;
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

export interface UsuarioResumen {
  id: number;
  nombre: string;
  primerApellido: string;
  rol: string | number;
  telefono: string | null;
  correo: string | null;
  codigoPostal: string | null;
}

export interface UsuarioContactos {
  id: number;
  nombre: string;
  primerApellido: string;
  telefonos: ContactoItem[];
  correos: ContactoItem[];
  direcciones: DireccionItem[];
}

export interface PaginaUsuarios {
  content: UsuarioResumen[];
  totalPages: number;
}

export interface AdministradorResumen {
  id: number;
  nombre: string;
  primerApellido: string;
  correo: string | null;
  telefono?: string | null;
  codigoPostal?: string | null;
}

export interface PaginaAdministradores {
  content: AdministradorResumen[];
  totalPages: number;
}