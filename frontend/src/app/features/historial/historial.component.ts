import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ConsultaResultado } from '../../core/models';
import { Ciudad, Pais } from '../../core/models/pais.model';
import { ConsultaService } from '../../core/services/consulta.service';
import { ConsultaStateService } from '../../core/services/consulta-state.service';
import { IdiomaService } from '../../core/services/idioma.service';
import { codigoCiudad } from '../../core/utils/codigos';
import {
  formatearCop,
  formatearFechaTalon,
  formatearMonto,
  formatearTasaDirecta,
  formatearTasaInversa,
  localeDe
} from '../../core/utils/formato';

import { IconoClimaComponent } from '../../shared/components/icono-clima/icono-clima.component';
import { CapitalizarPrimeraPipe } from '../../shared/pipes/capitalizar-primera.pipe';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [RouterLink, TranslatePipe, IconoClimaComponent, CapitalizarPrimeraPipe],
  template: `
    <div class="container py-4 contenedor-resultado">
      <header class="encabezado-pantalla d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-3">
        <div>
          <h1 class="titulo-pantalla">{{ 'HISTORIAL.TITULO' | translate }}</h1>
          <p class="bajada">{{ 'HISTORIAL.SUBTITULO' | translate }}</p>
        </div>
        @if (!cargando() && consultas().length > 0) {
          <a routerLink="/consulta/destino" class="btn btn-primary">{{ 'HISTORIAL.NUEVA_CONSULTA' | translate }}</a>
        }
      </header>

      @if (cargando()) {
        <p class="cargando py-4" role="status">
          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          {{ 'HISTORIAL.CARGANDO' | translate }}
        </p>
      } @else if (error()) {
        <div class="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
          <span>{{ 'HISTORIAL.ERROR_CARGA' | translate }}</span>
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="cargarHistorial()">
            {{ 'DESTINO.REINTENTAR' | translate }}
          </button>
        </div>
      } @else if (consultas().length === 0) {
        <section class="vacio">
          <p class="mono vacio-codigo" aria-hidden="true">--- → ---</p>
          <h2 class="h4">{{ 'HISTORIAL.VACIO' | translate }}</h2>
          <p class="bajada">{{ 'HISTORIAL.VACIO_DETALLE' | translate }}</p>
          <a routerLink="/consulta/destino" class="btn btn-primary">{{ 'HISTORIAL.PRIMERA_CONSULTA' | translate }}</a>
        </section>
      } @else {
        <!-- Tablet y computador: tablero de salidas -->
        <div class="tablero d-none d-md-block">
          <table>
            <caption class="visually-hidden">{{ 'HISTORIAL.TITULO' | translate }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ 'HISTORIAL.TABLA_FECHA' | translate }}</th>
                <th scope="col">{{ 'HISTORIAL.TABLA_DESTINO' | translate }}</th>
                <th scope="col" class="num">{{ 'HISTORIAL.TABLA_PRESUPUESTO' | translate }}</th>
                <th scope="col">{{ 'HISTORIAL.TABLA_CLIMA' | translate }}</th>
                <th scope="col" class="num">{{ 'HISTORIAL.TABLA_CONVERSION' | translate }}</th>
                <th scope="col" class="text-end">{{ 'HISTORIAL.TABLA_ACCIONES' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (item of consultas(); track item.id) {
                <tr>
                  <td class="mono fecha">{{ fecha(item.fecha) }}</td>
                  <td>
                    <span class="mono codigo">{{ codigo(item) }}</span>
                    <span class="destino">{{ item.ciudad.nombre }}, {{ item.pais.nombre }}</span>
                  </td>
                  <td class="num mono">{{ cop(item.presupuesto_cop) }}</td>
                  <td>
                    @if (item.clima; as clima) {
                      <div class="d-inline-flex align-items-center gap-2">
                        <app-icono-clima [icono]="clima.icono" [tamanio]="20" />
                        <span class="mono text-nowrap">{{ temperatura(clima.temperatura) }} °C</span>
                      </div>
                      <span class="secundario d-block">{{ clima.descripcion | capitalizarPrimera }}</span>
                    } @else {
                      <span aria-hidden="true">—</span>
                      <span class="secundario">{{ 'RESULTADO.CLIMA_NO_DISPONIBLE' | translate }}</span>
                    }
                  </td>
                  <td class="num">
                    @if (item.conversion; as conversion) {
                      <span class="mono valor">{{ item.moneda.simbolo }} {{ monto(conversion.valor, item.moneda.codigo) }}</span>
                      <span class="mono secundario">{{ tasaInversa(conversion.tasa, item.moneda.simbolo) }}</span>
                      <span class="mono secundario">{{ tasaDirecta(conversion.tasa, item.moneda.codigo) }}</span>
                    } @else {
                      <span aria-hidden="true">—</span>
                      <span class="secundario">{{ 'RESULTADO.CONVERSION_NO_DISPONIBLE' | translate }}</span>
                    }
                  </td>
                  <td class="text-end align-middle">
                    <button
                      type="button"
                      class="btn btn-sm btn-repetir"
                      (click)="repetirConsulta(item)"
                      [attr.aria-label]="('HISTORIAL.REPETIR_CONSULTA' | translate) + ': ' + item.ciudad.nombre"
                      [title]="'HISTORIAL.REPETIR_CONSULTA' | translate"
                    >
                      <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                      </svg>
                      <span class="texto-repetir">{{ 'HISTORIAL.REPETIR_CONSULTA' | translate }}</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Celular: talones pequeños apilados -->
        <ul class="talones d-md-none">
          @for (item of consultas(); track item.id) {
            <li class="talon">
              <div class="talon-cuerpo">
                <span class="mono codigo">{{ codigo(item) }}</span>
                <span class="destino">{{ item.ciudad.nombre }}, {{ item.pais.nombre }}</span>
                <span class="mono secundario">{{ fecha(item.fecha) }}</span>
                <span class="secundario d-flex align-items-center gap-1 flex-wrap">
                  @if (item.clima; as clima) {
                    <app-icono-clima [icono]="clima.icono" [tamanio]="18" />
                    <span>{{ temperatura(clima.temperatura) }} °C · {{ clima.descripcion | capitalizarPrimera }}</span>
                  } @else {
                    — {{ 'RESULTADO.CLIMA_NO_DISPONIBLE' | translate }}
                  }
                </span>
              </div>
              <dl class="talon-montos">
                <dt class="etiqueta">{{ 'HISTORIAL.TABLA_PRESUPUESTO' | translate }}</dt>
                <dd class="mono">{{ cop(item.presupuesto_cop) }}</dd>
                <dt class="etiqueta">{{ 'HISTORIAL.TABLA_CONVERSION' | translate }}</dt>
                <dd>
                  @if (item.conversion; as conversion) {
                    <span class="mono valor">{{ item.moneda.simbolo }} {{ monto(conversion.valor, item.moneda.codigo) }}</span>
                    <span class="mono secundario d-block">{{ tasaInversa(conversion.tasa, item.moneda.simbolo) }}</span>
                    <span class="mono secundario d-block">{{ tasaDirecta(conversion.tasa, item.moneda.codigo) }}</span>
                  } @else {
                    <span class="secundario">— {{ 'RESULTADO.CONVERSION_NO_DISPONIBLE' | translate }}</span>
                  }
                </dd>
              </dl>
              <div class="talon-pie">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary w-100 btn-repetir"
                  (click)="repetirConsulta(item)"
                  [attr.aria-label]="('HISTORIAL.REPETIR_CONSULTA' | translate) + ': ' + item.ciudad.nombre"
                >
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" class="me-1" aria-hidden="true">
                    <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                  </svg>
                  {{ 'HISTORIAL.REPETIR_CONSULTA' | translate }}
                </button>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    .tablero {
      background: var(--ink);
      color: var(--paper);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      padding: 1rem 1.1rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted-on-ink);
      text-align: left;
      border-bottom: 1px solid color-mix(in srgb, var(--paper) 20%, transparent);
    }
    td {
      padding: 0.9rem 1.1rem;
      vertical-align: top;
      border-top: 1px solid color-mix(in srgb, var(--paper) 9%, transparent);
    }
    tbody tr:hover {
      background: color-mix(in srgb, var(--paper) 5%, transparent);
    }
    .num {
      text-align: right;
      white-space: nowrap;
    }
    td > span {
      display: block;
    }
    .fecha {
      font-size: 0.85rem;
      color: var(--muted-on-ink);
    }
    .codigo {
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: 0.06em;
    }
    .tablero .codigo {
      color: var(--accent-on-ink);
    }
    .tablero .valor {
      font-weight: 600;
    }
    .tablero .secundario {
      color: var(--muted-on-ink);
    }
    .destino {
      font-size: 0.9rem;
    }
    .secundario {
      font-size: 0.8rem;
      color: var(--muted);
    }

    .btn-repetir {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      font-weight: 500;
      white-space: nowrap;
      border: 1px solid color-mix(in srgb, var(--paper) 35%, transparent);
      color: var(--paper);
    }
    .btn-repetir:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: #ffffff;
    }
    .tablero .btn-repetir:focus-visible {
      outline-color: var(--accent-on-ink);
    }
    /* Tablet: la tabla no cabe con el texto del botón; queda el ícono con su nombre accesible y tooltip */
    @media (max-width: 991.98px) {
      th,
      td {
        padding-inline: 0.7rem;
      }
      .tablero .texto-repetir {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      }
      .tablero .btn-repetir {
        padding: 0.45rem 0.55rem;
      }
    }

    .talones {
      display: grid;
      gap: 0.9rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .talon {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
    }
    .talon-cuerpo {
      display: grid;
      gap: 0.1rem;
      padding: 0.9rem 1rem;
    }
    .talon .codigo {
      font-size: 1.5rem;
      line-height: 1.1;
    }
    .talon-montos {
      position: relative;
      margin: 0;
      padding: 0.9rem 1rem;
      text-align: right;
      border-left: 2px dashed var(--line-strong);
    }
    .talon-montos::before,
    .talon-montos::after {
      content: '';
      position: absolute;
      left: -0.6rem;
      width: 1.1rem;
      height: 1.1rem;
      border-radius: 50%;
      background: var(--paper);
      border: 1px solid var(--line);
    }
    .talon-montos::before {
      top: -0.6rem;
    }
    .talon-montos::after {
      bottom: -0.6rem;
    }
    .talon-montos dd {
      margin: 0 0 0.5rem;
    }
    .talon-montos dd:last-child {
      margin: 0;
    }
    .talon .valor {
      font-weight: 600;
      color: var(--accent);
    }
    .talon-pie {
      grid-column: 1 / -1;
      padding: 0.5rem 1rem 0.8rem;
      border-top: 1px dashed var(--line);
    }
    .talon .btn-repetir {
      border-color: var(--line-strong);
      color: var(--ink);
      background-color: var(--surface);
    }
    .talon .btn-repetir:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: #ffffff;
    }

    .vacio {
      padding: 3rem 1.5rem;
      text-align: center;
      background: var(--surface);
      border: 1px dashed var(--line-strong);
      border-radius: var(--radius-lg);
    }
    .vacio-codigo {
      font-size: 1.5rem;
      color: var(--muted);
      letter-spacing: 0.1em;
    }
    .vacio .bajada {
      max-width: 28rem;
      margin: 0 auto 1.5rem;
    }
  `
})
export class HistorialComponent {
  private readonly consultaService = inject(ConsultaService);
  private readonly consultaState = inject(ConsultaStateService);
  private readonly idiomaService = inject(IdiomaService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly idioma = this.idiomaService.idiomaActual;

  readonly consultas = signal<ConsultaResultado[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);

  private peticion?: Subscription;

  constructor() {
    // Emite el idioma actual al iniciar y en cada cambio: el backend devuelve el historial traducido.
    toObservable(this.idioma)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarHistorial());
  }

