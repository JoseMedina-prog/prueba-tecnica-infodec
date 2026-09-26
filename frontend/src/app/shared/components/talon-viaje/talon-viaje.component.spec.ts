import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ConsultaResultado } from '../../../core/models';
import { TalonViajeComponent } from './talon-viaje.component';

describe('TalonViajeComponent', () => {
  let fixture: ComponentFixture<TalonViajeComponent>;

  const consultaCompleta: ConsultaResultado = {
    id: 7,
    fecha: '2026-09-26T01:45:00Z',
    pais: { id: 2, codigo: 'JP', nombre: 'Japón' },
    ciudad: { id: 3, nombre: 'Tokio', codigo_iata: 'TYO' },
    presupuesto_cop: 1000000,
    clima: { temperatura: 19.6, descripcion: 'lluvia ligera', icono: '10n' },
    moneda: { codigo: 'JPY', nombre: 'Yen japonés', simbolo: '¥' },
    conversion: { valor: 48300, tasa: 0.0483, fecha_tasa: '2026-09-26T00:00:00Z', fuente: 'api' }
  };

  const texto = (selector: string): string =>
    (fixture.nativeElement.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();

  function crear(consulta: ConsultaResultado, destacado = false): void {
    fixture = TestBed.createComponent(TalonViajeComponent);
    fixture.componentRef.setInput('consulta', consulta);
    fixture.componentRef.setInput('destacado', destacado);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.setItem('travel_app_lang', 'es');
    await TestBed.configureTestingModule({
      imports: [TalonViajeComponent],
      providers: [provideTranslateService()]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      HISTORIAL: {
        REPETIR_A: 'Repetir consulta a {{ciudad}}',
        ULTIMA_CONSULTA: 'Última consulta'
      },
      RESULTADO: {
        CLIMA_NO_DISPONIBLE: 'Clima no disponible',
        CONVERSION_NO_DISPONIBLE: 'Conversión no disponible',
        CLIMA_GUARDADO_HOY: 'Clima guardado · hoy {{hora}}',
        CLIMA_GUARDADO_FECHA: 'Clima guardado · {{fecha}} {{hora}}'
      }
    });
    translate.use('es');
  });

  afterEach(() => localStorage.clear());

  it('muestra "Clima guardado" solo si el clima es más de 30 minutos anterior a la consulta', () => {
    // Clima obtenido 3 horas antes de la consulta (fue de respaldo)
    crear({ ...consultaCompleta, clima: { ...consultaCompleta.clima!, obtenido_en: '2026-09-25T22:45:00Z' } });
    // "hoy" u otro día depende de la fecha real; esa lógica se prueba con fecha fija en formato.spec.ts
    expect(texto('app-clima-guardado')).toMatch(/^Clima guardado · (hoy|\d{2} SEP) \d{2}:\d{2}$/);

    // Clima obtenido 10 minutos antes (caché normal): nada extra
    crear({ ...consultaCompleta, clima: { ...consultaCompleta.clima!, obtenido_en: '2026-09-26T01:35:00Z' } });
    expect(fixture.nativeElement.querySelector('app-clima-guardado')).toBeNull();

    // Consulta antigua sin obtenido_en: nada extra
    crear(consultaCompleta);
    expect(fixture.nativeElement.querySelector('app-clima-guardado')).toBeNull();
  });

  it('muestra el código IATA, el destino, el presupuesto, el valor convertido y las dos tasas', () => {
    crear(consultaCompleta);

    expect(texto('.codigo')).toBe('TYO');
    expect(texto('.lugar')).toBe('Tokio · Japón');
    expect(texto('.presupuesto')).toContain('1.000.000');
    expect(texto('.valor').replace(/ /g, ' ')).toBe('¥ 48.300');
    expect(texto('.tasa-inversa').replace(/ /g, ' ')).toContain('1 ¥ = 20,70 COP');
    expect(texto('.tasa-directa').replace(/ /g, ' ')).toContain('1 COP = 0,0483');
  });

  it('muestra la fecha y la hora en una sola línea que no se corta', () => {
    crear(consultaCompleta);

    const fecha: HTMLElement = fixture.nativeElement.querySelector('.fecha');
    expect(fecha.textContent!.trim()).toMatch(/^\S.* · \d{2}:\d{2}$/);
    expect(fecha.textContent).not.toContain('\n');
    expect(getComputedStyle(fecha).whiteSpace).toBe('nowrap');
  });

  it('es un <article> con encabezado para lectores de pantalla', () => {
    crear(consultaCompleta);

    const articulo: HTMLElement = fixture.nativeElement.querySelector('article');
    const titulo: HTMLElement = fixture.nativeElement.querySelector('h2');
    expect(articulo.getAttribute('aria-labelledby')).toBe(titulo.id);
    expect(titulo.classList).toContain('visually-hidden');
  });

  it('muestra los avisos cuando el clima o la conversión son null, sin romper el talón', () => {
    crear({ ...consultaCompleta, clima: null, conversion: null });

    expect(texto('.aviso-clima')).toBe('Clima no disponible');
    expect(texto('.aviso-conversion')).toBe('Conversión no disponible');
    expect(fixture.nativeElement.querySelector('.valor')).toBeNull();
    expect(fixture.nativeElement.querySelector('.tasa-inversa')).toBeNull();
    expect(texto('.codigo')).toBe('TYO');
    expect(fixture.nativeElement.querySelector('.btn-repetir')).toBeTruthy();
  });

  it('el botón emite repetir con la consulta y su aria-label incluye el destino', () => {
    crear(consultaCompleta);
    const emitidas: ConsultaResultado[] = [];
    fixture.componentInstance.repetir.subscribe((c) => emitidas.push(c));

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-repetir');
    expect(boton.getAttribute('aria-label')).toBe('Repetir consulta a Tokio');
    boton.click();

    expect(emitidas).toEqual([consultaCompleta]);
  });

  it('solo el talón destacado lleva la etiqueta "Última consulta"', () => {
    crear(consultaCompleta, true);
    expect(texto('.ultima')).toBe('Última consulta');

    crear(consultaCompleta, false);
    expect(fixture.nativeElement.querySelector('.ultima')).toBeNull();
  });
});
