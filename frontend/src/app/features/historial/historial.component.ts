import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ConsultaResultado } from '../../core/models';
import { Ciudad, Pais } from '../../core/models/pais.model';
import { ConsultaService } from '../../core/services/consulta.service';
import { ConsultaStateService } from '../../core/services/consulta-state.service';
import { IdiomaService } from '../../core/services/idioma.service';
import { TalonViajeComponent } from '../../shared/components/talon-viaje/talon-viaje.component';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [RouterLink, TranslatePipe, TalonViajeComponent],
  template: `
    <div class="container py-4 contenedor-resultado">
      <header class="encabezado-pantalla d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-3">
        <div>
          <h1 class="titulo-pantalla">{{ 'HISTORIAL.TITULO' | translate }}</h1>
          <p class="bajada">{{ 'HISTORIAL.SUBTITULO' | translate }}</p>
        </div>
        @if (!cargando() && consultas().length > 0) {
          <a routerLink="/consulta/destino" class="btn btn-primary">{{ 'HISTORIAL.NUEVA_CONSULTA' | translate }}</a>
        }
      </header>

      @if (cargando()) {
        <p class="cargando py-4" role="status">
          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          {{ 'HISTORIAL.CARGANDO' | translate }}
        </p>
      } @else if (error()) {
        <div class="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
          <span>{{ 'HISTORIAL.ERROR_CARGA' | translate }}</span>
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="cargarHistorial()">
            {{ 'DESTINO.REINTENTAR' | translate }}
          </button>
        </div>
      } @else if (consultas().length === 0) {
        <section class="vacio">
          <p class="mono vacio-codigo" aria-hidden="true">--- → ---</p>
          <h2 class="h4">{{ 'HISTORIAL.VACIO' | translate }}</h2>
          <p class="bajada">{{ 'HISTORIAL.VACIO_DETALLE' | translate }}</p>
          <a routerLink="/consulta/destino" class="btn btn-primary">{{ 'HISTORIAL.PRIMERA_CONSULTA' | translate }}</a>
        </section>
      } @else {
        <!-- Talones tipo pasabordo: 2 columnas desde 992px, 1 columna por debajo -->
        <ul class="talones">
          @for (item of consultas(); track item.id; let primero = $first) {
            <li>
              <app-talon-viaje [consulta]="item" [destacado]="primero" (repetir)="repetirConsulta($event)" />
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    .talones {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    @media (min-width: 992px) {
      .talones {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .vacio {
      padding: 3rem 1.5rem;
      text-align: center;
      background: var(--surface);
      border: 1px dashed var(--line-strong);
      border-radius: var(--radius-lg);
    }
    .vacio-codigo {
      font-size: 1.5rem;
      color: var(--muted);
      letter-spacing: 0.1em;
    }
    .vacio .bajada {
      max-width: 28rem;
      margin: 0 auto 1.5rem;
    }
  `
})
export class HistorialComponent {
  private readonly consultaService = inject(ConsultaService);
  private readonly consultaState = inject(ConsultaStateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly idioma = inject(IdiomaService).idiomaActual;

  readonly consultas = signal<ConsultaResultado[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);

  private peticion?: Subscription;

  constructor() {
    // Emite el idioma actual al iniciar y en cada cambio: el backend devuelve el historial traducido.
    toObservable(this.idioma)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarHistorial());
  }

  cargarHistorial(): void {
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.error.set(false);

    this.peticion = this.consultaService
      .getHistorial()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.consultas.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(true);
          this.cargando.set(false);
        }
      });
  }

  repetirConsulta(item: ConsultaResultado): void {
    const pais: Pais = {
      id: item.pais.id,
      codigo: item.pais.codigo,
      nombre: item.pais.nombre,
      moneda: {
        codigo: item.moneda.codigo,
        nombre: item.moneda.nombre,
        simbolo: item.moneda.simbolo
      }
    };
    const ciudad: Ciudad = {
      id: item.ciudad.id,
      nombre: item.ciudad.nombre
    };
    this.consultaState.setDestino(pais, ciudad);
    this.consultaState.setPresupuesto(String(item.presupuesto_cop));
    this.consultaState.setResultado(null);
    this.router.navigate(['/consulta/presupuesto']);
  }
}
