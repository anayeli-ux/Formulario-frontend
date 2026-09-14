export interface Usuario {
  id?: number;
  nombre: string;
  primerApellido: string;
  password: string;
  telefono: string;
  codigoPostal: string;
  estado: string;
  municipio: string;
  direccion: string;
  fechaNacimiento: string;
  email: string;
  activo?: boolean;
}