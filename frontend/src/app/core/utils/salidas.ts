import { InjectionToken } from '@angular/core';

export const RELOJ_FN = new InjectionToken<() => Date>('RELOJ_FN', {
  providedIn: 'root',
  factory: () => () => new Date()
});

/** Formatea la fecha de hoy en hora de Colombia (ej. "25 SEP 26") */
export function obtenerFechaColombia(fecha: Date): string {
  const formateador = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
  const partes = formateador.formatToParts(fecha);
  const dia = partes.find((p) => p.type === 'day')?.value ?? '';
  let mes = (partes.find((p) => p.type === 'month')?.value ?? '').replace(/\./g, '').toUpperCase();
  if (mes.length > 3) mes = mes.slice(0, 3);
  const anio = partes.find((p) => p.type === 'year')?.value ?? '';
  return `${dia} ${mes} ${anio}`.trim();
}
