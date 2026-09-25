import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ConsultaStateService } from '../services/consulta-state.service';

export const consultaPasoGuard: CanActivateFn = (route) => {
  const consultaState = inject(ConsultaStateService);
  const router = inject(Router);

  const path = route.routeConfig?.path;

  if (path === 'presupuesto') {
    if (!consultaState.pais() || !consultaState.ciudad()) {
      return router.createUrlTree(['/consulta/destino']);
    }
  }

  if (path === 'resultado') {
    if (!consultaState.resultado()) {
      return router.createUrlTree(['/consulta/destino']);
    }
  }

  return true;
};
