import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function validarPresupuesto(valor: string | null | undefined): ValidationErrors | null {
  if (valor === null || valor === undefined || valor.trim() === '') {
    return { requerido: true };
  }

  const v = valor.trim();

  // Acepta solo dígitos enteros o con UN único punto o coma seguido de 1 o 2 decimales
  const regexValido = /^\d+([.,]\d{1,2})?$/;
  if (!regexValido.test(v)) {
    if (/^\d+[.,]\d{3,}$/.test(v)) {
      return { maxDecimales: true };
    }
    return { formatoInvalido: true };
  }

  // Normalizar separador a punto decimal
  const num = parseFloat(v.replace(',', '.'));
  if (isNaN(num) || num <= 0) {
    return { mayorQueCero: true };
  }

  if (num > 9999999999999.99) {
    return { maximoExcedido: true };
  }

  return null;
}

export function presupuestoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return validarPresupuesto(control.value);
  };
}
