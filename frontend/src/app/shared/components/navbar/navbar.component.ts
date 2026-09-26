import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LogoComponent } from '../logo/logo.component';
import { SelectorIdiomaComponent } from '../selector-idioma/selector-idioma.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LogoComponent, SelectorIdiomaComponent],
  template: `
    <nav class="navbar navbar-expand-md barra" data-bs-theme="dark">
      <!-- Mismo ancho que el contenido de las páginas para que el logo quede alineado -->
      <div class="container contenedor-resultado">
        <a class="navbar-brand" routerLink="/"><app-logo sobre="tinta" /></a>

        <button
          class="navbar-toggler"
          type="button"
          (click)="toggleMenu()"
          [attr.aria-expanded]="!isMenuCollapsed()"
          aria-controls="menuPrincipal"
          [attr.aria-label]="'NAVBAR.MENU' | translate"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div id="menuPrincipal" class="collapse navbar-collapse" [class.show]="!isMenuCollapsed()">
          <ul class="navbar-nav me-auto">
            @if (authService.estaAutenticado()) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/consulta" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="cerrarMenuMovil()">
                  {{ 'NAVBAR.CONSULTA' | translate }}
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/historial" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="cerrarMenuMovil()">
                  {{ 'NAVBAR.HISTORIAL' | translate }}
                </a>
              </li>
            }
          </ul>

          <div class="acciones">
            <app-selector-idioma />

            @if (authService.estaAutenticado()) {
              @if (authService.usuario(); as user) {
                <span class="usuario">{{ user.nombre }}</span>
              }
              <button type="button" class="btn btn-sm btn-outline-light" (click)="logout()">
                {{ 'NAVBAR.LOGOUT' | translate }}
              </button>
            } @else {
              <a routerLink="/login" class="nav-link" (click)="cerrarMenuMovil()">{{ 'NAVBAR.LOGIN' | translate }}</a>
              <a routerLink="/registro" class="nav-link" (click)="cerrarMenuMovil()">{{ 'NAVBAR.REGISTRO' | translate }}</a>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: `
    .barra {
      background: var(--ink);
      padding-block: 0.6rem;
      --bs-navbar-color: var(--muted-on-ink);
      --bs-navbar-hover-color: var(--paper);
      --bs-navbar-active-color: var(--paper);
    }
    .navbar-brand {
      margin-right: 1.5rem;
    }
    .nav-link.active {
      text-decoration: underline;
      text-decoration-color: var(--accent-on-ink);
      text-decoration-thickness: 2px;
      text-underline-offset: 0.45rem;
    }
    .acciones {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem 1rem;
      padding-block: 0.5rem;
    }
    .acciones .nav-link {
      color: var(--muted-on-ink);
    }
    .acciones .nav-link:hover {
      color: var(--paper);
    }
    .barra :focus-visible {
      outline-color: var(--accent-on-ink);
    }
    .usuario {
      color: var(--paper);
      font-size: 0.9rem;
    }
  `
})
export class NavbarComponent {
  readonly authService = inject(AuthService);

  readonly isMenuCollapsed = signal<boolean>(true);

  toggleMenu(): void {
    this.isMenuCollapsed.update((val) => !val);
  }

  cerrarMenuMovil(): void {
    this.isMenuCollapsed.set(true);
  }

  logout(): void {
    this.cerrarMenuMovil();
    this.authService.logout().subscribe();
  }
}
