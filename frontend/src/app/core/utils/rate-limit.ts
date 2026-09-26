import { DestroyRef, Signal, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, timer } from 'rxjs';
import { ApiHttpError } from '../models';

export interface RateLimitTimer {
  readonly segundos: Signal<number>;
  readonly activo: Signal<boolean>;
  readonly correoBloqueado: Signal<string | null>;
  readonly errorParaMostrar: Signal<ApiHttpError | null>;
  readonly mensajeInicial: Signal<string | null>;
  estaBloqueado(correoActual?: string | null): boolean;
  iniciar(error: ApiHttpError, correo?: string | null): void;
  limpiar(): void;
}

/**
 * Crea un temporizador reactivo para gestionar el aviso de 429 (Too Many Attempts)
 * con cuenta regresiva en vivo, soporte singular/plural, retención de trace_id,
 * bloqueo condicional por correo (login) o general (registro, presupuesto),
 * y limpieza automática de timers al destruirse el contexto.
 */
export function crearRateLimitTimer(
  destroyRef: DestroyRef = inject(DestroyRef),
  translate: TranslateService = inject(TranslateService)
): RateLimitTimer {
  const segundos = signal<number>(0);
  const correoBloqueado = signal<string | null>(null);
  const traceId = signal<string | undefined>(undefined);
  const codigoError = signal<string>('TOO_MANY_ATTEMPTS');
  const mensajeInicial = signal<string | null>(null);
  const langSignal = signal<string | null>(null);

  const langSub = translate.onLangChange?.subscribe?.((event) => {
    langSignal.set(event?.lang ?? null);
  });

  let subscription: Subscription | null = null;

  destroyRef.onDestroy(() => {
    langSub?.unsubscribe();
    limpiar();
  });

  function limpiar(): void {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
    segundos.set(0);
    correoBloqueado.set(null);
    traceId.set(undefined);
    mensajeInicial.set(null);
  }

  function formatearMensaje(seg: number): string {
    const clave = seg === 1 ? 'ERRORES.TOO_MANY_ATTEMPTS_1' : 'ERRORES.TOO_MANY_ATTEMPTS';
    let msg = translate.instant(clave, { segundos: seg });
    if (msg === clave) {
      const lang = typeof translate.currentLang === 'function' ? translate.currentLang() : (translate as any).currentLang;
      const esAleman = lang === 'de';
      if (esAleman) {
        msg = seg === 1
          ? 'Zu viele Versuche. Warte 1 Sekunde, bevor du es erneut versuchst.'
          : `Zu viele Versuche. Warte ${seg} Sekunden, bevor du es erneut versuchst.`;
      } else {
        msg = seg === 1
          ? 'Demasiados intentos. Espera 1 segundo antes de volver a intentar.'
          : `Demasiados intentos. Espera ${seg} segundos antes de volver a intentar.`;
      }
    }
    return msg;
  }

  function iniciar(error: ApiHttpError, correo?: string | null): void {
    limpiar();

    const seg = (error.retryAfter && !isNaN(error.retryAfter) && error.retryAfter > 0)
      ? error.retryAfter
      : 60;

    segundos.set(seg);
    traceId.set(error.traceId);
    codigoError.set(error.code || 'TOO_MANY_ATTEMPTS');
    mensajeInicial.set(formatearMensaje(seg));

    if (correo) {
      correoBloqueado.set(correo.toLowerCase().trim());
    } else {
      correoBloqueado.set(null);
    }

    subscription = timer(1000, 1000).subscribe(() => {
      const actual = segundos();
      if (actual <= 1) {
        limpiar();
      } else {
        segundos.set(actual - 1);
      }
    });
  }

  function estaBloqueado(correoActual?: string | null): boolean {
    if (segundos() <= 0) {
      return false;
    }
    const bloqueado = correoBloqueado();
    if (bloqueado !== null) {
      const actual = correoActual ? correoActual.toLowerCase().trim() : '';
      return actual === bloqueado;
    }
    return true;
  }

  const activo = computed(() => segundos() > 0);

  const errorParaMostrar = computed<ApiHttpError | null>(() => {
    langSignal();
    const seg = segundos();
    if (seg <= 0) {
      return null;
    }
    return {
      status: 429,
      code: codigoError(),
      message: formatearMensaje(seg),
      traceId: traceId(),
      retryAfter: seg
    };
  });

  return {
    segundos,
    activo,
    correoBloqueado,
    errorParaMostrar,
    mensajeInicial,
    estaBloqueado,
    iniciar,
    limpiar
  };
}
