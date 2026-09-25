import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-campo-error',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (mensajeServidor()) {
      <div class="invalid-feedback d-block">
        {{ mensajeServidor() }}
      </div>
    } @else if (control() && control()!.invalid && (control()!.dirty || control()!.touched)) {
      <div class="invalid-feedback d-block">
        @if (control()!.hasError('required')) {
          {{ 'VALIDACION.REQUERIDO' | translate }}
        } @else if (control()!.hasError('email')) {
          {{ 'VALIDACION.EMAIL_INVALIDO' | translate }}
        } @else if (control()!.hasError('minlength')) {
          {{ 'VALIDACION.PASSWORD_MIN' | translate }}
        } @else if (control()!.hasError('passwordComplexity')) {
          {{ 'VALIDACION.PASSWORD_COMPLEJIDAD' | translate }}
        } @else if (control()!.hasError('passwordMismatch')) {
          {{ 'VALIDACION.PASSWORD_MISMATCH' | translate }}
        } @else {
          {{ mensajePersonalizado() || ('VALIDACION.REQUERIDO' | translate) }}
        }
      </div>
    }
  `
})
export class CampoErrorComponent {
  readonly control = input<AbstractControl | null>(null);
  readonly mensajeServidor = input<string | null | undefined>(null);
  readonly mensajePersonalizado = input<string | null>(null);
}
