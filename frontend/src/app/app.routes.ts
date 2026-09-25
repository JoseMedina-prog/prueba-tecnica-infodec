import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { invitadoGuard } from './core/guards/invitado.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'consulta'
  },
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    loadComponent: () =>
      import('./features/auth/registro/registro.component').then((m) => m.RegistroComponent)
  },
  {
    path: 'consulta',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/consulta/consulta.component').then((m) => m.ConsultaComponent)
  },
  {
    path: 'historial',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/consulta/consulta.component').then((m) => m.ConsultaComponent)
  },
  {
    path: '**',
    redirectTo: 'consulta'
  }
];
