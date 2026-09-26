import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map, skip } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

/** Rutas con pantalla dividida propia (tablero + formulario), sin la navbar global. */
const RUTAS_SIN_NAVBAR = ['/login', '/registro'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly router = inject(Router);
  private readonly contenido = viewChild.required<ElementRef<HTMLElement>>('contenido');

  private readonly finDeNavegacion$ = this.router.events.pipe(filter((e) => e instanceof NavigationEnd));

  readonly mostrarNavbar = toSignal(
    this.finDeNavegacion$.pipe(map(() => !this.esRutaSinNavbar(this.router.url))),
    { initialValue: !this.esRutaSinNavbar(inject(DOCUMENT).location.pathname) }
  );

  constructor() {
    // Al cambiar de pantalla, el foco pasa al contenido principal: quien navega con teclado
    // o lector de pantalla sigue desde la nueva pantalla y no desde un botón que ya no existe.
    this.finDeNavegacion$
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this.contenido().nativeElement.focus());
  }

  private esRutaSinNavbar(url: string): boolean {
    return RUTAS_SIN_NAVBAR.some((ruta) => url === ruta || url.startsWith(ruta + '?'));
  }
}
