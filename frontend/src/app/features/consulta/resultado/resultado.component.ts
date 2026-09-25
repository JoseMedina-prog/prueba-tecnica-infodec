import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ConsultaStateService } from '../../../core/services/consulta-state.service';
import { IdiomaService } from '../../../core/services/idioma.service';
import { formatearCop, formatearFechaHora, formatearMonto, formatearTasa, localeDe } from '../../../core/utils/formato';
import { PasosIndicadorComponent } from '../../../shared/components/pasos-indicador/pasos-indicador.component';

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [TranslatePipe, PasosIndicadorComponent],
  template: `
    <div class="container py-4 contenedor-resultado">
      <app-pasos-indicador [pasoActual]="3" />

      @if (resultado(); as res) {
        <div class="text-center mb-4">
          <h1 class="h4 fw-bold text-primary mb-1">{{ 'RESULTADO.TITULO' | translate }}</h1>
          <p class="text-muted small mb-0">{{ 'RESULTADO.SUBTITULO' | translate }}</p>
        </div>

        <!-- Nombres traducidos en el front (el resultado no se vuelve a pedir al cambiar el idioma) -->
        @let clavePais = 'LUGARES.PAISES.' + res.pais.codigo;
        @let claveCiudad = 'LUGARES.CIUDADES.' + res.ciudad.id;
        @let claveMoneda = 'LUGARES.MONEDAS.' + res.moneda.codigo;
        @let nombrePais = (clavePais | translate) === clavePais ? res.pais.nombre : (clavePais | translate);
        @let nombreCiudad = (claveCiudad | translate) === claveCiudad ? res.ciudad.nombre : (claveCiudad | translate);
        @let nombreMoneda = (claveMoneda | translate) === claveMoneda ? res.moneda.nombre : (claveMoneda | translate);

        <div aria-live="polite">
          @for (aviso of res.avisos ?? []; track aviso.code) {
            <div class="alert alert-warning small" role="status">{{ 'AVISOS.' + aviso.code | translate }}</div>
          }
        </div>

        <div class="row g-3 mb-4">
          <div class="col-12 col-md-6 col-lg-4">
            <section class="card tarjeta h-100">
              <div class="card-body">
                <h2 class="etiqueta">{{ 'RESULTADO.TARJETA_DESTINO' | translate }}</h2>
                <p class="h5 fw-bold mb-1">{{ nombreCiudad }}</p>
                <p class="text-muted mb-0">{{ nombrePais }}</p>
              </div>
            </section>
          </div>

          <div class="col-12 col-md-6 col-lg-4">
            <section class="card tarjeta h-100">
              <div class="card-body">
                <h2 class="etiqueta">{{ 'RESULTADO.TARJETA_PRESUPUESTO' | translate }}</h2>
                <p class="h5 fw-bold mb-1">{{ presupuestoCop() }}</p>
                <p class="text-muted small mb-0">{{ fecha(res.fecha) }}</p>
              </div>
            </section>
          </div>

          <div class="col-12 col-md-6 col-lg-4">
            <section class="card tarjeta h-100">
              <div class="card-body">
                <h2 class="etiqueta">{{ 'RESULTADO.TARJETA_MONEDA' | translate }}</h2>
                <p class="h5 fw-bold mb-1">{{ nombreMoneda }}</p>
                <p class="text-muted mb-0">{{ res.moneda.simbolo }} · {{ res.moneda.codigo }}</p>
              </div>
            </section>
          </div>

          <div class="col-12 col-md-6 col-lg-5">
            <section class="card tarjeta h-100">
              <div class="card-body">
                <h2 class="etiqueta">{{ 'RESULTADO.TARJETA_CLIMA' | translate }}</h2>
                @if (res.clima; as clima) {
                  <div class="d-flex align-items-center gap-3">
                    @if (clima.icono) {
                      <img
                        [src]="'https://openweathermap.org/img/wn/' + clima.icono + '@2x.png'"
                        [alt]="clima.descripcion"
                        width="64"
                        height="64"
                        class="icono-clima"
                      />
                    }
                    <div>
                      <p class="h3 fw-bold mb-0">{{ temperatura(clima.temperatura) }} °C</p>
                      <p class="text-capitalize mb-0" [title]="'RESULTADO.CLIMA_NOTA' | translate">
                        {{ clima.descripcion }}
                      </p>
                    </div>
                  </div>
                  <p class="nota mt-3 mb-0">{{ 'RESULTADO.CLIMA_NOTA' | translate }}</p>
                } @else {
                  <p class="no-disponible mb-0">{{ 'RESULTADO.CLIMA_NO_DISPONIBLE' | translate }}</p>
                }
              </div>
            </section>
          </div>

          <div class="col-12 col-lg-7">
            <section class="card tarjeta tarjeta-destacada h-100">
              <div class="card-body">
                <h2 class="etiqueta">{{ 'RESULTADO.TARJETA_CONVERSION' | translate }}</h2>
                @if (res.conversion; as conversion) {
                  <p class="valor-convertido mb-2">{{ res.moneda.simbolo }} {{ valorConvertido() }}</p>
                  <dl class="row small mb-0">
                    <dt class="col-sm-5 fw-normal text-muted">{{ 'RESULTADO.TASA_APLICADA' | translate }}</dt>
                    <dd class="col-sm-7 fw-semibold">{{ tasa() }}</dd>
                    <dt class="col-sm-5 fw-normal text-muted">{{ 'RESULTADO.FECHA_TASA' | translate }}</dt>
                    <dd class="col-sm-7 mb-0">{{ fecha(conversion.fecha_tasa) }}</dd>
                  </dl>
                  @if (conversion.fuente === 'respaldo') {
                    <span class="badge text-bg-warning mt-2">
                      {{ 'RESULTADO.TASA_RESPALDO' | translate }} · {{ fecha(conversion.fecha_tasa) }}
                    </span>
                  }
                } @else {
                  <p class="no-disponible mb-0">{{ 'RESULTADO.CONVERSION_NO_DISPONIBLE' | translate }}</p>
                }
              </div>
            </section>
          </div>
        </div>

        <div class="acciones-flujo">
          <button type="button" class="btn btn-outline-secondary" (click)="volverAtras()">
            {{ 'DESTINO.ATRAS' | translate }}
          </button>
          <button type="button" class="btn btn-primary" (click)="volverAlInicio()">
            {{ 'RESULTADO.VOLVER_INICIO' | translate }}
          </button>
        </div>
      }
    </div>
  `
})
export class ResultadoComponent {
  private readonly consultaState = inject(ConsultaStateService);
  private readonly idiomaService = inject(IdiomaService);
  private readonly router = inject(Router);

  readonly resultado = this.consultaState.resultado;
  private readonly idioma = this.idiomaService.idiomaActual;

  readonly presupuestoCop = computed(() => {
    const res = this.resultado();
    return res ? formatearCop(res.presupuesto_cop, this.idioma()) : '';
  });

  readonly valorConvertido = computed(() => {
    const res = this.resultado();
    return res?.conversion ? formatearMonto(res.conversion.valor, res.moneda.codigo, this.idioma()) : '';
  });

  readonly tasa = computed(() => {
    const res = this.resultado();
    return res?.conversion ? formatearTasa(res.conversion.tasa, res.moneda.codigo, this.idioma()) : '';
  });

  fecha(fechaIso: string | null | undefined): string {
    return formatearFechaHora(fechaIso, this.idioma());
  }

  temperatura(valor: number): string {
    return new Intl.NumberFormat(localeDe(this.idioma()), { maximumFractionDigits: 1 }).format(valor);
  }

  volverAtras(): void {
    this.router.navigate(['/consulta/presupuesto']);
  }

  volverAlInicio(): void {
    this.consultaState.reiniciar();
    this.router.navigate(['/consulta/destino']);
  }
}
