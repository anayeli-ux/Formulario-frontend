import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }]
    });

    service = TestBed.inject(AuthService);
    service.limpiarSesionLocal();
  });

  it('should report no active session when no user is cached in memory', () => {
    expect(service.haySesion()).toBeFalse();
  });

  it('should report active session when the backend has already validated the user', () => {
    service['usuarioActual'] = { id: 1, email: 'admin@test.com', rol: 'ADMIN' };

    expect(service.haySesion()).toBeTrue();
  });
});