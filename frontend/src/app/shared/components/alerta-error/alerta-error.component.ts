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
      <div class="alert alert-danger alert-dismissible fade show d-flex flex-column shadow-sm" role="alert">
        <div class="d-flex align-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
          </svg>
          <div class="fw-semibold">
            {{ obtenerMensaje() }}
          </div>
        </div>

        @if (obtenerTraceId()) {
          <div class="mt-2 pt-2 border-top border-danger-subtle small text-secondary">
            <span class="fw-medium">{{ 'ERRORES.REFERENCIA' | translate }}:</span>
            <code class="text-danger-emphasis ms-1">{{ obtenerTraceId() }}</code>
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
