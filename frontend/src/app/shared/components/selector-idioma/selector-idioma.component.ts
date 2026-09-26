import { Component, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IdiomaApp, IdiomaService } from '../../../core/services/idioma.service';

/** Interruptor segmentado ES / DE. */
@Component({
  selector: 'app-selector-idioma',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="selector" [class.claro]="tono() === 'claro'" role="group" [attr.aria-label]="'NAVBAR.IDIOMA' | translate">
      @for (lang of idiomas; track lang) {
        <button
          type="button"
          [class.activo]="idiomaService.idiomaActual() === lang"
          [attr.aria-pressed]="idiomaService.idiomaActual() === lang"
          (click)="idiomaService.cambiarIdioma(lang)"
        >
          {{ lang.toUpperCase() }}
        </button>
      }
    </div>
  `,
  styles: `
    .selector {
      display: inline-flex;
      padding: 2px;
      border: 1px solid var(--muted-on-ink);
      border-radius: 999px;
    }
    button {
      min-width: 2.6rem;
      padding: 0.2rem 0.6rem;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--muted-on-ink);
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 600;
    }
    button.activo {
      background: var(--paper);
      color: var(--ink);
    }
    button:focus-visible {
      outline: 2px solid var(--accent-on-ink);
      outline-offset: 2px;
    }
    .claro {
      border: 1.5px solid var(--ink);
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(27, 42, 65, 0.04);
    }
    .claro button {
      color: var(--muted);
    }
    .claro button.activo {
      background: var(--ink);
      color: var(--paper);
    }
    .claro button:focus-visible {
      outline-color: var(--accent);
    }
  `
})
export class SelectorIdiomaComponent {
  readonly idiomaService = inject(IdiomaService);
  readonly tono = input<'tinta' | 'claro'>('tinta');
  readonly idiomas: readonly IdiomaApp[] = ['es', 'de'];
}
