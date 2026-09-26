import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiHttpError } from '../../../core/models';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { AuthService } from '../../../core/services/auth.service';
import { consumirEstadoLogin } from '../../../core/utils/estado-login';
import { RELOJ_FN, obtenerFechaColombia } from '../../../core/utils/salidas';
import { AlertaErrorComponent } from '../../../shared/components/alerta-error/alerta-error.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error.component';
import { AuthShellComponent } from '../../../shared/components/auth-shell/auth-shell.component';
import { BotonVerPasswordComponent } from '../../../shared/components/boton-ver-password/boton-ver-password.component';
import { CarruselSalidasComponent } from '../../../shared/components/carrusel-salidas/carrusel-salidas.component';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    AlertaErrorComponent,
    CampoErrorComponent,
    AuthShellComponent,
    BotonVerPasswordComponent,
    CarruselSalidasComponent,
    LogoComponent
  ],
  template: `
    <app-auth-shell enlace="registro">
      <!-- Pasabordo de dos partes: cuerpo a la izquierda y talón con botón submit a la derecha -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="ticket-pasabordo" novalidate>
        <!-- Cuerpo del ticket -->
        <div class="ticket-cuerpo">
          <!-- Cabecera del ticket con logo y ruta de vuelo -->
          <div class="ticket-header-meta">
            <div class="ticket-logo-wrap">
              <app-logo sobre="claro" />
            </div>
            <div class="ticket-ruta-meta mono">
              <span class="label-ruta">{{ 'AUTH.ORIGEN' | translate }}</span>
              <span class="val-ruta">BOG</span>
              <span class="flecha-ruta" aria-hidden="true">→</span>
              <span class="label-ruta">{{ 'AUTH.DESTINO' | translate }}</span>
              <span class="val-ruta">— — —</span>
            </div>
          </div>

          <header class="encabezado-pantalla">
            <h1 class="titulo-pantalla">{{ 'AUTH.LOGIN_TITLE' | translate }}</h1>
            <p class="bajada">{{ 'AUTH.LOGIN_SUBTITLE' | translate }}</p>
          </header>

          @if (avisoSesionExpirada()) {
            <div class="alert alert-warning aviso-sesion" role="status">
              <span>{{ 'AUTH.SESION_EXPIRADA' | translate }}</span>
              <button
                type="button"
                class="btn-close"
                [attr.aria-label]="'AUTH.CERRAR_AVISO' | translate"
                (click)="cerrarAviso()"
              ></button>
            </div>
          }

          @if (mensajeExito()) {
            <div class="alert alert-success small" role="status">{{ mensajeExito() }}</div>
          }

          <app-alerta-error [error]="errorGeneral()" />

          <div class="mb-3">
            <label for="correo" class="form-label label-mono">
              {{ 'AUTH.PASAJERO_CORREO' | translate }} <span class="requerido" aria-hidden="true">*</span>
            </label>
            <input
              type="email"
              id="correo"
              class="form-control"
              [class.is-invalid]="(form.get('correo')?.invalid && (form.get('correo')?.dirty || form.get('correo')?.touched)) || erroresCampos()['correo']"
              formControlName="correo"
              [placeholder]="'AUTH.CORREO_PLACEHOLDER' | translate"
              autocomplete="email"
            />
            <app-campo-error [control]="form.get('correo')" [mensajeServidor]="erroresCampos()['correo']" />
          </div>

          <div class="mb-2">
            <label for="password" class="form-label label-mono">
              {{ 'AUTH.CLAVE_ABORDAJE' | translate }} <span class="requerido" aria-hidden="true">*</span>
            </label>
            <div class="campo-password-wrap">
              <input
                [type]="mostrarPassword() ? 'text' : 'password'"
                id="password"
                class="form-control"
                [class.is-invalid]="(form.get('password')?.invalid && (form.get('password')?.dirty || form.get('password')?.touched)) || erroresCampos()['password']"
                formControlName="password"
                autocomplete="current-password"
              />
              <app-boton-ver-password [(visible)]="mostrarPassword" campoId="password" />
            </div>
            <app-campo-error [control]="form.get('password')" [mensajeServidor]="erroresCampos()['password']" />
          </div>

          <p class="auth-pie-cuerpo">
            {{ 'AUTH.NO_TIENES_CUENTA' | translate }}
            <a routerLink="/registro" class="fw-semibold">{{ 'AUTH.REGISTRATE_AQUI' | translate }}</a>
          </p>
        </div>

        <!-- Perforación vertical con muescas semicirculares arriba y abajo -->
        <div class="ticket-perforacion" aria-hidden="true">
          <div class="muesca muesca-arriba"></div>
          <div class="muesca muesca-abajo"></div>
        </div>

        <!-- Talón del ticket (derecha) -->
        <aside class="ticket-talon">
          <div class="talon-header mono">
            <span class="talon-titulo">{{ 'AUTH.TALON' | translate }}</span>
            <span class="talon-subtitulo">{{ 'AUTH.NUMERO_VUELO' | translate }}</span>
          </div>

          <div class="talon-info-grid mono">
            <div class="talon-dato">
              <span class="talon-label">{{ 'AUTH.PUERTA' | translate }}</span>
              <span class="talon-valor">A4</span>
            </div>
            <div class="talon-dato">
              <span class="talon-label">{{ 'AUTH.ASIENTO' | translate }}</span>
              <span class="talon-valor">12C</span>
            </div>
            <div class="talon-dato talon-dato-fecha">
              <span class="talon-label">{{ 'AUTH.FECHA' | translate }}</span>
              <span class="talon-valor">{{ fechaColombia() }}</span>
            </div>
          </div>

          <!-- Código de barras SVG decorativo -->
          <div class="talon-barcode-wrap" aria-hidden="true">
            <svg class="talon-barcode" viewBox="0 0 180 40" preserveAspectRatio="none">
              <rect x="0" y="0" width="3" height="40" fill="currentColor" />
              <rect x="5" y="0" width="1.5" height="40" fill="currentColor" />
              <rect x="9" y="0" width="4" height="40" fill="currentColor" />
              <rect x="15" y="0" width="2" height="40" fill="currentColor" />
              <rect x="19" y="0" width="1" height="40" fill="currentColor" />
              <rect x="23" y="0" width="5" height="40" fill="currentColor" />
              <rect x="30" y="0" width="2" height="40" fill="currentColor" />
              <rect x="34" y="0" width="3" height="40" fill="currentColor" />
              <rect x="39" y="0" width="1.5" height="40" fill="currentColor" />
              <rect x="43" y="0" width="4" height="40" fill="currentColor" />
              <rect x="50" y="0" width="2" height="40" fill="currentColor" />
              <rect x="54" y="0" width="1" height="40" fill="currentColor" />
              <rect x="58" y="0" width="3.5" height="40" fill="currentColor" />
              <rect x="64" y="0" width="1.5" height="40" fill="currentColor" />
              <rect x="68" y="0" width="4" height="40" fill="currentColor" />
              <rect x="75" y="0" width="2" height="40" fill="currentColor" />
              <rect x="80" y="0" width="3" height="40" fill="currentColor" />
              <rect x="85" y="0" width="1" height="40" fill="currentColor" />
              <rect x="89" y="0" width="5" height="40" fill="currentColor" />
              <rect x="96" y="0" width="2" height="40" fill="currentColor" />
              <rect x="100" y="0" width="3" height="40" fill="currentColor" />
              <rect x="105" y="0" width="1.5" height="40" fill="currentColor" />
              <rect x="109" y="0" width="4" height="40" fill="currentColor" />
              <rect x="115" y="0" width="2" height="40" fill="currentColor" />
              <rect x="120" y="0" width="4" height="40" fill="currentColor" />
              <rect x="126" y="0" width="1.5" height="40" fill="currentColor" />
              <rect x="130" y="0" width="3" height="40" fill="currentColor" />
              <rect x="135" y="0" width="2" height="40" fill="currentColor" />
              <rect x="140" y="0" width="4" height="40" fill="currentColor" />
              <rect x="146" y="0" width="1" height="40" fill="currentColor" />
              <rect x="150" y="0" width="3" height="40" fill="currentColor" />
              <rect x="155" y="0" width="2" height="40" fill="currentColor" />
              <rect x="160" y="0" width="4" height="40" fill="currentColor" />
              <rect x="166" y="0" width="1.5" height="40" fill="currentColor" />
              <rect x="170" y="0" width="3" height="40" fill="currentColor" />
              <rect x="176" y="0" width="4" height="40" fill="currentColor" />
            </svg>
          </div>

          <!-- Botón de envío en el talón -->
          <button
            type="submit"
            class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
            [disabled]="cargando()"
          >
            @if (cargando()) {
              <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            }
            <span>{{ 'AUTH.ENTRAR' | translate }}</span>
            <svg class="flecha" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        </aside>
      </form>

      <!-- Tira de próximas salidas centrada con el mismo ancho que el ticket -->
      <app-carrusel-salidas />
    </app-auth-shell>
  `,
  styles: `
    .aviso-sesion {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .aviso-sesion .btn-close {
      flex: none;
      margin-top: 0.15rem;
    }
  `
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly relojFn = inject(RELOJ_FN);

  readonly avisoSesionExpirada = signal(false);
  readonly cargando = signal<boolean>(false);
  readonly errorGeneral = signal<ApiHttpError | null>(null);
  readonly erroresCampos = signal<Record<string, string>>({});
  readonly mensajeExito = signal<string | null>(null);
  readonly mostrarPassword = signal(false);

  readonly fechaColombia = computed(() => obtenerFechaColombia(this.relojFn()));

  readonly form: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const estado = consumirEstadoLogin();
    if (estado.correo) {
      this.form.patchValue({ correo: estado.correo });
      this.mensajeExito.set(estado.mensajeExito);
    }
    this.avisoSesionExpirada.set(estado.sesionExpirada);

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cerrarAviso());
  }

  cerrarAviso(): void {
    this.avisoSesionExpirada.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cerrarAviso();
    this.cargando.set(true);
    this.errorGeneral.set(null);
    this.erroresCampos.set({});
    this.mensajeExito.set(null);

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.success) {
          this.router.navigate(['/consulta']);
        }
      },
      error: (err) => {
        this.cargando.set(false);
        const apiError = this.apiErrorService.procesarError(err);
        this.errorGeneral.set(apiError);

        if (apiError.details) {
          this.erroresCampos.set(this.apiErrorService.mapearDetallesPorCampo(apiError.details));
        }
      }
    });
  }
}
