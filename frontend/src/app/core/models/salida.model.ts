/** Destino del tablero de salidas (GET /api/salidas, público). Nombres ya traducidos por el backend. */
export interface DestinoSalida {
  codigo_iata: string;
  ciudad: string;
  pais: string;
}
