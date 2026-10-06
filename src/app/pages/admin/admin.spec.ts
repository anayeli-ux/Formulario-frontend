import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Admin } from './admin';
import { UsuariosTablaComponent } from '../../components/usuarios-tabla/usuarios-tabla.component';
import { environment } from '../../../environments/environment';
import { Usuario, UsuarioResumen } from '../../models/usuario.model';

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;
  let httpTesting: HttpTestingController;
  let overlayContainer: OverlayContainer;

  const resumen = (id: number, cambios: Partial<UsuarioResumen> = {}): UsuarioResumen => ({
    id,
    nombre: 'Ana',
    primerApellido: 'Perez',
    rol: 'USER',
    telefono: null,
    correo: null,
    codigoPostal: null,
    ...cambios
  });
  const pagina = <T>(content: T[], totalPages = content.length ? 1 : 0) => ({
    content,
    totalPages
  });

  function responderAdministradores(eliminados = false, content: UsuarioResumen[] = []): void {
    const request = httpTesting.expectOne(item =>
      item.url === `${environment.apiUrl}/usuarios/administradores`
      && item.params.get('eliminados') === String(eliminados)
    );
    expect(request.request.params.get('size')).toBe('5');
    request.flush(pagina(content));
  }

  function responderLista(url: string, content: UsuarioResumen[] = []): void {
    httpTesting.expectOne(request => request.method === 'GET' && request.url === url)
      .flush(pagina(content));
    responderAdministradores(url.endsWith('/eliminados'));
  }

  function responderCsrf(): void {
    httpTesting.expectOne(`${environment.apiUrl}/auth/csrf`).flush(null);
  }

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
    responderLista(`${environment.apiUrl}/usuarios`);
    expect(component).toBeTruthy();
  });

  it('reloads only the selected list when switching views', () => {
    fixture.detectChanges();
    responderLista(`${environment.apiUrl}/usuarios`);

    component.cambiarVista('eliminados');
    responderLista(`${environment.apiUrl}/usuarios/eliminados`);
    component.cambiarVista('activos');
    responderLista(`${environment.apiUrl}/usuarios`);
    component.cambiarVista('eliminados');
    responderLista(`${environment.apiUrl}/usuarios/eliminados`);
    expect(component.vistaActual()).toBe('eliminados');
  });

  it('keeps numeric role ID 2 out of the regular users table', () => {
    fixture.detectChanges();
    responderLista(`${environment.apiUrl}/usuarios`, [
      resumen(1, { nombre: 'Usuario', rol: 1 }),
      resumen(2, { nombre: 'Administrador', rol: 2 })
    ]);

    expect(component.usuariosFiltrados().map(usuario => usuario.id)).toEqual([1]);
  });

  it('places an administrator from the current page in the separate side table', () => {
    fixture.detectChanges();
    responderLista(`${environment.apiUrl}/usuarios`, [
      resumen(1, { rol: 1, nombre: 'Usuario' }),
      resumen(7, { rol: 2, nombre: 'Admin', correo: 'adm@gmail.com' })
    ]);

    expect(component.usuariosFiltrados().map(usuario => usuario.id)).toEqual([1]);
    expect(component.administradores()).toEqual([{
      id: 7,
      nombre: 'Admin',
      primerApellido: 'Perez',
      correo: 'adm@gmail.com'
    }]);
    expect(component.totalPaginasAdministradores()).toBe(1);
  });

  it('keeps the total page count while loading another page', () => {
    fixture.detectChanges();
    const firstPageRequest = httpTesting.expectOne(request =>
      request.url === `${environment.apiUrl}/usuarios`
      && request.params.get('page') === '0'
    );
    expect(firstPageRequest.request.params.get('size')).toBe('5');
    firstPageRequest.flush(pagina([1, 2, 3, 4, 5].map(id => resumen(id)), 3));
    responderAdministradores();

    expect(component.totalPaginasActivos()).toBe(3);
    component.cambiarPagina({ pageIndex: 1, pageSize: 5, length: 15 }, 'activos');

    expect(component.paginaIndexActivos()).toBe(1);
    expect(component.totalPaginasActivos()).toBe(3);
    const secondPageRequest = httpTesting.expectOne(request =>
      request.url === `${environment.apiUrl}/usuarios`
      && request.params.get('page') === '1'
    );
    expect(secondPageRequest.request.params.get('size')).toBe('5');
    secondPageRequest.flush(pagina([6, 7, 8, 9, 10].map(id => resumen(id)), 3));

    expect(component.paginaIndexActivos()).toBe(1);
    expect(component.usuariosFiltrados().map(usuario => usuario.id)).toEqual([6, 7, 8, 9, 10]);
    expect(component.totalPaginasActivos()).toBe(3);
  });

  it('ignores an older page response that arrives after a newer request', () => {
    fixture.detectChanges();
    const initial = httpTesting.expectOne(request =>
      request.url === `${environment.apiUrl}/usuarios`
      && request.params.get('page') === '0'
    );
    initial.flush(pagina([1, 2, 3, 4, 5].map(id => resumen(id)), 4));
    responderAdministradores();

    component.cambiarPagina({ pageIndex: 1, pageSize: 5, length: 20 }, 'activos');
    const pageOne = httpTesting.expectOne(request =>
      request.url === `${environment.apiUrl}/usuarios`
      && request.params.get('page') === '1'
    );
    component.cambiarPagina({ pageIndex: 2, pageSize: 5, length: 20 }, 'activos');
    const pageTwo = httpTesting.expectOne(request =>
      request.url === `${environment.apiUrl}/usuarios`
      && request.params.get('page') === '2'
    );

    pageTwo.flush(pagina([11, 12, 13, 14, 15].map(id => resumen(id)), 4));
    pageOne.flush(pagina([6, 7, 8, 9, 10].map(id => resumen(id)), 4));

    expect(component.paginaIndexActivos()).toBe(2);
    expect(component.usuariosFiltrados().map(usuario => usuario.id)).toEqual([11, 12, 13, 14, 15]);
    expect(component.totalPaginasActivos()).toBe(4);
  });

  it('shows page count instead of record ranges in the paginator label', () => {
    const paginatorIntl = fixture.debugElement.injector.get(MatPaginatorIntl);

    expect(paginatorIntl.getRangeLabel(0, 5, 15)).toBe('Página 1 de 3');
    expect(paginatorIntl.getRangeLabel(2, 5, 15)).toBe('Página 3 de 3');
    expect(paginatorIntl.getRangeLabel(0, 5, 0)).toBe('Página 0 de 0');
  });

  it('uses the backend conflict response when a new user email already exists', () => {
    fixture.detectChanges();
    responderLista(`${environment.apiUrl}/usuarios`);

    component.abrirCrearUsuario();
    component.usuarioForm.patchValue({
      datosPersonales: {
        nombre: 'Luis',
        primer_apellido: 'Lopez',
        fecha_nacimiento: '1990-01-01',
        email: 'ANA@example.com',
        password: 'ValidPass!1'
      },
      datosContacto: {
        telefono: '4445556666',
        codigo_postal: '12345',
        direccion: 'Calle 1'
      }
    });

    component.crearUsuario();
    responderCsrf();
    const post = httpTesting.expectOne(request => request.method === 'POST' && request.url === `${environment.apiUrl}/usuarios`);
    post.flush({ message: 'Correo duplicado' }, { status: 409, statusText: 'Conflict' });

    expect(component.modalMensajeVisible()).toBeTrue();
    expect(component.modalTitulo()).toBe('Datos de contacto duplicados');
    expect(component.modalMensaje()).toContain('Correo duplicado');
  });

  it('uses the backend conflict response when a new user phone already exists', () => {
    fixture.detectChanges();
    responderLista(`${environment.apiUrl}/usuarios`);

    component.abrirCrearUsuario();
    component.usuarioForm.patchValue({
      datosPersonales: {
        nombre: 'Luis',
        primer_apellido: 'Lopez',
        fecha_nacimiento: '1990-01-01',
        email: 'luis@example.com',
        password: 'ValidPass!1'
      },
      datosContacto: {
        telefono: '1112223333',
        codigo_postal: '12345',
        direccion: 'Calle 1'
      }
    });

    component.crearUsuario();
    responderCsrf();
    const post = httpTesting.expectOne(request => request.method === 'POST' && request.url === `${environment.apiUrl}/usuarios`);
    post.flush({ message: 'Teléfono duplicado' }, { status: 409, statusText: 'Conflict' });

    expect(component.modalMensajeVisible()).toBeTrue();
    expect(component.modalTitulo()).toBe('Datos de contacto duplicados');
    expect(component.modalMensaje()).toContain('Teléfono duplicado');
  });

  it('marks both primary and additional fields when contacts repeat in the form', () => {
    fixture.detectChanges();
    responderLista(`${environment.apiUrl}/usuarios`);

    component.abrirCrearUsuario();
    component.usuarioForm.patchValue({
      datosPersonales: {
        nombre: 'Luis',
        primer_apellido: 'Lopez',
        fecha_nacimiento: '1990-01-01',
        email: 'luis@example.com',
        password: 'ValidPass!1'
      },
      datosContacto: {
        telefono: '4445556666',
        codigo_postal: '12345',
        direccion: 'Calle 1'
      }
    });
    (component.usuarioForm.get('datosContacto.telefonos') as FormArray).push(new FormGroup({
      tipo: new FormControl('Trabajo', Validators.required),
      valor: new FormControl('4445556666', [Validators.required, Validators.pattern(/^\d{10}$/)])
    }));
    (component.usuarioForm.get('datosContacto.correos') as FormArray).push(new FormGroup({
      tipo: new FormControl('Trabajo', Validators.required),
      valor: new FormControl('luis@example.com', [Validators.required, Validators.email, Validators.maxLength(150)])
    }));

    component.crearUsuario();
    fixture.detectChanges();

    expect(component.usuarioForm.get('datosPersonales.email')?.getError('duplicadoContacto'))
      .toContain('Se repite en este formulario.');
    expect(component.usuarioForm.get('datosContacto.telefono')?.getError('duplicadoContacto'))
      .toContain('Se repite en este formulario.');
    expect(fixture.nativeElement.querySelector('#email').classList.contains('ng-invalid')).toBeTrue();
    expect(fixture.nativeElement.querySelector('#email').classList.contains('ng-touched')).toBeTrue();
    expect(fixture.nativeElement.querySelector('#telefono').classList.contains('ng-invalid')).toBeTrue();
    expect(fixture.nativeElement.querySelector('#telefono').classList.contains('ng-touched')).toBeTrue();
    httpTesting.expectNone(`${environment.apiUrl}/usuarios`, 'No debe enviar el alta con contactos repetidos.');
  });

  it('checks duplicate contacts while editing but ignores the current user', () => {
    const usuario: Usuario = {
      id: 1,
      nombre: 'Ana',
      primerApellido: 'Perez',
      fechaNacimiento: '1990-01-01',
      estado: 'Hidalgo',
      municipio: 'Pachuca',
      telefonos: [{ tipo: 'PRINCIPAL', valor: '1112223333' }],
      correos: [{ tipo: 'PRINCIPAL', valor: 'ana@example.com' }],
      direcciones: [{ tipo: 'PRINCIPAL', valor: 'Calle 1', codigoPostal: '42000' }]
    };

    fixture.detectChanges();
    responderLista(`${environment.apiUrl}/usuarios`, [resumen(1), resumen(2, { nombre: 'Luis' })]);

    component.editarUsuario(resumen(1));
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/1`).flush(usuario);
    component.usuarioForm.get('datosContacto.telefono')?.setValue('4445556666');
    component.actualizarUsuario();
    responderCsrf();
    httpTesting.expectOne(`${environment.apiUrl}/usuarios/1`).flush(
      { message: 'Teléfono duplicado' }, { status: 409, statusText: 'Conflict' }
    );

    expect(component.modalMensajeVisible()).toBeTrue();
    expect(component.modalMensaje()).toContain('Teléfono duplicado');
    expect(component.usuarioForm.get('datosPersonales.email')?.getError('duplicadoContacto')).toBeNull();
  });

  it('renders the server-provided postal code even while its column is hidden', () => {
    fixture.detectChanges();
    const usuario = resumen(21, { nombre: 'Ana', primerApellido: 'Lopez', codigoPostal: '42000' });
    responderLista(`${environment.apiUrl}/usuarios`, [usuario]);
    fixture.detectChanges();

    const tabla = fixture.debugElement.query(By.directive(UsuariosTablaComponent)).componentInstance as UsuariosTablaComponent;
    expect(tabla.columnasVisibles).not.toContain('codigoPostal');

    expect(tabla.columnasVisibles).not.toContain('codigoPostal');
    expect(component.usuariosFiltrados()).toEqual([usuario]);
    expect(tabla.usuarios).toEqual([usuario]);
  });

  it('runs a destructive action only after the dialog is confirmed', async () => {
    fixture.detectChanges();
    responderLista(`${environment.apiUrl}/usuarios`);
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
