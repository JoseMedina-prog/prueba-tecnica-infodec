import { Component, DestroyRef, InjectionToken, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, of, switchMap } from 'rxjs';
import { DestinoSalida } from '../../../core/models';
import { IdiomaService } from '../../../core/services/idioma.service';
import { SalidaService } from '../../../core/services/salida.service';

export const ESTADOS = ['DESPEGO', 'ABORDANDO', 'A_TIEMPO', 'PROGRAMADO'] as const;
export type Estado = (typeof ESTADOS)[number];

/** Estado de la carga de /api/salidas. */
export type EstadoTablero = 'cargando' | 'listo' | 'no-disponible';

export interface Salida {
  /** Código IATA de la ciudad: identifica la fila. */
  codigo: string;
  /** Nombre de la ciudad, ya traducido por el backend. */
  ciudad: string;
  hora: string;
  minutos: number;
  estado: Estado;
  /** Aumenta con cada cambio de estado para volver a disparar la animación. */
  cambios: number;
}

export const RELOJ_FN = new InjectionToken<() => Date>('RELOJ_FN', {
  providedIn: 'root',
  factory: () => () => new Date()
});

export const RELOJ_COLOMBIA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

/** Intervalos entre vuelos de 35 a 50 minutos, múltiplos de 5 */
export const INTERVALOS_VUELOS = [40, 45, 35, 50, 40, 45, 40];

