import { Routes } from '@angular/router';

import { InicioComponent } from './inicio/inicio';
import { Registro } from './registro/registro';
import { Admin } from './admin/admin';
import { Exito } from './exito/exito';

export const routes: Routes = [
  {
    path: '',
    component: InicioComponent
  },
  {
    path: 'registro',
    component: Registro
  },
  {
    path: 'admin',
    component: Admin
  },
  {
    path: 'exito',
    component: Exito
  },
  {
    path: '**',
    redirectTo: ''
  }
];