/** Código IATA de ciudad para cada ciudad del seeder (por id, igual que LUGARES.CIUDADES). */
export const CODIGOS_CIUDAD: Readonly<Record<number, string>> = {
  1: 'LON',
  2: 'MAN',
  3: 'TYO',
  4: 'OSA',
  5: 'DEL',
  6: 'BOM',
  7: 'CPH',
  8: 'AAR'
};

/** Código de 3 letras de la ciudad; si no está en la tabla, se arma con el nombre. */
export function codigoCiudad(id: number, nombre: string): string {
  return CODIGOS_CIUDAD[id] ?? nombre.slice(0, 3).toUpperCase();
}
