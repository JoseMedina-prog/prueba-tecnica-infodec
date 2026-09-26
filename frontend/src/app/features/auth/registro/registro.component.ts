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
import { Observable } from 'rxjs';
import { ApiHttpError } from '../../../core/models';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { AuthService } from '../../../core/services/auth.service';
import { IdiomaService } from '../../../core/services/idioma.service';
import { evaluatePasswordRules, passwordReglasValidator } from '../../../core/utils/password-rules';
import { AlertaErrorComponent } from '../../../shared/components/alerta-error/alerta-error.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error.component';
import { AuthShellComponent } from '../../../shared/components/auth-shell/auth-shell.component';
import { BotonVerPasswordComponent } from '../../../shared/components/boton-ver-password/boton-ver-password.component';

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
    BotonVerPasswordComponent
  ],
  template: `
    <app-auth-shell enlace="login">
        <div>
          <header class="encabezado-pantalla">
            <h1 class="titulo-pantalla">{{ 'AUTH.REGISTRO_TITLE' | translate }}</h1>
            <p class="bajada">{{ 'AUTH.REGISTRO_SUBTITLE' | translate }}</p>
          </header>

          <app-alerta-error [error]="errorGeneral()" />

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="mb-3">
              <label for="nombre" class="form-label">
                {{ 'AUTH.NOMBRE' | translate }} <span class="requerido" aria-hidden="true">*</span>
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
              <label for="correo" class="form-label">
                {{ 'AUTH.CORREO' | translate }} <span class="requerido" aria-hidden="true">*</span>
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
              <label for="password" class="form-label">
                {{ 'AUTH.PASSWORD' | translate }} <span class="requerido" aria-hidden="true">*</span>
              </label>
              <div class="input-group">
                <input
                  [type]="mostrarPassword() ? 'text' : 'password'"
                  id="password"
                  class="form-control"
                  [class.is-invalid]="(form.get('password')?.invalid && form.get('password')?.touched) || erroresCampos()['password']"
                  formControlName="password"
                  aria-describedby="passwordReglas"
                  autocomplete="new-password"
                />
                <app-boton-ver-password [(visible)]="mostrarPassword" />
              </div>

              <!-- Cada regla se vuelve a pintar entera al cambiar, así el lector anuncia solo la que cambió -->
              <ul id="passwordReglas" class="checklist-password" aria-live="polite">
                @for (regla of reglas(); track regla.clave) {
                  <li [class.cumplida]="regla.cumplida" [class.pendiente]="!regla.cumplida">
                    @if (regla.cumplida) {
                      <svg class="marca" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
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

              <!-- Mientras se escribe guía la checklist; el error aparece al salir del campo o al enviar -->
              <app-campo-error [control]="form.get('password')" [mensajeServidor]="erroresCampos()['password']" [soloAlSalir]="true" />
            </div>

            <div class="mb-4">
              <label for="password_confirmation" class="form-label">
                {{ 'AUTH.PASSWORD_CONFIRM' | translate }} <span class="requerido" aria-hidden="true">*</span>
              </label>
              <div class="input-group">
                <input
                  [type]="mostrarConfirmacion() ? 'text' : 'password'"
                  id="password_confirmation"
                  class="form-control"
                  [class.is-invalid]="(form.get('password_confirmation')?.invalid && (form.get('password_confirmation')?.dirty || form.get('password_confirmation')?.touched)) || erroresCampos()['password_confirmation']"
                  formControlName="password_confirmation"
                  autocomplete="new-password"
                />
                <app-boton-ver-password [(visible)]="mostrarConfirmacion" />
              </div>
              <app-campo-error
                [control]="form.get('password_confirmation')"
                [mensajeServidor]="erroresCampos()['password_confirmation']"
              />
            </div>

            <button
              type="submit"
              class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
              [disabled]="cargando()"
            >
              @if (cargando()) {
                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
              }
              <span>{{ 'AUTH.REGISTRARME' | translate }}</span>
            </button>
          </form>

          <p class="auth-pie">
            {{ 'AUTH.YA_TIENES_CUENTA' | translate }}
            <a routerLink="/login" class="fw-semibold">{{ 'AUTH.INICIA_SESION' | translate }}</a>
          </p>
        </div>
    </app-auth-shell>
  `,
  styles: `
    .checklist-password {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.3rem 1rem;
      margin: 0.6rem 0 0;
      padding: 0;
      list-style: none;
      font-size: 0.8125rem;
    }
    .checklist-password li {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--muted);
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
    .punto {
      display: inline-block;
      border: 1.5px solid currentColor;
      border-radius: 50%;
      transform: scale(0.6);
    }
    @media (max-width: 359.98px) {
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

  readonly cargando = signal<boolean>(false);
  readonly errorGeneral = signal<ApiHttpError | null>(null);
  readonly erroresCampos = signal<Record<string, string>>({});

  readonly mostrarPassword = signal(false);
  readonly mostrarConfirmacion = signal(false);

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

  /** Estado en vivo de las 4 reglas; sale de la misma función que usa el validador. */
  readonly passwordRules = computed(() => evaluatePasswordRules(this.password()));

  readonly reglas = computed(() => {
    const r = this.passwordRules();
    return [
      { clave: 'AUTH.REGLA_MIN_8', cumplida: r.minLength },
      { clave: 'AUTH.REGLA_MAYUSCULA', cumplida: r.hasUpper },
      { clave: 'AUTH.REGLA_MINUSCULA', cumplida: r.hasLower },
      { clave: 'AUTH.REGLA_NUMERO', cumplida: r.hasNumber }
    ];
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorGeneral.set(null);
    this.erroresCampos.set({});

    const datosRegistro = {
      ...this.form.value,
      idioma: this.idiomaService.getIdioma()
    };

    this.authService.registro(datosRegistro).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.success) {
          // Redirigir al login pasando el correo en el estado de navegación (NUNCA la contraseña)
          this.router.navigate(['/login'], {
            state: {
              correo: datosRegistro.correo,
              mensajeExito: this.translate.instant('AUTH.REGISTRO_EXITOSO')
            }
          });
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
