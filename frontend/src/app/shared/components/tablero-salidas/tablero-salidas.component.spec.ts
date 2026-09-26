import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import {
  RELOJ_FN,
  Salida,
  TableroSalidasComponent,
  actualizarEstados,
  generarSalidas,
  obtenerMinutosColombia
} from './tablero-salidas.component';

describe('TableroSalidasComponent', () => {
  let component: TableroSalidasComponent;
  let fixture: ComponentFixture<TableroSalidasComponent>;
  let translate: TranslateService;

  // Hora fija simulada en Colombia: 14:00 (hora local Colombia, UTC 19:00)
  const fechaSimulada = new Date('2026-09-25T19:00:00Z');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableroSalidasComponent],
      providers: [
        provideTranslateService(),
        { provide: RELOJ_FN, useValue: () => fechaSimulada }
      ]
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      TABLERO: {
        TITULO: 'Salidas',
        HORA: 'Hora',
        CODIGO: 'Vuelo',
        DESTINO: 'Destino',
        ESTADO: 'Estado',
        A_TIEMPO: 'A tiempo',
        ABORDANDO: 'Abordando',
        PROGRAMADO: 'Programado',
        DESPEGO: 'Despegó',
        HORA_COLOMBIA: 'Hora en Colombia',
        PIE: 'Tasas actualizadas a diario · Clima en tiempo real'
      },
      LUGARES: {
        CIUDADES: {
          '1': 'Londres',
          '2': 'Mánchester',
          '3': 'Tokio',
          '4': 'Osaka',
          '5': 'Nueva Delhi',
          '6': 'Bombay',
          '7': 'Copenhague',
          '8': 'Aarhus'
        }
      }
    });
    translate.use('es');

    fixture = TestBed.createComponent(TableroSalidasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe inicializarse con 8 vuelos y hora de Colombia', () => {
    expect(component.salidas().length).toBe(8);
    expect(component.hora()).toContain('14:00');
  });

  it('debe generar horas coherentes respecto a la hora simulada', () => {
    const salidas = component.salidas();
    // La primera salida debe ser aproximadamente 20 min antes (13:40)
    expect(salidas[0].hora).toBe('13:40');
    expect(salidas[0].estado).toBe('DESPEGO');

    // La siguiente salida que no ha despegado (14:20) debe estar en ABORDANDO
    expect(salidas[1].hora).toBe('14:20');
    expect(salidas[1].estado).toBe('ABORDANDO');

    // Las siguientes salidas deben ser A_TIEMPO o PROGRAMADO
    for (let i = 2; i < salidas.length; i++) {
      expect(['A_TIEMPO', 'PROGRAMADO']).toContain(salidas[i].estado);
    }

    // Ninguna salida debe tener EMBARQUE_CERRADO
    for (const salida of salidas) {
      expect((salida.estado as string)).not.toBe('EMBARQUE_CERRADO');
    }
  });

  it('debe transicionar estados cuando la hora avanza', () => {
    // Simulamos que ahora son las 14:25 en Colombia (UTC 19:25)
    const fechaMasTarde = new Date('2026-09-25T19:25:00Z');
    const salidasActualizadas = actualizarEstados(component.salidas(), fechaMasTarde);

    // Ahora la salida 1 (14:20) ya pasó respecto a las 14:25, por lo tanto pasa a DESPEGO
    expect(salidasActualizadas[1].estado).toBe('DESPEGO');
    expect(salidasActualizadas[1].cambios).toBeGreaterThan(0);

    // La salida 2 (15:05) pasa a ser la más próxima sin salir, por lo tanto ABORDANDO
    expect(salidasActualizadas[2].estado).toBe('ABORDANDO');
    expect(salidasActualizadas[2].cambios).toBeGreaterThan(0);
  });

  it('debe calcular los minutos de Colombia correctamente para 14:00', () => {
    const minutos = obtenerMinutosColombia(fechaSimulada);
    expect(minutos).toBe(14 * 60); // 840 minutos
  });
});
