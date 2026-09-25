import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-consulta',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8">
          <div class="card shadow-sm border-0 rounded-4 p-4 p-md-5 text-center">
            <div class="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-3 mx-auto" style="width: 64px; height: 64px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
              </svg>
            </div>
            <h1 class="h3 fw-bold mb-2">
              {{ 'CONSULTA.HOLA' | translate }} {{ authService.usuario()?.nombre || 'Viajero' }}!
            </h1>
            <p class="text-secondary mb-4">
              {{ 'CONSULTA.BIENVENIDO' | translate }}
            </p>
            <div class="alert alert-info border-0 rounded-3 text-start small">
              <strong>Paso 13A Completado:</strong> {{ 'CONSULTA.TEMPORAL_DESC' | translate }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConsultaComponent {
  readonly authService = inject(AuthService);
}
