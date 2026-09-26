import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { SplitFlapComponent } from './split-flap.component';

@Component({
  standalone: true,
  imports: [SplitFlapComponent],
  template: `<app-split-flap [texto]="texto()" [delayMs]="0" [trigger]="trigger()" />`
})
class TestHostComponent {
  readonly texto = signal('BOG');
  readonly trigger = signal(0);
}

describe('SplitFlapComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, SplitFlapComponent]
    }).compileComponents();
  });

  afterEach(() => {
    // Restore matchMedia if modified
  });

  it('deja el texto real accesible desde el inicio en una clase visually-hidden y marca las celdas con aria-hidden', () => {
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const accesible = el.querySelector('.visually-hidden');
    expect(accesible).toBeTruthy();
    expect(accesible?.textContent?.trim()).toBe('BOG');

    const display = el.querySelector('.split-flap-display');
    expect(display).toBeTruthy();
    expect(display?.getAttribute('aria-hidden')).toBe('true');
  });

  it('con prefers-reduced-motion muestra el texto final de inmediato sin animar', () => {
    // Simular prefers-reduced-motion: reduce
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      }) as any;

    try {
      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const celdas = el.querySelectorAll('.flap-celda');
      expect(celdas.length).toBe(3);

      const textoMostrado = Array.from(celdas)
        .map((c) => c.textContent?.trim())
        .join('');
      expect(textoMostrado).toBe('BOG');

      // Ninguna celda debe estar en estado de animación
      celdas.forEach((c) => {
        expect(c.classList.contains('volteando')).toBeFalse();
      });
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('anima y llega al texto final tras transcurrir la duración programada', fakeAsync(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();

    tick(1000);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const celdas = el.querySelectorAll('.flap-celda');
    const textoFinal = Array.from(celdas)
      .map((c) => c.textContent?.trim())
      .join('');
    expect(textoFinal).toBe('BOG');
  }));
});
