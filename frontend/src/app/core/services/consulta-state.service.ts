import { Injectable, signal } from '@angular/core';
import { Ciudad, Pais } from '../models/pais.model';
import { ConsultaResultado } from '../models/consulta.model';

interface StoredConsultaState {
  pais: Pais | null;
  ciudad: Ciudad | null;
  presupuesto: string | null;
  resultado: ConsultaResultado | null;
}

const STORAGE_KEY = 'travel_consulta_estado';

@Injectable({
  providedIn: 'root'
})
export class ConsultaStateService {
  private readonly paisSignal = signal<Pais | null>(null);
  readonly pais = this.paisSignal.asReadonly();

  private readonly ciudadSignal = signal<Ciudad | null>(null);
  readonly ciudad = this.ciudadSignal.asReadonly();

  private readonly presupuestoSignal = signal<string | null>(null);
  readonly presupuesto = this.presupuestoSignal.asReadonly();

  private readonly resultadoSignal = signal<ConsultaResultado | null>(null);
  readonly resultado = this.resultadoSignal.asReadonly();

  constructor() {
    this.cargarDesdeStorage();
  }

  setDestino(pais: Pais | null, ciudad: Ciudad | null): void {
    this.paisSignal.set(pais);
    this.ciudadSignal.set(ciudad);
    this.guardarEnStorage();
  }

  setPresupuesto(presupuesto: string | null): void {
    this.presupuestoSignal.set(presupuesto);
    this.guardarEnStorage();
  }

  setResultado(resultado: ConsultaResultado | null): void {
    this.resultadoSignal.set(resultado);
    this.guardarEnStorage();
  }

  reiniciar(): void {
    this.paisSignal.set(null);
    this.ciudadSignal.set(null);
    this.presupuestoSignal.set(null);
    this.resultadoSignal.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar errores de storage
    }
  }

  private cargarDesdeStorage(): void {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      if (!data) return;

      const parsed: StoredConsultaState = JSON.parse(data);
      if (parsed.pais) this.paisSignal.set(parsed.pais);
      if (parsed.ciudad) this.ciudadSignal.set(parsed.ciudad);
      if (parsed.presupuesto !== undefined) this.presupuestoSignal.set(parsed.presupuesto);
      if (parsed.resultado) this.resultadoSignal.set(parsed.resultado);
    } catch {
      // Ignorar errores de parseo
    }
  }

  private guardarEnStorage(): void {
    try {
      const estado: StoredConsultaState = {
        pais: this.paisSignal(),
        ciudad: this.ciudadSignal(),
        presupuesto: this.presupuestoSignal(),
        resultado: this.resultadoSignal()
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch {
      // Ignorar errores de storage
    }
  }
}
