import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Admin } from './admin';
import { UsuariosTablaComponent } from '../../components/usuarios-tabla/usuarios-tabla.component';
import { environment } from '../../../environments/environment';

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;
  let httpTesting: HttpTestingController;
  let overlayContainer: OverlayContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Admin, HttpClientTestingModule, RouterTestingModule],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    overlayContainer = TestBed.inject(OverlayContainer);
  });

  afterEach(() => {
    httpTesting.verify();
    fixture.destroy();
  });

  it('should create', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([]);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios/eliminados`);
    expect(component).toBeTruthy();
  });

  it('loads deleted users only once when that view is first selected', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([]);
    httpTesting.expectNone(`${environment.apiUrl}/usuarios/eliminados`);

    component.cambiarVista('eliminados');
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/eliminados`).flush([]);
    component.cambiarVista('activos');
    component.cambiarVista('eliminados');

    httpTesting.expectNone(`${environment.apiUrl}/usuarios/eliminados`);
    expect(component.vistaActual()).toBe('eliminados');
  });

  it('continues filtering by postal code while its column is hidden', () => {
    fixture.detectChanges();
    const usuario = {
      id: 21,
      nombre: 'Ana',
      primerApellido: 'Lopez',
      fechaNacimiento: '1990-05-15',
      estado: 'Hidalgo',
      municipio: 'Pachuca',
      telefonos: [{ tipo: 'PRINCIPAL', valor: '7711234567' }],
      correos: [{ tipo: 'PRINCIPAL', valor: 'ana@example.com' }],
      direcciones: [{ tipo: 'PRINCIPAL', valor: 'Calle Principal 10', codigoPostal: '42000' }]
    };
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([usuario]);
    fixture.detectChanges();

    const tabla = fixture.debugElement.query(By.directive(UsuariosTablaComponent)).componentInstance as UsuariosTablaComponent;
    expect(tabla.columnasVisibles).not.toContain('codigoPostal');

    component.busquedaUsuarios.set('42000');
    fixture.detectChanges();

    expect(tabla.columnasVisibles).not.toContain('codigoPostal');
    expect(component.usuariosFiltrados()).toEqual([usuario]);
    expect(tabla.usuarios).toEqual([usuario]);
  });

  it('runs a destructive action only after the dialog is confirmed', async () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios`).flush([]);
    let actionCount = 0;

    component.mostrarConfirmacion('¿Eliminar usuario?', 'Confirmación de prueba.', () => actionCount++);
    fixture.detectChanges();
    const overlay = overlayContainer.getContainerElement();
    const cancelButton = Array.from(overlay.querySelectorAll('button'))
      .find(button => button.textContent?.trim() === 'Cancelar');
    expect(cancelButton).toBeTruthy();
    cancelButton?.click();
    await fixture.whenStable();
    expect(actionCount).toBe(0);

    component.mostrarConfirmacion('¿Eliminar usuario?', 'Confirmación de prueba.', () => actionCount++);
    fixture.detectChanges();
    const confirmButton = overlay.querySelector('button.confirm-action') as HTMLButtonElement | null;
    expect(confirmButton).toBeTruthy();
    confirmButton?.click();
    await fixture.whenStable();
    expect(actionCount).toBe(1);
  });
});