  cargarHistorial(): void {
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.error.set(false);

    this.peticion = this.consultaService
      .getHistorial()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.consultas.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(true);
          this.cargando.set(false);
        }
      });
  }

  codigo(item: ConsultaResultado): string {
    return codigoCiudad(item.ciudad.id, item.ciudad.nombre);
  }

  fecha(fechaIso: string): string {
    const talon = formatearFechaTalon(fechaIso, this.idioma());
    return talon.hora ? `${talon.fecha} · ${talon.hora}` : talon.fecha;
  }

  cop(valor: number): string {
    return formatearCop(valor, this.idioma());
  }

  monto(valor: number, codigo: string): string {
    return formatearMonto(valor, codigo, this.idioma());
  }

  tasaInversa(valor: number, simbolo: string): string {
    return formatearTasaInversa(valor, simbolo, this.idioma());
  }

  tasaDirecta(valor: number, codigo: string): string {
    return formatearTasaDirecta(valor, codigo, this.idioma());
  }

  temperatura(valor: number): string {
    return new Intl.NumberFormat(localeDe(this.idioma()), { maximumFractionDigits: 1 }).format(valor);
  }

  repetirConsulta(item: ConsultaResultado): void {
    const pais: Pais = {
      id: item.pais.id,
      codigo: item.pais.codigo,
      nombre: item.pais.nombre,
      moneda: {
        codigo: item.moneda.codigo,
        nombre: item.moneda.nombre,
        simbolo: item.moneda.simbolo
      }
    };
    const ciudad: Ciudad = {
      id: item.ciudad.id,
      nombre: item.ciudad.nombre
    };
    this.consultaState.setDestino(pais, ciudad);
    this.consultaState.setPresupuesto(String(item.presupuesto_cop));
    this.consultaState.setResultado(null);
    this.router.navigate(['/consulta/presupuesto']);
  }
}
