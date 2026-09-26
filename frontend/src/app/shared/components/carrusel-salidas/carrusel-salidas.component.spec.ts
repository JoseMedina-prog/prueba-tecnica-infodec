import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { DestinoSalida } from '../../../core/models';
import { SalidaService } from '../../../core/services/salida.service';
import { CarruselSalidasComponent } from './carrusel-salidas.component';

const DESTINOS_PRUEBA: DestinoSalida[] = [
  { codigo_iata: 'LON', ciudad: 'Londres', pais: 'Inglaterra', moneda: { codigo: 'GBP', simbolo: '£' } },
  { codigo_iata: 'CPH', ciudad: 'Copenhague', pais: 'Dinamarca', moneda: { codigo: 'DKK', simbolo: 'kr' } },
  { codigo_iata: 'TYO', ciudad: 'Tokio', pais: 'Japón', moneda: { codigo: 'JPY', simbolo: '¥' } },
  { codigo_iata: 'DEL', ciudad: 'Nueva Delhi', pais: 'India', moneda: { codigo: 'INR', simbolo: '₹' } },
  { codigo_iata: 'BOM', ciudad: 'Bombay', pais: 'India', moneda: { codigo: 'INR', simbolo: '₹' } },
  { codigo_iata: 'MAN', ciudad: 'Mánchester', pais: 'Inglaterra', moneda: { codigo: 'GBP', simbolo: '£' } },
  { codigo_iata: 'AAR', ciudad: 'Aarhus', pais: 'Dinamarca', moneda: { codigo: 'DKK', simbolo: 'kr' } },
  { codigo_iata: 'OSA', ciudad: 'Osaka', pais: 'Japón', moneda: { codigo: 'JPY', simbolo: '¥' } }
];

