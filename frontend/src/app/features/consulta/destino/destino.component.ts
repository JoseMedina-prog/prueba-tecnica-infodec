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

      <header class="encabezado-pantalla">
        <h1 class="titulo-pantalla">{{ 'DESTINO.TITULO' | translate }}</h1>
        <p class="bajada">{{ 'DESTINO.SUBTITULO' | translate }}</p>
      </header>

      @if (errorCarga()) {
        <div class="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
          <span>{{ errorCarga()! | translate }}</span>
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="reintentar()">
            {{ 'DESTINO.REINTENTAR' | translate }}
          </button>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="avanzar()" novalidate>
        <fieldset class="mb-4" aria-describedby="paisError">
          <legend class="etiqueta">{{ 'DESTINO.PAIS' | translate }}</legend>
          @if (cargandoPaises()) {
            <p class="cargando" role="status">
              <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
              {{ 'DESTINO.CARGANDO_PAISES' | translate }}
            </p>
          } @else {
            <div class="paises">
              @for (pais of paises(); track pais.id) {
                <label class="pais" [class.elegido]="form.controls.paisId.value === pais.id">
                  <input
                    type="radio"
                    class="visually-hidden"
                    name="paisId"
                    formControlName="paisId"
                    [value]="pais.id"
                    [attr.aria-invalid]="errorPais()"
                  />
                  <span class="mono pais-codigo">{{ pais.codigo }}</span>
                  <span class="mono pais-simbolo" aria-hidden="true">{{ pais.moneda.simbolo }}</span>
                  <span class="pais-nombre">{{ pais.nombre }}</span>
                </label>
              }
            </div>
          }
          <p id="paisError" class="error-campo" aria-live="polite">
            @if (errorPais()) {
              {{ 'DESTINO.ERROR_PAIS_REQUERIDO' | translate }}
            }
          </p>

          @if (paisSeleccionado(); as pais) {
            <p class="nota-linea info-moneda">
              <span class="text-body-secondary">{{ 'DESTINO.MONEDA_OFICIAL' | translate }}</span>
              <span class="fw-semibold">{{ pais.moneda.nombre }} <span class="mono">({{ pais.moneda.simbolo }})</span></span>
            </p>
          }
        </fieldset>

        <fieldset aria-describedby="ciudadError">
          <legend class="etiqueta">{{ 'DESTINO.CIUDAD' | translate }}</legend>
          @if (cargandoCiudades()) {
            <p class="cargando" role="status">
              <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
              {{ 'DESTINO.CARGANDO_CIUDADES' | translate }}
            </p>
          } @else if (!paisSeleccionado()) {
            <p class="aviso-suave">{{ 'DESTINO.ELIGE_PAIS_PRIMERO' | translate }}</p>
          } @else {
            <div class="ciudades">
              @for (ciudad of ciudades(); track ciudad.id) {
                <label class="chip" [class.elegido]="form.controls.ciudadId.value === ciudad.id">
                  <input
                    type="radio"
                    class="visually-hidden"
                    name="ciudadId"
                    formControlName="ciudadId"
                    [value]="ciudad.id"
                    [attr.aria-invalid]="errorCiudad()"
                  />
                  <span class="mono chip-codigo">{{ ciudad.codigo_iata }}</span>
                  <span>{{ ciudad.nombre }}</span>
                </label>
              }
            </div>
          }
          <p id="ciudadError" class="error-campo" aria-live="polite">
            @if (errorCiudad()) {
              {{ 'DESTINO.ERROR_CIUDAD_REQUERIDA' | translate }}
            }
          </p>
        </fieldset>

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
  `,
  styles: `
    .paises {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }
    @media (min-width: 576px) {
      .paises {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    .pais {
      display: grid;
      gap: 0.15rem;
      padding: 0.9rem 1rem 1rem;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .pais:hover {
      border-color: var(--line-strong);
      transform: translateY(-1px);
    }
    .pais-codigo {
      font-size: 0.75rem;
      color: var(--muted);
      letter-spacing: 0.1em;
    }
    .pais-simbolo {
      font-size: 2.25rem;
      font-weight: 500;
      line-height: 1.2;
      color: var(--ink);
    }
    .pais-nombre {
      font-weight: 600;
    }
    .pais.elegido {
      border: 2px solid var(--accent);
      padding: calc(0.9rem - 1px) calc(1rem - 1px) calc(1rem - 1px);
    }
    .pais.elegido .pais-simbolo {
      color: var(--accent);
    }
    .ciudades {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 1rem 0.5rem 0.5rem;
      background: var(--surface);
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      cursor: pointer;
      font-weight: 500;
    }
    .chip-codigo {
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      background: var(--paper);
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.06em;
    }
    .chip.elegido {
      background: var(--ink);
      border-color: var(--ink);
      color: var(--paper);
    }
    .chip.elegido .chip-codigo {
      background: var(--accent-on-ink);
      color: var(--ink);
    }
    .pais:has(input:focus-visible),
    .chip:has(input:focus-visible) {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }
    fieldset {
      min-width: 0;
    }
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
