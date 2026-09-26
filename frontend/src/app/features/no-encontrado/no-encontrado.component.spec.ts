import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { NoEncontradoComponent } from './no-encontrado.component';
import { AuthService } from '../../core/services/auth.service';

describe('NoEncontradoComponent', () => {
  let fixture: ComponentFixture<NoEncontradoComponent>;
  let component: NoEncontradoComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const mockEstaAutenticado = signal(false);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoEncontradoComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: AuthService, useValue: { estaAutenticado: mockEstaAutenticado } }
      ]
    }).compileComponents();
  });

  it('debe mostrar los elementos del tablero de salidas (Puerta 404 y Vuelo no encontrado)', () => {
    mockEstaAutenticado.set(false);
    fixture = TestBed.createComponent(NoEncontradoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const puerta = fixture.nativeElement.querySelector('.puerta-mono');
    expect(puerta).toBeTruthy();
    expect(puerta.textContent).toContain('NO_ENCONTRADO.PUERTA');

    const titulo = fixture.nativeElement.querySelector('.titulo-vuelo');
    expect(titulo).toBeTruthy();
    expect(titulo.textContent).toContain('NO_ENCONTRADO.TITULO');
  });

  it('debe mostrar botón a "Ir al inicio" (/login) si no tiene sesión iniciada', () => {
    mockEstaAutenticado.set(false);
    fixture = TestBed.createComponent(NoEncontradoComponent);
    fixture.detectChanges();

    const boton = fixture.nativeElement.querySelector('.btn-accion');
    expect(boton).toBeTruthy();
    expect(boton.getAttribute('routerLink')).toBe('/login');
    expect(boton.textContent).toContain('NO_ENCONTRADO.IR_INICIO');
  });

  it('debe mostrar botón a "Volver a mis viajes" (/historial) si tiene sesión iniciada', () => {
    mockEstaAutenticado.set(true);
    fixture = TestBed.createComponent(NoEncontradoComponent);
    fixture.detectChanges();

    const boton = fixture.nativeElement.querySelector('.btn-accion');
    expect(boton).toBeTruthy();
    expect(boton.getAttribute('routerLink')).toBe('/historial');
    expect(boton.textContent).toContain('NO_ENCONTRADO.VOLVER_HISTORIAL');
  });
});
