import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiErrorService } from './api-error.service';

describe('ApiErrorService', () => {
  let service: ApiErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()]
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      ERRORES: {
        NOT_FOUND: 'No encontrado',
        USER_ALREADY_EXISTS: 'Ya existe una cuenta con ese correo.',
        ERROR_DESCONOCIDO: 'Error inesperado'
      }
    });
    translate.use('es');
    service = TestBed.inject(ApiErrorService);
  });

  it('sin error.code en la respuesta usa los mismos códigos que el backend según el status', () => {
    const esperados: Record<number, string> = {
      400: 'BAD_REQUEST',
      404: 'NOT_FOUND',
      409: 'USER_ALREADY_EXISTS',
      413: 'PAYLOAD_TOO_LARGE',
      502: 'EXTERNAL_API_ERROR',
      504: 'EXTERNAL_API_TIMEOUT',
      500: 'INTERNAL_ERROR'
    };

    for (const [status, codigo] of Object.entries(esperados)) {
      const error = service.procesarError(new HttpErrorResponse({ status: Number(status), error: null }));
      expect(error.code).withContext(`status ${status}`).toBe(codigo);
    }
  });

  it('traduce USER_ALREADY_EXISTS en el front en lugar de usar el mensaje del backend', () => {
    const error = service.procesarError(
      new HttpErrorResponse({
        status: 409,
        error: { success: false, error: { code: 'USER_ALREADY_EXISTS', message: 'Mensaje del backend' } }
      })
    );

    expect(error.code).toBe('USER_ALREADY_EXISTS');
    expect(error.message).toBe('Ya existe una cuenta con ese correo.');
  });
});
