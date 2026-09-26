import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
});
