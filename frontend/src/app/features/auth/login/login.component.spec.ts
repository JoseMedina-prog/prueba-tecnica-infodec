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
});
