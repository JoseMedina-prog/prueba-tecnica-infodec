export interface ClimaInfo {
  temperatura: number;
  descripcion: string;
  /** Solo viene al crear la consulta; el historial no lo guarda. */
  icono?: string | null;
}

export interface MonedaInfo {
  codigo: string;
  nombre: string;
  simbolo: string;
}

export interface ConversionInfo {
  valor: number;
  tasa: number;
  fecha_tasa: string;
  fuente?: 'api' | 'respaldo' | string;
}

export interface ConsultaAviso {
  code: string;
  message: string;
}

export interface ConsultaRequest {
  ciudad_id: number;
  presupuesto: number;
}

export interface ConsultaResultado {
  id: number;
  fecha: string;
  pais: {
    id: number;
    codigo: string;
    nombre: string;
  };
  ciudad: {
    id: number;
    nombre: string;
    codigo_iata: string;
  };
  presupuesto_cop: number;
  clima: ClimaInfo | null;
  moneda: MonedaInfo;
  conversion: ConversionInfo | null;
  avisos?: ConsultaAviso[];
}
