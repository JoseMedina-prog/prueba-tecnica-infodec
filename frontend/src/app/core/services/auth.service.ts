import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SIN_MANEJO_DE_SESION } from '../interceptors/contexto-auth';
import {
  ApiResponse,
  LoginRequest,
  RefreshResponse,
  RegistroRequest,
  TokensResponse,
  Usuario
} from '../models';
import { IdiomaService } from './idioma.service';
import { TokenStorageService } from './token-storage.service';
import { ConsultaStateService } from './consulta-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly idiomaService = inject(IdiomaService);
  private readonly consultaState = inject(ConsultaStateService);

  private readonly apiUrl = environment.apiUrl;

  private readonly usuarioSignal = signal<Usuario | null>(null);
  readonly usuario = this.usuarioSignal.asReadonly();

  // Signal para evitar parpadeos en los guards durante la inicialización
  private readonly inicializadoSignal = signal<boolean>(false);
  readonly estaInicializado = this.inicializadoSignal.asReadonly();

  readonly estaAutenticado = computed(() => {
    return !!this.tokenStorage.accessToken();
  });

  /**
   * Intenta restaurar la sesión al arrancar la app usando el refresh token de sessionStorage.
   * Si el backend lo rechaza, borra todo en silencio (tokens y estado de la consulta) y no muestra
   * el aviso de sesión expirada: el usuario solo recargó. No navega aquí porque la navegación
   * inicial aún no empieza; los guards llevan al login limpio cualquier ruta protegida.
   */
  async inicializarSesion(): Promise<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this.inicializadoSignal.set(true);
      return;
    }

    // El interceptor no maneja estos 401: el fallo se resuelve aquí, sin aviso ni redirección.
    const context = new HttpContext().set(SIN_MANEJO_DE_SESION, true);

    try {
      // 1. Renovar access token
      const refreshRes = await firstValueFrom(
        this.http.post<ApiResponse<RefreshResponse>>(
          `${this.apiUrl}/auth/refresh`,
          { refresh_token: refreshToken },
          { context }
        )
      );

      if (!refreshRes?.success || !refreshRes.data) {
        this.borrarDatosDeSesion();
        return;
      }

      this.tokenStorage.setTokens(refreshRes.data.access_token, refreshRes.data.refresh_token);

      // 2. Cargar perfil del usuario (/auth/me devuelve el usuario directamente en data)
      const meRes = await firstValueFrom(this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/auth/me`, { context }));

      // Al recargar se conserva el idioma elegido en este navegador; el del perfil se aplica al iniciar sesión.
      if (meRes?.success && meRes.data) {
        this.usuarioSignal.set(meRes.data);
      }
    } catch {
      this.borrarDatosDeSesion();
    } finally {
      this.inicializadoSignal.set(true);
    }
  }

  login(credenciales: LoginRequest): Observable<ApiResponse<TokensResponse>> {
    return this.http.post<ApiResponse<TokensResponse>>(`${this.apiUrl}/auth/login`, credenciales).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.tokenStorage.setTokens(res.data.access_token, res.data.refresh_token);
          if (res.data.usuario) {
            this.usuarioSignal.set(res.data.usuario);
            this.idiomaService.aplicarIdiomaUsuario(res.data.usuario.idioma);
          }
        }
      })
    );
  }

  registro(datos: RegistroRequest): Observable<ApiResponse<{ usuario: Usuario }>> {
    return this.http.post<ApiResponse<{ usuario: Usuario }>>(`${this.apiUrl}/auth/register`, datos);
  }

  /**
   * Renueva los tokens. Si falla no limpia nada por su cuenta: el interceptor, que es quien la llama,
   * limpia la sesión una sola vez y lleva al login con el aviso.
   */
  refrescarToken(): Observable<ApiResponse<RefreshResponse>> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return of({
        success: false,
        error: { code: 'AUTH_TOKEN_MISSING', message: 'No hay refresh token' }
      });
    }

    return this.http
      .post<ApiResponse<RefreshResponse>>(`${this.apiUrl}/auth/refresh`, {
        refresh_token: refreshToken
      })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.tokenStorage.setTokens(res.data.access_token, res.data.refresh_token);
          }
        })
      );
  }

  obtenerPerfil(): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/auth/me`).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.usuarioSignal.set(res.data);
          this.idiomaService.aplicarIdiomaUsuario(res.data.idioma);
        }
      })
    );
  }

  logout(): Observable<any> {
    const logoutReq = this.http.post(`${this.apiUrl}/auth/logout`, {});
    return logoutReq.pipe(
      tap(() => this.completarCierreSesion()),
      catchError(() => {
        this.completarCierreSesion();
        return of(null);
      })
    );
  }

  /**
   * Cierra la sesión local y lleva al login. Primero borra sessionStorage (refresh token y estado
   * de la consulta) y después redirige, para que un F5 posterior no intente renovar con un token revocado.
   * Con `mensajeExpirada` el login muestra una vez el aviso de sesión expirada.
   */
  limpiarSesion(mensajeExpirada: boolean = false): void {
    this.borrarDatosDeSesion();
    if (mensajeExpirada) {
      this.router.navigate(['/login'], { state: { sesionExpirada: true } });
    } else {
      this.router.navigate(['/login']);
    }
  }

  private completarCierreSesion(): void {
    this.borrarDatosDeSesion();
    this.router.navigate(['/login']);
  }

  /** Access token en memoria, refresh token y estado de la consulta en sessionStorage, y el usuario. */
  private borrarDatosDeSesion(): void {
    this.tokenStorage.clear();
    this.consultaState.reiniciar();
    this.usuarioSignal.set(null);
  }
}
