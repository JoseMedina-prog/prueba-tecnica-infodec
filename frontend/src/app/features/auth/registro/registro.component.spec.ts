import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { RegistroComponent } from './registro.component';

describe('RegistroComponent - Checklist de contraseña', () => {
  let fixture: ComponentFixture<RegistroComponent>;
  let component: RegistroComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe marcar las 4 reglas como cumplidas en la señal cuando la contraseña es "Abcdefg1"', () => {
    component.form.get('password')?.setValue('Abcdefg1');
    fixture.detectChanges();

    const rules = component.passwordRules();
    expect(rules.minLength).toBeTrue();
    expect(rules.hasUpper).toBeTrue();
    expect(rules.hasLower).toBeTrue();
    expect(rules.hasNumber).toBeTrue();

    const items = fixture.nativeElement.querySelectorAll('.checklist-password li');
    expect(items.length).toBe(4);
    items.forEach((item: Element) => {
      expect(item.classList.contains('cumplida')).toBeTrue();
      expect(item.classList.contains('pendiente')).toBeFalse();
    });
  });

  it('debe marcar solo minúscula como cumplida y las otras tres pendientes con "abc"', () => {
    component.form.get('password')?.setValue('abc');
    fixture.detectChanges();

    const rules = component.passwordRules();
    expect(rules.minLength).toBeFalse();
    expect(rules.hasUpper).toBeFalse();
    expect(rules.hasLower).toBeTrue();
    expect(rules.hasNumber).toBeFalse();

    const items = fixture.nativeElement.querySelectorAll('.checklist-password li');
    expect(items[0].classList.contains('pendiente')).toBeTrue(); // min 8
    expect(items[1].classList.contains('pendiente')).toBeTrue(); // mayúscula
    expect(items[2].classList.contains('cumplida')).toBeTrue();  // minúscula
    expect(items[3].classList.contains('pendiente')).toBeTrue(); // número
  });

  it('debe alternar la visibilidad de la contraseña con el botón mostrar/ocultar (el ojo cambia type, aria-pressed y aria-label)', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#password');
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('app-boton-ver-password button');
    expect(input.type).toBe('password');
    expect(boton.getAttribute('aria-pressed')).toBe('false');
    expect(boton.getAttribute('aria-controls')).toBe('password');
    expect(boton.getAttribute('aria-label')).toBe('AUTH.MOSTRAR_PASSWORD');

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
    expect(component.mostrarPassword()).toBeFalse();
  });

  it('el validador usa las mismas reglas que la checklist', () => {
    const control = component.form.get('password')!;
    control.setValue('abc');
    expect(control.hasError('minlength')).toBeTrue();
    control.setValue('abcdefgh');
    expect(control.hasError('passwordComplexity')).toBeTrue();
    control.setValue('Abcdefg1');
    expect(control.valid).toBeTrue();
  });

  it('el registro no muestra la tira de salidas', () => {
    const tiraSalidas = fixture.nativeElement.querySelector('app-carrusel-salidas');
    expect(tiraSalidas).toBeNull();
  });

  it('evita envíos repetidos por doble submit: solo emite una petición y el botón se deshabilita y rehabilita tras error', () => {
    const httpMock = TestBed.inject(HttpTestingController);

    component.form.setValue({
      nombre: 'Marlon',
      correo: 'marlon@travelapp.test',
      password: 'Password123',
      password_confirmation: 'Password123'
    });
    fixture.detectChanges();

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.ticket-talon button[type="submit"]');
    const inputNombre: HTMLInputElement = fixture.nativeElement.querySelector('#nombre');
    const inputCorreo: HTMLInputElement = fixture.nativeElement.querySelector('#correo');
    const inputPass: HTMLInputElement = fixture.nativeElement.querySelector('#password');
    const inputConfirm: HTMLInputElement = fixture.nativeElement.querySelector('#password_confirmation');
    expect(boton.disabled).toBeFalse();
    expect(inputNombre.disabled).toBeFalse();
    expect(inputCorreo.disabled).toBeFalse();
    expect(inputPass.disabled).toBeFalse();
    expect(inputConfirm.disabled).toBeFalse();

    // Disparar dos submits seguidos
    component.onSubmit();
    component.onSubmit();
    fixture.detectChanges();

    // Solo debe haber 1 petición HTTP a /auth/register
    const reqs = httpMock.match((r) => r.url.endsWith('/auth/register'));
    expect(reqs.length).toBe(1);
    expect(component.enviando()).toBeTrue();
    expect(boton.disabled).toBeTrue();
    expect(inputNombre.disabled).toBeTrue();
    expect(inputCorreo.disabled).toBeTrue();
    expect(inputPass.disabled).toBeTrue();
    expect(inputConfirm.disabled).toBeTrue();

    // Responder con error 409
    reqs[0].flush(
      { success: false, error: { code: 'USER_ALREADY_EXISTS', message: 'El usuario ya existe' } },
      { status: 409, statusText: 'Conflict' }
    );
    fixture.detectChanges();

    // El estado enviando vuelve a false y los campos y botón se rehabilitan
    expect(component.enviando()).toBeFalse();
    expect(boton.disabled).toBeFalse();
    expect(inputNombre.disabled).toBeFalse();
    expect(inputCorreo.disabled).toBeFalse();
    expect(inputPass.disabled).toBeFalse();
    expect(inputConfirm.disabled).toBeFalse();
    httpMock.verify();
  });

  describe('RegistroComponent - Aviso 429 y cuenta regresiva en vivo', () => {
    let translate: TranslateService;
    let httpMock: HttpTestingController;

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
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('con un 429 y Retry-After: 3, el mensaje muestra 3, luego 2, luego 1, y a los 3 s desaparece y el botón se habilita', fakeAsync(() => {
      component.form.setValue({
        nombre: 'Marlon',
        correo: 'marlon@travelapp.test',
        password: 'Password123',
        password_confirmation: 'Password123'
      });
      fixture.detectChanges();

      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.ticket-talon button[type="submit"]');
      expect(boton.disabled).toBeFalse();

      component.onSubmit();
      fixture.detectChanges();

      const req = httpMock.expectOne((r) => r.url.endsWith('/auth/register'));
      req.flush(
        { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos' }, trace_id: 'TRC-REG-429' },
        { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '3' } }
      );
      fixture.detectChanges();

      // Al aparecer el 429
      let alert = fixture.nativeElement.querySelector('.alert-danger');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('3');
      expect(alert.textContent).toContain('TRC-REG-429');
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

    it('el botón permanece bloqueado por IP sin importar lo que se escriba', fakeAsync(() => {
      component.form.setValue({
        nombre: 'Marlon',
        correo: 'marlon@travelapp.test',
        password: 'Password123',
        password_confirmation: 'Password123'
      });
      fixture.detectChanges();

      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.ticket-talon button[type="submit"]');

      component.onSubmit();
      fixture.detectChanges();

      const req = httpMock.expectOne((r) => r.url.endsWith('/auth/register'));
      req.flush(
        { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos' } },
        { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '5' } }
      );
      fixture.detectChanges();

      expect(boton.disabled).toBeTrue();

      // Cambiar valores del formulario no desbloquea el botón (límite por IP)
      component.form.controls['correo'].setValue('otro@travelapp.test');
      component.form.controls['nombre'].setValue('Otro Nombre');
      fixture.detectChanges();

      expect(boton.disabled).toBeTrue();
      expect(fixture.nativeElement.querySelector('.alert-danger')).toBeTruthy();

      tick(5000);
      fixture.detectChanges();

      expect(boton.disabled).toBeFalse();
      expect(fixture.nativeElement.querySelector('.alert-danger')).toBeNull();
    }));

    it('al destruir el componente no queda ningún temporizador pendiente', fakeAsync(() => {
      component.form.setValue({
        nombre: 'Marlon',
        correo: 'marlon@travelapp.test',
        password: 'Password123',
        password_confirmation: 'Password123'
      });
      fixture.detectChanges();

      component.onSubmit();
      fixture.detectChanges();

      const req = httpMock.expectOne((r) => r.url.endsWith('/auth/register'));
      req.flush(
        { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos' } },
        { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '45' } }
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
