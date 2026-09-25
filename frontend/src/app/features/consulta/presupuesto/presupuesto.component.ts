import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiHttpError } from '../../../core/models';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { ConsultaStateService } from '../../../core/services/consulta-state.service';
import { ConsultaService } from '../../../core/services/consulta.service';
import { IdiomaService } from '../../../core/services/idioma.service';
import { formatearCop, normalizarPresupuesto } from '../../../core/utils/formato';
import { AlertaErrorComponent } from '../../../shared/components/alerta-error/alerta-error.component';
import { PasosIndicadorComponent } from '../../../shared/components/pasos-indicador/pasos-indicador.component';
import { presupuestoValidator, validarPresupuesto } from './presupuesto.validator';

/** Clave de traducción para cada error del validador. */
const MENSAJES_ERROR: Record<string, string> = {
  requerido: 'PRESUPUESTO.ERROR_REQUERIDO',
  formatoInvalido: 'PRESUPUESTO.ERROR_FORMATO',
  maxDecimales: 'PRESUPUESTO.ERROR_MAX_DECIMALES',
  mayorQueCero: 'PRESUPUESTO.ERROR_MAYOR_CERO',
  maximoExcedido: 'PRESUPUESTO.ERROR_MAXIMO'
};

@Component({
  selector: 'app-presupuesto',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, PasosIndicadorComponent, AlertaErrorComponent],
  template: `
    <div class="container py-4 contenedor-flujo">
      <app-pasos-indicador [pasoActual]="2" />

      <div class="card tarjeta">
        <div class="card-body p-4 p-md-5">
          <div class="text-center mb-4">
            <h1 class="h4 fw-bold text-primary mb-1">{{ 'PRESUPUESTO.TITULO' | translate }}</h1>
            <p class="text-muted small mb-0">{{ 'PRESUPUESTO.SUBTITULO' | translate }}</p>
          </div>

          @if (pais() && ciudad()) {
            <div class="resumen-destino mb-4">
              <div>
                <div class="etiqueta">{{ 'PRESUPUESTO.RESUMEN_DESTINO' | translate }}</div>
                <div class="fw-semibold">{{ ciudad()!.nombre }}, {{ pais()!.nombre }}</div>
              </div>
              <span class="badge text-bg-light border">{{ pais()!.moneda.simbolo }} {{ pais()!.moneda.codigo }}</span>
            </div>
          }

          @if (errorHttp()) {
            <app-alerta-error [error]="errorHttp()" />
          }

          <form [formGroup]="form" (ngSubmit)="consultar()" novalidate>
            <div class="mb-4">
              <label for="presupuestoInput" class="form-label fw-semibold">
                {{ 'PRESUPUESTO.CAMPO_LABEL' | translate }}
              </label>
              <div class="input-group">
                <span class="input-group-text">COP</span>
                <input
                  id="presupuestoInput"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  class="form-control"
                  placeholder="1500000"
                  formControlName="presupuesto"
                  [class.is-invalid]="mensajeError() || errorServidor()"
                  [attr.aria-invalid]="!!(mensajeError() || errorServidor())"
                  aria-describedby="presupuestoAyuda presupuestoError"
                  (input)="limpiarErroresServidor()"
                />
              </div>
              <div id="presupuestoAyuda" class="form-text">{{ 'PRESUPUESTO.AYUDA' | translate }}</div>

              <div id="presupuestoError" class="invalid-feedback d-block" aria-live="polite">
                @if (errorServidor(); as mensaje) {
                  {{ mensaje }}
                } @else if (mensajeError(); as clave) {
                  {{ clave | translate }}
                }
              </div>

              @if (vistaPrevia(); as previa) {
                <div class="info-moneda mt-2">
                  <span class="text-muted">{{ 'PRESUPUESTO.PREVIA' | translate }}:</span>
                  <span class="fw-semibold">{{ previa }}</span>
                </div>
              }
            </div>

            <div class="acciones-flujo">
              <button type="button" class="btn btn-outline-secondary" (click)="volverAtras()" [disabled]="cargando()">
                {{ 'DESTINO.ATRAS' | translate }}
              </button>
              <button type="submit" class="btn btn-primary d-inline-flex align-items-center gap-2" [disabled]="cargando()">
                @if (cargando()) {
                  <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  <span role="status">{{ 'PRESUPUESTO.CONSULTANDO' | translate }}</span>
                } @else {
                  {{ 'DESTINO.SIGUIENTE' | translate }}
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class PresupuestoComponent {
  private readonly consultaState = inject(ConsultaStateService);
  private readonly consultaService = inject(ConsultaService);
  private readonly idiomaService = inject(IdiomaService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly pais = this.consultaState.pais;
  readonly ciudad = this.consultaState.ciudad;

  readonly presupuesto = new FormControl<string>(this.consultaState.presupuesto() ?? '', {
    nonNullable: true,
    validators: [presupuestoValidator()]
  });
  readonly form = new FormGroup({ presupuesto: this.presupuesto });
  private readonly valor = toSignal(this.presupuesto.valueChanges, { initialValue: this.presupuesto.value });

  readonly cargando = signal(false);
  readonly intentoEnviar = signal(false);
  readonly errorHttp = signal<ApiHttpError | null>(null);
  readonly errorServidor = signal<string | null>(null);

  /** Clave del error del cliente; solo se muestra después de intentar avanzar. */
  readonly mensajeError = computed(() => {
    if (!this.intentoEnviar()) return null;
    const errores = validarPresupuesto(this.valor());
    return errores ? MENSAJES_ERROR[Object.keys(errores)[0]] : null;
  });

  readonly vistaPrevia = computed(() => {
    const valor = this.valor();
    if (validarPresupuesto(valor)) return null;
    return formatearCop(normalizarPresupuesto(valor), this.idiomaService.idiomaActual());
  });

  limpiarErroresServidor(): void {
    this.errorServidor.set(null);
    this.errorHttp.set(null);
  }

  volverAtras(): void {
    this.consultaState.setPresupuesto(this.presupuesto.value.trim() || null);
    this.router.navigate(['/consulta/destino']);
  }

  consultar(): void {
    this.intentoEnviar.set(true);
    this.limpiarErroresServidor();

    const ciudad = this.ciudad();
    if (this.presupuesto.invalid || this.cargando() || !ciudad) {
      return;
    }

    const texto = this.presupuesto.value.trim();
    this.consultaState.setPresupuesto(texto);
    this.cargando.set(true);

    this.consultaService
      .crearConsulta({ ciudad_id: ciudad.id, presupuesto: normalizarPresupuesto(texto) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.cargando.set(false);
          if (res.data) {
            this.consultaState.setResultado(res.data);
            this.router.navigate(['/consulta/resultado']);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          const error = this.apiErrorService.procesarError(err);
          const porCampo = this.apiErrorService.mapearDetallesPorCampo(error.details);

          // 422 del presupuesto va debajo del campo; cualquier otro error (502/504, red...) como alerta general.
          if (err.status === 422 && porCampo['presupuesto']) {
            this.errorServidor.set(porCampo['presupuesto']);
          } else {
            this.errorHttp.set(error);
          }
        }
      });
  }
}
