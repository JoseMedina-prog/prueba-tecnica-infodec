import { DestroyRef } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { ApiHttpError } from '../models';
import { crearRateLimitTimer } from './rate-limit';

describe('RateLimitTimer utility', () => {
  let mockDestroyRef: { onDestroy: jasmine.Spy; destroy: () => void };
  let callbacks: (() => void)[] = [];
  let mockTranslate: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    callbacks = [];
    mockDestroyRef = {
      onDestroy: jasmine.createSpy('onDestroy').and.callFake((fn: () => void) => {
        callbacks.push(fn);
      }),
      destroy: () => {
        callbacks.forEach((fn) => fn());
      }
    };

    mockTranslate = jasmine.createSpyObj('TranslateService', ['instant'], {
      currentLang: 'es',
      onLangChange: { subscribe: () => ({ unsubscribe: () => {} }) }
    });
    mockTranslate.instant.and.callFake((key: string, params?: Record<string, unknown>) => {
      if (key === 'ERRORES.TOO_MANY_ATTEMPTS_1') {
        return 'Demasiados intentos. Espera 1 segundo antes de volver a intentar.';
      }
      if (key === 'ERRORES.TOO_MANY_ATTEMPTS' && params?.['segundos']) {
        return `Demasiados intentos. Espera ${params['segundos']} segundos antes de volver a intentar.`;
      }
      return key;
    });
  });

  it('inicia con segundos dados por Retry-After y descuenta cada segundo hasta 0', fakeAsync(() => {
    const timer = crearRateLimitTimer(mockDestroyRef as unknown as DestroyRef, mockTranslate);

    const error429: ApiHttpError = {
      status: 429,
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Demasiados intentos',
      retryAfter: 3,
      traceId: 'trace-123'
    };

    timer.iniciar(error429);

    expect(timer.segundos()).toBe(3);
    expect(timer.activo()).toBeTrue();
    expect(timer.estaBloqueado()).toBeTrue();
    expect(timer.errorParaMostrar()?.message).toContain('3 segundos');
    expect(timer.errorParaMostrar()?.traceId).toBe('trace-123');

    // 1 segundo
    tick(1000);
    expect(timer.segundos()).toBe(2);
    expect(timer.errorParaMostrar()?.message).toContain('2 segundos');
    expect(timer.errorParaMostrar()?.traceId).toBe('trace-123');

    // 2 segundos -> singular "1 segundo"
    tick(1000);
    expect(timer.segundos()).toBe(1);
    expect(timer.errorParaMostrar()?.message).toContain('1 segundo');
    expect(timer.errorParaMostrar()?.traceId).toBe('trace-123');

    // 3 segundos -> finaliza
    tick(1000);
    expect(timer.segundos()).toBe(0);
    expect(timer.activo()).toBeFalse();
    expect(timer.estaBloqueado()).toBeFalse();
    expect(timer.errorParaMostrar()).toBeNull();
  }));

  it('usa 60 segundos por defecto si no llega Retry-After o es inválido', fakeAsync(() => {
    const timer = crearRateLimitTimer(mockDestroyRef as unknown as DestroyRef, mockTranslate);

    const errorSinRetry: ApiHttpError = {
      status: 429,
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Demasiados intentos'
    };

    timer.iniciar(errorSinRetry);
    expect(timer.segundos()).toBe(60);

    timer.limpiar();
    expect(timer.segundos()).toBe(0);
  }));

  it('bloquea por correo en minúsculas y sin espacios (login)', fakeAsync(() => {
    const timer = crearRateLimitTimer(mockDestroyRef as unknown as DestroyRef, mockTranslate);

    const error: ApiHttpError = {
      status: 429,
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Demasiados intentos',
      retryAfter: 5
    };

    timer.iniciar(error, '  Marlon@TravelApp.Test  ');

    expect(timer.correoBloqueado()).toBe('marlon@travelapp.test');
    expect(timer.estaBloqueado('marlon@travelapp.test')).toBeTrue();
    expect(timer.estaBloqueado('MARLON@travelapp.test ')).toBeTrue();
    expect(timer.estaBloqueado('otro@travelapp.test')).toBeFalse();
    expect(timer.estaBloqueado('')).toBeFalse();
    expect(timer.estaBloqueado(null)).toBeFalse();

    timer.limpiar();
  }));

  it('limpia el temporizador al destruirse el contexto sin dejar tareas pendientes', fakeAsync(() => {
    const timer = crearRateLimitTimer(mockDestroyRef as unknown as DestroyRef, mockTranslate);

    timer.iniciar({
      status: 429,
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Demasiados intentos',
      retryAfter: 10
    });

    tick(2000);
    expect(timer.segundos()).toBe(8);

    // Simular destrucción del componente
    mockDestroyRef.destroy();

    expect(timer.segundos()).toBe(0);
    expect(timer.activo()).toBeFalse();
    // No quedan temporizadores pendientes en fakeAsync
  }));
});
