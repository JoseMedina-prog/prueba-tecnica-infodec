import { IdiomaApp } from '../services/idioma.service';

/** Locale de Intl para cada idioma de la app. */
export function localeDe(idioma: IdiomaApp): string {
  return idioma === 'de' ? 'de-DE' : 'es-CO';
}

/** Monedas que se muestran sin decimales (el resto usa 2). */
const MONEDAS_SIN_DECIMALES = ['JPY'];

/**
 * Muestra el presupuesto siempre con formato "$ 1.000.000 COP" para no confundirlo con dólares.
 * Aplica en pantalla 2 (presupuesto), pantalla 3 (resultado) e historial.
 */
export function formatearCop(valor: number, idioma: IdiomaApp): string {
  const numero = new Intl.NumberFormat(localeDe(idioma), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(valor);
  return `$ ${numero} COP`;
}

/** Valor en la moneda destino, sin símbolo: JPY sin decimales; GBP, INR y DKK con 2. */
export function formatearMonto(valor: number, codigoMoneda: string, idioma: IdiomaApp): string {
  const decimales = MONEDAS_SIN_DECIMALES.includes(codigoMoneda) ? 0 : 2;
  return new Intl.NumberFormat(localeDe(idioma), {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor);
}

/**
 * Tasa inversa legible: arriba y más grande "1 £ = 4.339,68 COP" (2 decimales con formato del idioma).
 */
export function formatearTasaInversa(tasa: number, simboloMoneda: string, idioma: IdiomaApp): string {
  if (!tasa || tasa <= 0) return '';
  const inverso = 1 / tasa;
  const numero = new Intl.NumberFormat(localeDe(idioma), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(inverso);
  return `1 ${simboloMoneda} = ${numero} COP`;
}

/**
 * Tasa directa detallada: debajo en pequeño "1 COP = 0,00023043 GBP" (8 decimales con formato del idioma).
 */
export function formatearTasaDirecta(tasa: number, codigoMoneda: string, idioma: IdiomaApp): string {
  const numero = new Intl.NumberFormat(localeDe(idioma), {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8
  }).format(tasa);
  return `1 COP = ${numero} ${codigoMoneda}`;
}

/** "1 COP = 0,04832 JPY" (formato general para tablas o compatibilidad) */
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

/** Fecha y hora en UTC (la tasa de ExchangeRate-API se publica en UTC). */
export function formatearFechaHoraUtc(fechaIso: string | null | undefined, idioma: IdiomaApp): string {
  if (!fechaIso) return '';
  const fecha = new Date(fechaIso);
  if (isNaN(fecha.getTime())) return fechaIso;
  return new Intl.DateTimeFormat(localeDe(idioma), { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(fecha);
}

/**
 * Fecha del talón en dos líneas, sin cortes:
 * Línea 1: "25 SEP 2026" (es) o "25 SEP. 2026" (de) con mes abreviado en mayúsculas.
 * Línea 2: "18:20" (24 h).
 */
export function formatearFechaTalon(
  fechaIso: string | null | undefined,
  idioma: IdiomaApp
): { fecha: string; hora: string } {
  if (!fechaIso) return { fecha: '', hora: '' };
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return { fecha: fechaIso, hora: '' };

  const partes = new Intl.DateTimeFormat(localeDe(idioma), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(d);

  const dia = partes.find((p) => p.type === 'day')?.value ?? '';
  const mesCrudo = partes.find((p) => p.type === 'month')?.value ?? '';
  const anio = partes.find((p) => p.type === 'year')?.value ?? '';
  const hora = partes.find((p) => p.type === 'hour')?.value ?? '';
  const minuto = partes.find((p) => p.type === 'minute')?.value ?? '';

  let mes = mesCrudo.toUpperCase().replace(/\.$/, '');
  if (mes.startsWith('SEP')) mes = 'SEP';

  const textoFecha = idioma === 'de' ? `${dia} ${mes}. ${anio}` : `${dia} ${mes} ${anio}`;
  const textoHora = `${hora}:${minuto}`;

  return { fecha: textoFecha, hora: textoHora };
}

/**
 * Momento de un dato guardado (clima de respaldo) en hora local del navegador:
 * si es de hoy, solo la hora ("18:05"); si no, día y mes sin año ("25 SEP" / "25 SEP.") y la hora.
 */
export function formatearMomentoGuardado(
  fechaIso: string | null | undefined,
  idioma: IdiomaApp,
  ahora: Date = new Date()
): { esHoy: boolean; fecha: string; hora: string } | null {
  if (!fechaIso) return null;
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return null;

  const esHoy = d.getFullYear() === ahora.getFullYear() && d.getMonth() === ahora.getMonth() && d.getDate() === ahora.getDate();
  const talon = formatearFechaTalon(fechaIso, idioma);
  // "25 SEP 2026" → "25 SEP" (y "25 SEP. 2026" → "25 SEP.")
  const fecha = talon.fecha.replace(/\s+\d{4}$/, '');

  return { esHoy, fecha, hora: talon.hora };
}

/**
 * True si el clima guardado en una consulta es más de `minutos` anterior a la consulta.
 * El historial no guarda la fuente, así que esto indica que se usó un clima de respaldo.
 */
export function climaAnteriorALaConsulta(
  climaObtenidoEn: string | null | undefined,
  fechaConsulta: string,
  minutos = 30
): boolean {
  if (!climaObtenidoEn) return false;
  const clima = new Date(climaObtenidoEn).getTime();
  const consulta = new Date(fechaConsulta).getTime();
  if (isNaN(clima) || isNaN(consulta)) return false;
  return consulta - clima > minutos * 60_000;
}

/** Solo la primera letra en mayúscula ("Nubes dispersas"). */
export function capitalizarPrimera(texto: string | null | undefined): string {
  if (!texto) return '';
  const trimmed = texto.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Convierte el texto del presupuesto ("1500000,5") al número que espera el backend. */
export function normalizarPresupuesto(valor: string): number {
  return Number(valor.trim().replace(',', '.'));
}
