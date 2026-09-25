import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Ciudad, Pais } from '../models/pais.model';

@Injectable({
  providedIn: 'root'
})
export class PaisService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getPaises(): Observable<Pais[]> {
    return this.http.get<ApiResponse<Pais[]>>(`${this.apiUrl}/paises`).pipe(
      map((res) => res.data || [])
    );
  }

  getCiudades(paisId: number): Observable<Ciudad[]> {
    return this.http.get<ApiResponse<Ciudad[]>>(`${this.apiUrl}/paises/${paisId}/ciudades`).pipe(
      map((res) => res.data || [])
    );
  }
}
