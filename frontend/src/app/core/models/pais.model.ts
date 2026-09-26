export interface Moneda {
  codigo: string;
  nombre: string;
  simbolo: string;
}

export interface Ciudad {
  id: number;
  nombre: string;
  /** Código IATA de 3 letras (LON, TYO…), guardado en la base de datos. */
  codigo_iata: string;
}

export interface Pais {
  id: number;
  codigo: string;
  nombre: string;
  moneda: Moneda;
}
