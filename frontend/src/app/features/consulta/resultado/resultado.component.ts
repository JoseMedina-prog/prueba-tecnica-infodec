import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ConsultaStateService } from '../../../core/services/consulta-state.service';
import { IdiomaService } from '../../../core/services/idioma.service';
import {
  formatearCop,
  formatearFechaTalon,
  formatearMonto,
  formatearTasaDirecta,
  formatearTasaInversa,
  localeDe
} from '../../../core/utils/formato';
import { IconoClimaComponent } from '../../../shared/components/icono-clima/icono-clima.component';
import { PasosIndicadorComponent } from '../../../shared/components/pasos-indicador/pasos-indicador.component';
import { CapitalizarPrimeraPipe } from '../../../shared/pipes/capitalizar-primera.pipe';

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [TranslatePipe, PasosIndicadorComponent, IconoClimaComponent, CapitalizarPrimeraPipe],
  template: `
    <div class="container py-4 contenedor-resultado">
      <app-pasos-indicador [pasoActual]="3" />

      @if (resultado(); as res) {
        <header class="encabezado-pantalla">
          <h1 class="titulo-pantalla">{{ 'RESULTADO.TITULO' | translate }}</h1>
          <p class="bajada">{{ 'RESULTADO.SUBTITULO' | translate }}</p>
        </header>

        <!-- Nombres traducidos en el front (el resultado no se vuelve a pedir al cambiar el idioma) -->
        @let clavePais = 'LUGARES.PAISES.' + res.pais.codigo;
        @let claveCiudad = 'LUGARES.CIUDADES.' + res.ciudad.codigo_iata;
        @let claveMoneda = 'LUGARES.MONEDAS.' + res.moneda.codigo;
        @let nombrePais = (clavePais | translate) === clavePais ? res.pais.nombre : (clavePais | translate);
        @let nombreCiudad = (claveCiudad | translate) === claveCiudad ? res.ciudad.nombre : (claveCiudad | translate);
        @let nombreMoneda = (claveMoneda | translate) === claveMoneda ? res.moneda.nombre : (claveMoneda | translate);

        <article class="pasabordo" [attr.aria-label]="'RESULTADO.PASABORDO' | translate">
          <div class="cuerpo">
            <div class="cabecera">
              <span class="etiqueta">{{ 'RESULTADO.PASABORDO' | translate }}</span>
              <p class="mono codigo-destino">{{ codigoDestino() }}</p>
              <p class="lugar">{{ nombreCiudad }} · {{ nombrePais }}</p>
            </div>

            <!-- Grilla 2x2: Clima, Presupuesto, Moneda, Tasa -->
            <dl class="casillas">
              <div class="casilla">
                <dt class="etiqueta">{{ 'RESULTADO.TARJETA_CLIMA' | translate }}</dt>
                <dd>
                  @if (res.clima; as clima) {
                    <span class="clima">
                      <app-icono-clima [icono]="clima.icono" [tamanio]="28" />
                      <span class="mono">{{ temperatura(clima.temperatura) }} °C</span>
                    </span>
                    <span
                      class="d-block secundario clima-desc"
                      tabindex="0"
                      [title]="'RESULTADO.CLIMA_NOTA' | translate"
                      [attr.aria-label]="clima.descripcion + '. ' + ('RESULTADO.CLIMA_NOTA' | translate)"
                    >
                      {{ clima.descripcion | capitalizarPrimera }}
                    </span>
                  } @else {
                    <span class="aviso-suave">{{ 'RESULTADO.CLIMA_NO_DISPONIBLE' | translate }}</span>
                  }
                </dd>
              </div>

              <div class="casilla">
                <dt class="etiqueta">{{ 'RESULTADO.TARJETA_PRESUPUESTO' | translate }}</dt>
                <dd class="mono">{{ presupuestoCop() }}</dd>
              </div>

              <div class="casilla">
                <dt class="etiqueta">{{ 'RESULTADO.TARJETA_MONEDA' | translate }}</dt>
                <dd>
                  {{ nombreMoneda }}
                  <span class="d-block mono secundario">{{ res.moneda.simbolo }} · {{ res.moneda.codigo }}</span>
                </dd>
              </div>

              <div class="casilla casilla-tasa">
                <dt class="etiqueta">{{ 'RESULTADO.TASA_APLICADA' | translate }}</dt>
                <dd>
                  @if (res.conversion) {
                    <span class="mono d-block tasa-inversa">{{ tasaInversa() }}</span>
                    <span class="mono d-block tasa-directa">{{ tasaDirecta() }}</span>
                  } @else {
                    <span class="aviso-suave">—</span>
                  }
                </dd>
              </div>

              <div class="casilla casilla-valor">
                <dt class="etiqueta">{{ 'RESULTADO.RINDE' | translate: { ciudad: nombreCiudad } }}</dt>
                <dd>
                  @if (res.conversion) {
                    <span class="mono valor-convertido">{{ res.moneda.simbolo }} {{ valorConvertido() }}</span>
                  } @else {
                    <span class="aviso-suave">{{ 'RESULTADO.CONVERSION_NO_DISPONIBLE' | translate }}</span>
                  }
                </dd>
              </div>
            </dl>
          </div>

          <div class="talon">
            <div class="codigo-barras" aria-hidden="true"></div>
            <dl class="talon-datos">
              <div>
                <dt class="etiqueta">{{ 'RESULTADO.FECHA' | translate }}</dt>
                <dd class="mono fecha-talon">
                  <span class="fecha-linea">{{ fechaTalon(res.fecha).fecha }}</span>
                  <span class="fecha-linea">{{ fechaTalon(res.fecha).hora }}</span>
                </dd>
              </div>
              <div>
                <dt class="etiqueta">{{ 'RESULTADO.PASAJERO' | translate }}</dt>
                <dd>{{ pasajero() }}</dd>
              </div>
              <div>
                <dt class="etiqueta">{{ 'RESULTADO.VUELO' | translate }}</dt>
                <dd class="mono">COP → {{ res.moneda.codigo }}</dd>
              </div>
            </dl>
          </div>

          @if (res.conversion?.fuente === 'respaldo') {
            <p class="sello" role="note">
              {{ 'RESULTADO.TASA_RESPALDO' | translate }} · {{ fechaTalon(res.conversion!.fecha_tasa).fecha }}
            </p>
          }
        </article>

        <div aria-live="polite" class="mt-3">
          @for (aviso of res.avisos ?? []; track aviso.code) {
            <p class="aviso-suave mb-1">{{ 'AVISOS.' + aviso.code | translate }}</p>
          }
        </div>

        <div class="acciones-flujo">
          <button type="button" class="btn btn-outline-secondary" (click)="volverAtras()">
            {{ 'DESTINO.ATRAS' | translate }}
          </button>
          <button type="button" class="btn btn-primary" (click)="volverAlInicio()">
            {{ 'RESULTADO.VOLVER_INICIO' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    @use '../../../../styles/perforacion' as *;

    .pasabordo {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 17rem;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
    }
    .cuerpo {
      padding: 1.75rem 2rem 2rem;
    }
    .cabecera {
      padding-bottom: 1.25rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--line);
    }
    .codigo-destino {
      margin: 0;
      font-size: clamp(3rem, 12vw, 4.5rem);
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.04em;
    }
    .lugar {
      margin: 0.35rem 0 0;
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 500;
    }
    .casillas {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.25rem 1.5rem;
      margin: 0;
    }
    .casilla dd {
      margin: 0;
      font-weight: 500;
    }
    .casilla-tasa {
      display: flex;
      flex-direction: column;
    }
    .tasa-inversa {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--ink);
    }
    .tasa-directa {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 0.15rem;
    }
    .casilla-valor {
      grid-column: 1 / -1;
      padding-top: 1rem;
      border-top: 1px dashed var(--line-strong);
    }
    .valor-convertido {
      font-size: clamp(2rem, 8vw, 3rem);
      font-weight: 600;
      line-height: 1.1;
      color: var(--accent);
      overflow-wrap: anywhere;
    }
    .secundario {
      font-size: 0.85rem;
      font-weight: 400;
      color: var(--muted);
    }
    .clima {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .clima-desc {
      cursor: help;
      display: inline-block;
      text-decoration: underline dotted var(--muted);
      text-underline-offset: 3px;
    }
    .clima-desc:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
      border-radius: var(--radius-sm);
    }

    /* Talón separado por una línea perforada con muescas como recortes en el papel */
    .talon {
      @include talon-perforado(1rem);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.75rem 1.5rem;
    }
    .codigo-barras {
      height: 3.25rem;
      background: repeating-linear-gradient(
        90deg,
        var(--ink) 0 2px,
        transparent 2px 4px,
        var(--ink) 4px 5px,
        transparent 5px 8px,
        var(--ink) 8px 11px,
        transparent 11px 13px,
        var(--ink) 13px 14px,
        transparent 14px 17px
      );
    }
    .talon-datos {
      display: grid;
      gap: 0.9rem;
      margin: 0;
    }
    .talon-datos dd {
      margin: 0;
      font-weight: 500;
    }
    .fecha-talon {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }
    .fecha-linea {
      white-space: nowrap;
    }

    .sello {
      position: absolute;
      top: 1.5rem;
      right: 19rem;
      margin: 0;
      padding: 0.35rem 0.75rem;
      border: 2px solid var(--success);
      border-radius: var(--radius);
      color: var(--success);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      transform: rotate(-6deg);
      background: var(--surface);
    }

    @media (max-width: 767.98px) {
      .pasabordo {
        grid-template-columns: 1fr;
      }
      .cuerpo {
        padding: 1.25rem 1.25rem 1.5rem;
      }
      .casillas {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .talon {
        padding: 1.5rem 1.25rem;
      }
      .talon-datos {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .sello {
        top: 1rem;
        right: 1rem;
      }
    }
  `
})
export class ResultadoComponent {
  private readonly consultaState = inject(ConsultaStateService);
  private readonly idiomaService = inject(IdiomaService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly resultado = this.consultaState.resultado;
  private readonly idioma = this.idiomaService.idiomaActual;

  readonly pasajero = computed(() => this.authService.usuario()?.nombre ?? '');

  readonly codigoDestino = computed(() => this.resultado()?.ciudad.codigo_iata ?? '');

  readonly presupuestoCop = computed(() => {
    const res = this.resultado();
    return res ? formatearCop(res.presupuesto_cop, this.idioma()) : '';
  });

  readonly valorConvertido = computed(() => {
    const res = this.resultado();
    return res?.conversion ? formatearMonto(res.conversion.valor, res.moneda.codigo, this.idioma()) : '';
  });

  readonly tasaInversa = computed(() => {
    const res = this.resultado();
    return res?.conversion ? formatearTasaInversa(res.conversion.tasa, res.moneda.simbolo, this.idioma()) : '';
  });

  readonly tasaDirecta = computed(() => {
    const res = this.resultado();
    return res?.conversion ? formatearTasaDirecta(res.conversion.tasa, res.moneda.codigo, this.idioma()) : '';
  });

  fechaTalon(fechaIso: string | null | undefined): { fecha: string; hora: string } {
    return formatearFechaTalon(fechaIso, this.idioma());
  }

  temperatura(valor: number): string {
    return new Intl.NumberFormat(localeDe(this.idioma()), { maximumFractionDigits: 1 }).format(valor);
  }

  volverAtras(): void {
    this.router.navigate(['/consulta/presupuesto']);
  }

  volverAlInicio(): void {
    this.consultaState.reiniciar();
    this.router.navigate(['/consulta/destino']);
  }
}
