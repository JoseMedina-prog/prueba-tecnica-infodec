import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ConsultaRequest, ConsultaResultado } from '../models/consulta.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  crearConsulta(datos: ConsultaRequest): Observable<ApiResponse<ConsultaResultado>> {
    return this.http.post<ApiResponse<ConsultaResultado>>(`${this.apiUrl}/consultas`, datos);
  }

  getHistorial(): Observable<ConsultaResultado[]> {
    return this.http.get<ApiResponse<ConsultaResultado[]>>(`${this.apiUrl}/consultas/historial`).pipe(
      map((res) => res.data || [])
    );
  }
}
