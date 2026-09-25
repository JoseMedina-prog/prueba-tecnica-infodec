export interface ClimaInfo {
  temperatura?: number | null;
  descripcion?: string | null;
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
  fuente: 'api' | 'bd' | string;
}

export interface ConsultaRequest {
  ciudad_id: number;
  presupuesto: number;
  idioma?: string;
}

export interface ConsultaItem {
  id: number;
  fecha: string;
  pais: {
    codigo: string;
    nombre: string;
  };
  ciudad: {
    id: number;
    nombre: string;
  };
  presupuesto_cop: number;
  clima: ClimaInfo;
  moneda: MonedaInfo;
  conversion: ConversionInfo;
  avisos?: string[];
}
