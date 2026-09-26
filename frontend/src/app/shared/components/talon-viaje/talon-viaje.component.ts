import { Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConsultaResultado } from '../../../core/models';
import { IdiomaService } from '../../../core/services/idioma.service';
import {
  climaAnteriorALaConsulta,
  formatearCop,
  formatearFechaTalon,
  formatearMonto,
  formatearTasaDirecta,
  formatearTasaInversa,
  localeDe
} from '../../../core/utils/formato';
import { CapitalizarPrimeraPipe } from '../../pipes/capitalizar-primera.pipe';
import { ClimaGuardadoComponent } from '../clima-guardado/clima-guardado.component';
import { IconoClimaComponent } from '../icono-clima/icono-clima.component';

/**
 * Talón de una consulta del historial: un pasabordo en miniatura.
 * Cuerpo a la izquierda y talón a la derecha desde 768px; en celular el talón queda abajo.
 * No navega por su cuenta: emite `repetir` con la consulta y el contenedor decide qué hacer.
 */
@Component({
  selector: 'app-talon-viaje',
  standalone: true,
  imports: [TranslatePipe, IconoClimaComponent, CapitalizarPrimeraPipe, ClimaGuardadoComponent],
  template: `
    @let item = consulta();
    <article class="boleto" [attr.aria-labelledby]="idTitulo()">
      <div class="cuerpo">
        <h2 class="visually-hidden" [id]="idTitulo()">
          {{ 'HISTORIAL.TALON_TITULO' | translate: { ciudad: item.ciudad.nombre, pais: item.pais.nombre, fecha: fecha() } }}
        </h2>

        <div class="cabecera">
          <p class="mono codigo" aria-hidden="true">{{ codigo() }}</p>
          @if (destacado()) {
            <span class="ultima">{{ 'HISTORIAL.ULTIMA_CONSULTA' | translate }}</span>
          }
        </div>
        <p class="lugar">{{ item.ciudad.nombre }} · {{ item.pais.nombre }}</p>

        <dl class="datos">
          <div class="dato dato-fecha">
            <dt class="etiqueta">{{ 'HISTORIAL.FECHA' | translate }}</dt>
            <dd class="mono fecha">{{ fecha() }}</dd>
          </div>
          <div class="dato">
            <dt class="etiqueta">{{ 'HISTORIAL.CLIMA' | translate }}</dt>
            <dd>
              @if (item.clima; as clima) {
                <span class="clima">
                  <app-icono-clima [icono]="clima.icono" [tamanio]="20" />
                  <span class="mono temperatura">{{ temperatura() }} °C</span>
                </span>
                <span class="secundario d-block">{{ clima.descripcion | capitalizarPrimera }}</span>
                <!-- El historial no guarda la fuente: si el clima es más de 30 min anterior a la consulta, fue de respaldo -->
                @if (climaGuardado()) {
                  <app-clima-guardado [obtenidoEn]="clima.obtenido_en" />
                }
              } @else {
                <span class="aviso-suave aviso-clima">{{ 'RESULTADO.CLIMA_NO_DISPONIBLE' | translate }}</span>
              }
            </dd>
          </div>
          <div class="dato">
            <dt class="etiqueta">{{ 'HISTORIAL.PRESUPUESTO' | translate }}</dt>
            <dd class="mono presupuesto">{{ presupuesto() }}</dd>
          </div>
        </dl>
      </div>

      <div class="talon">
        <dl class="montos">
          <dt class="etiqueta">{{ 'HISTORIAL.EN_DESTINO' | translate }}</dt>
          <dd>
            @if (item.conversion) {
              <span class="mono valor">{{ item.moneda.simbolo }} {{ valor() }}</span>
              <span class="mono tasa-inversa">{{ tasaInversa() }}</span>
              <span class="mono tasa-directa">{{ tasaDirecta() }}</span>
            } @else {
              <span class="aviso-suave aviso-conversion">{{ 'RESULTADO.CONVERSION_NO_DISPONIBLE' | translate }}</span>
            }
          </dd>
        </dl>
        <button
          type="button"
          class="btn btn-outline-secondary btn-repetir"
          [attr.aria-label]="'HISTORIAL.REPETIR_A' | translate: { ciudad: item.ciudad.nombre }"
          (click)="repetir.emit(item)"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
          </svg>
          {{ 'HISTORIAL.REPETIR_CONSULTA' | translate }}
        </button>
      </div>
    </article>
  `,
  styles: `
    @use '../../../../styles/perforacion' as *;

    :host {
      display: block;
    }
    .boleto {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 13.5rem;
      height: 100%;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
    }
    .cuerpo {
      min-width: 0;
      padding: 1.25rem 1.5rem 1.35rem;
    }
    .cabecera {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .codigo {
      margin: 0;
      font-size: 2.25rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.04em;
    }
    .ultima {
      flex: none;
      padding: 0.15rem 0.5rem;
      border: 1px solid var(--accent);
      border-radius: var(--radius);
      color: var(--accent);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .lugar {
      margin: 0.3rem 0 1rem;
      font-family: var(--font-display);
      font-weight: 500;
    }
    .datos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
      gap: 0.75rem 1.25rem;
      margin: 0;
    }
    .dato-fecha {
      grid-column: 1 / -1;
    }
    .datos dd {
      margin: 0;
      font-weight: 500;
    }
    .fecha,
    .presupuesto,
    .temperatura {
      white-space: nowrap;
    }
    .clima {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .secundario {
      font-size: 0.8rem;
      font-weight: 400;
      color: var(--muted);
    }

    .talon {
      @include talon-perforado(0.8rem);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
      min-width: 0;
      padding: 1.25rem 1.25rem 1.35rem;
    }
    .montos {
      margin: 0;
    }
    .montos dd {
      display: flex;
      flex-direction: column;
      margin: 0;
    }
    .valor {
      font-size: 1.6rem;
      font-weight: 600;
      line-height: 1.15;
      color: var(--accent);
      overflow-wrap: anywhere;
    }
    .tasa-inversa {
      margin-top: 0.35rem;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .tasa-directa {
      font-size: 0.72rem;
      color: var(--muted);
      overflow-wrap: anywhere;
    }
    .btn-repetir {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.45rem 0.75rem;
      font-size: 0.85rem;
    }

    @media (max-width: 767.98px) {
      .boleto {
        grid-template-columns: 1fr;
      }
      .cuerpo {
        padding: 1.1rem 1.1rem 1.25rem;
      }
      .codigo {
        font-size: 2rem;
      }
      .talon {
        padding: 1.1rem 1.1rem 1.15rem;
      }
    }
  `
})
export class TalonViajeComponent {
  private readonly idioma = inject(IdiomaService).idiomaActual;

