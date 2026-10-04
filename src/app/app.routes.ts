import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(module => module.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.component').then(module => module.RegistroComponent),
    canActivate: [guestGuard]
  },

  {
    path: 'exito',
    loadComponent: () => import('./pages/exito/exito').then(module => module.Exito),
    canActivate: [guestGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then(module => module.Admin),
    canActivate: [adminGuard]
  },
  {
    path: 'usuario',
    loadComponent: () => import('./pages/usuario-perfil/usuario-perfil.component').then(module => module.UsuarioPerfilComponent),
    canActivate: [authGuard]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];