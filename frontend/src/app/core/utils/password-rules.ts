import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Longitud mínima exigida también por el backend (RegistroRequest). */
export const PASSWORD_MIN_LONGITUD = 8;

export interface PasswordRulesState {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
}

/**
 * Evalúa las 4 reglas de la contraseña. La usan tanto el validador del formulario
 * como la checklist del registro, para que ambas nunca se contradigan:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula (A-Z)
 * - Al menos una letra minúscula (a-z)
 * - Al menos un dígito (0-9)
 */
export function evaluatePasswordRules(password: string | null | undefined): PasswordRulesState {
  const val = password ?? '';
  return {
    minLength: val.length >= PASSWORD_MIN_LONGITUD,
    hasUpper: /[A-Z]/.test(val),
    hasLower: /[a-z]/.test(val),
    hasNumber: /[0-9]/.test(val)
  };
}

/** True si y solo si todas las reglas de contraseña se cumplen. */
export function isPasswordValid(password: string | null | undefined): boolean {
  const rules = evaluatePasswordRules(password);
  return rules.minLength && rules.hasUpper && rules.hasLower && rules.hasNumber;
}

/**
 * Validador de la contraseña basado en evaluatePasswordRules.
 * Devuelve `minlength` (misma forma que Validators.minLength) antes que `passwordComplexity`,
 * para que el mensaje debajo del campo siga el mismo orden de siempre.
 */
export function passwordReglasValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value ?? '';
    if (!valor) return null;

    const rules = evaluatePasswordRules(valor);
    if (!rules.minLength) {
      return { minlength: { requiredLength: PASSWORD_MIN_LONGITUD, actualLength: valor.length } };
    }
    return rules.hasUpper && rules.hasLower && rules.hasNumber ? null : { passwordComplexity: true };
  };
}
