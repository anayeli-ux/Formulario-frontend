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
    localStorage.clear();
  });

  it('should not accept a forged admin flag as a valid session', () => {
    localStorage.setItem('adminSesion', 'true');

    expect(service.haySesion()).toBeFalse();
  });

  it('should accept a real session only when a valid token exists', () => {
    localStorage.setItem('token', 'abc123');

    expect(service.haySesion()).toBeTrue();
  });
});