  readonly consulta = input.required<ConsultaResultado>();
  /** Marca el talón más reciente con la etiqueta "Última consulta". */
  readonly destacado = input(false);
  readonly repetir = output<ConsultaResultado>();

  readonly idTitulo = computed(() => `talon-viaje-${this.consulta().id}`);

  readonly codigo = computed(() => this.consulta().ciudad.codigo_iata);

  /** Fecha y hora en una sola línea: "25 SEP 2026 · 20:45". */
  readonly fecha = computed(() => {
    const talon = formatearFechaTalon(this.consulta().fecha, this.idioma());
    return talon.hora ? `${talon.fecha} · ${talon.hora}` : talon.fecha;
  });

  /** El clima de esa consulta se había obtenido más de 30 minutos antes: se usó un clima guardado. */
  readonly climaGuardado = computed(() =>
    climaAnteriorALaConsulta(this.consulta().clima?.obtenido_en, this.consulta().fecha)
  );

  readonly presupuesto = computed(() => formatearCop(this.consulta().presupuesto_cop, this.idioma()));

  readonly temperatura = computed(() => {
    const clima = this.consulta().clima;
    return clima ? new Intl.NumberFormat(localeDe(this.idioma()), { maximumFractionDigits: 1 }).format(clima.temperatura) : '';
  });

  readonly valor = computed(() => {
    const { conversion, moneda } = this.consulta();
    return conversion ? formatearMonto(conversion.valor, moneda.codigo, this.idioma()) : '';
  });

  readonly tasaInversa = computed(() => {
    const { conversion, moneda } = this.consulta();
    return conversion ? formatearTasaInversa(conversion.tasa, moneda.simbolo, this.idioma()) : '';
  });

  readonly tasaDirecta = computed(() => {
    const { conversion, moneda } = this.consulta();
    return conversion ? formatearTasaDirecta(conversion.tasa, moneda.codigo, this.idioma()) : '';
  });
}
