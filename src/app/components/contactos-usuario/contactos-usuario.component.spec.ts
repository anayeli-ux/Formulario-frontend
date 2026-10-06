import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Usuario } from '../../models/usuario.model';
import { ContactosUsuarioComponent } from './contactos-usuario.component';

describe('ContactosUsuarioComponent', () => {
  let fixture: ComponentFixture<ContactosUsuarioComponent>;

  const usuario: Usuario = {
    id: 8,
    nombre: 'Ana',
    primerApellido: 'Perez',
    fechaNacimiento: '1990-01-01',
    rol: 'USER',
    telefonos: [{ tipo: 'PRINCIPAL', valor: '7711234567' }],
    correos: [{ tipo: 'PRINCIPAL', valor: 'ana@example.com' }],
    direcciones: [{ tipo: 'PRINCIPAL', valor: 'Calle 1', codigoPostal: '42000' }]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ContactosUsuarioComponent] }).compileComponents();
    fixture = TestBed.createComponent(ContactosUsuarioComponent);
    fixture.componentRef.setInput('usuario', usuario);
  });

  it('renders the same personal and contact details in the profile and admin modal', () => {
    fixture.componentRef.setInput('presentacion', 'perfil');
    fixture.detectChanges();
    const profileText = fixture.nativeElement.textContent;

    fixture.componentRef.setInput('presentacion', 'modal');
    fixture.detectChanges();
    const modalText = fixture.nativeElement.textContent;

    for (const dato of ['1990-01-01', '7711234567', 'ana@example.com', 'Calle 1', '42000']) {
      expect(profileText).toContain(dato);
      expect(modalText).toContain(dato);
    }
  });
});