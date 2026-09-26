import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { Subject, of, throwError } from 'rxjs';
import { DestinoSalida } from '../../../core/models';
import { IdiomaService } from '../../../core/services/idioma.service';
import { SalidaService } from '../../../core/services/salida.service';
import {
  RELOJ_FN,
  TableroSalidasComponent,
  actualizarEstados,
  generarSalidas,
  obtenerMinutosColombia
} from './tablero-salidas.component';

const DESTINOS_ES: DestinoSalida[] = [
  { codigo_iata: 'AAR', ciudad: 'Aarhus', pais: 'Dinamarca' },
  { codigo_iata: 'BOM', ciudad: 'Bombay', pais: 'India' },
  { codigo_iata: 'CPH', ciudad: 'Copenhague', pais: 'Dinamarca' },
  { codigo_iata: 'DEL', ciudad: 'Nueva Delhi', pais: 'India' },
  { codigo_iata: 'LON', ciudad: 'Londres', pais: 'Inglaterra' },
  { codigo_iata: 'MAN', ciudad: 'Mánchester', pais: 'Inglaterra' },
  { codigo_iata: 'OSA', ciudad: 'Osaka', pais: 'Japón' },
  { codigo_iata: 'TYO', ciudad: 'Tokio', pais: 'Japón' }
];

describe('TableroSalidasComponent', () => {
  let fixture: ComponentFixture<TableroSalidasComponent>;
  let component: TableroSalidasComponent;
  let salidaService: jasmine.SpyObj<SalidaService>;

  // Hora fija simulada en Colombia: 14:00 (UTC 19:00)
  const fechaSimulada = new Date('2026-09-25T19:00:00Z');

  const textos = (selector: string): string[] =>
    [...fixture.nativeElement.querySelectorAll(selector)].map((e: Element) => e.textContent!.trim());

  function crear(): void {
    fixture = TestBed.createComponent(TableroSalidasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.setItem('travel_app_lang', 'es');
    salidaService = jasmine.createSpyObj<SalidaService>('SalidaService', ['getSalidas']);
    salidaService.getSalidas.and.returnValue(of(DESTINOS_ES));

    await TestBed.configureTestingModule({
      imports: [TableroSalidasComponent],
      providers: [
        provideTranslateService(),
        { provide: RELOJ_FN, useValue: () => fechaSimulada },
        { provide: SalidaService, useValue: salidaService }
      ]
    }).compileComponents();

    TestBed.inject(TranslateService).setTranslation('es', {
      TABLERO: { NO_DISPONIBLE: 'Tablero no disponible' }
    });
    TestBed.inject(TranslateService).use('es');
  });

  afterEach(() => localStorage.clear());

  it('pide /api/salidas y muestra una fila por destino con el código IATA y la ciudad de la API', () => {
    crear();

    expect(salidaService.getSalidas).toHaveBeenCalledTimes(1);
    expect(component.estado()).toBe('listo');
    expect(textos('.fila:not(.cabecera):not(.fila-cargando) .codigo')).toEqual(DESTINOS_ES.map((d) => d.codigo_iata));
    expect(textos('.fila .destino')).toContain('Nueva Delhi');
    expect(component.hora()).toContain('14:00');
  });

  it('mientras carga muestra las filas de "cargando" y ninguna salida', () => {
    const respuesta = new Subject<DestinoSalida[]>();
    salidaService.getSalidas.and.returnValue(respuesta);
    crear();

    expect(component.estado()).toBe('cargando');
    expect(fixture.nativeElement.querySelectorAll('.fila-cargando').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.no-disponible')).toBeNull();

    respuesta.next(DESTINOS_ES);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.fila-cargando').length).toBe(0);
    expect(component.salidas().length).toBe(8);
  });

  it('si la petición falla, deja el tablero vacío con "Tablero no disponible" y sigue dando la hora', () => {
    salidaService.getSalidas.and.returnValue(throwError(() => new Error('500')));
    crear();

    expect(component.estado()).toBe('no-disponible');
    expect(component.salidas()).toEqual([]);
    expect(textos('.no-disponible')).toEqual(['Tablero no disponible']);
    expect(fixture.nativeElement.querySelectorAll('.fila-cargando').length).toBe(0);
    expect(textos('.reloj-hora')).toEqual(['14:00']);
  });

  it('al cambiar de idioma vuelve a pedir las salidas y conserva las horas', () => {
    crear();
    const horasAntes = component.salidas().map((s) => s.hora);

    salidaService.getSalidas.and.returnValue(
      of(DESTINOS_ES.map((d) => (d.codigo_iata === 'DEL' ? { ...d, ciudad: 'Neu-Delhi', pais: 'Indien' } : d)))
    );
    TestBed.inject(IdiomaService).cambiarIdioma('de');
    fixture.detectChanges();

    expect(salidaService.getSalidas).toHaveBeenCalledTimes(2);
    expect(textos('.fila .destino')).toContain('Neu-Delhi');
    expect(component.salidas().map((s) => s.hora)).toEqual(horasAntes);
  });

  it('genera horas y estados coherentes con la hora simulada', () => {
    const salidas = generarSalidas(DESTINOS_ES, fechaSimulada);

    // La primera sale unos 20 minutos antes (13:40) y ya despegó
    expect(salidas[0].hora).toBe('13:40');
    expect(salidas[0].estado).toBe('DESPEGO');
    // La siguiente (14:20) está abordando; las demás, a tiempo o programadas
    expect(salidas[1].hora).toBe('14:20');
    expect(salidas[1].estado).toBe('ABORDANDO');
    for (const salida of salidas.slice(2)) {
      expect(['A_TIEMPO', 'PROGRAMADO']).toContain(salida.estado);
    }
    expect(salidas.map((s) => s.codigo)).toEqual(DESTINOS_ES.map((d) => d.codigo_iata));
  });

  it('transiciona los estados cuando la hora avanza', () => {
    const salidas = generarSalidas(DESTINOS_ES, fechaSimulada);
    // 14:25 en Colombia (UTC 19:25)
    const actualizadas = actualizarEstados(salidas, new Date('2026-09-25T19:25:00Z'));

    expect(actualizadas[1].estado).toBe('DESPEGO');
    expect(actualizadas[1].cambios).toBeGreaterThan(0);
    expect(actualizadas[2].estado).toBe('ABORDANDO');
    expect(actualizadas[2].cambios).toBeGreaterThan(0);
  });

  it('calcula los minutos de Colombia correctamente para 14:00', () => {
    expect(obtenerMinutosColombia(fechaSimulada)).toBe(14 * 60);
  });
});
