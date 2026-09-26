import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Indicador de pasos como una ruta de vuelo: puntos unidos por línea punteada y un avión en el paso actual. */
@Component({
  selector: 'app-pasos-indicador',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <ol class="ruta" [attr.aria-label]="'PASOS.ARIA' | translate">
      @for (paso of pasos; track paso.numero) {
        <li
          class="parada"
          [class.hecho]="paso.numero < pasoActual()"
          [class.actual]="paso.numero === pasoActual()"
          [attr.aria-current]="paso.numero === pasoActual() ? 'step' : null"
        >
          <span class="marca" aria-hidden="true">
            @if (paso.numero === pasoActual()) {
              <svg width="26" height="26" viewBox="0 0 24 24" focusable="false">
                <path
                  d="M21 12c0-.8-.7-1.3-1.5-1.3H14L9.5 4H7.5l2.5 6.7H5.5L4 8.5H2.5l1 3.5-1 3.5H4l1.5-2.2h4.5L7.5 20h2l4.5-6.7h5.5c.8 0 1.5-.5 1.5-1.3z"
                  fill="currentColor"
                />
              </svg>
            }
          </span>
          <span class="nombre">
            <span class="mono numero">{{ '0' + paso.numero }}</span>
            {{ paso.clave | translate }}
          </span>
        </li>
      }
    </ol>
  `,
  styles: `
    .ruta {
      display: flex;
      margin: 0 0 2rem;
      padding: 0;
      list-style: none;
    }
    .parada {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--muted);
    }
    /* Tramo punteado hasta la parada anterior */
    .parada + .parada::before {
      content: '';
      position: absolute;
      top: 0.8rem;
      right: 50%;
      width: 100%;
      border-top: 2px dashed var(--line-strong);
    }
    .parada.hecho::before,
    .parada.actual::before {
      border-top-color: var(--accent-vivid);
    }
    .marca {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      width: 1.6rem;
      height: 1.6rem;
    }
    .marca::after {
      content: '';
      width: 0.7rem;
      height: 0.7rem;
      border-radius: 50%;
      border: 2px solid var(--line-strong);
      background: var(--paper);
    }
    .hecho .marca::after {
      border-color: var(--accent);
      background: var(--accent);
    }
    .actual .marca {
      color: var(--accent);
      background: var(--paper);
    }
    .actual .marca::after {
      display: none;
    }
    .nombre {
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-align: center;
    }
    .numero {
      margin-right: 0.2rem;
      font-weight: 500;
    }
    .actual .nombre {
      color: var(--ink);
    }
    @media (max-width: 575.98px) {
      .nombre {
        font-size: 0.68rem;
        letter-spacing: 0.04em;
      }
      .numero {
        display: none;
      }
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