describe('CarruselSalidasComponent', () => {
  let fixture: ComponentFixture<CarruselSalidasComponent>;
  let component: CarruselSalidasComponent;
  let salidaService: jasmine.SpyObj<SalidaService>;

  beforeEach(async () => {
    salidaService = jasmine.createSpyObj<SalidaService>('SalidaService', ['getSalidas']);
    salidaService.getSalidas.and.returnValue(of(DESTINOS_PRUEBA));

    await TestBed.configureTestingModule({
      imports: [CarruselSalidasComponent],
      providers: [
        provideTranslateService(),
        { provide: SalidaService, useValue: salidaService }
      ]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      TABLERO: {
        DESTINOS_DISPONIBLES: 'Destinos disponibles',
        ANTERIOR: 'Anterior',
        SIGUIENTE: 'Siguiente',
        DE: 'de'
      }
    });
    translate.use('es');

    fixture = TestBed.createComponent(CarruselSalidasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('el carrusel avanza y retrocede con los botones y los deshabilita en los extremos', fakeAsync(() => {
    const el = fixture.nativeElement as HTMLElement;
    const btnAnterior: HTMLButtonElement = el.querySelector('.btn-nav[aria-label="Anterior"]')!;
    const btnSiguiente: HTMLButtonElement = el.querySelector('.btn-nav[aria-label="Siguiente"]')!;
    const track = el.querySelector('.carrusel-track') as HTMLElement;

    // Al inicio: botón anterior deshabilitado, botón siguiente habilitado
    expect(component.enInicio()).toBeTrue();
    expect(btnAnterior.disabled).toBeTrue();
    expect(btnSiguiente.disabled).toBeFalse();

    // Mockeamos dimensiones de scroll en el elemento track
    Object.defineProperty(track, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(track, 'scrollWidth', { value: 1200, configurable: true });
    let currentScroll = 0;
    Object.defineProperty(track, 'scrollLeft', {
      get: () => currentScroll,
      set: (val: number) => { currentScroll = val; },
      configurable: true
    });
    track.scrollBy = jasmine.createSpy('scrollBy').and.callFake((opts: ScrollToOptions) => {
      currentScroll += opts.left ?? 0;
      component.actualizarExtremos();
    });

    // Avanzar con el botón siguiente
    btnSiguiente.click();
    tick(150);
    fixture.detectChanges();

    expect(track.scrollBy).toHaveBeenCalled();
    expect(component.enInicio()).toBeFalse();
    expect(btnAnterior.disabled).toBeFalse();

    // Simular que el carrusel llegó al final del scroll
    currentScroll = 800; // scrollWidth (1200) - clientWidth (400)
    component.actualizarExtremos();
    fixture.detectChanges();

    expect(component.enFin()).toBeTrue();
    expect(btnSiguiente.disabled).toBeTrue();

    // Retroceder con el botón anterior
    btnAnterior.click();
    tick(150);
    fixture.detectChanges();

    expect(component.enFin()).toBeFalse();
    expect(btnSiguiente.disabled).toBeFalse();
  }));

  it('cada tarjeta muestra la moneda con su código y símbolo', () => {
    const monedas: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.salida-moneda'));
    expect(monedas.length).toBe(DESTINOS_PRUEBA.length);
    expect(monedas[0].textContent?.trim()).toBe('GBP £');
    expect(monedas[1].textContent?.trim()).toBe('DKK kr');
    expect(monedas[2].textContent?.trim()).toBe('JPY ¥');
    expect(monedas[3].textContent?.trim()).toBe('INR ₹');
  });

  it('el encabezado muestra el texto COP → £ ¥ ₹ kr', () => {
    const indicador = fixture.nativeElement.querySelector('.carrusel-monedas');
    expect(indicador).toBeTruthy();
    expect(indicador.textContent?.trim()).toBe('COP → £ ¥ ₹ kr');
  });

  it('cada tarjeta tiene aria-label accesible con formato X de Y', () => {
    const tarjetas: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.tarjeta-salida'));
    expect(tarjetas.length).toBe(DESTINOS_PRUEBA.length);
    expect(tarjetas[0].getAttribute('aria-label')).toBe('1 de 8');
    expect(tarjetas[2].getAttribute('aria-label')).toBe('3 de 8');
  });

  it('el carrusel muestra una tarjeta por cada destino que devuelve el servicio', () => {
    const tarjetas = fixture.nativeElement.querySelectorAll('.tarjeta-salida');
    expect(tarjetas.length).toBe(DESTINOS_PRUEBA.length);

    // Con otra cantidad simulada (ej. 3 destinos)
    const tresDestinos: DestinoSalida[] = [
      { codigo_iata: 'LON', ciudad: 'Londres', pais: 'Inglaterra', moneda: { codigo: 'GBP', simbolo: '£' } },
      { codigo_iata: 'CPH', ciudad: 'Copenhague', pais: 'Dinamarca', moneda: { codigo: 'DKK', simbolo: 'kr' } },
      { codigo_iata: 'TYO', ciudad: 'Tokio', pais: 'Japón', moneda: { codigo: 'JPY', simbolo: '¥' } }
    ];
    salidaService.getSalidas.and.returnValue(of(tresDestinos));
    const fixture2 = TestBed.createComponent(CarruselSalidasComponent);
    fixture2.detectChanges();
    const tarjetas2 = fixture2.nativeElement.querySelectorAll('.tarjeta-salida');
    expect(tarjetas2.length).toBe(3);
  });

  it('con error de la API la tira no aparece', () => {
    salidaService.getSalidas.and.returnValue(throwError(() => new Error('Error de red al consultar salidas')));
    const errorFixture = TestBed.createComponent(CarruselSalidasComponent);
    errorFixture.detectChanges();

    const seccion = errorFixture.nativeElement.querySelector('.carrusel-seccion');
    expect(seccion).toBeNull();
    const titulo = errorFixture.nativeElement.querySelector('.carrusel-titulo');
    expect(titulo).toBeNull();
    const flechas = errorFixture.nativeElement.querySelectorAll('.btn-nav');
    expect(flechas.length).toBe(0);
    expect(errorFixture.componentInstance.destinos().length).toBe(0);
  });

  it('con respuesta vacía de la API la tira no aparece', () => {
    salidaService.getSalidas.and.returnValue(of([]));
    const vacioFixture = TestBed.createComponent(CarruselSalidasComponent);
    vacioFixture.detectChanges();

    const seccion = vacioFixture.nativeElement.querySelector('.carrusel-seccion');
    expect(seccion).toBeNull();
  });
});

