import { CommonModule } from '@angular/common';
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
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    AlertaErrorComponent,
    CampoErrorComponent
  ],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="card shadow border-0 rounded-4">
            <div class="card-body p-4 p-md-5">
              <div class="text-center mb-4">
                <div class="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-3" style="width: 56px; height: 56px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" class="bi bi-person-plus-fill" viewBox="0 0 16 16">
                    <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                    <path fill-rule="evenodd" d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5"/>
                  </svg>
                </div>
                <h2 class="h4 fw-bold mb-1">{{ 'AUTH.REGISTRO_TITLE' | translate }}</h2>
                <p class="text-muted small">{{ 'AUTH.REGISTRO_SUBTITLE' | translate }}</p>
              </div>

              <!-- Alerta general de error -->
              <app-alerta-error [error]="errorGeneral()" />

              <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
                <!-- Nombre -->
                <div class="mb-3">
                  <label for="nombre" class="form-label fw-semibold small">
                    {{ 'AUTH.NOMBRE' | translate }} <span class="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    class="form-control"
                    [class.is-invalid]="(form.get('nombre')?.invalid && (form.get('nombre')?.dirty || form.get('nombre')?.touched)) || erroresCampos()['nombre']"
                    formControlName="nombre"
                    placeholder="Tu nombre completo"
                    autocomplete="name"
                  />
                  <app-campo-error
                    [control]="form.get('nombre')"
                    [mensajeServidor]="erroresCampos()['nombre']"
                  />
                </div>

                <!-- Correo -->
                <div class="mb-3">
                  <label for="correo" class="form-label fw-semibold small">
                    {{ 'AUTH.CORREO' | translate }} <span class="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    id="correo"
                    class="form-control"
                    [class.is-invalid]="(form.get('correo')?.invalid && (form.get('correo')?.dirty || form.get('correo')?.touched)) || erroresCampos()['correo']"
                    formControlName="correo"
                    placeholder="ejemplo@correo.com"
                    autocomplete="email"
                  />
                  <app-campo-error
                    [control]="form.get('correo')"
                    [mensajeServidor]="erroresCampos()['correo']"
                  />
                </div>

                <!-- Contraseña -->
                <div class="mb-3">
                  <label for="password" class="form-label fw-semibold small">
                    {{ 'AUTH.PASSWORD' | translate }} <span class="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    class="form-control"
                    [class.is-invalid]="(form.get('password')?.invalid && (form.get('password')?.dirty || form.get('password')?.touched)) || erroresCampos()['password']"
                    formControlName="password"
                    placeholder="Mínimo 8 caracteres (mayúscula, minúscula, número)"
                    autocomplete="new-password"
                  />
                  <app-campo-error
                    [control]="form.get('password')"
                    [mensajeServidor]="erroresCampos()['password']"
                  />
                </div>

                <!-- Confirmación de Contraseña -->
                <div class="mb-4">
                  <label for="password_confirmation" class="form-label fw-semibold small">
                    {{ 'AUTH.PASSWORD_CONFIRM' | translate }} <span class="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    id="password_confirmation"
                    class="form-control"
                    [class.is-invalid]="(form.get('password_confirmation')?.invalid && (form.get('password_confirmation')?.dirty || form.get('password_confirmation')?.touched)) || erroresCampos()['password_confirmation']"
                    formControlName="password_confirmation"
                    placeholder="Repite tu contraseña"
                    autocomplete="new-password"
                  />
                  <app-campo-error
                    [control]="form.get('password_confirmation')"
                    [mensajeServidor]="erroresCampos()['password_confirmation']"
                  />
                </div>

                <!-- Botón de Envío -->
                <button
                  type="submit"
                  class="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  [disabled]="form.invalid || cargando()"
                >
                  @if (cargando()) {
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  }
                  <span>{{ 'AUTH.REGISTRARME' | translate }}</span>
                </button>
              </form>

              <div class="text-center mt-4 pt-2 border-top">
                <span class="text-muted small">{{ 'AUTH.YA_TIENES_CUENTA' | translate }}</span>
                <a routerLink="/login" class="ms-1 small fw-semibold text-decoration-none">
                  {{ 'AUTH.INICIA_SESION' | translate }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
