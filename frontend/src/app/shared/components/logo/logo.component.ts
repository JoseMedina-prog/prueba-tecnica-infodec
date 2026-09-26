import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Logotipo de Pasabordo: un boleto con su perforación y un avión recortado, más el nombre. */
@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <span class="logo" [class.sobre-tinta]="sobre() === 'tinta'">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path class="boleto" d="M3 8h26v5.5a2.5 2.5 0 0 0 0 5V24H3v-5.5a2.5 2.5 0 0 0 0-5z" />
        <path
          class="avion"
          d="M21 12c0-.8-.7-1.3-1.5-1.3H14L9.5 4H7.5l2.5 6.7H5.5L4 8.5H2.5l1 3.5-1 3.5H4l1.5-2.2h4.5L7.5 20h2l4.5-6.7h5.5c.8 0 1.5-.5 1.5-1.3z"
          transform="translate(5.2 10.6) scale(0.45)"
        />
        <path class="perforacion" d="M22.5 9.5v13" stroke-width="2" stroke-dasharray="2 1.6" />
      </svg>
      <span class="nombre">{{ 'APP.TITLE' | translate }}</span>
    </span>
  `,
  styles: `
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      color: var(--ink);
      --logo-hueco: var(--surface);
      --logo-acento: var(--accent-vivid);
    }
    .logo.sobre-tinta {
      color: var(--paper);
      --logo-hueco: var(--ink);
      --logo-acento: var(--accent-on-ink);
    }
    .boleto {
      fill: currentColor;
    }
    .avion {
      fill: var(--logo-hueco);
    }
    .perforacion {
      stroke: var(--logo-acento);
      fill: none;
    }
    .nombre {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 0.01em;
    }
  `
})
export class LogoComponent {
  /** Fondo sobre el que se dibuja: define los colores del boleto. */
  readonly sobre = input<'tinta' | 'claro'>('claro');
}
