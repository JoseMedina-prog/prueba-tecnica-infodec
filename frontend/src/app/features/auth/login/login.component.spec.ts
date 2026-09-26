import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { DestinoSalida } from '../../../core/models';
import { SalidaService } from '../../../core/services/salida.service';
import { LoginComponent } from './login.component';

describe('LoginComponent - aviso de sesión expirada', () => {
  let fixture: ComponentFixture<LoginComponent>;

  const aviso = (): HTMLElement | null => fixture.nativeElement.querySelector('.aviso-sesion');

  function crear(): void {
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideTranslateService()]
    }).compileComponents();
  });

  afterEach(() => history.replaceState(null, ''));

  it('muestra el aviso cuando llega la señal y la borra de history.state de inmediato', () => {
    history.replaceState({ navigationId: 3, sesionExpirada: true }, '');
    crear();

    expect(aviso()).toBeTruthy();
    expect(aviso()!.textContent).toContain('AUTH.SESION_EXPIRADA');
    expect(history.state.sesionExpirada).toBeUndefined();
    // Se conserva el resto del estado del router
    expect(history.state.navigationId).toBe(3);
  });

  it('tras un F5 (el componente se crea de nuevo con el mismo history.state) no vuelve a aparecer', () => {
    history.replaceState({ sesionExpirada: true }, '');
    crear();
    expect(aviso()).toBeTruthy();

    fixture.destroy();
    crear();
    expect(aviso()).toBeNull();
  });

  it('sin señal no hay aviso', () => {
    history.replaceState(null, '');
    crear();
    expect(aviso()).toBeNull();
  });

  it('se cierra con su botón, que tiene aria-label', () => {
    history.replaceState({ sesionExpirada: true }, '');
    crear();

    const cerrar: HTMLButtonElement = aviso()!.querySelector('button')!;
    expect(cerrar.getAttribute('aria-label')).toBe('AUTH.CERRAR_AVISO');
    cerrar.click();
    fixture.detectChanges();

    expect(aviso()).toBeNull();
  });

  it('desaparece cuando el usuario empieza a escribir', () => {
    history.replaceState({ sesionExpirada: true }, '');
    crear();

    const correo: HTMLInputElement = fixture.nativeElement.querySelector('#correo');
    correo.value = 'a';
    correo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(aviso()).toBeNull();
  });

  it('el correo que llega desde el registro también se consume una sola vez', () => {
    history.replaceState({ correo: 'ana@correo.com', mensajeExito: 'Cuenta creada' }, '');
    crear();

    expect(fixture.componentInstance.form.value.correo).toBe('ana@correo.com');
    expect(fixture.componentInstance.mensajeExito()).toBe('Cuenta creada');
    expect(history.state.correo).toBeUndefined();
    expect(history.state.mensajeExito).toBeUndefined();
  });

  it('el ojo cambia type, aria-pressed y aria-label', () => {
    crear();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('#password');
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('app-boton-ver-password button');

    expect(input.type).toBe('password');
    expect(boton.getAttribute('aria-pressed')).toBe('false');
    expect(boton.getAttribute('aria-label')).toBe('AUTH.MOSTRAR_PASSWORD');
    expect(boton.getAttribute('aria-controls')).toBe('password');

    boton.click();
    fixture.detectChanges();

    expect(input.type).toBe('text');
    expect(boton.getAttribute('aria-pressed')).toBe('true');
    expect(boton.getAttribute('aria-label')).toBe('AUTH.OCULTAR_PASSWORD');

    boton.click();
    fixture.detectChanges();

    expect(input.type).toBe('password');
    expect(boton.getAttribute('aria-pressed')).toBe('false');
    expect(boton.getAttribute('aria-label')).toBe('AUTH.MOSTRAR_PASSWORD');
  });

  it('el login muestra la tira de destinos disponibles debajo de la tarjeta', () => {
    crear();
    const carrusel = fixture.nativeElement.querySelector('app-carrusel-salidas');
    expect(carrusel).toBeTruthy();
  });

  it('el talón calcula el número de destinos con los datos del servicio', () => {
    const salidaService = TestBed.inject(SalidaService);
    const destinosMock: DestinoSalida[] = [
      { codigo_iata: 'LON', ciudad: 'Londres', pais: 'Inglaterra', moneda: { codigo: 'GBP', simbolo: '£' } },
      { codigo_iata: 'MAN', ciudad: 'Mánchester', pais: 'Inglaterra', moneda: { codigo: 'GBP', simbolo: '£' } },
      { codigo_iata: 'TYO', ciudad: 'Tokio', pais: 'Japón', moneda: { codigo: 'JPY', simbolo: '¥' } }
    ];
    spyOn(salidaService, 'getSalidas').and.returnValue(of(destinosMock));

    crear();

    expect(fixture.componentInstance.resumenDestinos()).toEqual({ paises: 2, ciudades: 3 });
    const datoDestinos: HTMLElement | null = fixture.nativeElement.querySelector('.talon-dato-ancho');
    expect(datoDestinos).toBeTruthy();
    expect(datoDestinos!.textContent).toContain('AUTH.DESTINOS');
  });

  it('el talón no muestra el dato de destinos si el servicio de salidas falla', () => {
    const salidaService = TestBed.inject(SalidaService);
    spyOn(salidaService, 'getSalidas').and.returnValue(throwError(() => new Error('Error')));

    crear();

    expect(fixture.componentInstance.resumenDestinos()).toBeNull();
    const datoDestinos: HTMLElement | null = fixture.nativeElement.querySelector('.talon-dato-ancho');
    expect(datoDestinos).toBeNull();
  });

  it('el botón Entrar está en el talón y es type="submit" del form', () => {
    crear();
    const botonTalon: HTMLButtonElement | null = fixture.nativeElement.querySelector('.ticket-talon button[type="submit"]');
    expect(botonTalon).toBeTruthy();
    expect(botonTalon!.type).toBe('submit');
    expect(botonTalon!.textContent).toContain('AUTH.ENTRAR');
  });

  it('evita envíos repetidos por doble submit: solo emite una petición y el botón se deshabilita y rehabilita tras error', () => {
    const salidaService = TestBed.inject(SalidaService);
    spyOn(salidaService, 'getSalidas').and.returnValue(of([]));
    const httpMock = TestBed.inject(HttpTestingController);

    crear();

    fixture.componentInstance.form.setValue({
      correo: 'marlon@travelapp.test',
      password: 'Password123'
    });
    fixture.detectChanges();

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.ticket-talon button[type="submit"]');
    const inputCorreo: HTMLInputElement = fixture.nativeElement.querySelector('#correo');
    const inputPass: HTMLInputElement = fixture.nativeElement.querySelector('#password');
    expect(boton.disabled).toBeFalse();
    expect(inputCorreo.disabled).toBeFalse();
    expect(inputPass.disabled).toBeFalse();

    // Disparar dos submits seguidos (doble clic)
    fixture.componentInstance.onSubmit();
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    // Solo debe haber 1 petición HTTP a /auth/login
    const reqs = httpMock.match((r) => r.url.endsWith('/auth/login'));
    expect(reqs.length).toBe(1);
    expect(fixture.componentInstance.enviando()).toBeTrue();
    expect(boton.disabled).toBeTrue();
    expect(inputCorreo.disabled).toBeTrue();
    expect(inputPass.disabled).toBeTrue();

    // Responder con error 401
    reqs[0].flush(
      { success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Credenciales inválidas' } },
      { status: 401, statusText: 'Unauthorized' }
    );
    fixture.detectChanges();

    // El estado enviando vuelve a false y los campos y botón se rehabilitan
    expect(fixture.componentInstance.enviando()).toBeFalse();
    expect(boton.disabled).toBeFalse();
    expect(inputCorreo.disabled).toBeFalse();
    expect(inputPass.disabled).toBeFalse();
    httpMock.verify();
  });

  describe('LoginComponent - Aviso 429 y cuenta regresiva en vivo', () => {
    let fixture: ComponentFixture<LoginComponent>;
    let httpMock: HttpTestingController;
    let translate: TranslateService;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [LoginComponent],
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideTranslateService()]
      }).compileComponents();

      const salidaService = TestBed.inject(SalidaService);
      spyOn(salidaService, 'getSalidas').and.returnValue(of([]));

      translate = TestBed.inject(TranslateService);
      translate.setTranslation('es', {
        ERRORES: {
          TOO_MANY_ATTEMPTS: 'Demasiados intentos. Espera {{segundos}} segundos antes de volver a intentar.',
          TOO_MANY_ATTEMPTS_1: 'Demasiados intentos. Espera 1 segundo antes de volver a intentar.',
          REFERENCIA: 'Código de referencia'
        }
      });
      translate.use('es');

      httpMock = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('con un 429 y Retry-After: 3, el mensaje muestra 3, luego 2, luego 1, y a los 3 s desaparece y el botón se habilita', fakeAsync(() => {
      fixture.componentInstance.form.setValue({
        correo: 'marlon@travelapp.test',
        password: 'Password123'
      });
      fixture.detectChanges();

      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.ticket-talon button[type="submit"]');
      expect(boton.disabled).toBeFalse();

      fixture.componentInstance.onSubmit();
      fixture.detectChanges();

      const req = httpMock.expectOne((r) => r.url.endsWith('/auth/login'));
      req.flush(
        { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos' }, trace_id: 'TRC-429-ABC' },
        { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '3' } }
      );
      fixture.detectChanges();

      // Al aparecer el 429: muestra 3, el botón se deshabilita, y muestra el traceId
      let alert = fixture.nativeElement.querySelector('.alert-danger');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('3');
      expect(alert.textContent).toContain('TRC-429-ABC');
      expect(boton.disabled).toBeTrue();

      // Accesibilidad: tiene role="alert" y la parte dinámica tiene aria-live="off"
      expect(alert.getAttribute('role')).toBe('alert');
      const offLive = alert.querySelector('[aria-live="off"]');
      expect(offLive).toBeTruthy();

      // Tic 1 segundo: muestra 2
      tick(1000);
      fixture.detectChanges();
      alert = fixture.nativeElement.querySelector('.alert-danger');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('2');
      expect(boton.disabled).toBeTrue();

      // Tic 2 segundos: muestra 1 (singular)
      tick(1000);
      fixture.detectChanges();
      alert = fixture.nativeElement.querySelector('.alert-danger');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('1');
      expect(boton.disabled).toBeTrue();

      // Tic 3 segundos: desaparece el aviso y el botón se rehabilita
      tick(1000);
      fixture.detectChanges();
      alert = fixture.nativeElement.querySelector('.alert-danger');
      expect(alert).toBeNull();
      expect(boton.disabled).toBeFalse();
    }));

    it('en el login, con la cuenta activa, cambiar el correo habilita el botón y volver al correo bloqueado lo deshabilita', fakeAsync(() => {
      fixture.componentInstance.form.setValue({
        correo: 'marlon@travelapp.test',
        password: 'Password123'
      });
      fixture.detectChanges();

      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.ticket-talon button[type="submit"]');

      fixture.componentInstance.onSubmit();
      fixture.detectChanges();

      const req = httpMock.expectOne((r) => r.url.endsWith('/auth/login'));
      req.flush(
        { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos' }, trace_id: 'TRC-999' },
        { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '5' } }
      );
      fixture.detectChanges();

      // Bloqueado en marlon@travelapp.test
      expect(boton.disabled).toBeTrue();
      expect(fixture.nativeElement.querySelector('.alert-danger')).toBeTruthy();

      // Cambiar a otro correo habilita el botón y oculta el aviso
      fixture.componentInstance.form.controls['correo'].setValue('otro@travelapp.test');
      fixture.detectChanges();

      expect(boton.disabled).toBeFalse();
      expect(fixture.nativeElement.querySelector('.alert-danger')).toBeNull();

      // Avanzar 2 segundos (quedan 3 s)
      tick(2000);
      fixture.detectChanges();

      // Volver al correo bloqueado (incluso con mayúsculas/espacios): reaparecen el aviso y la cuenta restante
      fixture.componentInstance.form.controls['correo'].setValue('  MARLON@travelapp.test  ');
      fixture.detectChanges();

      expect(boton.disabled).toBeTrue();
      const alert = fixture.nativeElement.querySelector('.alert-danger');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('3');

      // Completar la cuenta (3 s más)
      tick(3000);
      fixture.detectChanges();

      expect(boton.disabled).toBeFalse();
      expect(fixture.nativeElement.querySelector('.alert-danger')).toBeNull();
    }));

    it('al destruir el componente no queda ningún temporizador pendiente', fakeAsync(() => {
      fixture.componentInstance.form.setValue({
        correo: 'marlon@travelapp.test',
        password: 'Password123'
      });
      fixture.detectChanges();

      fixture.componentInstance.onSubmit();
      fixture.detectChanges();

      const req = httpMock.expectOne((r) => r.url.endsWith('/auth/login'));
      req.flush(
        { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos' } },
        { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '30' } }
      );
      fixture.detectChanges();

      // Avanzar 2 segundos mientras la cuenta está activa
      tick(2000);
      fixture.detectChanges();

      // Destruir el componente con la cuenta aún activa (quedan 28 s)
      fixture.destroy();
      expect(fixture.componentInstance.rateLimit.segundos()).toBe(0);
      expect(fixture.componentInstance.rateLimit.activo()).toBeFalse();
    }));
  });
});
