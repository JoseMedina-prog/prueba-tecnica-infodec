import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ConsultaResultado } from '../../core/models';
import { ConsultaService } from '../../core/services/consulta.service';
import { IdiomaService } from '../../core/services/idioma.service';
import { formatearCop, formatearFechaHora, formatearMonto, formatearTasa, localeDe } from '../../core/utils/formato';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="container py-4 contenedor-resultado">
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h1 class="h4 fw-bold text-primary mb-1">{{ 'HISTORIAL.TITULO' | translate }}</h1>
          <p class="text-muted small mb-0">{{ 'HISTORIAL.SUBTITULO' | translate }}</p>
        </div>
        <a routerLink="/consulta/destino" class="btn btn-primary">{{ 'HISTORIAL.NUEVA_CONSULTA' | translate }}</a>
      </div>

      @if (cargando()) {
        <div class="text-center py-5 text-muted" role="status">
          <span class="spinner-border text-primary mb-2" aria-hidden="true"></span>
          <p class="small mb-0">{{ 'HISTORIAL.CARGANDO' | translate }}</p>
        </div>
      } @else if (error()) {
        <div class="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
          <span class="small">{{ 'HISTORIAL.ERROR_CARGA' | translate }}</span>
          <button type="button" class="btn btn-outline-danger btn-sm" (click)="cargarHistorial()">
            {{ 'DESTINO.REINTENTAR' | translate }}
          </button>
        </div>
      } @else if (consultas().length === 0) {
        <div class="card tarjeta text-center">
          <div class="card-body py-5">
            <p class="h5 fw-semibold mb-3">{{ 'HISTORIAL.VACIO' | translate }}</p>
            <a routerLink="/consulta/destino" class="btn btn-primary">{{ 'HISTORIAL.NUEVA_CONSULTA' | translate }}</a>
          </div>
        </div>
      } @else {
        <!-- Tabla: pantallas medianas en adelante -->
        <div class="card tarjeta d-none d-md-block">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">{{ 'HISTORIAL.TABLA_FECHA' | translate }}</th>
                <th scope="col">{{ 'HISTORIAL.TABLA_DESTINO' | translate }}</th>
                <th scope="col" class="text-end">{{ 'HISTORIAL.TABLA_PRESUPUESTO' | translate }}</th>
                <th scope="col">{{ 'HISTORIAL.TABLA_CLIMA' | translate }}</th>
                <th scope="col" class="text-end">{{ 'HISTORIAL.TABLA_CONVERSION' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (item of consultas(); track item.id) {
                <tr>
                  <td class="small">{{ fecha(item.fecha) }}</td>
                  <td>
                    <div class="fw-semibold">{{ item.ciudad.nombre }}</div>
                    <div class="small text-muted">{{ item.pais.nombre }}</div>
                  </td>
                  <td class="text-end text-nowrap">{{ cop(item.presupuesto_cop) }}</td>
                  <td>
                    @if (item.clima; as clima) {
                      <div class="fw-semibold">{{ temperatura(clima.temperatura) }} °C</div>
                      <div class="small text-muted text-capitalize">{{ clima.descripcion }}</div>
                    } @else {
                      <span class="text-muted">—</span>
                      <span class="small text-muted d-block">{{ 'RESULTADO.CLIMA_NO_DISPONIBLE' | translate }}</span>
                    }
                  </td>
                  <td class="text-end">
                    @if (item.conversion; as conversion) {
                      <div class="fw-semibold text-primary text-nowrap">
                        {{ item.moneda.simbolo }} {{ monto(conversion.valor, item.moneda.codigo) }}
                      </div>
                      <div class="small text-muted text-nowrap">{{ tasa(conversion.tasa, item.moneda.codigo) }}</div>
                    } @else {
                      <span class="text-muted">—</span>
                      <span class="small text-muted d-block">{{ 'RESULTADO.CONVERSION_NO_DISPONIBLE' | translate }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Tarjetas apiladas: celular -->
        <ul class="list-unstyled d-md-none d-flex flex-column gap-3 mb-0">
          @for (item of consultas(); track item.id) {
            <li class="card tarjeta">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
                  <div>
                    <p class="fw-semibold mb-0">{{ item.ciudad.nombre }}</p>
                    <p class="small text-muted mb-0">{{ item.pais.nombre }}</p>
                  </div>
                  <span class="small text-muted text-end">{{ fecha(item.fecha) }}</span>
                </div>
                <dl class="row small mb-0 g-0">
                  <dt class="col-5 fw-normal text-muted">{{ 'HISTORIAL.TABLA_PRESUPUESTO' | translate }}</dt>
                  <dd class="col-7 text-end">{{ cop(item.presupuesto_cop) }}</dd>

                  <dt class="col-5 fw-normal text-muted">{{ 'HISTORIAL.TABLA_CLIMA' | translate }}</dt>
                  <dd class="col-7 text-end">
                    @if (item.clima; as clima) {
                      {{ temperatura(clima.temperatura) }} °C · <span class="text-capitalize">{{ clima.descripcion }}</span>
                    } @else {
                      — {{ 'RESULTADO.CLIMA_NO_DISPONIBLE' | translate }}
                    }
                  </dd>

                  <dt class="col-5 fw-normal text-muted">{{ 'HISTORIAL.TABLA_CONVERSION' | translate }}</dt>
                  <dd class="col-7 text-end mb-0">
                    @if (item.conversion; as conversion) {
                      <span class="fw-semibold text-primary">{{ item.moneda.simbolo }} {{ monto(conversion.valor, item.moneda.codigo) }}</span>
                      <span class="d-block text-muted">{{ tasa(conversion.tasa, item.moneda.codigo) }}</span>
                    } @else {
                      — {{ 'RESULTADO.CONVERSION_NO_DISPONIBLE' | translate }}
                    }
                  </dd>
                </dl>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class HistorialComponent {
  private readonly consultaService = inject(ConsultaService);
  private readonly idiomaService = inject(IdiomaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly idioma = this.idiomaService.idiomaActual;

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

  fecha(fechaIso: string): string {
    return formatearFechaHora(fechaIso, this.idioma());
  }

  cop(valor: number): string {
    return formatearCop(valor, this.idioma());
  }

  monto(valor: number, codigo: string): string {
    return formatearMonto(valor, codigo, this.idioma());
  }

  tasa(valor: number, codigo: string): string {
    return formatearTasa(valor, codigo, this.idioma());
  }

  temperatura(valor: number): string {
    return new Intl.NumberFormat(localeDe(this.idioma()), { maximumFractionDigits: 1 }).format(valor);
  }
}
