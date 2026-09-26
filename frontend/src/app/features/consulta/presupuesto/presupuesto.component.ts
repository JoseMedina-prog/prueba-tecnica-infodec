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
import { codigoCiudad } from '../../../core/utils/codigos';
import { formatearCop, localeDe, normalizarPresupuesto } from '../../../core/utils/formato';
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

const ATAJOS = [500000, 1000000, 3000000];

@Component({
  selector: 'app-presupuesto',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, PasosIndicadorComponent, AlertaErrorComponent],
  template: `
    <div class="container py-4 contenedor-flujo">
      <app-pasos-indicador [pasoActual]="2" />

      <header class="encabezado-pantalla">
        <h1 class="titulo-pantalla">{{ 'PRESUPUESTO.TITULO' | translate }}</h1>
        <p class="bajada">{{ 'PRESUPUESTO.SUBTITULO' | translate }}</p>
      </header>

      @if (pais() && ciudad()) {
        <div class="resumen-destino mb-4">
          <span class="mono resumen-codigo">{{ codigoDestino() }}</span>
          <div>
            <span class="etiqueta mb-0">{{ 'PRESUPUESTO.RESUMEN_DESTINO' | translate }}</span>
            <span class="fw-semibold">{{ ciudad()!.nombre }}, {{ pais()!.nombre }}</span>
          </div>
          <span class="mono resumen-moneda">{{ pais()!.moneda.simbolo }} {{ pais()!.moneda.codigo }}</span>
        </div>
      }

      @if (errorHttp()) {
        <app-alerta-error [error]="errorHttp()" />
      }

      <form [formGroup]="form" (ngSubmit)="consultar()" novalidate>
        <label for="presupuestoInput" class="form-label">{{ 'PRESUPUESTO.CAMPO_LABEL' | translate }}</label>
        <div class="monto" [class.invalido]="mensajeError() || errorServidor()">
          <span class="mono monto-prefijo" aria-hidden="true">COP</span>
          <input
            id="presupuestoInput"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            class="mono monto-input"
            placeholder="1500000"
            formControlName="presupuesto"
            [attr.aria-invalid]="!!(mensajeError() || errorServidor())"
            aria-describedby="presupuestoAyuda presupuestoError"
            (input)="limpiarErroresServidor()"
          />
        </div>
        <p id="presupuestoAyuda" class="form-text mb-0">{{ 'PRESUPUESTO.AYUDA' | translate }}</p>

        <p id="presupuestoError" class="error-campo" aria-live="polite">
          @if (errorServidor(); as mensaje) {
            {{ mensaje }}
          } @else if (mensajeError(); as clave) {
            {{ clave | translate }}
          }
        </p>

        <div class="atajos" role="group" [attr.aria-label]="'PRESUPUESTO.ATAJOS' | translate">
          @for (atajo of atajos(); track atajo.valor) {
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary mono"
              [attr.aria-pressed]="valorActual() === atajo.valor"
              (click)="usarAtajo(atajo.valor)"
            >
              {{ atajo.texto }}
            </button>
          }
        </div>

        @if (vistaPrevia(); as previa) {
          <p class="nota-linea info-moneda mt-3 mb-0">
            <span class="text-body-secondary">{{ 'PRESUPUESTO.PREVIA' | translate }}</span>
            <span class="mono fw-semibold">{{ previa }}</span>
          </p>
        }

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
  `,
  styles: `
    .resumen-destino {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--surface);
      border: 1px dashed var(--line-strong);
      border-radius: var(--radius-lg);
    }
    .resumen-destino > div {
      display: grid;
      flex: 1;
      min-width: 0;
    }
    .resumen-codigo {
      font-size: 1.6rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: var(--accent);
    }
    .resumen-moneda {
      font-size: 0.9rem;
      color: var(--muted);
    }
    .monto {
      display: flex;
      align-items: center;
      background: var(--surface);
      border: 1px solid var(--line-strong);
      border-radius: var(--radius-lg);
    }
    .monto:focus-within {
      border-color: var(--accent);
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .monto.invalido {
      border-color: var(--danger);
    }
    .monto-prefijo {
      padding: 0 0 0 1.1rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--muted);
    }
    .monto-input {
      flex: 1;
      min-width: 0;
      padding: 0.9rem 1rem 0.9rem 0.75rem;
      border: 0;
      background: transparent;
      color: var(--ink);
      font-size: clamp(1.5rem, 6vw, 2rem);
      font-weight: 500;
    }
    .monto-input:focus {
      outline: none;
    }
    .monto-input::placeholder {
      color: var(--line-strong);
    }
    .atajos {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .atajos .btn[aria-pressed='true'] {
      background: var(--ink);
      color: var(--paper);
    }
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

  readonly valorActual = computed(() => this.valor().trim());

  readonly codigoDestino = computed(() => {
    const ciudad = this.ciudad();
    return ciudad ? codigoCiudad(ciudad.id, ciudad.nombre) : '';
  });

  /** Montos rápidos: llenan el campo con el número sin separadores, igual que si se escribiera. */
  readonly atajos = computed(() => {
    const formato = new Intl.NumberFormat(localeDe(this.idiomaService.idiomaActual()));
    return ATAJOS.map((valor) => ({ valor: String(valor), texto: formato.format(valor) }));
  });

  usarAtajo(valor: string): void {
    this.presupuesto.setValue(valor);
    this.limpiarErroresServidor();
  }

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
