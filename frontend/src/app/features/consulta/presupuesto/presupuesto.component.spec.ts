import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
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

  describe('Aviso 429 y cuenta regresiva en vivo', () => {
    let translate: TranslateService;

    beforeEach(() => {
      translate = TestBed.inject(TranslateService);
      translate.setTranslation('es', {
        ERRORES: {
          TOO_MANY_ATTEMPTS: 'Demasiados intentos. Espera {{segundos}} segundos antes de volver a intentar.',
          TOO_MANY_ATTEMPTS_1: 'Demasiados intentos. Espera 1 segundo antes de volver a intentar.',
          REFERENCIA: 'Código de referencia'
        }
      });
      translate.use('es');
    });

    it('con un 429 y Retry-After: 3, el mensaje muestra 3, luego 2, luego 1, y a los 3 s desaparece y el botón se habilita', fakeAsync(() => {
      component.presupuesto.setValue('1500000');
      fixture.detectChanges();

      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-consultar');
      expect(boton.disabled).toBeFalse();

      component.consultar();
      fixture.detectChanges();

      const req = httpMock.expectOne((r) => r.url.endsWith('/consultas'));
      req.flush(
        { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos' }, trace_id: 'TRC-PRE-429' },
        { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '3' } }
      );
      fixture.detectChanges();

      // Al aparecer el 429
      let alert = fixture.nativeElement.querySelector('.alert-danger');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('3');
      expect(alert.textContent).toContain('TRC-PRE-429');
      expect(boton.disabled).toBeTrue();

      // Tic 1: muestra 2
      tick(1000);
      fixture.detectChanges();
      alert = fixture.nativeElement.querySelector('.alert-danger');
      expect(alert.textContent).toContain('2');
      expect(boton.disabled).toBeTrue();

      // Tic 2: muestra 1
      tick(1000);
      fixture.detectChanges();
      alert = fixture.nativeElement.querySelector('.alert-danger');
      expect(alert.textContent).toContain('1');
      expect(boton.disabled).toBeTrue();

      // Tic 3: desaparece el aviso y se rehabilita el botón
      tick(1000);
      fixture.detectChanges();
      alert = fixture.nativeElement.querySelector('.alert-danger');
      expect(alert).toBeNull();
      expect(boton.disabled).toBeFalse();
    }));

    it('el botón permanece bloqueado durante la cuenta (límite por usuario)', fakeAsync(() => {
      component.presupuesto.setValue('1500000');
      fixture.detectChanges();

      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-consultar');

      component.consultar();
      fixture.detectChanges();

      const req = httpMock.expectOne((r) => r.url.endsWith('/consultas'));
      req.flush(
        { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos' } },
        { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '5' } }
      );
      fixture.detectChanges();

      expect(boton.disabled).toBeTrue();

      // Modificar el campo no desbloquea el botón
      component.presupuesto.setValue('2000000');
      fixture.detectChanges();

      expect(boton.disabled).toBeTrue();
      expect(fixture.nativeElement.querySelector('.alert-danger')).toBeTruthy();

      tick(5000);
      fixture.detectChanges();

      expect(boton.disabled).toBeFalse();
      expect(fixture.nativeElement.querySelector('.alert-danger')).toBeNull();
    }));

    it('al destruir el componente no queda ningún temporizador pendiente', fakeAsync(() => {
      component.presupuesto.setValue('1500000');
      fixture.detectChanges();

      component.consultar();
      fixture.detectChanges();

      const req = httpMock.expectOne((r) => r.url.endsWith('/consultas'));
      req.flush(
        { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos' } },
        { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '60' } }
      );
      fixture.detectChanges();

      tick(2000);
      fixture.detectChanges();

      fixture.destroy();
      expect(component.rateLimit.segundos()).toBe(0);
      expect(component.rateLimit.activo()).toBeFalse();
    }));
  });
});
