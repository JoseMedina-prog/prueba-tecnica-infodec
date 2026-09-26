import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, finalize } from 'rxjs';
import { ApiHttpError } from '../../../core/models';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { AuthService } from '../../../core/services/auth.service';
import { IdiomaService } from '../../../core/services/idioma.service';
import { evaluatePasswordRules, passwordReglasValidator } from '../../../core/utils/password-rules';
import { RELOJ_FN, obtenerFechaColombia } from '../../../core/utils/salidas';
import { AlertaErrorComponent } from '../../../shared/components/alerta-error/alerta-error.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error.component';
import { AuthShellComponent } from '../../../shared/components/auth-shell/auth-shell.component';
import { BotonVerPasswordComponent } from '../../../shared/components/boton-ver-password/boton-ver-password.component';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

/**
 * Validador para confirmar que password y password_confirmation coincidan
 */
export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmacion = group.get('password_confirmation')?.value;

  if (password && confirmacion && password !== confirmacion) {
    group.get('password_confirmation')?.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    AlertaErrorComponent,
    CampoErrorComponent,
    AuthShellComponent,
    BotonVerPasswordComponent,
    LogoComponent
  ],
  template: `
    <app-auth-shell enlace="login">
      <!-- Pasabordo de dos partes: cuerpo con campos y talón con submit -->
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
            <h1 class="titulo-pantalla">{{ 'AUTH.REGISTRO_TITLE' | translate }}</h1>
            <p class="bajada">{{ 'AUTH.REGISTRO_SUBTITLE' | translate }}</p>
          </header>

          <app-alerta-error [error]="errorGeneral()" />

          <div class="mb-3">
            <label for="nombre" class="form-label label-mono">
              {{ 'AUTH.NOMBRE_LABEL' | translate }} <span class="requerido" aria-hidden="true">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              class="form-control"
              [class.is-invalid]="(form.get('nombre')?.invalid && (form.get('nombre')?.dirty || form.get('nombre')?.touched)) || erroresCampos()['nombre']"
              formControlName="nombre"
              [placeholder]="'AUTH.NOMBRE_PLACEHOLDER' | translate"
              autocomplete="name"
            />
            <app-campo-error [control]="form.get('nombre')" [mensajeServidor]="erroresCampos()['nombre']" />
          </div>

          <div class="mb-3">
            <label for="correo" class="form-label label-mono">
              {{ 'AUTH.CORREO_LABEL' | translate }} <span class="requerido" aria-hidden="true">*</span>
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

          <div class="mb-3">
            <label for="password" class="form-label label-mono">
              {{ 'AUTH.PASSWORD_LABEL' | translate }} <span class="requerido" aria-hidden="true">*</span>
            </label>
            <div class="campo-password-wrap">
              <input
                [type]="mostrarPassword() ? 'text' : 'password'"
                id="password"
                class="form-control"
                [class.is-invalid]="(form.get('password')?.invalid && form.get('password')?.touched) || erroresCampos()['password']"
                formControlName="password"
                aria-describedby="passwordReglas"
                autocomplete="new-password"
              />
              <app-boton-ver-password [(visible)]="mostrarPassword" campoId="password" [deshabilitado]="enviando()" />
            </div>

            <!-- Checklist de contraseña -->
            <ul id="passwordReglas" class="checklist-password" aria-live="polite">
              @for (regla of reglas(); track regla.clave) {
                <li [class.cumplida]="regla.cumplida" [class.pendiente]="!regla.cumplida">
                  @if (regla.cumplida) {
                    <svg class="marca marca-chulo" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                      <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span>{{ regla.clave | translate }}<span class="visually-hidden">: {{ 'AUTH.REGLA_CUMPLIDA' | translate }}</span></span>
                  } @else {
                    <span class="marca punto" aria-hidden="true"></span>
                    <span>{{ regla.clave | translate }}<span class="visually-hidden">: {{ 'AUTH.REGLA_PENDIENTE' | translate }}</span></span>
                  }
                </li>
              }
            </ul>

            <app-campo-error [control]="form.get('password')" [mensajeServidor]="erroresCampos()['password']" [soloAlSalir]="true" />
          </div>

          <div class="mb-3">
            <label for="password_confirmation" class="form-label label-mono">
              {{ 'AUTH.PASSWORD_CONFIRM_LABEL' | translate }} <span class="requerido" aria-hidden="true">*</span>
            </label>
            <div class="campo-password-wrap">
              <input
                [type]="mostrarConfirmacion() ? 'text' : 'password'"
                id="password_confirmation"
                class="form-control"
                [class.is-invalid]="(form.get('password_confirmation')?.invalid && (form.get('password_confirmation')?.dirty || form.get('password_confirmation')?.touched)) || erroresCampos()['password_confirmation']"
                formControlName="password_confirmation"
                autocomplete="new-password"
              />
              <app-boton-ver-password [(visible)]="mostrarConfirmacion" campoId="password_confirmation" [deshabilitado]="enviando()" />
            </div>
            <app-campo-error
              [control]="form.get('password_confirmation')"
              [mensajeServidor]="erroresCampos()['password_confirmation']"
            />
          </div>

          <p class="auth-pie-cuerpo">
            {{ 'AUTH.YA_TIENES_CUENTA' | translate }}
            <a routerLink="/login" class="fw-semibold">{{ 'AUTH.INICIA_SESION' | translate }}</a>
          </p>
        </div>

        <!-- Perforación vertical con muescas arriba y abajo -->
        <div class="ticket-perforacion" aria-hidden="true">
          <div class="muesca muesca-arriba"></div>
          <div class="muesca muesca-abajo"></div>
        </div>

        <!-- Talón del ticket (derecha) -->
        <aside class="ticket-talon">
          <div class="talon-header mono">
            <span class="talon-titulo">{{ 'AUTH.TALON' | translate }}</span>
            <span class="talon-subtitulo">{{ 'AUTH.PASAJERO_NUEVO' | translate }}</span>
          </div>

          <div class="talon-info-grid mono">
            <div class="talon-dato">
              <span class="talon-label">{{ 'AUTH.MONEDA_ORIGEN' | translate }}</span>
              <span class="talon-valor">COP</span>
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
            class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 btn-auth-submit"
            [disabled]="enviando()"
          >
            @if (enviando()) {
              <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            }
            <span>{{ 'AUTH.REGISTRARME' | translate }}</span>
            @if (!enviando()) {
              <svg class="flecha" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            }
          </button>
        </aside>
      </form>
    </app-auth-shell>
  `,
  styles: `
    .checklist-password {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.35rem 1rem;
      margin: 0.75rem 0 0;
      padding: 0;
      list-style: none;
      font-size: 0.8125rem;
    }
    .btn-auth-submit {
      min-height: 42px;
    }
    .checklist-password li {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--muted);
      transition: color 150ms ease;
    }
    .checklist-password li.cumplida {
      color: var(--success);
      font-weight: 500;
    }
    .marca {
      flex: none;
      width: 14px;
      height: 14px;
    }
    .marca-chulo {
      color: var(--success-vivid);
      animation: escala-chulo 180ms ease-out both;
    }
    .punto {
      display: inline-block;
      border: 1.5px solid currentColor;
      border-radius: 50%;
      transform: scale(0.6);
    }
    @keyframes escala-chulo {
      from {
        transform: scale(0.6);
        opacity: 0.5;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .marca-chulo {
        animation: none !important;
        transform: none !important;
      }
    }
    @media (max-width: 440px) {
      .checklist-password {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly idiomaService = inject(IdiomaService);
  private readonly translate = inject(TranslateService);
  private readonly relojFn = inject(RELOJ_FN);

  readonly enviando = signal<boolean>(false);
  readonly cargando = this.enviando;
  readonly errorGeneral = signal<ApiHttpError | null>(null);
  readonly erroresCampos = signal<Record<string, string>>({});

  readonly mostrarPassword = signal(false);
  readonly mostrarConfirmacion = signal(false);

  readonly fechaColombia = computed(() => obtenerFechaColombia(this.relojFn()));

  readonly form: FormGroup = this.fb.group(
    {
      nombre: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordReglasValidator()]],
      password_confirmation: ['', [Validators.required]]
    },
    { validators: passwordMatchValidator }
  );

  private readonly password = toSignal(this.form.controls['password'].valueChanges as Observable<string>, {
    initialValue: ''
  });

  readonly passwordRules = computed(() => evaluatePasswordRules(this.password() ?? ''));

  readonly reglas = computed(() => [
    { clave: 'AUTH.REGLA_MIN_8', cumplida: this.passwordRules().minLength },
    { clave: 'AUTH.REGLA_MAYUSCULA', cumplida: this.passwordRules().hasUpper },
    { clave: 'AUTH.REGLA_MINUSCULA', cumplida: this.passwordRules().hasLower },
    { clave: 'AUTH.REGLA_NUMERO', cumplida: this.passwordRules().hasNumber }
  ]);

  onSubmit(): void {
    if (this.enviando()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    this.enviando.set(true);
    this.form.disable();
    this.errorGeneral.set(null);
    this.erroresCampos.set({});

    this.authService
      .registro(payload)
      .pipe(
        finalize(() => {
          this.enviando.set(false);
          this.form.enable();
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            const correo = payload.correo;
            this.router.navigate(['/login'], {
              state: {
                correo,
                mensajeExito: this.translate.instant('AUTH.REGISTRO_EXITOSO')
              }
            });
          }
        },
        error: (err) => {
          const apiError = this.apiErrorService.procesarError(err);
          this.errorGeneral.set(apiError);

          if (apiError.details) {
            this.erroresCampos.set(this.apiErrorService.mapearDetallesPorCampo(apiError.details));
          }
        }
      });
  }
}
