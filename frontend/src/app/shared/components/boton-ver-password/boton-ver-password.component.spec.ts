import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { BotonVerPasswordComponent } from './boton-ver-password.component';

@Component({
  standalone: true,
  imports: [BotonVerPasswordComponent],
  template: `
    <div class="campo-password-wrap">
      <input [type]="visible() ? 'text' : 'password'" id="password" />
      <app-boton-ver-password [(visible)]="visible" campoId="password" />
    </div>
  `
})
class TestHostPasswordComponent {
  readonly visible = signal(false);
}

describe('BotonVerPasswordComponent', () => {
  let fixture: ComponentFixture<TestHostPasswordComponent>;
  let host: TestHostPasswordComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostPasswordComponent, BotonVerPasswordComponent],
      providers: [provideTranslateService()]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      AUTH: {
        MOSTRAR_PASSWORD: 'Mostrar contraseña',
        OCULTAR_PASSWORD: 'Ocultar contraseña'
      }
    });
    translate.setTranslation('de', {
      AUTH: {
        MOSTRAR_PASSWORD: 'Passwort anzeigen',
        OCULTAR_PASSWORD: 'Passwort verbergen'
      }
    });
    translate.use('es');

    fixture = TestBed.createComponent(TestHostPasswordComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('el ojo cambia type, aria-pressed y aria-label al hacer clic', () => {
    const el = fixture.nativeElement as HTMLElement;
    const input: HTMLInputElement = el.querySelector('#password')!;
    const boton: HTMLButtonElement = el.querySelector('button')!;

    // Estado inicial: contraseña oculta
    expect(input.type).toBe('password');
    expect(boton.type).toBe('button');
    expect(boton.getAttribute('aria-pressed')).toBe('false');
    expect(boton.getAttribute('aria-controls')).toBe('password');
    expect(boton.getAttribute('aria-label')).toBe('Mostrar contraseña');
    expect(boton.title).toBe('Mostrar contraseña');

    // Clic: mostrar contraseña
    boton.click();
    fixture.detectChanges();

    expect(input.type).toBe('text');
    expect(boton.getAttribute('aria-pressed')).toBe('true');
    expect(boton.getAttribute('aria-label')).toBe('Ocultar contraseña');
    expect(boton.title).toBe('Ocultar contraseña');
    expect(host.visible()).toBeTrue();

    // Segundo clic: ocultar contraseña
    boton.click();
    fixture.detectChanges();

    expect(input.type).toBe('password');
    expect(boton.getAttribute('aria-pressed')).toBe('false');
    expect(boton.getAttribute('aria-label')).toBe('Mostrar contraseña');
    expect(boton.title).toBe('Mostrar contraseña');
    expect(host.visible()).toBeFalse();
  });

  it('cambia el aria-label correctamente en idioma alemán (DE)', () => {
    const translate = TestBed.inject(TranslateService);
    translate.use('de');
    fixture.detectChanges();

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button')!;
    expect(boton.getAttribute('aria-label')).toBe('Passwort anzeigen');
    expect(boton.title).toBe('Passwort anzeigen');

    boton.click();
    fixture.detectChanges();

    expect(boton.getAttribute('aria-label')).toBe('Passwort verbergen');
    expect(boton.title).toBe('Passwort verbergen');
  });
});
