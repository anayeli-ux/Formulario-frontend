import { obtenerContactoPrincipal } from './contactos.util';

describe('obtenerContactoPrincipal', () => {
  it('prefers a contact marked as principal', () => {
    const contactos = [
      { tipo: 'Personal', valor: '1111111111' },
      { tipo: 'PRINCIPAL', valor: '2222222222' }
    ];

    expect(obtenerContactoPrincipal(contactos)?.valor).toBe('2222222222');
  });

  it('falls back to the first contact when none is marked principal', () => {
    const contactos = [
      { tipo: '', valor: '1212121212' },
      { tipo: '', valor: '565656' }
    ];

    expect(obtenerContactoPrincipal(contactos)?.valor).toBe('1212121212');
  });

  it('returns undefined when there are no contacts', () => {
    expect(obtenerContactoPrincipal([])).toBeUndefined();
    expect(obtenerContactoPrincipal(undefined)).toBeUndefined();
  });
});