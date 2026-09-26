import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DestinoSalida } from '../models/salida.model';

@Injectable({
  providedIn: 'root'
})
export class SalidaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private salidas$?: Observable<DestinoSalida[]>;

  /** Destinos del tablero del login. Endpoint público: funciona sin sesión. */
  getSalidas(): Observable<DestinoSalida[]> {
    if (!this.salidas$) {
      this.salidas$ = this.http.get<ApiResponse<DestinoSalida[]>>(`${this.apiUrl}/salidas`).pipe(
        map((res) => res.data ?? []),
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((err) => {
          this.salidas$ = undefined;
          return throwError(() => err);
        })
      );
    }
    return this.salidas$;
  }
}
