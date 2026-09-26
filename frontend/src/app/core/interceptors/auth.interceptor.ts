import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SIN_MANEJO_DE_SESION } from './contexto-auth';
import { AuthService } from '../services/auth.service';
import { IdiomaService } from '../services/idioma.service';
import { TokenStorageService } from '../services/token-storage.service';

// Variable de módulo para compartir una ÚNICA petición de renovación en curso
// y evitar múltiples llamadas con el mismo refresh token (lo que causaría revocación por reuso en el backend)
let renovacionEnCurso$: Observable<string | null> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Las peticiones que no van a la API (p. ej. /i18n/es.json) pasan sin cambios. Además evita una
  // dependencia circular al arrancar: TranslateService carga el JSON mientras AuthService se construye.
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);
  const idiomaService = inject(IdiomaService);

  const esRutaPublicaAuth =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh');

  // 1. Agregar cabecera Accept-Language a TODAS las peticiones
  let headers = req.headers.set('Accept-Language', idiomaService.getIdioma());

  // 2. Agregar Authorization: Bearer <token> a peticiones de la API excepto auth públicas
  if (!esRutaPublicaAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const peticionConCabeceras = req.clone({ headers });

  // Peticiones cuyo 401 maneja quien las hace (inicializador de la app): sin renovar ni redirigir.
  if (req.context.get(SIN_MANEJO_DE_SESION)) {
    return next(peticionConCabeceras);
  }

  return next(peticionConCabeceras).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }

      // No interceptar 401 en login (AUTH_INVALID_CREDENTIALS) ni en register
      if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
        return throwError(() => err);
      }

      const codigoError = err.error?.error?.code;

      // 401 de la propia llamada a /auth/refresh: lo resuelve la renovación en curso (abajo),
      // que limpia la sesión una sola vez.
      if (req.url.includes('/auth/refresh')) {
        return throwError(() => err);
      }

      // Caso A: Token expirado (AUTH_TOKEN_EXPIRED)
      if (codigoError === 'AUTH_TOKEN_EXPIRED') {
        // Evitar bucles infinitos: si ya fue reintentada una vez, no reintentar de nuevo
        if (req.headers.has('X-Reintento-Auth')) {
          authService.limpiarSesion(true);
          return throwError(() => err);
        }

        // Si ya hay una renovación en curso, reutilizarla; si no, crearla
        if (!renovacionEnCurso$) {
          renovacionEnCurso$ = authService.refrescarToken().pipe(
            map((res) => (res.success && res.data?.access_token ? res.data.access_token : null)),
            catchError(() => of(null)),
            // Dentro del flujo compartido: aunque varias peticiones esperen la renovación, la sesión
            // se limpia UNA vez. limpiarSesion borra sessionStorage antes de redirigir al login.
            tap((nuevoToken) => {
              if (!nuevoToken) {
                authService.limpiarSesion(true);
              }
            }),
            finalize(() => {
              renovacionEnCurso$ = null;
            }),
            shareReplay(1)
          );
        }

        return renovacionEnCurso$.pipe(
          switchMap((nuevoToken) => {
            if (!nuevoToken) {
              return throwError(() => err);
            }

            // Reintentar la petición original con el nuevo token y marca de reintento
            const peticionReintentada = req.clone({
              headers: req.headers
                .set('Authorization', `Bearer ${nuevoToken}`)
                .set('Accept-Language', idiomaService.getIdioma())
                .set('X-Reintento-Auth', '1')
            });

            return next(peticionReintentada);
          })
        );
      }

      // Caso B: Otros errores 401 de token (INVALID, REVOKED, MISSING)
      if (
        codigoError === 'AUTH_TOKEN_INVALID' ||
        codigoError === 'AUTH_TOKEN_REVOKED' ||
        codigoError === 'AUTH_TOKEN_MISSING'
      ) {
        authService.limpiarSesion(true);
      }

      return throwError(() => err);
    })
  );
};
