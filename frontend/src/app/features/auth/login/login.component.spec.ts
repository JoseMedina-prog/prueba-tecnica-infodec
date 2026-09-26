import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
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

  it('el login muestra la tira de próximas salidas debajo de la tarjeta', () => {
    crear();
    const carrusel = fixture.nativeElement.querySelector('app-carrusel-salidas');
    expect(carrusel).toBeTruthy();
  });

  it('el botón Entrar está en el talón y es type="submit" del form', () => {
    crear();
    const botonTalon: HTMLButtonElement | null = fixture.nativeElement.querySelector('.ticket-talon button[type="submit"]');
    expect(botonTalon).toBeTruthy();
    expect(botonTalon!.type).toBe('submit');
    expect(botonTalon!.textContent).toContain('AUTH.ENTRAR');
  });
});
