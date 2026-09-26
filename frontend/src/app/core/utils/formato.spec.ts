import { climaAnteriorALaConsulta, formatearMomentoGuardado } from './formato';

describe('formato - clima guardado', () => {
  // Fechas locales del navegador, para que "hoy" no dependa de la zona horaria de la máquina
  const ahora = new Date(2026, 8, 26, 20, 0);

  it('formatearMomentoGuardado: de hoy solo da la hora', () => {
    const momento = formatearMomentoGuardado(new Date(2026, 8, 26, 18, 5).toISOString(), 'es', ahora);
    expect(momento).toEqual({ esHoy: true, fecha: '26 SEP', hora: '18:05' });
  });

  it('formatearMomentoGuardado: de otro día da día y mes sin año', () => {
    expect(formatearMomentoGuardado(new Date(2026, 8, 25, 18, 5).toISOString(), 'es', ahora)).toEqual({
      esHoy: false,
      fecha: '25 SEP',
      hora: '18:05'
    });
    expect(formatearMomentoGuardado(new Date(2026, 8, 25, 18, 5).toISOString(), 'de', ahora)?.fecha).toBe('25 SEP.');
  });

  it('formatearMomentoGuardado: sin fecha o con fecha inválida no devuelve nada', () => {
    expect(formatearMomentoGuardado(null, 'es', ahora)).toBeNull();
    expect(formatearMomentoGuardado('no-es-fecha', 'es', ahora)).toBeNull();
  });

  it('climaAnteriorALaConsulta: más de 30 minutos antes de la consulta', () => {
    const consulta = '2026-09-26T15:00:00Z';
    expect(climaAnteriorALaConsulta('2026-09-26T14:00:00Z', consulta)).toBeTrue();
    expect(climaAnteriorALaConsulta('2026-09-26T14:40:00Z', consulta)).toBeFalse();
    expect(climaAnteriorALaConsulta(null, consulta)).toBeFalse();
  });
});
