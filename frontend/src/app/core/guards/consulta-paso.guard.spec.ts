import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { consultaPasoGuard } from './consulta-paso.guard';
import { ConsultaStateService } from '../services/consulta-state.service';
import { Pais, Ciudad, ConsultaResultado } from '../models';

describe('consultaPasoGuard', () => {
  let stateService: ConsultaStateService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    sessionStorage.clear();
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
    routerSpy.createUrlTree.and.callFake((commands: any[]) => ({ path: commands.join('/') } as unknown as UrlTree));

    TestBed.configureTestingModule({
      providers: [
        ConsultaStateService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    stateService = TestBed.inject(ConsultaStateService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Paso Presupuesto (/consulta/presupuesto)', () => {
    const routeSnapshot = { routeConfig: { path: 'presupuesto' } } as unknown as ActivatedRouteSnapshot;

    it('debe redirigir a /consulta/destino si no hay país ni ciudad seleccionados', () => {
      const result = TestBed.runInInjectionContext(() => consultaPasoGuard(routeSnapshot, {} as any));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/consulta/destino']);
      expect((result as any).path).toBe('/consulta/destino');
    });

    it('debe redirigir a /consulta/destino si solo hay país pero no ciudad', () => {
      stateService.setDestino({ id: 1, codigo: 'JP', nombre: 'Japón', moneda: { codigo: 'JPY', nombre: 'Yen', simbolo: '¥' } }, null);
      const result = TestBed.runInInjectionContext(() => consultaPasoGuard(routeSnapshot, {} as any));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/consulta/destino']);
    });

    it('debe permitir el acceso si país y ciudad están seleccionados', () => {
      stateService.setDestino(
        { id: 1, codigo: 'JP', nombre: 'Japón', moneda: { codigo: 'JPY', nombre: 'Yen', simbolo: '¥' } },
        { id: 3, nombre: 'Tokio' }
      );
      const result = TestBed.runInInjectionContext(() => consultaPasoGuard(routeSnapshot, {} as any));
      expect(result).toBeTrue();
    });
  });

  describe('Paso Resultado (/consulta/resultado)', () => {
    const routeSnapshot = { routeConfig: { path: 'resultado' } } as unknown as ActivatedRouteSnapshot;

    it('debe redirigir a /consulta/destino si no hay resultado guardado', () => {
      const result = TestBed.runInInjectionContext(() => consultaPasoGuard(routeSnapshot, {} as any));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/consulta/destino']);
    });

    it('debe permitir el acceso si hay resultado de consulta guardado', () => {
      stateService.setResultado({
        id: 1,
        fecha: '2026-09-25T12:00:00Z',
        pais: { codigo: 'JP', nombre: 'Japón' },
        ciudad: { id: 3, nombre: 'Tokio' },
        presupuesto_cop: 1000000,
        clima: null,
        moneda: { codigo: 'JPY', nombre: 'Yen', simbolo: '¥' },
        conversion: null
      });
      const result = TestBed.runInInjectionContext(() => consultaPasoGuard(routeSnapshot, {} as any));
      expect(result).toBeTrue();
    });
  });
});
