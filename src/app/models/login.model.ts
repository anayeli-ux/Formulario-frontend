export type LoginErrorField = 'general' | 'identificador' | 'password';

export interface LoginError {
  mensaje: string;
  campo: LoginErrorField;
}

export interface LoginCredentials {
  identificador: string;
  password: string;
}
