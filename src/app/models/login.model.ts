export type LoginErrorField = 'general' | 'identificador' | 'password';

export interface LoginError {
  mensaje: string;
  campo: LoginErrorField;
}
