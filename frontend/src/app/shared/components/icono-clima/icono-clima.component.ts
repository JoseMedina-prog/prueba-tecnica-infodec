import { Component, computed, input } from '@angular/core';

export type TipoIconoClima =
  | 'sol'
  | 'luna'
  | 'sol-nube'
  | 'luna-nube'
  | 'nube'
  | 'lluvia'
  | 'tormenta'
  | 'nieve'
  | 'niebla';

/**
 * Mapea el código de OpenWeather (01d, 02n, 10d, etc.) al tipo de icono SVG.
 */
export function mapearCodigoIcono(codigo: string | null | undefined): TipoIconoClima {
  if (!codigo) return 'nube';
  const prefijo = codigo.slice(0, 2);
  const esNoche = codigo.endsWith('n');

  switch (prefijo) {
    case '01':
      return esNoche ? 'luna' : 'sol';
    case '02':
      return esNoche ? 'luna-nube' : 'sol-nube';
    case '03':
    case '04':
      return 'nube';
    case '09':
    case '10':
      return 'lluvia';
    case '11':
      return 'tormenta';
    case '13':
      return 'nieve';
    case '50':
      return 'niebla';
    default:
      return 'nube';
  }
}

/**
 * Set de íconos del clima propios con trazo limpio en color tinta (currentColor).
 * Soporta variantes día/noche según OpenWeather.
 */
@Component({
  selector: 'app-icono-clima',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="tamanio()"
      [attr.height]="tamanio()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="icono-clima-svg"
    >
      @switch (tipo()) {
        @case ('sol') {
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
          <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
        }
        @case ('luna') {
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        }
        @case ('sol-nube') {
          <path d="M12 2v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M20 12h2" />
          <path d="M19.07 4.93l-1.41 1.41" />
          <path d="M15.5 8.5a4 4 0 0 0-5.8 1.4" />
          <path d="M17.5 19H9a5 5 0 0 1-.8-9.93 6 6 0 0 1 10.6 2.43A4 4 0 0 1 17.5 19z" />
        }
        @case ('luna-nube') {
          <path d="M11 4a5 5 0 0 1 5 5 5 5 0 0 1-.5 2.2" />
          <path d="M17.5 19H9a5 5 0 0 1-.8-9.93 6 6 0 0 1 10.6 2.43A4 4 0 0 1 17.5 19z" />
        }
        @case ('nube') {
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        }
        @case ('lluvia') {
          <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
          <line x1="8" y1="14" x2="8" y2="20" />
          <line x1="12" y1="16" x2="12" y2="22" />
          <line x1="16" y1="14" x2="16" y2="20" />
        }
        @case ('tormenta') {
          <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
          <polyline points="13 11 9 17 15 17 11 23" />
        }
        @case ('nieve') {
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
          <line x1="8" y1="15" x2="8.01" y2="15" />
          <line x1="8" y1="19" x2="8.01" y2="19" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
          <line x1="12" y1="21" x2="12.01" y2="21" />
          <line x1="16" y1="15" x2="16.01" y2="15" />
          <line x1="16" y1="19" x2="16.01" y2="19" />
        }
        @case ('niebla') {
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="6" y1="10" x2="18" y2="10" />
          <line x1="3" y1="14" x2="21" y2="14" />
          <line x1="6" y1="18" x2="18" y2="18" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      vertical-align: middle;
    }
    .icono-clima-svg {
      display: block;
      flex-shrink: 0;
    }
  `
})
export class IconoClimaComponent {
  readonly icono = input<string | null | undefined>();
  readonly tamanio = input<number>(26);

  readonly tipo = computed(() => mapearCodigoIcono(this.icono()));
}
