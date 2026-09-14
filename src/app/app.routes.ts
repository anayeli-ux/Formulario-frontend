import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { Exito } from './exito/exito'; // <--- Importamos la clase Exito desde ./exito/exito
import { authGuard } from './guards/auth.guard';
import { Admin } from './admin/admin';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },

  { 
    path: 'exito', 
    component: Exito, 
    canActivate: [authGuard] 
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [adminGuard]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];