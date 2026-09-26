import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type IdiomaApp = 'es' | 'de';

@Injectable({
  providedIn: 'root'
})
export class IdiomaService {
  private readonly translate = inject(TranslateService);
  private readonly STORAGE_KEY = 'travel_app_lang';

  private readonly idiomaSignal = signal<IdiomaApp>(this.obtenerIdiomaInicial());
  readonly idiomaActual = this.idiomaSignal.asReadonly();

  constructor() {
    this.translate.addLangs(['es', 'de']);
    this.translate.setFallbackLang('es');
    this.translate.use(this.idiomaSignal());
    document.documentElement.lang = this.idiomaSignal();
  }

  cambiarIdioma(nuevoIdioma: string): void {
    const lang: IdiomaApp = nuevoIdioma === 'de' ? 'de' : 'es';
    this.idiomaSignal.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
    this.translate.use(lang);
    document.documentElement.lang = lang;
  }

  aplicarIdiomaUsuario(idiomaUsuario?: string): void {
    if (idiomaUsuario && (idiomaUsuario === 'es' || idiomaUsuario === 'de')) {
      this.cambiarIdioma(idiomaUsuario);
    }
  }

  getIdioma(): IdiomaApp {
    return this.idiomaSignal();
  }

  private obtenerIdiomaInicial(): IdiomaApp {
    const guardado = localStorage.getItem(this.STORAGE_KEY);
    if (guardado === 'es' || guardado === 'de') {
      return guardado;
    }
    const navegador = navigator.language?.slice(0, 2);
    return navegador === 'de' ? 'de' : 'es';
  }
}
