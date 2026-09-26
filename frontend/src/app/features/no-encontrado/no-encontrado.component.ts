import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

/**
 * Página 404 (ruta comodín). Se ve como una fila cancelada del tablero de salidas
 * y ofrece volver al historial con sesión o al inicio sin ella.
 */
@Component({
  selector: 'app-no-encontrado',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="container contenedor-flujo pagina-404" aria-labelledby="titulo-404">
      <div class="tablero">
        <header class="tablero-cabecera" aria-hidden="true">
          <span>{{ 'TABLERO.TITULO' | translate }}</span>
          <span class="mono">COP → ???</span>
        </header>

        <div class="fila" aria-hidden="true">
          <span class="mono">--:--</span>
          <span class="mono codigo">404</span>
          <span class="mono estado">{{ 'NO_ENCONTRADO.ESTADO' | translate }}</span>
        </div>

        <div class="cuerpo">
          <p class="mono puerta-mono">{{ 'NO_ENCONTRADO.PUERTA' | translate }}</p>
          <h1 id="titulo-404" class="mono titulo-vuelo">{{ 'NO_ENCONTRADO.TITULO' | translate }}</h1>
          <p class="subtitulo">{{ 'NO_ENCONTRADO.SUBTITULO' | translate }}</p>

          @if (authService.estaAutenticado()) {
            <a routerLink="/historial" class="btn btn-primary btn-accion">
              {{ 'NO_ENCONTRADO.VOLVER_HISTORIAL' | translate }}
            </a>
          } @else {
            <a routerLink="/login" class="btn btn-primary btn-accion">
              {{ 'NO_ENCONTRADO.IR_INICIO' | translate }}
            </a>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .pagina-404 {
      padding-block: 3rem 4rem;
    }
    .tablero {
      background: var(--ink);
      color: var(--paper);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .tablero-cabecera {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.5rem 0.75rem;
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .tablero-cabecera .mono {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--accent-on-ink);
    }
    .fila {
      display: grid;
      grid-template-columns: 4rem 4rem minmax(0, 1fr);
      align-items: center;
      gap: 0.5rem;
      padding: 0.8rem 1.5rem;
      border-block: 1px solid color-mix(in srgb, var(--paper) 14%, transparent);
    }
    .codigo {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: var(--accent-on-ink);
    }
    .estado {
      justify-self: end;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--accent-on-ink);
    }
    .cuerpo {
      padding: 2.25rem 1.5rem 2.5rem;
    }
    .puerta-mono {
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted-on-ink);
    }
    .titulo-vuelo {
      margin: 0 0 0.75rem;
      font-size: clamp(1.6rem, 5vw, 2.3rem);
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--paper);
    }
    .subtitulo {
      max-width: 30rem;
      margin: 0 0 1.75rem;
      color: var(--muted-on-ink);
    }
    .btn-accion:focus-visible {
      outline-color: var(--accent-on-ink);
    }
    @media (max-width: 575.98px) {
      .pagina-404 {
        padding-block: 1.5rem 3rem;
      }
      .tablero-cabecera,
      .fila,
      .cuerpo {
        padding-inline: 1.1rem;
      }
      .fila {
        grid-template-columns: 3.4rem 3.4rem minmax(0, 1fr);
      }
    }
  `
})
export class NoEncontradoComponent {
  readonly authService = inject(AuthService);
}
