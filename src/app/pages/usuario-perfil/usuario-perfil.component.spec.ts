import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { PostaliaService } from '../../services/postalia.service';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioPerfilComponent } from './usuario-perfil.component';

describe('UsuarioPerfilComponent', () => {
  let fixture: ComponentFixture<UsuarioPerfilComponent>;

  const usuario: Usuario = {
    id: 7,
    nombre: 'Ana',
    primerApellido: 'Lopez',
    telefono: '7711234567',
    codigoPostal: '42000',
    estado: 'Hidalgo',
    municipio: 'Pachuca',
    direccion: 'Calle Principal 1',
    fechaNacimiento: '1990-05-15',
    email: 'ana@example.com',
    telefonos: [
      { tipo: 'Principal', valor: '7711234567' },
      { tipo: 'Trabajo', valor: '7717654321' }
    ],
    correos: [
      { tipo: 'Principal', valor: 'ana@example.com' },
      { tipo: 'Trabajo', valor: 'ana.trabajo@example.com' }
    ],
    direcciones: [
      { tipo: 'Principal', valor: 'Calle Principal 1', codigoPostal: '42000' },
      { tipo: 'Trabajo', valor: 'Calle Secundaria 2', codigoPostal: '42010' }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioPerfilComponent],
      providers: [
        provideRouter([]),
        { provide: UsuarioService, useValue: { obtenerMiPerfil: () => of(usuario) } },
        { provide: PostaliaService, useValue: { buscarCodigoPostal: () => of({ estado: 'Hidalgo', municipio: 'Pachuca' }) } },
        { provide: AuthService, useValue: { cerrarSesion: () => of(undefined), limpiarSesionLocal: () => undefined } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioPerfilComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows all registered phones, emails, and addresses', () => {
    const pageText = fixture.nativeElement.textContent as string;

    expect(pageText).toContain('7711234567');
    expect(pageText).toContain('7717654321');
    expect(pageText).toContain('ana@example.com');
    expect(pageText).toContain('ana.trabajo@example.com');
    expect(pageText).toContain('Calle Principal 1');
    expect(pageText).toContain('Calle Secundaria 2');
    expect(pageText).toContain('42010');
  });
});