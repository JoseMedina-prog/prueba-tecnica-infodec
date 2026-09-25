export interface Moneda {
  codigo: string;
  nombre: string;
  simbolo: string;
}

export interface Ciudad {
  id: number;
  nombre: string;
}

export interface Pais {
  id: number;
  codigo: string;
  nombre: string;
  moneda: Moneda;
}
