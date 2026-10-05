import { esAdministrador, obtenerIdRol } from './rol.util';

describe('rol.util', () => {
  it('normalizes numeric role IDs and legacy names', () => {
    expect(obtenerIdRol(1)).toBe(1);
    expect(obtenerIdRol('1')).toBe(1);
    expect(obtenerIdRol('USER')).toBe(1);
    expect(obtenerIdRol(2)).toBe(2);
    expect(obtenerIdRol('2')).toBe(2);
    expect(obtenerIdRol('ADMIN')).toBe(2);
  });

  it('identifies only role ID 2 as administrator', () => {
    expect(esAdministrador(2)).toBeTrue();
    expect(esAdministrador('2')).toBeTrue();
    expect(esAdministrador('ADMIN')).toBeTrue();
    expect(esAdministrador(1)).toBeFalse();
    expect(esAdministrador('USER')).toBeFalse();
  });
});