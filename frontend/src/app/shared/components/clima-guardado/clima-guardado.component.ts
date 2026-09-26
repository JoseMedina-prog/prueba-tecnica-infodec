import { Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IdiomaService } from '../../../core/services/idioma.service';
import { formatearMomentoGuardado } from '../../../core/utils/formato';

/**
 * Nota discreta bajo el clima cuando no es de ahora mismo (se usó el último guardado porque la API falló):
 * "Clima guardado · hoy 18:05" o "Clima guardado · 25 SEP 18:05".
 */
@Component({
  selector: 'app-clima-guardado',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (momento(); as m) {
      <span class="clima-guardado">
        @if (m.esHoy) {
          {{ 'RESULTADO.CLIMA_GUARDADO_HOY' | translate: { hora: m.hora } }}
        } @else {
          {{ 'RESULTADO.CLIMA_GUARDADO_FECHA' | translate: { fecha: m.fecha, hora: m.hora } }}
        }
      </span>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .clima-guardado {
      display: block;
      margin-top: 0.2rem;
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--muted);
    }
  `
})
export class ClimaGuardadoComponent {
  private readonly idioma = inject(IdiomaService).idiomaActual;

  /** Fecha ISO de cuándo se obtuvo el clima (clima.obtenido_en). */
  readonly obtenidoEn = input.required<string | null | undefined>();

  readonly momento = computed(() => formatearMomentoGuardado(this.obtenidoEn(), this.idioma()));
}
