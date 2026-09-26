import { InjectionToken } from '@angular/core';
import { DestinoSalida } from '../models';

export const ESTADOS = ['DESPEGO', 'ABORDANDO', 'A_TIEMPO', 'PROGRAMADO'] as const;
export type Estado = (typeof ESTADOS)[number];

export interface Salida {
  codigo: string;
  ciudad: string;
  hora: string;
  minutos: number;
  estado: Estado;
  cambios: number;
}

export const RELOJ_FN = new InjectionToken<() => Date>('RELOJ_FN', {
  providedIn: 'root',
  factory: () => () => new Date()
});

export const RELOJ_COLOMBIA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

export const INTERVALOS_VUELOS = [40, 45, 35, 50, 40, 45, 40];

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

export function obtenerMinutosColombia(fecha: Date): number {
  const formateador = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const partes = formateador.formatToParts(fecha);
  let h = Number(partes.find((p) => p.type === 'hour')?.value ?? 0);
  if (h === 24) h = 0;
  const m = Number(partes.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

export function generarSalidas(destinos: DestinoSalida[], fecha: Date, salidasAnteriores: Salida[] = []): Salida[] {
  const minutosAhora = obtenerMinutosColombia(fecha);
  const redondeo5 = (min: number) => Math.round(min / 5) * 5;

  let mAcumulado = redondeo5(minutosAhora - 20);
  const minutosVuelos = destinos.map((_, i) => {
    if (i > 0) mAcumulado += INTERVALOS_VUELOS[(i - 1) % INTERVALOS_VUELOS.length];
    return mAcumulado;
  });

  let abordandoAsignado = false;

  return destinos.map((destino, i) => {
    const codigo = destino.codigo_iata;
    const m = minutosVuelos[i];
    const normalizado = ((m % 1440) + 1440) % 1440;
    const hh = String(Math.floor(normalizado / 60)).padStart(2, '0');
    const mm = String(normalizado % 60).padStart(2, '0');
    const hora = `${hh}:${mm}`;

    let estado: Estado;
    if (m < minutosAhora) {
      estado = 'DESPEGO';
    } else if (!abordandoAsignado) {
      abordandoAsignado = true;
      estado = 'ABORDANDO';
    } else {
      estado = i % 2 === 0 ? 'A_TIEMPO' : 'PROGRAMADO';
    }

    const anterior = salidasAnteriores.find((s) => s.codigo === codigo);
    const cambios = anterior && anterior.estado !== estado ? anterior.cambios + 1 : (anterior?.cambios ?? 0);

    return {
      codigo,
      ciudad: destino.ciudad,
      hora,
      minutos: m,
      estado,
      cambios
    };
  });
}

export function actualizarEstados(salidas: Salida[], fecha: Date): Salida[] {
  const minutosAhora = obtenerMinutosColombia(fecha);
  let abordandoAsignado = false;

  return salidas.map((salida, i) => {
    let estado: Estado;
    if (salida.minutos < minutosAhora) {
      estado = 'DESPEGO';
    } else if (!abordandoAsignado) {
      abordandoAsignado = true;
      estado = 'ABORDANDO';
    } else {
      estado = i % 2 === 0 ? 'A_TIEMPO' : 'PROGRAMADO';
    }

    const cambios = salida.estado !== estado ? salida.cambios + 1 : salida.cambios;

    return {
      ...salida,
      estado,
      cambios
    };
  });
}
