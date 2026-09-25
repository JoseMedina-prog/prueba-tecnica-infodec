import { FormControl } from '@angular/forms';
import { presupuestoValidator, validarPresupuesto } from './presupuesto.validator';

describe('PresupuestoValidator', () => {
  const validator = presupuestoValidator();

  describe('Valores válidos aceptados', () => {
    it('debe aceptar número entero sin decimales (1500000)', () => {
      const control = new FormControl('1500000');
      expect(validator(control)).toBeNull();
      expect(validarPresupuesto('1500000')).toBeNull();
    });

    it('debe aceptar número con un decimal usando coma (1500000,5)', () => {
      const control = new FormControl('1500000,5');
      expect(validator(control)).toBeNull();
      expect(validarPresupuesto('1500000,5')).toBeNull();
    });

    it('debe aceptar número con dos decimales usando punto (1500000.55)', () => {
      const control = new FormControl('1500000.55');
      expect(validator(control)).toBeNull();
      expect(validarPresupuesto('1500000.55')).toBeNull();
    });
  });

  describe('Valores inválidos rechazados', () => {
    it('debe rechazar cadena vacía', () => {
      const control = new FormControl('');
      const resultado = validator(control);
      expect(resultado).toEqual({ requerido: true });
    });

    it('debe rechazar valor 0', () => {
      const control = new FormControl('0');
      const resultado = validator(control);
      expect(resultado).toEqual({ mayorQueCero: true });
    });

    it('debe rechazar números negativos (-5)', () => {
      const control = new FormControl('-5');
      const resultado = validator(control);
      expect(resultado).toEqual({ formatoInvalido: true });
    });

    it('debe rechazar texto no numérico (abc)', () => {
      const control = new FormControl('abc');
      const resultado = validator(control);
      expect(resultado).toEqual({ formatoInvalido: true });
    });

    it('debe rechazar separadores de miles (1.500.000)', () => {
      const control = new FormControl('1.500.000');
      const resultado = validator(control);
      expect(resultado).toEqual({ formatoInvalido: true });
    });

    it('debe rechazar más de 2 decimales (10,555)', () => {
      const control = new FormControl('10,555');
      const resultado = validator(control);
      expect(resultado).toEqual({ maxDecimales: true });
    });
  });
});
