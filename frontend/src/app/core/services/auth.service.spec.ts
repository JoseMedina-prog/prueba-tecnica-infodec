import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthService } from './auth.service';
import { ConsultaStateService } from './consulta-state.service';

describe('AuthService.inicializarSesion (al recargar la página)', () => {
  const apiUrl = environment.apiUrl;
  let httpMock: HttpTestingController;
  let navigateSpy: jasmine.Spy;

  /** Simula un F5 con sesión: el refresh y el estado de la consulta siguen en sessionStorage. */
  function prepararRecarga(): AuthService {
    sessionStorage.setItem('refresh_token', 'refresh-revocado');
    sessionStorage.setItem(
      'travel_consulta_estado',
      JSON.stringify({ pais: { id: 2 }, ciudad: { id: 3 }, presupuesto: '1000000', resultado: null })
    );

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideTranslateService()
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    return TestBed.inject(AuthService);
  }

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('si el backend rechaza el refresh, borra access, refresh y estado de la consulta sin mostrar aviso', async () => {
    const auth = prepararRecarga();
    const consultaState = TestBed.inject(ConsultaStateService);
    expect(consultaState.ciudad()).not.toBeNull();

    const inicio = auth.inicializarSesion();
    httpMock
      .expectOne(`${apiUrl}/auth/refresh`)
      .flush(
        { success: false, error: { code: 'AUTH_TOKEN_REVOKED', message: 'Revocado' } },
        { status: 401, statusText: 'Unauthorized' }
      );
    await inicio;

    expect(sessionStorage.getItem('refresh_token')).toBeNull();
    expect(sessionStorage.getItem('travel_consulta_estado')).toBeNull();
    expect(consultaState.ciudad()).toBeNull();
    expect(auth.estaAutenticado()).toBeFalse();
    expect(auth.usuario()).toBeNull();
    expect(auth.estaInicializado()).toBeTrue();
    // Sin navegación con { sesionExpirada: true }: los guards llevan al login limpio
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('si el refresh responde sin éxito, también limpia todo', async () => {
    const auth = prepararRecarga();

    const inicio = auth.inicializarSesion();
    httpMock.expectOne(`${apiUrl}/auth/refresh`).flush({ success: false });
    await inicio;

    expect(sessionStorage.getItem('refresh_token')).toBeNull();
    expect(sessionStorage.getItem('travel_consulta_estado')).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('si el refresh es válido, restaura la sesión y conserva el estado de la consulta', async () => {
    const auth = prepararRecarga();

    const inicio = auth.inicializarSesion();
    httpMock.expectOne(`${apiUrl}/auth/refresh`).flush({
      success: true,
      data: { access_token: 'access-nuevo', refresh_token: 'refresh-nuevo', token_type: 'Bearer', expires_in: 900 }
    });
    await new Promise((resolver) => setTimeout(resolver));
    const me = httpMock.expectOne(`${apiUrl}/auth/me`);
    expect(me.request.headers.get('Authorization')).toBe('Bearer access-nuevo');
    me.flush({ success: true, data: { id: 1, nombre: 'Usuario Prueba', correo: 'prueba@travelapp.test', idioma: 'es' } });
    await inicio;

    expect(auth.estaAutenticado()).toBeTrue();
    expect(auth.usuario()?.nombre).toBe('Usuario Prueba');
    expect(sessionStorage.getItem('refresh_token')).toBe('refresh-nuevo');
    expect(sessionStorage.getItem('travel_consulta_estado')).not.toBeNull();
  });
});
