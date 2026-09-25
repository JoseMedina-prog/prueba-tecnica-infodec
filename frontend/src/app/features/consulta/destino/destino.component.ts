import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription, skip } from 'rxjs';
import { Ciudad, Pais } from '../../../core/models';
import { ConsultaStateService } from '../../../core/services/consulta-state.service';
import { IdiomaService } from '../../../core/services/idioma.service';
import { PaisService } from '../../../core/services/pais.service';
import { PasosIndicadorComponent } from '../../../shared/components/pasos-indicador/pasos-indicador.component';

@Component({
  selector: 'app-destino',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, PasosIndicadorComponent],
  template: `
    <div class="container py-4 contenedor-flujo">
      <app-pasos-indicador [pasoActual]="1" />

      <div class="card tarjeta">
        <div class="card-body p-4 p-md-5">
          <div class="text-center mb-4">
            <h1 class="h4 fw-bold text-primary mb-1">{{ 'DESTINO.TITULO' | translate }}</h1>
            <p class="text-muted small mb-0">{{ 'DESTINO.SUBTITULO' | translate }}</p>
          </div>

          @if (errorCarga()) {
            <div class="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
              <span class="small">{{ errorCarga()! | translate }}</span>
              <button type="button" class="btn btn-outline-danger btn-sm" (click)="reintentar()">
                {{ 'DESTINO.REINTENTAR' | translate }}
              </button>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="avanzar()" novalidate>
            <div class="mb-4">
              <label for="paisSelect" class="form-label fw-semibold">{{ 'DESTINO.PAIS' | translate }}</label>
              @if (cargandoPaises()) {
                <div class="form-control d-flex align-items-center gap-2 text-muted" role="status">
                  <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
                  <span>{{ 'DESTINO.CARGANDO_PAISES' | translate }}</span>
                </div>
              } @else {
                <select
                  id="paisSelect"
                  class="form-select"
                  formControlName="paisId"
                  [class.is-invalid]="errorPais()"
                  [attr.aria-invalid]="errorPais()"
                  aria-describedby="paisError"
                >
                  <option [ngValue]="null">{{ 'DESTINO.SELECCIONAR_PAIS' | translate }}</option>
                  @for (pais of paises(); track pais.id) {
                    <option [ngValue]="pais.id">{{ pais.nombre }}</option>
                  }
                </select>
              }
              <div id="paisError" class="invalid-feedback d-block" aria-live="polite">
                @if (errorPais()) {
                  {{ 'DESTINO.ERROR_PAIS_REQUERIDO' | translate }}
                }
              </div>

              @if (paisSeleccionado(); as pais) {
                <div class="info-moneda mt-2">
                  <span class="text-muted">{{ 'DESTINO.MONEDA_OFICIAL' | translate }}:</span>
                  <span class="fw-semibold">{{ pais.moneda.nombre }} ({{ pais.moneda.simbolo }})</span>
                </div>
              }
            </div>

            <div class="mb-4">
              <label for="ciudadSelect" class="form-label fw-semibold">{{ 'DESTINO.CIUDAD' | translate }}</label>
              @if (cargandoCiudades()) {
                <div class="form-control d-flex align-items-center gap-2 text-muted" role="status">
                  <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
                  <span>{{ 'DESTINO.CARGANDO_CIUDADES' | translate }}</span>
                </div>
              } @else {
                <select
                  id="ciudadSelect"
                  class="form-select"
                  formControlName="ciudadId"
                  [class.is-invalid]="errorCiudad()"
                  [attr.aria-invalid]="errorCiudad()"
                  aria-describedby="ciudadError"
                >
                  <option [ngValue]="null">{{ 'DESTINO.SELECCIONAR_CIUDAD' | translate }}</option>
                  @for (ciudad of ciudades(); track ciudad.id) {
                    <option [ngValue]="ciudad.id">{{ ciudad.nombre }}</option>
                  }
                </select>
              }
              <div id="ciudadError" class="invalid-feedback d-block" aria-live="polite">
                @if (errorCiudad()) {
                  {{ 'DESTINO.ERROR_CIUDAD_REQUERIDA' | translate }}
                }
              </div>
            </div>

            <div class="acciones-flujo">
              <button type="button" class="btn btn-outline-secondary" disabled>
                {{ 'DESTINO.ATRAS' | translate }}
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="cargandoPaises() || cargandoCiudades()">
                {{ 'DESTINO.SIGUIENTE' | translate }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class DestinoComponent implements OnInit {
  private readonly paisService = inject(PaisService);
  private readonly consultaState = inject(ConsultaStateService);
  private readonly idiomaService = inject(IdiomaService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly paises = signal<Pais[]>([]);
  readonly ciudades = signal<Ciudad[]>([]);
  readonly paisSeleccionado = signal<Pais | null>(null);

  readonly cargandoPaises = signal(false);
  readonly cargandoCiudades = signal(false);
  /** Clave de traducción del error de carga, o null si no hay error. */
  readonly errorCarga = signal<string | null>(null);
  readonly errorPais = signal(false);
  readonly errorCiudad = signal(false);

  readonly form = new FormGroup({
    paisId: new FormControl<number | null>(null),
    ciudadId: new FormControl<number | null>(null)
  });

  private ciudadesSub?: Subscription;

  constructor() {
    // Al cambiar de idioma se piden de nuevo países y ciudades (vienen traducidos) sin perder la selección.
    toObservable(this.idiomaService.idiomaActual)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this.cargarPaises());

    // Solo los cambios del usuario emiten; los valores que pone el componente usan emitEvent: false.
    this.form.controls.paisId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.onPaisChange());

    this.form.controls.ciudadId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => id !== null && this.errorCiudad.set(false));
  }

  ngOnInit(): void {
    const pais = this.consultaState.pais();
    const ciudad = this.consultaState.ciudad();
    this.form.setValue({ paisId: pais?.id ?? null, ciudadId: ciudad?.id ?? null }, { emitEvent: false });
    this.paisSeleccionado.set(pais);
    this.cargarPaises();
  }

  reintentar(): void {
    this.cargarPaises();
  }

  /** Carga los países y, si hay uno elegido, sus ciudades, conservando lo seleccionado. */
  private cargarPaises(): void {
    this.cargandoPaises.set(true);
    this.errorCarga.set(null);

    this.paisService
      .getPaises()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paises) => {
          this.paises.set(paises);
          this.cargandoPaises.set(false);

          const pais = paises.find((p) => p.id === this.form.controls.paisId.value) ?? null;
          this.paisSeleccionado.set(pais);
          if (pais) {
            this.cargarCiudades(pais.id, this.form.controls.ciudadId.value);
          } else {
            this.form.controls.paisId.setValue(null, { emitEvent: false });
          }
        },
        error: () => {
          this.cargandoPaises.set(false);
          this.errorCarga.set('DESTINO.ERROR_CARGA_PAISES');
        }
      });
  }

  private onPaisChange(): void {
    const paisId = this.form.controls.paisId.value;
    this.form.controls.ciudadId.setValue(null, { emitEvent: false });
    this.ciudades.set([]);
    this.errorPais.set(false);

    const pais = this.paises().find((p) => p.id === paisId) ?? null;
    this.paisSeleccionado.set(pais);
    if (pais) {
      this.cargarCiudades(pais.id, null);
    } else {
      this.ciudadesSub?.unsubscribe();
    }
  }

  private cargarCiudades(paisId: number, ciudadIdRestaurar: number | null): void {
    this.ciudadesSub?.unsubscribe();
    this.cargandoCiudades.set(true);
    this.errorCarga.set(null);

    this.ciudadesSub = this.paisService
      .getCiudades(paisId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ciudades) => {
          this.ciudades.set(ciudades);
          this.cargandoCiudades.set(false);

          const ciudad = ciudades.find((c) => c.id === ciudadIdRestaurar) ?? null;
          this.form.controls.ciudadId.setValue(ciudad?.id ?? null, { emitEvent: false });
          this.sincronizarNombresEnEstado(ciudad);
        },
        error: () => {
          this.cargandoCiudades.set(false);
          this.errorCarga.set('DESTINO.ERROR_CARGA_CIUDADES');
        }
      });
  }

  /** Si ya había un destino guardado, actualiza sus nombres al idioma actual. */
  private sincronizarNombresEnEstado(ciudad: Ciudad | null): void {
    const pais = this.paisSeleccionado();
    if (pais && ciudad && this.consultaState.ciudad()?.id === ciudad.id) {
      this.consultaState.setDestino(pais, ciudad);
    }
  }

  avanzar(): void {
    const pais = this.paisSeleccionado();
    const ciudad = this.ciudades().find((c) => c.id === this.form.controls.ciudadId.value) ?? null;

    this.errorPais.set(!pais);
    this.errorCiudad.set(!ciudad);
    if (!pais || !ciudad) {
      return;
    }

    // Si cambia el destino, el presupuesto se conserva pero el resultado anterior ya no aplica.
    if (this.consultaState.ciudad()?.id !== ciudad.id) {
      this.consultaState.setResultado(null);
    }
    this.consultaState.setDestino(pais, ciudad);
    this.router.navigate(['/consulta/presupuesto']);
  }
}
