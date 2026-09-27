import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DestinoSalida } from '../models/salida.model';
import { IdiomaService } from './idioma.service';
import { SalidaService } from './salida.service';

describe('SalidaService', () => {
  let service: SalidaService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const mockSalidas: DestinoSalida[] = [
    {
      codigo_iata: 'HND',
      ciudad: 'Tokio',
      pais: 'Japón',
      moneda: { codigo: 'JPY', simbolo: '¥' }
    },
    {
      codigo_iata: 'LHR',
      ciudad: 'Londres',
      pais: 'Reino Unido',
      moneda: { codigo: 'GBP', simbolo: '£' }
    }
  ];

  const mockResponse: ApiResponse<DestinoSalida[]> = {
    success: true,
    data: mockSalidas
  };

  let idiomaService: IdiomaService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        SalidaService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService()
      ]
    });

    idiomaService = TestBed.inject(IdiomaService);
    idiomaService.cambiarIdioma('es');
    service = TestBed.inject(SalidaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('pide de nuevo al cambiar de idioma con el Accept-Language nuevo, y volver al anterior no repite la petición', () => {
    const salidasDe: DestinoSalida[] = [
      { codigo_iata: 'LON', ciudad: 'London', pais: 'England', moneda: { codigo: 'GBP', simbolo: '£' } }
    ];

    let enEspanol: DestinoSalida[] | undefined;
    service.getSalidas().subscribe((data) => (enEspanol = data));
    const reqEs = httpMock.expectOne(`${apiUrl}/salidas`);
    expect(reqEs.request.headers.get('Accept-Language')).toBe('es');
    reqEs.flush(mockResponse);
    expect(enEspanol).toEqual(mockSalidas);

    idiomaService.cambiarIdioma('de');
    let enAleman: DestinoSalida[] | undefined;
    service.getSalidas().subscribe((data) => (enAleman = data));
    const reqDe = httpMock.expectOne(`${apiUrl}/salidas`);
    expect(reqDe.request.headers.get('Accept-Language')).toBe('de');
    reqDe.flush({ success: true, data: salidasDe });
    expect(enAleman).toEqual(salidasDe);

    idiomaService.cambiarIdioma('es');
    let otraVezEspanol: DestinoSalida[] | undefined;
    service.getSalidas().subscribe((data) => (otraVezEspanol = data));
    httpMock.expectNone(`${apiUrl}/salidas`);
    expect(otraVezEspanol).toEqual(mockSalidas);
  });

  it('hace una sola petición HTTP cuando hay dos suscripciones concurrentes', () => {
    let resultado1: DestinoSalida[] | undefined;
    let resultado2: DestinoSalida[] | undefined;

    // Dos suscripciones a getSalidas() (ej. login y carrusel)
    service.getSalidas().subscribe((data) => (resultado1 = data));
    service.getSalidas().subscribe((data) => (resultado2 = data));

    // Debe existir exactamente UNA petición HTTP a /salidas
    const req = httpMock.expectOne(`${apiUrl}/salidas`);
    expect(req.request.method).toBe('GET');

    // Respondemos la petición
    req.flush(mockResponse);

    // Ambas suscripciones reciben los mismos datos
    expect(resultado1).toEqual(mockSalidas);
    expect(resultado2).toEqual(mockSalidas);
  });

  it('reutiliza la respuesta en caché para suscripciones posteriores sin nueva petición HTTP', () => {
    let resultado1: DestinoSalida[] | undefined;
    service.getSalidas().subscribe((data) => (resultado1 = data));

    const req = httpMock.expectOne(`${apiUrl}/salidas`);
    req.flush(mockResponse);
    expect(resultado1).toEqual(mockSalidas);

    // Suscripción posterior
    let resultado2: DestinoSalida[] | undefined;
    service.getSalidas().subscribe((data) => (resultado2 = data));

    // No debe emitirse otra petición HTTP
    httpMock.expectNone(`${apiUrl}/salidas`);
    expect(resultado2).toEqual(mockSalidas);
  });

  it('no guarda el error en caché: la próxima suscripción reintenta la petición HTTP', () => {
    let error1: unknown;
    service.getSalidas().subscribe({
      next: () => fail('no debió responder éxito'),
      error: (err) => (error1 = err)
    });

    // Primera petición falla
    const req1 = httpMock.expectOne(`${apiUrl}/salidas`);
    req1.flush({ message: 'Error de servidor' }, { status: 500, statusText: 'Internal Server Error' });
    expect(error1).toBeDefined();

    // Nueva suscripción después del error
    let resultado2: DestinoSalida[] | undefined;
    service.getSalidas().subscribe({
      next: (data) => (resultado2 = data),
      error: () => fail('no debió fallar la segunda')
    });

    // Debe realizarse una SEGUNDA petición HTTP (reintento)
    const req2 = httpMock.expectOne(`${apiUrl}/salidas`);
    expect(req2.request.method).toBe('GET');
    req2.flush(mockResponse);

    expect(resultado2).toEqual(mockSalidas);
  });
});
