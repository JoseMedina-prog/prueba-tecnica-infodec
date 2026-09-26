import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  input,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LogoComponent } from '../logo/logo.component';
import { SelectorIdiomaComponent } from '../selector-idioma/selector-idioma.component';

export type DestinoRuta = 'LON' | 'CPH' | 'DEL' | 'TYO';

export interface RutaCalculada {
  destino: DestinoRuta;
  d: string;
  waypoint: { x: number; y: number };
}

/**
 * Lienzo de fondo niebla unificado para login y registro con bloques decorativos,
 * coordenadas reales, retícula náutica, rutas SVG calculadas dinámicamente y avión animado.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LogoComponent, SelectorIdiomaComponent],
  template: `
    <div class="lienzo-auth">
      <!-- Capa decorativa con bloques, rutas SVG dinámicas y detalles aeronáuticos -->
      <div #decoracionRef class="decoracion-fondo" aria-hidden="true">
        <!-- Retícula tenue de líneas cada 64 px -->
        <svg class="reticula-svg" width="100%" height="100%">
          <defs>
            <pattern id="patronCuadricula" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(27, 42, 65, 0.05)" stroke-width="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#patronCuadricula)" />
        </svg>

        <!-- Marcas de grados en los bordes -->
        <div class="marcas-grados-top mono">
          <span>075°O</span>
          <span>060°O</span>
          <span>045°O</span>
          <span>030°O</span>
          <span>015°O</span>
          <span>000°</span>
          <span>015°E</span>
          <span>030°E</span>
        </div>
        <div class="marcas-grados-left mono">
          <span>60°N</span>
          <span>45°N</span>
          <span>30°N</span>
          <span>15°N</span>
          <span>00°</span>
        </div>

        <!-- Arco superior decorativo con altitud y Mach -->
        <svg class="arco-fl350-svg" viewBox="0 0 1440 280" preserveAspectRatio="none">
          <path id="arcoFL350" class="arco-vuelo-guia" d="M 220 230 C 520 90, 920 90, 1220 230" />
          <text class="texto-arco mono">
            <textPath href="#arcoFL350" startOffset="50%" text-anchor="middle">FL350 · M0.84</textPath>
          </text>
        </svg>

        <!-- Miras en cruz en las esquinas -->
        <div class="mira-cruz mira-tl">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(27, 42, 65, 0.40)" stroke-width="1" />
            <path d="M8 0v16M0 8h16" stroke="rgba(27, 42, 65, 0.40)" stroke-width="1" />
          </svg>
        </div>
        <div class="mira-cruz mira-br">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(27, 42, 65, 0.40)" stroke-width="1" />
            <path d="M8 0v16M0 8h16" stroke="rgba(27, 42, 65, 0.40)" stroke-width="1" />
          </svg>
        </div>

        <!-- Bloques sólidos de ciudades -->
        <div class="bloques-ciudades">
          <div #lonRef class="bloque bloque-lon">
            <span class="bloque-codigo">LON</span>
            <span class="bloque-ciudad">LONDRES</span>
            <span class="bloque-coords mono">51°30'N 000°07'O</span>
          </div>
          <div #cphRef class="bloque bloque-cph">
            <span class="bloque-codigo">CPH</span>
            <span class="bloque-ciudad">COPENHAGUE</span>
            <span class="bloque-coords mono">55°40'N 012°34'E</span>
          </div>
          <div #tyoRef class="bloque bloque-tyo">
            <span class="bloque-codigo">TYO</span>
            <span class="bloque-ciudad">TOKIO</span>
            <span class="bloque-coords mono">35°41'N 139°41'E</span>
          </div>
          <div #delRef class="bloque bloque-del">
            <span class="bloque-codigo">DEL</span>
            <span class="bloque-ciudad">NUEVA DELHI</span>
            <span class="bloque-coords mono">28°36'N 077°12'E</span>
          </div>
        </div>

        <!-- Punto BOG con doble anillo y latido suave -->
        <div #bogRef class="punto-bog">
          <div class="anillo-pulso"></div>
          <div class="anillo-exterior"></div>
          <div class="anillo-interior"></div>
          <div class="punto-central"></div>
          <div class="bog-etiquetas">
            <span class="bog-codigo">BOG</span>
            <span class="bog-pais">COLOMBIA</span>
            <span class="bog-coords mono">04°42'N 074°04'O</span>
          </div>
        </div>

        <!-- Rutas punteadas dinámicas desde BOG a cada bloque con waypoints -->
        <svg #rutasSvgRef class="rutas-svg-dinamicas">
          <g class="rutas-base">
            @for (ruta of rutas(); track ruta.destino) {
              <path [attr.id]="'ruta-' + ruta.destino" class="ruta-linea-base" [attr.d]="ruta.d" />
              <rect
                class="waypoint-diamante"
                [attr.x]="ruta.waypoint.x - 4"
                [attr.y]="ruta.waypoint.y - 4"
                width="8"
                height="8"
                [attr.transform]="'rotate(45 ' + ruta.waypoint.x + ' ' + ruta.waypoint.y + ')'"
              />
            }
          </g>
          <!-- Copia de ruta activa que se pinta en terracota al paso del avión -->
          <path #rutaActivaRef class="ruta-linea-activa" d="" />
        </svg>

        <!-- Avión viajero que recorre las rutas secuencialmente -->
        <div #avionRef class="avion-viajero">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
      </div>

      <!-- Barra superior por encima de todo -->
      <header class="barra-superior">
        <a class="marca" routerLink="/login">
          <span class="pastilla-logo">
            <app-logo sobre="claro" />
          </span>
        </a>
        <div class="acciones-nav">
          <app-selector-idioma tono="claro" />
          @if (enlace() === 'registro') {
            <a routerLink="/registro" class="btn-pastilla-auth">{{ 'NAVBAR.REGISTRO' | translate }}</a>
          } @else {
            <a routerLink="/login" class="btn-pastilla-auth">{{ 'NAVBAR.LOGIN' | translate }}</a>
          }
        </div>
      </header>

      <!-- Contenedor centrado para la tarjeta del formulario (y carrusel en login) -->
      <main class="contenedor-principal">
        <ng-content />
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      min-height: 100dvh;
      margin: 0;
      padding: 0;
      background-color: var(--paper);
    }
  `
})
export class AuthShellComponent implements AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);

  readonly enlace = input.required<'login' | 'registro'>();

  @ViewChild('decoracionRef') decoracionRef?: ElementRef<HTMLDivElement>;
  @ViewChild('bogRef') bogRef?: ElementRef<HTMLDivElement>;
  @ViewChild('lonRef') lonRef?: ElementRef<HTMLDivElement>;
  @ViewChild('cphRef') cphRef?: ElementRef<HTMLDivElement>;
  @ViewChild('delRef') delRef?: ElementRef<HTMLDivElement>;
  @ViewChild('tyoRef') tyoRef?: ElementRef<HTMLDivElement>;
  @ViewChild('rutasSvgRef') rutasSvgRef?: ElementRef<SVGSVGElement>;
  @ViewChild('avionRef') avionRef?: ElementRef<HTMLDivElement>;
  @ViewChild('rutaActivaRef') rutaActivaRef?: ElementRef<SVGPathElement>;

  readonly rutas = signal<RutaCalculada[]>([]);
  animacionActiva = false;

  private resizeObserver?: ResizeObserver;
  private rafId?: number;
  private visibilidadListener?: () => void;
  private enPausa = false;

  ngAfterViewInit(): void {
    this.calcularRutas();

    if (typeof ResizeObserver !== 'undefined' && this.decoracionRef?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.calcularRutas();
      });
      this.resizeObserver.observe(this.decoracionRef.nativeElement);
    }

    const reducedMotion = this.esReducedMotion();
    if (reducedMotion) {
      this.animacionActiva = false;
      return;
    }

    this.iniciarAnimacionAvion();
  }

  ngOnDestroy(): void {
    this.animacionActiva = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.resizeObserver?.disconnect();
    if (this.visibilidadListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilidadListener);
    }
  }

  /**
   * Calcula las 4 rutas (LON, CPH, DEL, TYO) desde la posición real de BOG hasta el borde de cada bloque.
   */
  calcularRutas(): void {
    const contenedor = this.decoracionRef?.nativeElement;
    const rectFondo = contenedor?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1440, height: 900 };

    const getCenter = (el?: HTMLElement) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return {
        x: r.left + r.width / 2 - rectFondo.left,
        y: r.top + r.height / 2 - rectFondo.top,
        left: r.left - rectFondo.left,
        right: r.right - rectFondo.left,
        top: r.top - rectFondo.top,
        bottom: r.bottom - rectFondo.top
      };
    };

    const bog = getCenter(this.bogRef?.nativeElement) ?? {
      x: 80,
      y: rectFondo.height * 0.5,
      left: 60,
      right: 100,
      top: rectFondo.height * 0.5 - 20,
      bottom: rectFondo.height * 0.5 + 20
    };

    const lon = getCenter(this.lonRef?.nativeElement) ?? {
      x: 180,
      y: 120,
      left: 0,
      right: 230,
      top: 80,
      bottom: 220
    };

    const cph = getCenter(this.cphRef?.nativeElement) ?? {
      x: rectFondo.width - 180,
      y: 120,
      left: rectFondo.width - 240,
      right: rectFondo.width,
      top: 80,
      bottom: 230
    };

    const del = getCenter(this.delRef?.nativeElement) ?? {
      x: rectFondo.width - 180,
      y: rectFondo.height - 120,
      left: rectFondo.width - 240,
      right: rectFondo.width,
      top: rectFondo.height - 230,
      bottom: rectFondo.height
    };

    const tyo = getCenter(this.tyoRef?.nativeElement) ?? {
      x: 180,
      y: rectFondo.height - 120,
      left: 0,
      right: 230,
      top: rectFondo.height - 240,
      bottom: rectFondo.height
    };

    // Puntos de contacto en el borde de cada bloque y waypoints
    const wpLon = { x: Math.max(lon.right - 25, 140), y: Math.min(lon.bottom - 15, 230) };
    const wpCph = { x: Math.min(cph.left + 25, rectFondo.width - 140), y: Math.min(cph.bottom - 20, 230) };
    const wpDel = { x: Math.min(del.left + 35, rectFondo.width - 140), y: Math.max(del.top + 25, rectFondo.height - 240) };
    const wpTyo = { x: Math.max(tyo.right - 25, 140), y: Math.max(tyo.top + 30, rectFondo.height - 240) };

    const rutasCalculadas: RutaCalculada[] = [
      {
        destino: 'LON',
        waypoint: wpLon,
        d: `M ${bog.x + 8} ${bog.y - 18} C ${bog.x + 15} ${(bog.y + wpLon.y) / 2}, ${wpLon.x - 45} ${wpLon.y + 45}, ${wpLon.x} ${wpLon.y}`
      },
      {
        destino: 'CPH',
        waypoint: wpCph,
        d: `M ${bog.x + 22} ${bog.y - 8} C ${bog.x + (wpCph.x - bog.x) * 0.35} ${bog.y - 140}, ${bog.x + (wpCph.x - bog.x) * 0.7} ${wpCph.y + 60}, ${wpCph.x} ${wpCph.y}`
      },
      {
        destino: 'DEL',
        waypoint: wpDel,
        d: `M ${bog.x + 20} ${bog.y + 12} C ${bog.x + (wpDel.x - bog.x) * 0.32} ${bog.y + 140}, ${bog.x + (wpDel.x - bog.x) * 0.68} ${wpDel.y - 20}, ${wpDel.x} ${wpDel.y}`
      },
      {
        destino: 'TYO',
        waypoint: wpTyo,
        d: `M ${bog.x + 5} ${bog.y + 22} C ${bog.x + 15} ${(bog.y + wpTyo.y) / 2}, ${wpTyo.x + 30} ${wpTyo.y - 45}, ${wpTyo.x} ${wpTyo.y}`
      }
    ];

    this.rutas.set(rutasCalculadas);
  }

  private esReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true
    );
  }

  /**
   * Recorre una ruta a la vez: LON → CPH → DEL → TYO → repite.
   * 5 s por trayecto con 1 s de pausa en cada destino.
   * Ejecutado fuera de Angular Zone con requestAnimationFrame para 60fps sin sobrecarga.
   */
  private iniciarAnimacionAvion(): void {
    this.animacionActiva = true;

    this.ngZone.runOutsideAngular(() => {
      const ordenDestinos: DestinoRuta[] = ['LON', 'CPH', 'DEL', 'TYO'];
      let indiceDestino = 0;
      let estado: 'viajando' | 'pausado' = 'viajando';
      const duracionVuelo = 5000;
      const duracionPausa = 1000;
      let inicioTiempo = performance.now();

      this.visibilidadListener = () => {
        if (typeof document !== 'undefined') {
          this.enPausa = document.hidden;
          if (!this.enPausa) {
            inicioTiempo = performance.now();
          }
        }
      };
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', this.visibilidadListener);
      }

      const frame = (ahora: number) => {
        if (!this.animacionActiva) return;

        if (this.enPausa) {
          this.rafId = requestAnimationFrame(frame);
          return;
        }

        const destinoActual = ordenDestinos[indiceDestino];
        const pathEl = this.rutasSvgRef?.nativeElement.querySelector<SVGPathElement>(`#ruta-${destinoActual}`);
        const avionEl = this.avionRef?.nativeElement;
        const activaEl = this.rutaActivaRef?.nativeElement;

        if (!pathEl || !avionEl || !activaEl) {
          this.rafId = requestAnimationFrame(frame);
          return;
        }

        const totalLength = pathEl.getTotalLength();
        if (totalLength === 0) {
          this.rafId = requestAnimationFrame(frame);
          return;
        }

        const delta = ahora - inicioTiempo;

        if (estado === 'viajando') {
          const t = Math.min(delta / duracionVuelo, 1);
          const dist = t * totalLength;

          const p1 = pathEl.getPointAtLength(dist);
          const p2 = pathEl.getPointAtLength(Math.min(dist + 2, totalLength));
          const angulo = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

          avionEl.style.opacity = '1';
          avionEl.style.transform = `translate(${p1.x - 10}px, ${p1.y - 10}px) rotate(${angulo}deg)`;

          activaEl.setAttribute('d', pathEl.getAttribute('d') || '');
          activaEl.style.strokeDasharray = `${totalLength} ${totalLength}`;
          activaEl.style.strokeDashoffset = `${totalLength - dist}`;
          activaEl.style.opacity = '1';

          if (t >= 1) {
            estado = 'pausado';
            inicioTiempo = ahora;
          }
        } else {
          // Pausa de 1 s en destino mientras el tramo recorrido se desvanece
          const fade = Math.max(1 - (delta / duracionPausa), 0);
          activaEl.style.opacity = String(fade);

          if (delta >= duracionPausa) {
            estado = 'viajando';
            indiceDestino = (indiceDestino + 1) % ordenDestinos.length;
            inicioTiempo = ahora;
            activaEl.style.opacity = '0';
          }
        }

        this.rafId = requestAnimationFrame(frame);
      };

      this.rafId = requestAnimationFrame(frame);
    });
  }
}
