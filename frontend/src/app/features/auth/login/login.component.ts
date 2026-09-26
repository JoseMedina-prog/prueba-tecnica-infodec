import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiHttpError } from '../../../core/models';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertaErrorComponent } from '../../../shared/components/alerta-error/alerta-error.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error.component';
import { AuthShellComponent } from '../../../shared/components/auth-shell/auth-shell.component';

@Component({
  selector: 'app-login',
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
    <app-auth-shell enlace="registro">
        <div>
          <header class="encabezado-pantalla">
            <h1 class="titulo-pantalla">{{ 'AUTH.LOGIN_TITLE' | translate }}</h1>
            <p class="bajada">{{ 'AUTH.LOGIN_SUBTITLE' | translate }}</p>
          </header>

          @if (mensajeExito()) {
            <div class="alert alert-success small" role="status">{{ mensajeExito() }}</div>
          }

          <app-alerta-error [error]="errorGeneral()" />

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
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

            <div class="mb-4">
              <label for="password" class="form-label">
                {{ 'AUTH.PASSWORD' | translate }} <span class="requerido" aria-hidden="true">*</span>
              </label>
              <input
                type="password"
                id="password"
                class="form-control"
                [class.is-invalid]="(form.get('password')?.invalid && (form.get('password')?.dirty || form.get('password')?.touched)) || erroresCampos()['password']"
                formControlName="password"
                autocomplete="current-password"
              />
              <app-campo-error [control]="form.get('password')" [mensajeServidor]="erroresCampos()['password']" />
            </div>

            <button
              type="submit"
              class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
              [disabled]="cargando()"
            >
              @if (cargando()) {
                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
              }
              <span>{{ 'AUTH.ENTRAR' | translate }}</span>
            </button>
          </form>

          <p class="auth-pie">
            {{ 'AUTH.NO_TIENES_CUENTA' | translate }}
            <a routerLink="/registro" class="fw-semibold">{{ 'AUTH.REGISTRATE_AQUI' | translate }}</a>
          </p>
        </div>
    </app-auth-shell>
  `
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);

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
        message: this.translate.instant('AUTH.SESION_EXPIRADA')
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
