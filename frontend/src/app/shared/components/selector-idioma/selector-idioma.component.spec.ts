import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { IdiomaService } from '../../../core/services/idioma.service';
import { SelectorIdiomaComponent } from './selector-idioma.component';

describe('SelectorIdiomaComponent', () => {
  let fixture: ComponentFixture<SelectorIdiomaComponent>;
  let idiomaService: IdiomaService;
  let boton: HTMLButtonElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SelectorIdiomaComponent],
      providers: [provideTranslateService()]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', { NAVBAR: { IDIOMA_ALTERNAR: 'Idioma: español. Cambiar a alemán' } });
    translate.setTranslation('de', { NAVBAR: { IDIOMA_ALTERNAR: 'Sprache: Deutsch. Zu Spanisch wechseln' } });

    idiomaService = TestBed.inject(IdiomaService);
    idiomaService.cambiarIdioma('es');

    fixture = TestBed.createComponent(SelectorIdiomaComponent);
    fixture.detectChanges();
    boton = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('es un solo botón nativo, sin aria-pressed, con las etiquetas ES y DE ocultas al lector', () => {
    const botones = fixture.nativeElement.querySelectorAll('button');
    expect(botones.length).toBe(1);
    expect(boton.type).toBe('button');
    expect(boton.hasAttribute('aria-pressed')).toBeFalse();

    const opciones: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.opcion'));
    expect(opciones.map((o) => o.textContent?.trim())).toEqual(['ES', 'DE']);
    opciones.forEach((o) => expect(o.getAttribute('aria-hidden')).toBe('true'));
  });

  it('un clic pasa de es a de y otro clic vuelve a es, moviendo el resaltado', () => {
    const opciones = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.opcion'));
    expect(opciones()[0].classList.contains('activo')).toBeTrue();
    expect(boton.classList.contains('en-de')).toBeFalse();

    boton.click();
    fixture.detectChanges();
    expect(idiomaService.getIdioma()).toBe('de');
    expect(opciones()[1].classList.contains('activo')).toBeTrue();
    expect(opciones()[0].classList.contains('activo')).toBeFalse();
    expect(boton.classList.contains('en-de')).toBeTrue();

    boton.click();
    fixture.detectChanges();
    expect(idiomaService.getIdioma()).toBe('es');
    expect(opciones()[0].classList.contains('activo')).toBeTrue();
    expect(boton.classList.contains('en-de')).toBeFalse();
  });

  it('el aria-label dice el idioma actual y la acción, y cambia con el idioma', () => {
    expect(boton.getAttribute('aria-label')).toBe('Idioma: español. Cambiar a alemán');

    boton.click();
    fixture.detectChanges();
    expect(boton.getAttribute('aria-label')).toBe('Sprache: Deutsch. Zu Spanisch wechseln');

    boton.click();
    fixture.detectChanges();
    expect(boton.getAttribute('aria-label')).toBe('Idioma: español. Cambiar a alemán');
  });
});
