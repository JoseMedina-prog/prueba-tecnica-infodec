import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
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
   * Intenta restaurar la sesión al arrancar la app usando el refresh token de sessionStorage
   */
  async inicializarSesion(): Promise<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this.inicializadoSignal.set(true);
      return;
    }

    try {
      // 1. Renovar access token
      const refreshRes = await firstValueFrom(
        this.http.post<ApiResponse<RefreshResponse>>(`${this.apiUrl}/auth/refresh`, {
          refresh_token: refreshToken
        })
      );

      if (refreshRes?.success && refreshRes.data) {
        this.tokenStorage.setTokens(refreshRes.data.access_token, refreshRes.data.refresh_token);

        // 2. Cargar perfil del usuario
        const meRes = await firstValueFrom(
          this.http.get<ApiResponse<{ usuario: Usuario }>>(`${this.apiUrl}/auth/me`)
        );

        if (meRes?.success && meRes.data?.usuario) {
          this.usuarioSignal.set(meRes.data.usuario);
          this.idiomaService.aplicarIdiomaUsuario(meRes.data.usuario.idioma);
        }
      } else {
        this.tokenStorage.clear();
        this.usuarioSignal.set(null);
      }
    } catch {
      // Si falla la renovación al inicio, se limpia todo de forma silenciosa
      this.tokenStorage.clear();
      this.usuarioSignal.set(null);
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
          } else {
            this.limpiarSesion();
          }
        }),
        catchError((err) => {
          this.limpiarSesion();
          throw err;
        })
      );
  }

  obtenerPerfil(): Observable<ApiResponse<{ usuario: Usuario }>> {
    return this.http.get<ApiResponse<{ usuario: Usuario }>>(`${this.apiUrl}/auth/me`).pipe(
      tap((res) => {
        if (res.success && res.data?.usuario) {
          this.usuarioSignal.set(res.data.usuario);
          this.idiomaService.aplicarIdiomaUsuario(res.data.usuario.idioma);
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

  limpiarSesion(mensajeExpirada: boolean = false): void {
    this.tokenStorage.clear();
    this.usuarioSignal.set(null);
    this.consultaState.reiniciar();
    if (mensajeExpirada) {
      this.router.navigate(['/login'], { state: { sesionExpirada: true } });
    } else {
      this.router.navigate(['/login']);
    }
  }

  private completarCierreSesion(): void {
    this.tokenStorage.clear();
    this.usuarioSignal.set(null);
    this.consultaState.reiniciar();
    this.router.navigate(['/login']);
  }
}
