import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentInstance.etiqueta = 'ACCESO';
    fixture.componentInstance.titulo = 'Iniciar sesión';
    fixture.componentInstance.descripcion = 'Ingresa tus credenciales para continuar.';
    fixture.detectChanges();
  });

  it('renders its label, title, and description with the configured heading level', () => {
    expect(fixture.nativeElement.querySelector('.page-header-label').textContent).toContain('ACCESO');
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Iniciar sesión');
    expect(fixture.nativeElement.querySelector('p').textContent).toContain('Ingresa tus credenciales');

    fixture.componentInstance.nivelTitulo = 1;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Iniciar sesión');
  });

  it('uses the shared principal header with identity and logout action', () => {
    fixture.componentInstance.variante = 'principal';
    fixture.componentInstance.nivelTitulo = 1;
    fixture.componentInstance.nombreUsuario = 'Ana Perez';
    fixture.componentInstance.correoUsuario = 'ana@example.com';
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.page-header');
    expect(header.classList.contains('page-header--principal')).toBeTrue();
    expect(header.querySelector('h1')).toBeTruthy();
    expect(header.querySelector('.page-header-identity').textContent).toContain('Ana Perez');
    expect(header.querySelector('.page-header-identity').textContent).toContain('ana@example.com');
    expect(header.querySelector('.page-header-logout').textContent).toContain('Cerrar sesión');
  });
});