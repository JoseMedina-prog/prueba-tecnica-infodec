import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-pasos-indicador',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <ol class="pasos list-unstyled d-flex mb-4">
      @for (paso of pasos; track paso.numero) {
        <li
          class="paso flex-fill text-center"
          [class.completado]="paso.numero < pasoActual()"
          [class.actual]="paso.numero === pasoActual()"
          [attr.aria-current]="paso.numero === pasoActual() ? 'step' : null"
        >
          <span class="paso-circulo">{{ paso.numero < pasoActual() ? '✓' : paso.numero }}</span>
          <span class="paso-texto small d-block mt-1">{{ paso.clave | translate }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .paso {
      position: relative;
      color: var(--bs-secondary-color);
    }
    .paso:not(:first-child)::before {
      content: '';
      position: absolute;
      top: 1rem;
      right: 50%;
      width: 100%;
      height: 2px;
      background: var(--bs-border-color);
      z-index: 0;
    }
    .paso.actual::before,
    .paso.completado::before {
      background: var(--bs-primary);
    }
    .paso-circulo {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      font-weight: 600;
      background: var(--bs-body-bg);
      border: 2px solid var(--bs-border-color);
    }
    .paso.completado .paso-circulo,
    .paso.actual .paso-circulo {
      background: var(--bs-primary);
      border-color: var(--bs-primary);
      color: #fff;
    }
    .paso.actual .paso-texto {
      color: var(--bs-primary);
      font-weight: 600;
    }
    .paso.completado .paso-texto {
      color: var(--bs-body-color);
    }
  `
})
export class PasosIndicadorComponent {
  readonly pasoActual = input.required<1 | 2 | 3>();

  readonly pasos = [
    { numero: 1, clave: 'PASOS.DESTINO' },
    { numero: 2, clave: 'PASOS.PRESUPUESTO' },
    { numero: 3, clave: 'PASOS.RESULTADO' }
  ] as const;
}
