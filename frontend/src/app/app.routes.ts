import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { consultaPasoGuard } from './core/guards/consulta-paso.guard';
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
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'destino'
      },
      {
        path: 'destino',
        loadComponent: () =>
          import('./features/consulta/destino/destino.component').then((m) => m.DestinoComponent)
      },
      {
        path: 'presupuesto',
        canActivate: [consultaPasoGuard],
        loadComponent: () =>
          import('./features/consulta/presupuesto/presupuesto.component').then((m) => m.PresupuestoComponent)
      },
      {
        path: 'resultado',
        canActivate: [consultaPasoGuard],
        loadComponent: () =>
          import('./features/consulta/resultado/resultado.component').then((m) => m.ResultadoComponent)
      }
    ]
  },
  {
    path: 'historial',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/historial/historial.component').then((m) => m.HistorialComponent)
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/no-encontrado/no-encontrado.component').then((m) => m.NoEncontradoComponent)
  }
];
