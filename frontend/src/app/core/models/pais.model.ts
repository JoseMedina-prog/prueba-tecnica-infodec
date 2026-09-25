export interface Moneda {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
}

export interface Ciudad {
  id: number;
  pais_id: number;
  nombre: string;
  latitud: number;
  longitud: number;
}

export interface Pais {
  id: number;
  codigo_iso: string;
  nombre: string;
  moneda_id: number;
  moneda?: Moneda;
  ciudades?: Ciudad[];
}
