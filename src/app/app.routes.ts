import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { Exito } from './pages/exito/exito';
import { Admin } from './pages/admin/admin';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { UsuarioPerfilComponent } from './pages/usuario-perfil/usuario-perfil.component';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'registro', component: RegistroComponent, canActivate: [guestGuard] },

  { path: 'exito', component: Exito, canActivate: [guestGuard] },
  {
    path: 'admin',
    component: Admin,
    canActivate: [adminGuard]
  },
  {
    path: 'usuario',
    component: UsuarioPerfilComponent,
    canActivate: [authGuard]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];