import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, of, switchMap } from 'rxjs';
import { DestinoSalida } from '../../../core/models';
import { IdiomaService } from '../../../core/services/idioma.service';
import { SalidaService } from '../../../core/services/salida.service';
import {
  Estado,
  RELOJ_COLOMBIA,
  RELOJ_FN,
  Salida,
  actualizarEstados,
  generarSalidas,
  obtenerMinutosColombia
} from '../../../core/utils/salidas';
import { SplitFlapComponent } from '../split-flap/split-flap.component';

@Component({
  selector: 'app-carrusel-salidas',
  standalone: true,
  imports: [TranslatePipe, SplitFlapComponent],
  template: `
    @if (salidas().length > 0) {
      <section class="carrusel-seccion" [attr.aria-label]="'TABLERO.PROXIMAS_SALIDAS' | translate">
        <header class="carrusel-header">
        <div class="carrusel-titulo-wrap">
          <h2 class="carrusel-titulo">{{ 'TABLERO.PROXIMAS_SALIDAS' | translate }}</h2>
          <span class="reloj-vivo mono">BOGOTÁ · {{ hora() }}</span>
        </div>
        <div class="carrusel-nav">
          <button
            type="button"
            class="btn-nav"
            [disabled]="enInicio()"
            [attr.aria-label]="'TABLERO.ANTERIOR' | translate"
            (click)="anterior()"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10 13L5 8l5-5" />
            </svg>
          </button>
          <button
            type="button"
            class="btn-nav"
            [disabled]="enFin()"
            [attr.aria-label]="'TABLERO.SIGUIENTE' | translate"
            (click)="siguiente()"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </div>
      </header>

      <div class="carrusel-track" #track (scroll)="alHacerScroll()">
        @for (salida of salidas(); track salida.codigo) {
          <article
            class="tarjeta-salida"
            [attr.aria-label]="($index + 1) + ' ' + ('TABLERO.DE' | translate) + ' ' + salidas().length"
          >
            <div class="salida-fila-superior">
              <app-split-flap class="codigo mono" [texto]="salida.codigo" [delayMs]="$index * 60" />
              <time class="hora mono">{{ salida.hora }}</time>
            </div>
            <div class="ciudad">{{ salida.ciudad }}</div>
            <div class="salida-fila-inferior">
              <span class="chip-estado" [class]="obtenerClaseChip(salida.estado)" [attr.data-estado]="salida.estado">
                @if (salida.estado === 'ABORDANDO') {
                  <span class="punto-parpadeo" aria-hidden="true"></span>
                }
                <span>{{ 'TABLERO.' + salida.estado | translate }}</span>
              </span>
            </div>
          </article>
        }
      </div>
    </section>
  }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      max-width: 880px;
    }
    .carrusel-seccion {
      width: 100%;
      margin: 2rem auto 0;
    }
    .carrusel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.85rem;
      padding: 0 0.25rem;
    }
    .carrusel-titulo-wrap {
      display: flex;
      align-items: baseline;
      gap: 0.85rem;
      flex-wrap: wrap;
    }
    .carrusel-titulo {
      margin: 0;
      font-family: var(--font-display);
      font-size: 0.875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink);
    }
    .reloj-vivo {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
    }
    .carrusel-nav {
      display: flex;
      gap: 0.5rem;
    }
    .btn-nav {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1.5px solid var(--ink);
      background: #ffffff;
      color: var(--ink);
      opacity: 1;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(27, 42, 65, 0.06);
      transition: background-color 150ms ease, border-color 150ms ease, opacity 150ms ease, transform 150ms ease;

      &:hover:not(:disabled) {
        background: var(--paper);
        transform: scale(1.04);
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
        box-shadow: none;
      }

      &:focus-visible {
        outline: 3px solid var(--accent);
        outline-offset: 2px;
      }
    }
    .carrusel-track {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      padding: 0.25rem 0.25rem 0.75rem;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }
    .tarjeta-salida {
      scroll-snap-align: start;
      flex: 0 0 calc((100% - 3rem) / 4);
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 1rem 1.1rem;
      box-shadow: 0 2px 8px rgba(27, 42, 65, 0.04);
      transition: transform 150ms ease, box-shadow 150ms ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(27, 42, 65, 0.08);
      }
    }
    .salida-fila-superior {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .codigo {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--ink);
    }
    .hora {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--muted);
    }
    .ciudad {
      margin: 0.6rem 0 0.85rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--ink);
      line-height: 1.25;
      min-height: 2.4rem;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      word-break: normal;
      white-space: normal;
    }
    .salida-fila-inferior {
      display: flex;
      align-items: center;
    }
    .chip-estado {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
      line-height: 1.3;
    }
    .chip-despego {
      background: transparent;
      color: #6b6b6b;
      border: 1px solid var(--line);
    }
    .chip-abordando {
      background: var(--accent);
      color: #ffffff;
      border: 1px solid var(--accent);
    }
    .punto-parpadeo {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ffffff;
      animation: punto-pulso 1s ease-in-out infinite;
    }
    @keyframes punto-pulso {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }
    .chip-a-tiempo {
      background: rgba(31, 122, 111, 0.12);
      color: #1f7a6f;
      border: 1px solid rgba(31, 122, 111, 0.28);
    }
    .chip-programado {
      background: transparent;
      color: var(--ink);
      border: 1px solid var(--line-strong);
    }
    @media (prefers-reduced-motion: reduce) {
      .tarjeta-salida {
        transition: none !important;
        &:hover { transform: none !important; }
      }
      .punto-parpadeo {
        animation: none !important;
        opacity: 1 !important;
      }
    }
    @media (max-width: 991.98px) {
      .tarjeta-salida {
        flex: 0 0 calc((100% - 1rem) / 2);
      }
    }
    @media (max-width: 575.98px) {
      .tarjeta-salida {
        flex: 0 0 78%;
      }
    }
  `
})
export class CarruselSalidasComponent implements AfterViewInit {
  private readonly relojFn = inject(RELOJ_FN);
  private readonly salidaService = inject(SalidaService);
  private readonly idioma = inject(IdiomaService).idiomaActual;

