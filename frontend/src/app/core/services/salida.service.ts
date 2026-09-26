import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DestinoSalida } from '../models/salida.model';

@Injectable({
  providedIn: 'root'
})
export class SalidaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Destinos del tablero del login. Endpoint público: funciona sin sesión. */
  getSalidas(): Observable<DestinoSalida[]> {
    return this.http.get<ApiResponse<DestinoSalida[]>>(`${this.apiUrl}/salidas`).pipe(map((res) => res.data ?? []));
  }
}
