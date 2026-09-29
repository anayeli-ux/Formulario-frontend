import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Admin } from './admin';
import { environment } from '../../../environments/environment';

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Admin, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
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
});
