import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { IdiomaService } from '../services/idioma.service';
import { TokenStorageService } from '../services/token-storage.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorageService;
  let authService: AuthService;
  let router: Router;

  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideTranslateService()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);

    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('a) debe agregar las cabeceras Authorization y Accept-Language en peticiones a la API', () => {
    tokenStorage.setTokens('access-token-123', 'refresh-token-456');

    http.get(`${apiUrl}/consultas`).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/consultas`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-token-123');
    expect(req.request.headers.get('Accept-Language')).toBe('es');
    req.flush({ success: true, data: [] });
  });

  it('no debe modificar peticiones fuera de la API (archivos de traducción)', () => {
    tokenStorage.setTokens('access-token-123', 'refresh-token-456');

    http.get('/i18n/es.json').subscribe();

    const req = httpMock.expectOne('/i18n/es.json');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('b) ante AUTH_TOKEN_EXPIRED debe llamar a /auth/refresh una vez y repetir la petición con el nuevo token', () => {
    tokenStorage.setTokens('token-expirado', 'refresh-token-valido');

    let respuestaFinal: any;
    http.get(`${apiUrl}/consultas`).subscribe((res) => {
      respuestaFinal = res;
    });

    // 1. Petición inicial falla con 401 y código AUTH_TOKEN_EXPIRED
    const reqInicial = httpMock.expectOne(`${apiUrl}/consultas`);
    expect(reqInicial.request.headers.get('Authorization')).toBe('Bearer token-expirado');
    reqInicial.flush(
      {
        success: false,
        error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Token expirado' }
      },
      { status: 401, statusText: 'Unauthorized' }
    );

    // 2. El interceptor debe llamar automáticamente a /auth/refresh
    const reqRefresh = httpMock.expectOne(`${apiUrl}/auth/refresh`);
    expect(reqRefresh.request.body).toEqual({ refresh_token: 'refresh-token-valido' });
    reqRefresh.flush({
      success: true,
      data: {
        access_token: 'nuevo-token-789',
        refresh_token: 'nuevo-refresh-999',
        token_type: 'Bearer',
        expires_in: 900
      }
    });

    // 3. La petición original se repite con el nuevo token y marca de reintento
    const reqReintento = httpMock.expectOne(`${apiUrl}/consultas`);
    expect(reqReintento.request.headers.get('Authorization')).toBe('Bearer nuevo-token-789');
    expect(reqReintento.request.headers.get('X-Reintento-Auth')).toBe('1');
    reqReintento.flush({ success: true, data: [{ id: 1 }] });

    expect(respuestaFinal).toEqual({ success: true, data: [{ id: 1 }] });
    expect(tokenStorage.getAccessToken()).toBe('nuevo-token-789');
  });

  it('c) dos peticiones que vencen al mismo tiempo deben generar UNA sola llamada a /auth/refresh', () => {
    tokenStorage.setTokens('token-viejo', 'refresh-token-compartido');

    let res1: any;
    let res2: any;

    http.get(`${apiUrl}/consultas`).subscribe((r) => (res1 = r));
    http.get(`${apiUrl}/paises`).subscribe((r) => (res2 = r));

    // Ambas peticiones iniciales
    const req1 = httpMock.expectOne(`${apiUrl}/consultas`);
    const req2 = httpMock.expectOne(`${apiUrl}/paises`);

    // Ambas fallan con 401 AUTH_TOKEN_EXPIRED
    req1.flush(
      { success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Expirado' } },
      { status: 401, statusText: 'Unauthorized' }
    );
    req2.flush(
      { success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Expirado' } },
      { status: 401, statusText: 'Unauthorized' }
    );

    // Se verifica que SOLO haya una única petición de refresh
    const reqRefresh = httpMock.expectOne(`${apiUrl}/auth/refresh`);
    reqRefresh.flush({
      success: true,
      data: {
        access_token: 'token-compartido-renovado',
        refresh_token: 'refresh-compartido-renovado',
        token_type: 'Bearer',
        expires_in: 900
      }
    });

    // Ambas peticiones se reintentan con el nuevo token compartido
    const reintento1 = httpMock.expectOne(`${apiUrl}/consultas`);
    const reintento2 = httpMock.expectOne(`${apiUrl}/paises`);

    expect(reintento1.request.headers.get('Authorization')).toBe('Bearer token-compartido-renovado');
    expect(reintento2.request.headers.get('Authorization')).toBe('Bearer token-compartido-renovado');

    reintento1.flush({ success: true, data: ['consulta'] });
    reintento2.flush({ success: true, data: ['pais'] });

    expect(res1).toEqual({ success: true, data: ['consulta'] });
    expect(res2).toEqual({ success: true, data: ['pais'] });
  });

  it('d) si el refresh falla, debe limpiar la sesión y navegar a /login', () => {
    const navigateSpy = spyOn(router, 'navigate');
    tokenStorage.setTokens('token-expirado', 'refresh-invalido');

    let errorRecibido: any;
    http.get(`${apiUrl}/consultas`).subscribe({
      error: (err) => (errorRecibido = err)
    });

    // 1. Petición inicial falla con 401 expirado
    const reqInicial = httpMock.expectOne(`${apiUrl}/consultas`);
    reqInicial.flush(
      { success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Expirado' } },
      { status: 401, statusText: 'Unauthorized' }
    );

    // 2. El refresh falla con 401 (por ejemplo token revocado)
    const reqRefresh = httpMock.expectOne(`${apiUrl}/auth/refresh`);
    reqRefresh.flush(
      { success: false, error: { code: 'AUTH_TOKEN_REVOKED', message: 'Revocado' } },
      { status: 401, statusText: 'Unauthorized' }
    );

    // 3. Debe limpiarse la sesión y navegar a /login
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { state: { sesionExpirada: true } });
    expect(errorRecibido).toBeDefined();
  });

  it('e) si la renovación falla a mitad del uso, sessionStorage ya está limpio al redirigir y se redirige una sola vez', () => {
    tokenStorage.setTokens('token-expirado', 'refresh-revocado');
    sessionStorage.setItem('travel_consulta_estado', JSON.stringify({ presupuesto: '1000000' }));

    // Lo que habría en sessionStorage en el momento exacto de la redirección
    const alRedirigir: (string | null)[][] = [];
    const navigateSpy = spyOn(router, 'navigate').and.callFake(() => {
      alRedirigir.push([sessionStorage.getItem('refresh_token'), sessionStorage.getItem('travel_consulta_estado')]);
      return Promise.resolve(true);
    });

    // Dos peticiones vencen al tiempo y esperan la misma renovación
    http.get(`${apiUrl}/consultas`).subscribe({ error: () => {} });
    http.get(`${apiUrl}/paises`).subscribe({ error: () => {} });
    for (const url of [`${apiUrl}/consultas`, `${apiUrl}/paises`]) {
      httpMock
        .expectOne(url)
        .flush(
          { success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Expirado' } },
          { status: 401, statusText: 'Unauthorized' }
        );
    }
    httpMock
      .expectOne(`${apiUrl}/auth/refresh`)
      .flush(
        { success: false, error: { code: 'AUTH_TOKEN_REVOKED', message: 'Revocado' } },
        { status: 401, statusText: 'Unauthorized' }
      );

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { state: { sesionExpirada: true } });
    expect(alRedirigir).toEqual([[null, null]]);
  });
});
