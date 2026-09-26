import { evaluatePasswordRules, isPasswordValid } from './password-rules';

describe('password-rules', () => {
  it('debe marcar las 4 reglas con "Abcdefg1"', () => {
    const rules = evaluatePasswordRules('Abcdefg1');
    expect(rules.minLength).toBeTrue();
    expect(rules.hasUpper).toBeTrue();
    expect(rules.hasLower).toBeTrue();
    expect(rules.hasNumber).toBeTrue();
    expect(isPasswordValid('Abcdefg1')).toBeTrue();
  });

  it('debe marcar solo minúscula y dejar pendientes longitud, mayúscula y número con "abc"', () => {
    const rules = evaluatePasswordRules('abc');
    expect(rules.minLength).toBeFalse();
    expect(rules.hasUpper).toBeFalse();
    expect(rules.hasLower).toBeTrue();
    expect(rules.hasNumber).toBeFalse();
    expect(isPasswordValid('abc')).toBeFalse();
  });

  it('debe evaluar correctamente valores vacíos o nulos', () => {
    const rulesEmpty = evaluatePasswordRules('');
    expect(rulesEmpty.minLength).toBeFalse();
    expect(rulesEmpty.hasUpper).toBeFalse();
    expect(rulesEmpty.hasLower).toBeFalse();
    expect(rulesEmpty.hasNumber).toBeFalse();

    const rulesNull = evaluatePasswordRules(null);
    expect(rulesNull.minLength).toBeFalse();
    expect(rulesNull.hasUpper).toBeFalse();
    expect(rulesNull.hasLower).toBeFalse();
    expect(rulesNull.hasNumber).toBeFalse();
  });
});
