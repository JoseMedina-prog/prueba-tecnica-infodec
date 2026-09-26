import { Component, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Botón para mostrar u ocultar una contraseña ubicado dentro del campo de entrada.
 * Provee accesibilidad completa con type="button", aria-pressed, aria-controls y aria-label dinámico.
 */
@Component({
  selector: 'app-boton-ver-password',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="boton-ojo"
      [class.activo]="visible()"
      [attr.aria-pressed]="visible()"
      [attr.aria-controls]="campoId()"
      [attr.aria-label]="(visible() ? 'AUTH.OCULTAR_PASSWORD' : 'AUTH.MOSTRAR_PASSWORD') | translate"
      [title]="(visible() ? 'AUTH.OCULTAR_PASSWORD' : 'AUTH.MOSTRAR_PASSWORD') | translate"
      (click)="alternar()"
    >
      @if (!visible()) {
        <svg
          class="icono-ojo"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      } @else {
        <svg
          class="icono-ojo"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      }
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .boton-ojo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      transition: background-color 150ms ease, color 150ms ease;
    }
    .boton-ojo:hover {
      background: color-mix(in srgb, var(--ink) 6%, transparent);
      color: var(--ink);
    }
    .boton-ojo.activo,
    .boton-ojo[aria-pressed='true'] {
      color: var(--ink);
    }
    .boton-ojo:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  `
})
export class BotonVerPasswordComponent {
  /** True cuando la contraseña se está mostrando en texto plano. */
  readonly visible = model(false);
  /** Id del campo que controla este botón (para aria-controls). */
  readonly campoId = input<string>();

  alternar(): void {
    this.visible.set(!this.visible());
  }
}
