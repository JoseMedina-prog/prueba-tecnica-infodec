import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeEs from '@angular/common/locales/es-CO';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// Registrar configuraciones regionales para formateo de números, monedas y fechas
registerLocaleData(localeEs, 'es-CO');
registerLocaleData(localeDe, 'de-DE');

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
