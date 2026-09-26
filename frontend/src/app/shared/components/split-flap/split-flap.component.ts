import { Component, DestroyRef, OnInit, effect, inject, input, signal } from '@angular/core';

interface CeldaFlap {
  caracter: string;
  volteando: boolean;
}

@Component({
  selector: 'app-split-flap',
  standalone: true,
  template: `
    <span class="visually-hidden">{{ texto() }}</span>
    <span class="split-flap-display" aria-hidden="true">
      @for (celda of celdas(); track $index) {
        <span class="flap-celda" [class.volteando]="celda.volteando">
          <span class="flap-caracter">{{ celda.caracter }}</span>
        </span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-block;
      vertical-align: middle;
    }
    .split-flap-display {
      display: inline-flex;
      align-items: center;
      perspective: 300px;
    }
    .flap-celda {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 0.62em;
      transform-style: preserve-3d;
    }
    .flap-caracter {
      display: inline-block;
      transform-origin: 50% 50%;
    }
    .flap-celda.volteando .flap-caracter {
      animation: flap-giro 120ms ease-in-out;
    }
    @keyframes flap-giro {
      0% {
        transform: rotateX(0deg);
        opacity: 1;
      }
      50% {
        transform: rotateX(-90deg);
        opacity: 0.6;
      }
      100% {
        transform: rotateX(0deg);
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .flap-celda.volteando .flap-caracter {
        animation: none !important;
        transform: none !important;
      }
    }
  `
})
export class SplitFlapComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private timeouts: any[] = [];

  /** Texto real que debe mostrar y anunciar el lector de pantalla */
  readonly texto = input.required<string>();
  /** Desfase opcional de inicio para sincronizar fila por fila */
  readonly delayMs = input<number>(0);
  /** Señal de cambio para re-disparar la animación (ej. salida.cambios) */
  readonly trigger = input<any>();

  readonly celdas = signal<CeldaFlap[]>([]);

  private inicializado = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.limpiarTimeouts());

    effect(() => {
      const txt = this.texto();
      // Registramos trigger para reaccionar a sus cambios
      this.trigger();
      if (this.inicializado) {
        this.iniciarAnimacion(txt);
      }
    });
  }

  ngOnInit(): void {
    this.iniciarAnimacion(this.texto());
    this.inicializado = true;
  }

  private esReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true
    );
  }

  private limpiarTimeouts(): void {
    this.timeouts.forEach((t) => clearTimeout(t));
    this.timeouts = [];
  }

  private iniciarAnimacion(textoFinal: string): void {
    this.limpiarTimeouts();

    if (this.esReducedMotion()) {
      this.celdas.set(
        textoFinal.split('').map((c) => ({
          caracter: c,
          volteando: false
        }))
      );
      return;
    }

    const chars = textoFinal.split('');
    const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digitos = '0123456789';

    const charAleatorio = (base: string): string => {
      if (base === ' ' || base === ':') return base;
      if (!isNaN(Number(base)) && base.trim() !== '') {
        return digitos[Math.floor(Math.random() * digitos.length)];
      }
      return alfabeto[Math.floor(Math.random() * alfabeto.length)];
    };

    // Estado inicial: 1er caracter aleatorio
    const estadoCeldas: CeldaFlap[] = chars.map((c) => ({
      caracter: c === ' ' || c === ':' ? c : charAleatorio(c),
      volteando: c !== ' ' && c !== ':'
    }));
    this.celdas.set([...estadoCeldas]);

    const delayBase = this.delayMs();
    const numFlips = 3;
    const duracionPaso = 90;

    chars.forEach((realChar, i) => {
      if (realChar === ' ' || realChar === ':') {
        estadoCeldas[i] = { caracter: realChar, volteando: false };
        return;
      }

      const delayChar = delayBase + i * 20;

      for (let paso = 0; paso < numFlips; paso++) {
        const t = setTimeout(() => {
          estadoCeldas[i] = {
            caracter: charAleatorio(realChar),
            volteando: true
          };
          this.celdas.set([...estadoCeldas]);
        }, delayChar + paso * duracionPaso);
        this.timeouts.push(t);
      }

      const finalTimeout = setTimeout(() => {
        estadoCeldas[i] = {
          caracter: realChar,
          volteando: false
        };
        this.celdas.set([...estadoCeldas]);
      }, delayChar + numFlips * duracionPaso);
      this.timeouts.push(finalTimeout);
    });
  }
}
