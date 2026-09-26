import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiHttpError } from '../../../core/models';

@Component({
  selector: 'app-alerta-error',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (error()) {
      <div class="alert alert-danger" role="alert">
        <div class="fw-semibold" aria-live="off">
          <span aria-live="off">{{ obtenerMensaje() }}</span>
        </div>
        @if (obtenerTraceId()) {
          <div class="mt-1 small text-body-secondary">
            {{ 'ERRORES.REFERENCIA' | translate }}: <span class="mono">{{ obtenerTraceId() }}</span>
          </div>
        }
      </div>
    }
  `
})
export class AlertaErrorComponent {
  readonly error = input<ApiHttpError | string | null>(null);

  obtenerMensaje(): string {
    const err = this.error();
    if (!err) return '';
    if (typeof err === 'string') return err;
    return err.message;
  }

  obtenerTraceId(): string | undefined {
    const err = this.error();
    if (!err || typeof err === 'string') return undefined;
    return err.traceId;
  }
}
