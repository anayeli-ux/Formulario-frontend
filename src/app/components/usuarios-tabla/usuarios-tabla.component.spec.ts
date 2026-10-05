import { SimpleChange, SimpleChanges } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatCheckbox } from '@angular/material/checkbox';
import { UsuarioResumen } from '../../models/usuario.model';
import { UsuariosTablaComponent } from './usuarios-tabla.component';

describe('UsuariosTablaComponent', () => {
  let component: UsuariosTablaComponent;
  let fixture: ComponentFixture<UsuariosTablaComponent>;

  const crearUsuario = (id: number): UsuarioResumen => ({
    id,
    nombre: `Usuario ${id}`,
    primerApellido: 'Prueba',
    rol: 'USER',
    telefono: null,
    correo: null,
    codigoPostal: null
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosTablaComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosTablaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('defaults to five rows per page', () => {
    expect(component.pageSize).toBe(5);
  });

  it('emits page changes so the parent can request the next server page', () => {
    let requestedPage = -1;
    component.paginaChange.subscribe(event => requestedPage = event.pageIndex);
    fixture.detectChanges();
    component.cambiarPagina({ pageIndex: 1, pageSize: 5, length: 12 });

    expect(requestedPage).toBe(1);
  });

  it('resets the page when the search changes', () => {
    component.pageIndex = 2;
    component.ngOnChanges({
      busqueda: new SimpleChange('texto anterior', 'nuevo texto', false)
    } as SimpleChanges);

    expect(component.pageIndex).toBe(0);
  });

  it('forwards free-text searches without restricting the searched value', () => {
    let emittedSearch = '';
    component.busquedaChange.subscribe(value => emittedSearch = value);
    const input = document.createElement('input');
    input.value = '  42000  ';

    component.actualizarBusqueda({ target: input } as unknown as Event);

    expect(emittedSearch).toBe('  42000  ');
  });

  it('suggests only users already matching the current search', () => {
    component.busqueda = 'ana';
    fixture.componentRef.setInput('usuarios', Array.from({ length: 10 }, (_, index) => crearUsuario(index + 1)));
    fixture.detectChanges();

    expect(component.sugerencias.length).toBe(8);
    component.busqueda = '';
    expect(component.sugerencias).toEqual([]);
  });

  it('uses a searchable existing field when a suggestion is selected', () => {
    let emittedSearch = '';
    component.busquedaChange.subscribe(value => emittedSearch = value);

    component.seleccionarSugerencia({ option: { value: '12' } } as never);

    expect(emittedSearch).toBe('12');
  });

  it('keeps identity and action columns fixed and offers only current optional columns', () => {
    expect(component.columnasVisibles).toEqual([
      'id', 'nombre', 'rol', 'telefono', 'correo', 'informacion', 'acciones'
    ]);
    expect(component.columnasConfigurables.map(columna => columna.id)).toEqual([
      'telefono', 'codigoPostal', 'correo'
    ]);
    expect(component.columnasVisibles).not.toContain('codigoPostal');
  });

  it('shows and hides the postal-code column from its MatCheckbox', () => {
    const postalCheckbox = fixture.debugElement.queryAll(By.directive(MatCheckbox))
      .find(element => element.nativeElement.textContent.includes('Código postal'));

    expect(postalCheckbox).toBeDefined();
    expect(component.columnasVisibles).not.toContain('codigoPostal');

    const checkboxInput = postalCheckbox!.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkboxInput.click();
    fixture.detectChanges();
    expect(component.columnasVisibles).toContain('codigoPostal');

    checkboxInput.click();
    fixture.detectChanges();
    expect(component.columnasVisibles).not.toContain('codigoPostal');
  });

  it('does not mutate page results when column visibility changes', () => {
    const usuarios = [crearUsuario(7)];
    const snapshot = JSON.stringify(usuarios);
    fixture.componentRef.setInput('usuarios', usuarios);
    fixture.detectChanges();

    component.cambiarVisibilidadColumna('telefono', { checked: false } as never);

    expect(component.usuarios).toBe(usuarios);
    expect(JSON.stringify(component.usuarios)).toBe(snapshot);
    expect(component.usuariosPaginados).toEqual(usuarios);
  });
});