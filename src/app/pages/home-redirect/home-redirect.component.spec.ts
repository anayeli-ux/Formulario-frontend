import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthService, UsuarioSesion } from '../../services/auth.service';
import { homeRedirectGuard } from '../../guards/home-redirect.guard';

describe('HomeRedirectComponent', () => {
  let sesion: UsuarioSesion | null;
  let router: Router;

  beforeEach(() => {
    sesion = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { obtenerSesion: () => of(sesion) } }
      ]
    });
    router = TestBed.inject(Router);
  });

  async function resolveHome(): Promise<UrlTree> {
    const result = TestBed.runInInjectionContext(() =>
      homeRedirectGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    return firstValueFrom(result as Observable<UrlTree>);
  }

  it('routes a logged-in administrator to /admin', async () => {
    sesion = { id: 1, email: 'admin@example.com', rol: 'ADMIN' };

    expect(router.serializeUrl(await resolveHome())).toBe('/admin');
  });

  it('routes a logged-in user to /usuario', async () => {
    sesion = { id: 2, email: 'user@example.com', rol: 'USER' };

    expect(router.serializeUrl(await resolveHome())).toBe('/usuario');
  });

  it('routes a visitor without a session to /login', async () => {
    expect(router.serializeUrl(await resolveHome())).toBe('/login');
  });
});