  @ViewChild('track') trackRef?: ElementRef<HTMLDivElement>;

  readonly hora = signal(RELOJ_COLOMBIA.format(this.relojFn()));
  readonly salidas = signal<Salida[]>([]);
  readonly enInicio = signal(true);
  readonly enFin = signal(false);

  private destinos: DestinoSalida[] = [];
  private ultimoMinuto = -1;

  constructor() {
    toObservable(this.idioma)
      .pipe(
        switchMap(() =>
          this.salidaService.getSalidas().pipe(
            catchError(() => of<DestinoSalida[]>([]))
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((destinos) => {
        this.recibirDestinos(destinos ?? []);
      });

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

  ngAfterViewInit(): void {
    this.actualizarExtremos();
  }

  alHacerScroll(): void {
    this.actualizarExtremos();
  }

  actualizarExtremos(): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    this.enInicio.set(el.scrollLeft <= 5);
    this.enFin.set(el.scrollLeft + el.clientWidth >= el.scrollWidth - 5);
  }

  siguiente(): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    const paso = Math.max(el.clientWidth * 0.75, 200);
    if (typeof el.scrollBy === 'function') {
      el.scrollBy({ left: paso, behavior: 'smooth' });
    } else {
      el.scrollLeft += paso;
    }
    setTimeout(() => this.actualizarExtremos(), 100);
  }

  anterior(): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    const paso = Math.max(el.clientWidth * 0.75, 200);
    if (typeof el.scrollBy === 'function') {
      el.scrollBy({ left: -paso, behavior: 'smooth' });
    } else {
      el.scrollLeft -= paso;
    }
    setTimeout(() => this.actualizarExtremos(), 100);
  }

  obtenerClaseChip(estado: Estado): string {
    switch (estado) {
      case 'DESPEGO':
        return 'chip-despego';
      case 'ABORDANDO':
        return 'chip-abordando';
      case 'A_TIEMPO':
        return 'chip-a-tiempo';
      case 'PROGRAMADO':
        return 'chip-programado';
    }
  }

  private recibirDestinos(destinos: DestinoSalida[]): void {
    if (!destinos || destinos.length === 0) {
      this.destinos = [];
      this.salidas.set([]);
      return;
    }
    this.destinos = destinos;
    this.salidas.set(generarSalidas(destinos, this.relojFn(), this.salidas()));
    setTimeout(() => this.actualizarExtremos(), 0);
  }
}
