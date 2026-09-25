import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { IdiomaService } from '../../../core/services/idioma.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" routerLink="/">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-airplane-fill" viewBox="0 0 16 16">
            <path d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849"/>
          </svg>
          <span>{{ 'APP.TITLE' | translate }}</span>
        </a>

        <!-- Botón responsive para móvil -->
        <button
          class="navbar-toggler"
          type="button"
          (click)="toggleMenu()"
          [attr.aria-expanded]="!isMenuCollapsed()"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" [class.show]="!isMenuCollapsed()">
          <!-- Menú central / izquierdo -->
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            @if (authService.estaAutenticado()) {
              <li class="nav-item">
                <a
                  class="nav-link"
                  routerLink="/consulta"
                  routerLinkActive="active"
                  (click)="cerrarMenuMovil()"
                >
                  {{ 'APP.TITLE' | translate }}
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  routerLink="/historial"
                  routerLinkActive="active"
                  (click)="cerrarMenuMovil()"
                >
                  {{ 'NAVBAR.HISTORIAL' | translate }}
                </a>
              </li>
            }
          </ul>

          <!-- Menú derecho: selector de idioma y sesión -->
          <div class="d-flex flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-3 mt-3 mt-lg-0">
            <!-- Selector de Idioma -->
            <div class="btn-group btn-group-sm" role="group" aria-label="Idioma">
              <button
                type="button"
                class="btn"
                [class.btn-light]="idiomaService.idiomaActual() === 'es'"
                [class.btn-outline-light]="idiomaService.idiomaActual() !== 'es'"
                (click)="cambiarIdioma('es')"
              >
                ES
              </button>
              <button
                type="button"
                class="btn"
                [class.btn-light]="idiomaService.idiomaActual() === 'de'"
                [class.btn-outline-light]="idiomaService.idiomaActual() !== 'de'"
                (click)="cambiarIdioma('de')"
              >
                DE
              </button>
            </div>

            <!-- Autenticación -->
            @if (authService.estaAutenticado()) {
              <div class="d-flex align-items-center gap-2">
                @if (authService.usuario(); as user) {
                  <span class="text-white small fw-medium">
                    {{ user.nombre }}
                  </span>
                }
                <button
                  type="button"
                  class="btn btn-outline-light btn-sm"
                  (click)="logout()"
                >
                  {{ 'NAVBAR.LOGOUT' | translate }}
                </button>
              </div>
            } @else {
              <div class="d-flex align-items-center gap-2">
                <a
                  routerLink="/login"
                  class="btn btn-outline-light btn-sm"
                  (click)="cerrarMenuMovil()"
                >
                  {{ 'NAVBAR.LOGIN' | translate }}
                </a>
                <a
                  routerLink="/registro"
                  class="btn btn-light btn-sm text-primary fw-semibold"
                  (click)="cerrarMenuMovil()"
                >
                  {{ 'NAVBAR.REGISTRO' | translate }}
                </a>
              </div>
            }
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  readonly idiomaService = inject(IdiomaService);
  private readonly router = inject(Router);

  readonly isMenuCollapsed = signal<boolean>(true);

  toggleMenu(): void {
    this.isMenuCollapsed.update((val) => !val);
  }

  cerrarMenuMovil(): void {
    this.isMenuCollapsed.set(true);
  }

  cambiarIdioma(lang: 'es' | 'de'): void {
    this.idiomaService.cambiarIdioma(lang);
  }

  logout(): void {
    this.cerrarMenuMovil();
    this.authService.logout().subscribe();
  }
}
