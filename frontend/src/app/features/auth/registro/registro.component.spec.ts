import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
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
});
