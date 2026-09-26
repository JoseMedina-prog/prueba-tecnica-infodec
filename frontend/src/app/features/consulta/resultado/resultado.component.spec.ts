import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ResultadoComponent } from './resultado.component';
import { ConsultaStateService } from '../../../core/services/consulta-state.service';
import { ConsultaResultado } from '../../../core/models';

describe('ResultadoComponent', () => {
  let component: ResultadoComponent;
  let fixture: ComponentFixture<ResultadoComponent>;
  let stateService: ConsultaStateService;
  let translate: TranslateService;

  beforeEach(async () => {
    sessionStorage.clear();
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ResultadoComponent],
      providers: [
        ConsultaStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      RESULTADO: {
        TITULO: 'Resultado de la consulta',
        CLIMA_NO_DISPONIBLE: 'Clima no disponible',
        CONVERSION_NO_DISPONIBLE: 'Conversión no disponible',
        TARJETA_DESTINO: 'Destino',
        TARJETA_PRESUPUESTO: 'Presupuesto inicial (COP)',
        TARJETA_CLIMA: 'Clima de hoy',
        TARJETA_CONVERSION: 'Presupuesto convertido',
        VOLVER_INICIO: 'Volver al inicio',
        TASA_RESPALDO: 'Última tasa guardada'
      },
      PASOS: {
        DESTINO: 'Destino',
        PRESUPUESTO: 'Presupuesto',
        RESULTADO: 'Resultado'
      },
      DESTINO: { ATRAS: 'Atrás' },
      LUGARES: {
        PAISES: { JP: 'Japón' },
        CIUDADES: { '3': 'Tokio' },
        MONEDAS: { JPY: 'Yen japonés' }
      }
    });
    translate.use('es');

    stateService = TestBed.inject(ConsultaStateService);
    fixture = TestBed.createComponent(ResultadoComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('debe mostrar aviso de "Clima no disponible" cuando clima viene en null', () => {
    const mockResultado: ConsultaResultado = {
      id: 1,
      fecha: '2026-09-25T12:00:00Z',
      pais: { id: 2, codigo: 'JP', nombre: 'Japón' },
      ciudad: { id: 3, nombre: 'Tokio', codigo_iata: 'TYO' },
      presupuesto_cop: 1000000,
      clima: null, // CLIMA NULL
      moneda: { codigo: 'JPY', nombre: 'Yen japonés', simbolo: '¥' },
      conversion: {
        valor: 48320,
        tasa: 0.04832,
        fecha_tasa: '2026-09-25T12:00:00Z',
        fuente: 'api'
      }
    };

    stateService.setResultado(mockResultado);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Clima no disponible');
  });

  it('debe mostrar aviso de "Conversión no disponible" cuando conversion viene en null', () => {
    const mockResultado: ConsultaResultado = {
      id: 2,
      fecha: '2026-09-25T12:00:00Z',
      pais: { id: 2, codigo: 'JP', nombre: 'Japón' },
      ciudad: { id: 3, nombre: 'Tokio', codigo_iata: 'TYO' },
      presupuesto_cop: 1000000,
      clima: {
        temperatura: 22,
        descripcion: 'cielo claro',
        icono: '01d'
      },
      moneda: { codigo: 'JPY', nombre: 'Yen japonés', simbolo: '¥' },
      conversion: null // CONVERSION NULL
    };

    stateService.setResultado(mockResultado);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Conversión no disponible');
  });

  it('debe mostrar tanto el clima como la conversión cuando ambos están disponibles', () => {
    const mockResultado: ConsultaResultado = {
      id: 3,
      fecha: '2026-09-25T12:00:00Z',
      pais: { id: 2, codigo: 'JP', nombre: 'Japón' },
      ciudad: { id: 3, nombre: 'Tokio', codigo_iata: 'TYO' },
      presupuesto_cop: 1000000,
      clima: {
        temperatura: 19.5,
        descripcion: 'parcialmente nublado',
        icono: '02d'
      },
      moneda: { codigo: 'JPY', nombre: 'Yen japonés', simbolo: '¥' },
      conversion: {
        valor: 48320,
        tasa: 0.04832,
        fecha_tasa: '2026-09-25T12:00:00Z',
        fuente: 'api'
      }
    };

    stateService.setResultado(mockResultado);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('19,5 °C');
    expect(compiled.textContent).toContain('Parcialmente nublado');
    expect(compiled.textContent).not.toContain('Clima no disponible');
    expect(compiled.textContent).not.toContain('Conversión no disponible');
    expect(compiled.textContent).not.toContain('Última tasa guardada');
  });

  it('debe marcar "Última tasa guardada" cuando la fuente es respaldo', () => {
    stateService.setResultado({
      id: 4,
      fecha: '2026-09-25T12:00:00Z',
      pais: { id: 2, codigo: 'JP', nombre: 'Japón' },
      ciudad: { id: 3, nombre: 'Tokio', codigo_iata: 'TYO' },
      presupuesto_cop: 1000000,
      clima: null,
      moneda: { codigo: 'JPY', nombre: 'Yen japonés', simbolo: '¥' },
      conversion: { valor: 48320, tasa: 0.04832, fecha_tasa: '2026-09-24T12:00:00Z', fuente: 'respaldo' }
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Última tasa guardada');
    expect(compiled.textContent).toContain('1 COP = 0,04832000 JPY');
    expect(compiled.textContent).toContain('1 ¥ = 20,70 COP');
  });
});
