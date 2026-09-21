import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { Exito } from './pages/exito/exito';
import { Admin } from './pages/admin/admin';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { UsuarioPerfilComponent } from './pages/usuario-perfil/usuario-perfil.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },

  { path: 'exito', component: Exito },
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