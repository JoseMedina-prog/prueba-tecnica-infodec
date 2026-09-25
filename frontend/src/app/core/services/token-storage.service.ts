import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // El access token vive EXCLUSIVAMENTE en memoria por seguridad (mitigación XSS)
  private readonly accessTokenSignal = signal<string | null>(null);

  // Selector público de solo lectura para el access token
  readonly accessToken = this.accessTokenSignal.asReadonly();

  // Indica si el usuario tiene sesión activa en memoria
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());

  setTokens(accessToken: string, refreshToken?: string): void {
    this.accessTokenSignal.set(accessToken);
    if (refreshToken) {
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  setAccessToken(accessToken: string): void {
    this.accessTokenSignal.set(accessToken);
  }

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  clear(): void {
    this.accessTokenSignal.set(null);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}
