import { IdiomaApp } from '../services/idioma.service';

/** Locale de Intl para cada idioma de la app. */
export function localeDe(idioma: IdiomaApp): string {
  return idioma === 'de' ? 'de-DE' : 'es-CO';
}

/** Monedas que se muestran sin decimales (el resto usa 2). */
const MONEDAS_SIN_DECIMALES = ['JPY'];

/** "$ 1.500.000" (es-CO) o "1.500.000 COP" (de-DE). Solo muestra decimales si los hay. */
export function formatearCop(valor: number, idioma: IdiomaApp): string {
  return new Intl.NumberFormat(localeDe(idioma), {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(valor);
}

/** Valor en la moneda destino, sin símbolo: JPY sin decimales; GBP, INR y DKK con 2. */
export function formatearMonto(valor: number, codigoMoneda: string, idioma: IdiomaApp): string {
  const decimales = MONEDAS_SIN_DECIMALES.includes(codigoMoneda) ? 0 : 2;
  return new Intl.NumberFormat(localeDe(idioma), {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor);
}

/** "1 COP = 0,04832 JPY" */
export function formatearTasa(tasa: number, codigoMoneda: string, idioma: IdiomaApp): string {
  const numero = new Intl.NumberFormat(localeDe(idioma), { maximumFractionDigits: 6 }).format(tasa);
  return `1 COP = ${numero} ${codigoMoneda}`;
}

/** Fecha y hora en la zona horaria local del navegador. */
export function formatearFechaHora(fechaIso: string | null | undefined, idioma: IdiomaApp): string {
  if (!fechaIso) return '';
  const fecha = new Date(fechaIso);
  if (isNaN(fecha.getTime())) return fechaIso;
  return new Intl.DateTimeFormat(localeDe(idioma), { dateStyle: 'medium', timeStyle: 'short' }).format(fecha);
}

/** Convierte el texto del presupuesto ("1500000,5") al número que espera el backend. */
export function normalizarPresupuesto(valor: string): number {
  return Number(valor.trim().replace(',', '.'));
}
