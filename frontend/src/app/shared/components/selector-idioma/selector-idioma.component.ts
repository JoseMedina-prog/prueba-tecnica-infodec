import { Component, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IdiomaService } from '../../../core/services/idioma.service';

/**
 * Interruptor ES / DE: un solo botón; un clic en cualquier parte de la pastilla cambia al otro idioma.
 * El resaltado se desliza hacia el idioma activo. Las etiquetas visibles van con aria-hidden y el
 * aria-label (del archivo del idioma activo) dice el idioma actual y la acción.
 */
@Component({
  selector: 'app-selector-idioma',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="selector"
      [class.claro]="tono() === 'claro'"
      [class.en-de]="idiomaActual() === 'de'"
      [attr.aria-label]="'NAVBAR.IDIOMA_ALTERNAR' | translate"
      (click)="alternar()"
    >
      <span class="resaltado" aria-hidden="true"></span>
      <span class="opcion" [class.activo]="idiomaActual() === 'es'" aria-hidden="true">ES</span>
      <span class="opcion" [class.activo]="idiomaActual() === 'de'" aria-hidden="true">DE</span>
    </button>
  `,
  styles: `
    .selector {
      position: relative;
      display: inline-flex;
      padding: 2px;
      border: 1px solid var(--muted-on-ink);
      border-radius: 999px;
      background: transparent;
      cursor: pointer;
    }
    /* Área táctil de al menos 44 px de alto sin cambiar el tamaño visible de la pastilla */
    .selector::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: max(100%, 44px);
      transform: translateY(-50%);
    }
    .resaltado {
      position: absolute;
      top: 2px;
      bottom: 2px;
      left: 2px;
      width: calc(50% - 2px);
      border-radius: 999px;
      background: var(--paper);
      transition: transform 200ms ease;
    }
    .selector.en-de .resaltado {
      transform: translateX(100%);
    }
    .opcion {
      position: relative;
      min-width: 2.6rem;
      padding: 0.2rem 0.6rem;
      color: var(--muted-on-ink);
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 600;
      text-align: center;
      transition: color 200ms ease;
    }
    .opcion.activo {
      color: var(--ink);
    }
    .selector:focus-visible {
      outline: 2px solid var(--accent-on-ink);
      outline-offset: 2px;
    }
    .claro {
      border: 1.5px solid var(--ink);
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(27, 42, 65, 0.04);
    }
    .claro .resaltado {
      background: var(--ink);
    }
    .claro .opcion {
      color: var(--muted);
    }
    .claro .opcion.activo {
      color: var(--paper);
    }
    .claro:focus-visible {
      outline-color: var(--accent);
    }
    @media (prefers-reduced-motion: reduce) {
      .resaltado,
      .opcion {
        transition: none;
      }
    }
  `
})
export class SelectorIdiomaComponent {
  private readonly idiomaService = inject(IdiomaService);
  readonly tono = input<'tinta' | 'claro'>('tinta');
  readonly idiomaActual = this.idiomaService.idiomaActual;

  /** ES → DE y DE → ES; la lógica del cambio sigue en IdiomaService. */
  alternar(): void {
    this.idiomaService.cambiarIdioma(this.idiomaActual() === 'es' ? 'de' : 'es');
  }
}
