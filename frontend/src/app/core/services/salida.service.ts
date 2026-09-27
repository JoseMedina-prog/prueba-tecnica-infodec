import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DestinoSalida } from '../models/salida.model';
import { IdiomaApp, IdiomaService } from './idioma.service';

@Injectable({
  providedIn: 'root'
})
export class SalidaService {
  private readonly http = inject(HttpClient);
  private readonly idiomaService = inject(IdiomaService);
  private readonly apiUrl = environment.apiUrl;
  /** Una respuesta por idioma: el backend traduce ciudad y país según Accept-Language. */
  private readonly salidasPorIdioma = new Map<IdiomaApp, Observable<DestinoSalida[]>>();

  /** Destinos del tablero del login en el idioma actual. Endpoint público: funciona sin sesión. */
  getSalidas(): Observable<DestinoSalida[]> {
    const idioma = this.idiomaService.getIdioma();
    const enCache = this.salidasPorIdioma.get(idioma);
    if (enCache) {
      return enCache;
    }

    // El Accept-Language va explícito para que la respuesta siempre corresponda a la clave de la caché.
    const salidas$ = this.http
      .get<ApiResponse<DestinoSalida[]>>(`${this.apiUrl}/salidas`, { headers: { 'Accept-Language': idioma } })
      .pipe(
        map((res) => res.data ?? []),
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((err) => {
          // Los errores no se guardan: la próxima suscripción en este idioma vuelve a pedir.
          if (this.salidasPorIdioma.get(idioma) === salidas$) {
            this.salidasPorIdioma.delete(idioma);
          }
          return throwError(() => err);
        })
      );

    this.salidasPorIdioma.set(idioma, salidas$);
    return salidas$;
  }
}
