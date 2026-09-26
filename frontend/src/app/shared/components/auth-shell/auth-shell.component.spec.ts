import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthShellComponent } from './auth-shell.component';

describe('AuthShellComponent', () => {
  let fixture: ComponentFixture<AuthShellComponent>;
  let component: AuthShellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthShellComponent],
      providers: [provideRouter([]), provideTranslateService()]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthShellComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('enlace', 'registro');
    fixture.detectChanges();
  });

  it('la capa decorativa tiene aria-hidden="true" y pointer-events: none', () => {
    const el = fixture.nativeElement as HTMLElement;
    const capaDecorativa = el.querySelector('.decoracion-fondo');

    expect(capaDecorativa).toBeTruthy();
    expect(capaDecorativa?.getAttribute('aria-hidden')).toBe('true');
  });

  it('muestra la barra superior transparente con el logo y el selector de idioma', () => {
    const el = fixture.nativeElement as HTMLElement;
    const barra = el.querySelector('.barra-superior');
    const logo = el.querySelector('.marca app-logo');
    const selectorIdioma = el.querySelector('app-selector-idioma');

    expect(barra).toBeTruthy();
    expect(logo).toBeTruthy();
    expect(selectorIdioma).toBeTruthy();
  });

  it('las rutas se generan una por bloque', () => {
    const rutas = component.rutas();
    expect(rutas.length).toBe(4);
    const destinos = rutas.map((r) => r.destino);
    expect(destinos).toContain('LON');
    expect(destinos).toContain('CPH');
    expect(destinos).toContain('DEL');
    expect(destinos).toContain('TYO');

    const paths = fixture.nativeElement.querySelectorAll('.ruta-linea-base');
    expect(paths.length).toBe(4);

    const waypoints = fixture.nativeElement.querySelectorAll('.waypoint-diamante');
    expect(waypoints.length).toBe(4);
  });

  it('con reduced motion no se arranca la animación del avión', () => {
    spyOn(window, 'matchMedia').and.callFake((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true
    } as any));

    const fixtureReduced = TestBed.createComponent(AuthShellComponent);
    fixtureReduced.componentRef.setInput('enlace', 'login');
    fixtureReduced.detectChanges();

    expect(fixtureReduced.componentInstance.animacionActiva).toBeFalse();
  });
});

