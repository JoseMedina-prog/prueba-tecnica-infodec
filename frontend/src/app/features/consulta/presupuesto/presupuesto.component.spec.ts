import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ConsultaStateService } from '../../../core/services/consulta-state.service';
import { PresupuestoComponent } from './presupuesto.component';

describe('PresupuestoComponent', () => {
  let fixture: ComponentFixture<PresupuestoComponent>;
  let component: PresupuestoComponent;
  let state: ConsultaStateService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresupuestoComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService()
      ]
    }).compileComponents();

    state = TestBed.inject(ConsultaStateService);
    state.setDestino(
      { id: 1, codigo: 'JP', nombre: 'Japón', moneda: { codigo: 'JPY', nombre: 'Yen japonés', simbolo: '¥' } },
      { id: 3, nombre: 'Tokio', codigo_iata: 'TYO' }
    );
    state.setPresupuesto('1500000');

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PresupuestoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('muestra el código de destino del estado en el resumen', () => {
    const resumenCodigo = fixture.nativeElement.querySelector('.resumen-codigo');
    expect(resumenCodigo?.textContent).toContain('TYO');
  });

  it('no envía petición y muestra error sin activar enviando si el formulario es inválido', () => {
    component.presupuesto.setValue('invalido');
    fixture.detectChanges();

    component.consultar();
    fixture.detectChanges();

    expect(component.enviando()).toBeFalse();
    const reqs = httpMock.match((r) => r.url.endsWith('/consultas'));
    expect(reqs.length).toBe(0);

    const error = fixture.nativeElement.querySelector('#presupuestoError');
    expect(error?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('evita envíos repetidos por doble submit: solo emite una petición y el botón y campos se deshabilitan y rehabilitan tras error', () => {
    component.presupuesto.setValue('1500000');
    fixture.detectChanges();

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-consultar');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#presupuestoInput');
    expect(boton.disabled).toBeFalse();
    expect(input.disabled).toBeFalse();

    // Disparar dos submits seguidos
    component.consultar();
    component.consultar();
    fixture.detectChanges();

    // Solo debe salir 1 petición HTTP a /consultas
    const reqs = httpMock.match((r) => r.url.endsWith('/consultas'));
    expect(reqs.length).toBe(1);
    expect(component.enviando()).toBeTrue();
    expect(boton.disabled).toBeTrue();
    expect(input.disabled).toBeTrue();

    // Responder con error 500
    reqs[0].flush(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error de servidor' } },
      { status: 500, statusText: 'Internal Server Error' }
    );
    fixture.detectChanges();

    // El estado enviando vuelve a false y los campos y botón se rehabilitan
    expect(component.enviando()).toBeFalse();
    expect(boton.disabled).toBeFalse();
    expect(input.disabled).toBeFalse();
  });
});
