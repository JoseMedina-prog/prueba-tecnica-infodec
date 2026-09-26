import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { HistorialComponent } from './historial.component';
import { ConsultaService } from '../../core/services/consulta.service';
import { ConsultaStateService } from '../../core/services/consulta-state.service';
import { ConsultaResultado } from '../../core/models/consulta.model';

describe('HistorialComponent - Repetir consulta', () => {
  let fixture: ComponentFixture<HistorialComponent>;
  let component: HistorialComponent;
  let consultaServiceSpy: jasmine.SpyObj<ConsultaService>;
  let consultaState: ConsultaStateService;
  let router: Router;

  const mockItem: ConsultaResultado = {
    id: 101,
    fecha: '2026-09-25T14:30:00Z',
    pais: {
      id: 1,
      codigo: 'GB',
      nombre: 'Reino Unido'
    },
    ciudad: {
      id: 1,
      nombre: 'Londres',
      codigo_iata: 'LON'
    },
    moneda: {
      codigo: 'GBP',
      nombre: 'Libra Esterlina',
      simbolo: '£'
    },
    presupuesto_cop: 5000000,
    clima: {
      temperatura: 18.5,
      descripcion: 'Cielo claro',
      icono: '01d'
    },
    conversion: {
      valor: 980.5,
      tasa: 0.000196,
      fecha_tasa: '2026-09-25T14:30:00Z',
      fuente: 'api'
    }
  };

  beforeEach(async () => {
    consultaServiceSpy = jasmine.createSpyObj('ConsultaService', ['getHistorial', 'crearConsulta']);
    consultaServiceSpy.getHistorial.and.returnValue(of([mockItem]));

    await TestBed.configureTestingModule({
      imports: [HistorialComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: ConsultaService, useValue: consultaServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    consultaState = TestBed.inject(ConsultaStateService);
    consultaState.reiniciar();

    fixture = TestBed.createComponent(HistorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe cargar país, ciudad y presupuesto en ConsultaStateService y navegar a pantalla 2 al repetir consulta', () => {
    component.repetirConsulta(mockItem);

    expect(consultaState.pais()).toEqual({
      id: 1,
      codigo: 'GB',
      nombre: 'Reino Unido',
      moneda: {
        codigo: 'GBP',
        nombre: 'Libra Esterlina',
        simbolo: '£'
      }
    });

    expect(consultaState.ciudad()).toEqual({
      id: 1,
      nombre: 'Londres',
      codigo_iata: 'LON'
    });

    expect(consultaState.presupuesto()).toBe('5000000');
    expect(consultaState.resultado()).toBeNull();

    expect(router.navigate).toHaveBeenCalledWith(['/consulta/presupuesto']);
    // NO debe crear la consulta automáticamente
    expect(consultaServiceSpy.crearConsulta).not.toHaveBeenCalled();
  });

  it('debe invocar repetirConsulta cuando el usuario pulsa el botón en la interfaz', () => {
    spyOn(component, 'repetirConsulta').and.callThrough();

    const botonRepetir = fixture.nativeElement.querySelector('.btn-repetir');
    expect(botonRepetir).toBeTruthy();
    botonRepetir.click();

    expect(component.repetirConsulta).toHaveBeenCalledWith(mockItem);
    expect(consultaState.presupuesto()).toBe('5000000');
    expect(router.navigate).toHaveBeenCalledWith(['/consulta/presupuesto']);
  });
});
