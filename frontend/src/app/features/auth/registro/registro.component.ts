import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiHttpError } from '../../../core/models';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { AuthService } from '../../../core/services/auth.service';
import { IdiomaService } from '../../../core/services/idioma.service';
import { AlertaErrorComponent } from '../../../shared/components/alerta-error/alerta-error.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error.component';
import { AuthShellComponent } from '../../../shared/components/auth-shell/auth-shell.component';

/**
 * Validador para complejidad de contraseña: al menos una mayúscula, una minúscula y un número
 */
export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const hasUpper = /[A-Z]/.test(control.value);
    const hasLower = /[a-z]/.test(control.value);
    const hasNumber = /[0-9]/.test(control.value);

    const valid = hasUpper && hasLower && hasNumber;
    return valid ? null : { passwordComplexity: true };
  };
}

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
    AuthShellComponent
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
              <input
                type="password"
                id="password"
                class="form-control"
                [class.is-invalid]="(form.get('password')?.invalid && (form.get('password')?.dirty || form.get('password')?.touched)) || erroresCampos()['password']"
                formControlName="password"
                aria-describedby="passwordAyuda"
                autocomplete="new-password"
              />
              <div id="passwordAyuda" class="form-text">{{ 'AUTH.PASSWORD_AYUDA' | translate }}</div>
              <app-campo-error [control]="form.get('password')" [mensajeServidor]="erroresCampos()['password']" />
            </div>

            <div class="mb-4">
              <label for="password_confirmation" class="form-label">
                {{ 'AUTH.PASSWORD_CONFIRM' | translate }} <span class="requerido" aria-hidden="true">*</span>
              </label>
              <input
                type="password"
                id="password_confirmation"
                class="form-control"
                [class.is-invalid]="(form.get('password_confirmation')?.invalid && (form.get('password_confirmation')?.dirty || form.get('password_confirmation')?.touched)) || erroresCampos()['password_confirmation']"
                formControlName="password_confirmation"
                autocomplete="new-password"
              />
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

  readonly form: FormGroup = this.fb.group(
    {
      nombre: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), passwordComplexityValidator()]],
      password_confirmation: ['', [Validators.required]]
    },
    { validators: passwordMatchValidator }
  );

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
