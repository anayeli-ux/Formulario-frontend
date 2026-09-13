import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { Exito } from './exito/exito'; // <--- Importamos la clase Exito desde ./exito/exito
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  
  // Ruta de éxito protegida con el guard
  { 
    path: 'exito', 
    component: Exito, 
    canActivate: [authGuard] 
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];