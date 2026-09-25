import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiHttpError } from '../../../core/models';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertaErrorComponent } from '../../../shared/components/alerta-error/alerta-error.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error.component';

@Component({
  selector: 'app-login',
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
        <div class="col-12 col-md-8 col-lg-5">
          <div class="card shadow border-0 rounded-4">
            <div class="card-body p-4 p-md-5">
              <div class="text-center mb-4">
                <div class="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-3" style="width: 56px; height: 56px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" class="bi bi-box-arrow-in-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0z"/>
                    <path fill-rule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
                  </svg>
                </div>
                <h2 class="h4 fw-bold mb-1">{{ 'AUTH.LOGIN_TITLE' | translate }}</h2>
                <p class="text-muted small">{{ 'AUTH.LOGIN_SUBTITLE' | translate }}</p>
              </div>

              <!-- Mensaje de éxito tras registro -->
              @if (mensajeExito()) {
                <div class="alert alert-success d-flex align-items-center mb-4 shadow-sm" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-check-circle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                  <div class="small fw-medium">
                    {{ mensajeExito() }}
                  </div>
                </div>
              }

              <!-- Alerta general de error -->
              <app-alerta-error [error]="errorGeneral()" />

              <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
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
                <div class="mb-4">
                  <label for="password" class="form-label fw-semibold small">
                    {{ 'AUTH.PASSWORD' | translate }} <span class="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    class="form-control"
                    [class.is-invalid]="(form.get('password')?.invalid && (form.get('password')?.dirty || form.get('password')?.touched)) || erroresCampos()['password']"
                    formControlName="password"
                    placeholder="••••••••"
                    autocomplete="current-password"
                  />
                  <app-campo-error
                    [control]="form.get('password')"
                    [mensajeServidor]="erroresCampos()['password']"
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
                  <span>{{ 'AUTH.ENTRAR' | translate }}</span>
                </button>
              </form>

              <div class="text-center mt-4 pt-2 border-top">
                <span class="text-muted small">{{ 'AUTH.NO_TIENES_CUENTA' | translate }}</span>
                <a routerLink="/registro" class="ms-1 small fw-semibold text-decoration-none">
                  {{ 'AUTH.REGISTRATE_AQUI' | translate }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly apiErrorService = inject(ApiErrorService);

  readonly cargando = signal<boolean>(false);
  readonly errorGeneral = signal<ApiHttpError | null>(null);
  readonly erroresCampos = signal<Record<string, string>>({});
  readonly mensajeExito = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    // Si viene desde registro con correo prellenado o aviso de sesión expirada
    const navegacion = history.state;
    if (navegacion?.correo) {
      this.form.patchValue({ correo: navegacion.correo });
      this.mensajeExito.set(navegacion.mensajeExito || null);
    }

    if (navegacion?.sesionExpirada) {
      this.errorGeneral.set({
        status: 401,
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Tu sesión ha expirado o no es válida. Por favor, ingresa de nuevo.'
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

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
