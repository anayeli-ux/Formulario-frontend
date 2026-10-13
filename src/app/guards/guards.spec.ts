/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    provideRouter,
    Router,
    RouterStateSnapshot,
    UrlTree
} from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { homeRedirectGuard } from './home-redirect.guard';
import { AuthService, UsuarioSesion } from '../services/auth.service';
import { routes } from '../app.routes';

describe('route guards', () => {
    let session$: Observable<UsuarioSesion | null>;
    let router: Router;

    beforeEach(() => {
        session$ = of(null);
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: { obtenerSesion: () => session$ } }
            ]
        });
        router = TestBed.inject(Router);
    });

    async function runGuard(guard: CanActivateFn): Promise<boolean | UrlTree> {
        const result = TestBed.runInInjectionContext(() =>
            guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
        );
        return firstValueFrom(result as Observable<boolean | UrlTree>);
    }

    function route(result: boolean | UrlTree): boolean | string {
        return result instanceof UrlTree ? router.serializeUrl(result) : result;
    }

    it('sends unauthenticated users to login on protected routes', async () => {
        expect(route(await runGuard(authGuard))).toBe('/login');
    });

    it('recognizes the numeric admin role on the admin route', async () => {
        session$ = of({ id: 1, email: 'admin@example.com', rol: '2' });

        expect(await runGuard(adminGuard)).toBeTrue();
    });

    it('keeps the existing redirect for a missing session on the admin route', async () => {
        expect(route(await runGuard(adminGuard))).toBe('/usuario');
    });

    it('redirects regular users away from the admin route', async () => {
        session$ = of({ id: 2, email: 'user@example.com', rol: 'USER' });

        expect(route(await runGuard(adminGuard))).toBe('/usuario');
    });

    it('allows guest access if session verification fails', async () => {
        session$ = throwError(() => new Error('Session lookup failed'));

        expect(await runGuard(guestGuard)).toBeTrue();
    });

    it('allows an administrator to open guest routes', async () => {
        session$ = of({ id: 1, email: 'admin@example.com', rol: '2' });

        expect(await runGuard(guestGuard)).toBeTrue();
    });

    it('sends unknown paths through the role-aware root route', () => {
        expect(routes.find(route => route.path === '**')?.redirectTo).toBe('');
    });

    it('redirects visitors from the home route to login', async () => {
        expect(route(await runGuard(homeRedirectGuard))).toBe('/login');
    });

    it('redirects users from the home route to their profile', async () => {
        session$ = of({ id: 2, email: 'user@example.com', rol: 'USER' });

        expect(route(await runGuard(homeRedirectGuard))).toBe('/usuario');
    });

    it('redirects administrators from the home route to admin', async () => {
        session$ = of({ id: 1, email: 'admin@example.com', rol: 'ADMIN' });

        expect(route(await runGuard(homeRedirectGuard))).toBe('/admin');
    });
});