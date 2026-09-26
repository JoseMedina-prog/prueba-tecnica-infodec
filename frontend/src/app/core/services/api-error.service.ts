import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiErrorDetail, ApiHttpError } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiErrorService {
  private readonly translate = inject(TranslateService);

  /**
   * Transforma un HttpErrorResponse en un ApiHttpError normalizado y traducido.
   */
  procesarError(err: unknown): ApiHttpError {
    if (!(err instanceof HttpErrorResponse)) {
      return {
        status: 0,
        code: 'ERROR_DESCONOCIDO',
        message: this.translate.instant('ERRORES.ERROR_DESCONOCIDO')
      };
    }

    // Caso: Sin conexión o error de red (status 0)
    if (err.status === 0) {
      return {
        status: 0,
        code: 'ERROR_RED',
        message: this.translate.instant('ERRORES.ERROR_RED'),
        traceId: undefined
      };
    }

    const payload = err.error;
    const backendCode: string = payload?.error?.code || this.obtenerCodigoPorStatus(err.status);
    const details: ApiErrorDetail[] | undefined = payload?.error?.details;
    const traceId: string | undefined = payload?.trace_id || err.headers?.get('X-Trace-Id') || undefined;

    // Obtener Retry-After si viene en cabeceras
    const retryAfterHeader = err.headers?.get('Retry-After') ?? err.headers?.get('retry-after');
    const parsedRetryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
    const retryAfter = (parsedRetryAfter !== undefined && !isNaN(parsedRetryAfter)) ? parsedRetryAfter : undefined;

    // Obtener mensaje traducido según el código de error
    const segundos = retryAfter ?? 60;
    const claveTraduccion = (backendCode === 'TOO_MANY_ATTEMPTS' && segundos === 1)
      ? 'ERRORES.TOO_MANY_ATTEMPTS_1'
      : `ERRORES.${backendCode}`;
    let mensaje = this.translate.instant(claveTraduccion, { segundos });

    // Si ngx-translate devuelve la misma clave porque no existe, usar el mensaje del backend o genérico
    if (mensaje === claveTraduccion) {
      if (backendCode === 'TOO_MANY_ATTEMPTS') {
        const lang = typeof this.translate.currentLang === 'function' ? this.translate.currentLang() : (this.translate as any).currentLang;
        const esAleman = lang === 'de';
        mensaje = segundos === 1
          ? (esAleman ? 'Zu viele Versuche. Warte 1 Sekunde, bevor du es erneut versuchst.' : 'Demasiados intentos. Espera 1 segundo antes de volver a intentar.')
          : (esAleman ? `Zu viele Versuche. Warte ${segundos} Sekunden, bevor du es erneut versuchst.` : `Demasiados intentos. Espera ${segundos} segundos antes de volver a intentar.`);
      } else {
        mensaje = payload?.error?.message || this.translate.instant('ERRORES.ERROR_DESCONOCIDO');
      }
    }

    return {
      status: err.status,
      code: backendCode,
      message: mensaje,
      details,
      traceId,
      retryAfter
    };
  }

  /**
   * Convierte los detalles de validación de 422 en un diccionario campo -> mensaje
   */
  mapearDetallesPorCampo(details?: ApiErrorDetail[]): Record<string, string> {
    const mapa: Record<string, string> = {};
    if (!details || !Array.isArray(details)) {
      return mapa;
    }

    for (const d of details) {
      if (d.field) {
        mapa[d.field] = d.message;
      }
    }
    return mapa;
  }

  private obtenerCodigoPorStatus(status: number): string {
    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'AUTH_INVALID_CREDENTIALS';
      case 404:
        return 'ROUTE_NOT_FOUND';
      case 405:
        return 'METHOD_NOT_ALLOWED';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'TOO_MANY_ATTEMPTS';
      case 502:
        return 'EXTERNAL_SERVICE_UNAVAILABLE';
      case 504:
        return 'EXTERNAL_SERVICE_TIMEOUT';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
