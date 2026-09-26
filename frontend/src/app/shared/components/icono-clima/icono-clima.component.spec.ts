import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconoClimaComponent, mapearCodigoIcono } from './icono-clima.component';

describe('IconoClimaComponent', () => {
  let component: IconoClimaComponent;
  let fixture: ComponentFixture<IconoClimaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconoClimaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IconoClimaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mapear correctamente los códigos de OpenWeather según día/noche', () => {
    expect(mapearCodigoIcono('01d')).toBe('sol');
    expect(mapearCodigoIcono('01n')).toBe('luna');
    expect(mapearCodigoIcono('02d')).toBe('sol-nube');
    expect(mapearCodigoIcono('02n')).toBe('luna-nube');
    expect(mapearCodigoIcono('03d')).toBe('nube');
    expect(mapearCodigoIcono('04n')).toBe('nube');
    expect(mapearCodigoIcono('09d')).toBe('lluvia');
    expect(mapearCodigoIcono('10n')).toBe('lluvia');
    expect(mapearCodigoIcono('11d')).toBe('tormenta');
    expect(mapearCodigoIcono('13d')).toBe('nieve');
    expect(mapearCodigoIcono('50d')).toBe('niebla');
    expect(mapearCodigoIcono(null)).toBe('nube');
  });
});
