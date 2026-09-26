import { Component, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Botón para mostrar u ocultar una contraseña. Va dentro de un .input-group, a la derecha del campo:
 * `<app-boton-ver-password [(visible)]="mostrarPassword" />` y el input usa `[type]="mostrarPassword() ? 'text' : 'password'"`.
 */
@Component({
  selector: 'app-boton-ver-password',
  standalone: true,
  imports: [TranslatePipe],
  host: { class: 'd-flex' },
  template: `
    <button
      type="button"
      class="btn boton-ojo"
      [attr.aria-pressed]="visible()"
      [attr.aria-label]="'AUTH.MOSTRAR_PASSWORD' | translate"
      [title]="(visible() ? 'AUTH.OCULTAR_PASSWORD' : 'AUTH.MOSTRAR_PASSWORD') | translate"
      (click)="visible.set(!visible())"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        @if (visible()) {
          <path d="M4 4l16 16" />
        }
      </svg>
    </button>
  `,
  styles: `
    .boton-ojo {
      display: flex;
      align-items: center;
      padding: 0 0.8rem;
      color: var(--muted);
      background: var(--surface);
      border: 1px solid var(--line-strong);
      border-radius: 0 var(--radius) var(--radius) 0;
    }
    .boton-ojo:hover,
    .boton-ojo[aria-pressed='true'] {
      color: var(--ink);
    }
    .boton-ojo:focus-visible {
      position: relative;
      z-index: 5;
    }
  `
})
export class BotonVerPasswordComponent {
  /** True cuando la contraseña se está mostrando en texto plano. */
  readonly visible = model(false);
}