/** Obtiene los minutos transcurridos en el día (0..1439) en la hora de Colombia */
export function obtenerMinutosColombia(fecha: Date): number {
  const formateador = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const partes = formateador.formatToParts(fecha);
  let h = Number(partes.find((p) => p.type === 'hour')?.value ?? 0);
  if (h === 24) h = 0;
  const m = Number(partes.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

/**
 * Genera una salida por destino a partir de la hora actual de Colombia.
 * Las salidas anteriores (mismo código IATA) conservan su contador de cambios para la animación.
 */
export function generarSalidas(destinos: DestinoSalida[], fecha: Date, salidasAnteriores: Salida[] = []): Salida[] {
  const minutosAhora = obtenerMinutosColombia(fecha);
  const redondeo5 = (min: number) => Math.round(min / 5) * 5;

  // Primera hora: unos 20 minutos antes de ahora, redondeada a múltiplos de 5; luego un intervalo por vuelo
  let mAcumulado = redondeo5(minutosAhora - 20);
  const minutosVuelos = destinos.map((_, i) => {
    if (i > 0) mAcumulado += INTERVALOS_VUELOS[(i - 1) % INTERVALOS_VUELOS.length];
    return mAcumulado;
  });

  let abordandoAsignado = false;

  return destinos.map((destino, i) => {
    const codigo = destino.codigo_iata;
    const m = minutosVuelos[i];
    const normalizado = ((m % 1440) + 1440) % 1440;
    const hh = String(Math.floor(normalizado / 60)).padStart(2, '0');
    const mm = String(normalizado % 60).padStart(2, '0');
    const hora = `${hh}:${mm}`;

    let estado: Estado;
    if (m < minutosAhora) {
      estado = 'DESPEGO';
    } else if (!abordandoAsignado) {
      abordandoAsignado = true;
      estado = 'ABORDANDO';
    } else {
      // Las siguientes: A tiempo o Programado
      estado = i % 2 === 0 ? 'A_TIEMPO' : 'PROGRAMADO';
    }

    const anterior = salidasAnteriores.find((s) => s.codigo === codigo);
    const cambios = anterior && anterior.estado !== estado ? anterior.cambios + 1 : (anterior?.cambios ?? 0);

    return {
      codigo,
      ciudad: destino.ciudad,
      hora,
      minutos: m,
      estado,
      cambios
    };
  });
}

/** Actualiza los estados de las salidas existentes según la hora actual */
export function actualizarEstados(salidas: Salida[], fecha: Date): Salida[] {
  const minutosAhora = obtenerMinutosColombia(fecha);
  let abordandoAsignado = false;

  return salidas.map((salida, i) => {
    let estado: Estado;
    if (salida.minutos < minutosAhora) {
      estado = 'DESPEGO';
    } else if (!abordandoAsignado) {
      abordandoAsignado = true;
      estado = 'ABORDANDO';
    } else {
      estado = i % 2 === 0 ? 'A_TIEMPO' : 'PROGRAMADO';
    }

    const cambios = salida.estado !== estado ? salida.cambios + 1 : salida.cambios;

    return {
      ...salida,
      estado,
      cambios
    };
  });
}

/**
 * Tablero de salidas "vivo":
 * - 8 salidas generadas a partir de la hora de Colombia.
 * - Estados coherentes con la hora: Despegó, Abordando, A tiempo / Programado.
 * - Recalculado cada minuto y reloj por segundo.
 */
@Component({
  selector: 'app-tablero-salidas',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="tablero-titulo" aria-hidden="true">
      <span>{{ 'TABLERO.TITULO' | translate }}</span>
      <span class="mono">COP → ¥ £ ₹ kr</span>
    </div>

    <div class="filas" aria-hidden="true">
      <div class="fila cabecera">
        <span>{{ 'TABLERO.HORA' | translate }}</span>
        <span>{{ 'TABLERO.CODIGO' | translate }}</span>
        <span>{{ 'TABLERO.DESTINO' | translate }}</span>
        <span>{{ 'TABLERO.ESTADO' | translate }}</span>
      </div>
      @if (estado() === 'cargando') {
        <!-- Filas en blanco que "parpadean" mientras llega /api/salidas -->
        @for (n of filasCargando; track n) {
          <div class="fila fila-cargando">
            <span class="mono">--:--</span>
            <span class="mono codigo">---</span>
            <span class="barra barra-destino"></span>
            <span class="barra barra-estado"></span>
          </div>
        }
      } @else if (estado() === 'no-disponible') {
        <p class="no-disponible">{{ 'TABLERO.NO_DISPONIBLE' | translate }}</p>
      }
      @for (salida of salidas(); track salida.codigo) {
        <div class="fila">
          <span class="mono">{{ salida.hora }}</span>
          <span class="mono codigo">{{ salida.codigo }}</span>
          <span class="destino">{{ salida.ciudad }}</span>
          <!-- Alternar entre dos animaciones iguales la reinicia en cada cambio sin recrear el DOM -->
          @let texto = 'TABLERO.' + salida.estado | translate;
          <span class="estado" [attr.data-estado]="salida.estado">
            <span
              class="paletas"
              [class.animar-a]="salida.cambios % 2 === 1"
              [class.animar-b]="salida.cambios > 0 && salida.cambios % 2 === 0"
            >
              @for (letra of texto.split(''); track $index) {
                <span class="letra" [style.animation-delay.ms]="$index * 40">{{ letra }}</span>
              }
            </span>
          </span>
        </div>
      }
    </div>

    <footer class="pie">
      <p class="reloj">
        <span class="reloj-etiqueta">{{ 'TABLERO.HORA_COLOMBIA' | translate }}</span>
        <time class="mono reloj-hora">{{ hora() }}</time>
      </p>
      <p class="pie-nota">{{ 'TABLERO.PIE' | translate }}</p>
    </footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      color: var(--paper);
    }
    .tablero-titulo {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding-bottom: 0.75rem;
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .tablero-titulo .mono {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--accent-on-ink);
    }
    /* Las filas se reparten todo el alto disponible del panel */
    .filas {
      flex: 1;
      display: grid;
      grid-template-rows: auto repeat(8, minmax(2.4rem, 1fr));
    }
    .fila {
      display: grid;
      grid-template-columns: 4rem 4rem minmax(0, 1fr) 9.5rem;
      align-items: center;
      gap: 0.5rem;
      border-top: 1px solid color-mix(in srgb, var(--paper) 10%, transparent);
    }
    .cabecera {
      padding-block: 0.5rem;
      border-top-color: color-mix(in srgb, var(--paper) 22%, transparent);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted-on-ink);
    }
    .codigo {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: var(--accent-on-ink);
    }
    .destino {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .estado {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
      perspective: 20rem;
    }
    .estado[data-estado='DESPEGO'] {
      color: var(--muted-on-ink);
    }
    .estado[data-estado='ABORDANDO'] {
      color: var(--accent-on-ink);
      font-weight: 600;
    }
    .estado[data-estado='A_TIEMPO'],
    .estado[data-estado='PROGRAMADO'] {
      color: var(--paper);
    }
    .letra {
      display: inline-block;
      white-space: pre;
    }
    /* Cada letra "cae" como las paletas de un tablero de aeropuerto */
    .animar-a .letra,
    .animar-b .letra {
      animation: paleta-a 0.32s ease-out both;
      transform-origin: 50% 0;
    }
    .animar-b .letra {
      animation-name: paleta-b;
    }
    @keyframes paleta-a {
      from {
        transform: rotateX(-90deg);
        opacity: 0;
      }
      60% {
        transform: rotateX(15deg);
        opacity: 1;
      }
      to {
        transform: rotateX(0);
      }
    }
    @keyframes paleta-b {
      from {
        transform: rotateX(-90deg);
        opacity: 0;
      }
      60% {
        transform: rotateX(15deg);
        opacity: 1;
      }
      to {
        transform: rotateX(0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .animar-a .letra,
      .animar-b .letra {
        animation: none;
      }
    }
    .pie {
      display: grid;
      gap: 0.25rem;
      padding-top: 1rem;
      margin-top: 0.5rem;
      border-top: 1px solid color-mix(in srgb, var(--paper) 22%, transparent);
    }
    .pie p {
      margin: 0;
    }
    .reloj {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
    }
    .reloj-etiqueta {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted-on-ink);
    }
    .reloj-hora {
      font-size: 1.6rem;
      font-weight: 500;
      color: var(--paper);
    }
    .pie-nota {
      font-size: 0.8rem;
      color: var(--muted-on-ink);
    }
    /* Cargando: filas del tablero sin datos, con las casillas apagadas latiendo suavemente */
    .fila-cargando {
      color: color-mix(in srgb, var(--paper) 35%, transparent);
    }
    .fila-cargando .codigo {
      color: color-mix(in srgb, var(--accent-on-ink) 40%, transparent);
    }
    .barra {
      display: block;
      height: 0.7rem;
      border-radius: 2px;
      background: color-mix(in srgb, var(--paper) 14%, transparent);
      animation: latido 1.4s ease-in-out infinite;
    }
    .barra-destino {
      width: 70%;
    }
    .barra-estado {
      width: 60%;
    }
    @keyframes latido {
      50% {
        opacity: 0.45;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .barra {
        animation: none;
      }
    }
    /* Sin datos: el tablero queda vacío con un aviso discreto; el login sigue funcionando */
    .no-disponible {
      grid-row: 2 / -1;
      align-self: center;
      margin: 0;
      padding: 1.5rem 0;
      border-top: 1px solid color-mix(in srgb, var(--paper) 10%, transparent);
      font-family: var(--font-mono);
      font-size: 0.8rem;
      letter-spacing: 0.06em;
      text-align: center;
      text-transform: uppercase;
      color: var(--muted-on-ink);
    }
    @media (max-width: 767.98px) {
      .tablero-titulo {
        font-size: 0.85rem;
        padding-bottom: 0.25rem;
      }
      .filas {
        grid-template-rows: auto;
      }
      .cabecera,
      .fila:nth-child(n + 5),
      .pie {
        display: none;
      }
      .fila {
        grid-template-columns: 3.2rem 3.2rem minmax(0, 1fr) auto;
        min-height: 2.1rem;
        font-size: 0.85rem;
      }
      .no-disponible {
        grid-row: auto;
        padding: 0.9rem 0;
      }
    }
  `
})
export class TableroSalidasComponent {
  private readonly relojFn = inject(RELOJ_FN);
  private readonly salidaService = inject(SalidaService);
  private readonly idioma = inject(IdiomaService).idiomaActual;

  /** Filas en blanco que se muestran mientras carga (las mismas 8 del tablero). */
  readonly filasCargando = [1, 2, 3, 4, 5, 6, 7, 8];

  readonly hora = signal(RELOJ_COLOMBIA.format(this.relojFn()));
  readonly estado = signal<EstadoTablero>('cargando');
  readonly salidas = signal<Salida[]>([]);

  /** Destinos recibidos de /api/salidas; las horas y estados se calculan en el cliente. */
  private destinos: DestinoSalida[] = [];
  private ultimoMinuto = -1;

  constructor() {
    // Pide los destinos al iniciar y en cada cambio de idioma (los nombres vienen traducidos).
    // Si la petición falla, el tablero queda vacío con un aviso y el login sigue funcionando.
    toObservable(this.idioma)
      .pipe(
        switchMap(() => this.salidaService.getSalidas().pipe(catchError(() => of<DestinoSalida[]>([])))),
        takeUntilDestroyed()
      )
      .subscribe((destinos) => this.recibirDestinos(destinos));

    this.ultimoMinuto = obtenerMinutosColombia(this.relojFn());
    const interval = setInterval(() => {
      const ahora = this.relojFn();
      this.hora.set(RELOJ_COLOMBIA.format(ahora));
      const minActual = obtenerMinutosColombia(ahora);
      if (minActual !== this.ultimoMinuto) {
        this.ultimoMinuto = minActual;
        const actual = this.salidas();
        if (actual.length === 0) return;
        if (minActual - actual[0].minutos > 45 || actual.every((s) => s.minutos < minActual)) {
          this.salidas.set(generarSalidas(this.destinos, ahora, actual));
        } else {
          this.salidas.set(actualizarEstados(actual, ahora));
        }
      }
    }, 1000);

    inject(DestroyRef).onDestroy(() => clearInterval(interval));
  }

  private recibirDestinos(destinos: DestinoSalida[]): void {
    this.destinos = destinos;
    if (destinos.length === 0) {
      this.salidas.set([]);
      this.estado.set('no-disponible');
      return;
    }
    // Conserva los estados y contadores de animación de las filas que ya estaban (mismo código IATA)
    this.salidas.set(generarSalidas(destinos, this.relojFn(), this.salidas()));
    this.estado.set('listo');
  }
}
