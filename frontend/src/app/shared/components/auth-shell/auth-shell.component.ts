import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LogoComponent } from '../logo/logo.component';
import { SelectorIdiomaComponent } from '../selector-idioma/selector-idioma.component';
import { TableroSalidasComponent } from '../tablero-salidas/tablero-salidas.component';

/**
 * Pantalla dividida de login y registro (sin la navbar global):
 * a la izquierda el tablero de salidas azul pegado a los bordes, a la derecha el formulario ocupando todo el alto.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LogoComponent, SelectorIdiomaComponent, TableroSalidasComponent],
  template: `
    <div class="shell">
      <aside class="panel-tinta">
        <a class="marca" routerLink="/login"><app-logo sobre="tinta" /></a>
        <app-tablero-salidas />
      </aside>

      <section class="lado">
        <header class="barra">
          <app-selector-idioma tono="claro" />
          @if (enlace() === 'registro') {
            <a routerLink="/registro" class="enlace-alterno">{{ 'NAVBAR.REGISTRO' | translate }}</a>
          } @else {
            <a routerLink="/login" class="enlace-alterno">{{ 'NAVBAR.LOGIN' | translate }}</a>
          }
        </header>
        <div class="centro">
          <div class="contenido">
            <ng-content />
          </div>
        </div>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }
    .shell {
      display: grid;
      grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
      min-height: 100vh;
      width: 100%;
      margin: 0;
      padding: 0;
    }
    .panel-tinta {
      position: sticky;
      top: 0;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      height: 100vh;
      margin: 0;
      padding: 2rem 2.25rem 1.75rem;
      background: var(--ink);
      border: none;
      border-radius: 0;
      box-shadow: none;
    }
    .marca {
      align-self: flex-start;
      text-decoration: none;
    }
    .marca:focus-visible {
      outline-color: var(--accent-on-ink);
    }
    .lado {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 100vh;
      margin: 0;
      padding: 0;
      background: var(--paper);
    }
    .barra {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 1.25rem;
      padding: 1.5rem 2rem 0;
    }
    .enlace-alterno {
      color: var(--ink);
      font-weight: 600;
      text-decoration: underline;
      text-decoration-color: var(--line-strong);
      text-underline-offset: 4px;
    }
    .enlace-alterno:hover {
      text-decoration-color: var(--accent);
    }
    .centro {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem 3rem;
    }
    .contenido {
      width: 100%;
      max-width: 25rem;
    }
    @media (max-width: 767.98px) {
      .shell {
        grid-template-columns: 1fr;
        min-height: 100vh;
      }
      .panel-tinta {
        position: static;
        height: auto;
        min-height: auto;
        width: 100%;
        margin: 0;
        border: none;
        border-radius: 0;
        gap: 1rem;
        padding: 1.1rem 1.25rem 0.5rem;
      }
      .lado {
        min-height: auto;
        flex: 1;
        width: 100%;
        margin: 0;
      }
      .barra {
        justify-content: space-between;
        padding: 1rem 1.25rem 0;
      }
      .centro {
        align-items: flex-start;
        padding: 1.5rem 1.25rem 3rem;
      }
    }
  `
})
export class AuthShellComponent {
  /** Enlace que se ofrece arriba a la derecha: a registro desde login y viceversa. */
  readonly enlace = input.required<'login' | 'registro'>();
}
