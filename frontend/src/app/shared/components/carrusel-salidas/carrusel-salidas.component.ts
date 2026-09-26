import {
  AfterViewInit,
  Component,
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
import { SplitFlapComponent } from '../split-flap/split-flap.component';

@Component({
  selector: 'app-carrusel-salidas',
  standalone: true,
  imports: [TranslatePipe, SplitFlapComponent],
  template: `
    @if (destinos().length > 0) {
      <section class="carrusel-seccion" [attr.aria-label]="'TABLERO.DESTINOS_DISPONIBLES' | translate">
        <header class="carrusel-header">
          <h2 class="carrusel-titulo">{{ 'TABLERO.DESTINOS_DISPONIBLES' | translate }}</h2>
          <div class="carrusel-header-der">
            <span class="carrusel-monedas mono" aria-label="Monedas de destino">COP → £ ¥ ₹ kr</span>
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
          </div>
        </header>

        <div class="carrusel-track" #track (scroll)="alHacerScroll()">
          @for (destino of destinos(); track destino.codigo_iata) {
            <article
              class="tarjeta-salida"
              [attr.aria-label]="($index + 1) + ' ' + ('TABLERO.DE' | translate) + ' ' + destinos().length"
            >
              <div class="salida-fila-superior">
                <app-split-flap class="codigo mono" [texto]="destino.codigo_iata" [delayMs]="$index * 60" />
                <span class="salida-moneda mono">{{ destino.moneda.codigo }} {{ destino.moneda.simbolo }}</span>
              </div>
              <div class="ciudad">{{ destino.ciudad }}</div>
              <div class="pais">{{ destino.pais }}</div>
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
    .carrusel-titulo {
      margin: 0;
      font-family: var(--font-display);
      font-size: 0.875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink);
    }
    .carrusel-header-der {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .carrusel-monedas {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: var(--muted);
      background: var(--paper);
      padding: 0.3rem 0.65rem;
      border-radius: 999px;
      border: 1px solid var(--line);
      white-space: nowrap;
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
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.65rem;
    }
    .codigo {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--ink);
    }
    .salida-moneda {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent);
      letter-spacing: 0.04em;
      background: rgba(184, 64, 28, 0.08);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .ciudad {
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--ink);
      line-height: 1.25;
      margin-bottom: 0.2rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pais {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @media (prefers-reduced-motion: reduce) {
      .tarjeta-salida {
        transition: none !important;
        &:hover { transform: none !important; }
      }
    }
    @media (max-width: 991.98px) {
      .tarjeta-salida {
        flex: 0 0 calc((100% - 1rem) / 2);
      }
    }
    @media (max-width: 575.98px) {
      .carrusel-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .carrusel-header-der {
        width: 100%;
        justify-content: space-between;
      }
      .tarjeta-salida {
        flex: 0 0 78%;
      }
    }
  `
})
export class CarruselSalidasComponent implements AfterViewInit {
  private readonly salidaService = inject(SalidaService);
  private readonly idioma = inject(IdiomaService).idiomaActual;

  @ViewChild('track') trackRef?: ElementRef<HTMLDivElement>;

  readonly destinos = signal<DestinoSalida[]>([]);
  // Alias de compatibilidad para pruebas y plantillas
  readonly salidas = this.destinos;
  readonly enInicio = signal(true);
  readonly enFin = signal(false);

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

  private recibirDestinos(destinos: DestinoSalida[]): void {
    if (!destinos || destinos.length === 0) {
      this.destinos.set([]);
      return;
    }
    this.destinos.set(destinos);
    setTimeout(() => this.actualizarExtremos(), 0);
  }
}
