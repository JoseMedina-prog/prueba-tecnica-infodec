import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { App } from './app';
import { routes } from './app.routes';
import { NoEncontradoComponent } from './features/no-encontrado/no-encontrado.component';

describe('App', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService()
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('debe navegar a la ruta comodín (**) y cargar NoEncontradoComponent cuando la URL no existe', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/ruta-inexistente-xyz');
    fixture.detectChanges();

    const noEncontradoEl = fixture.nativeElement.querySelector('app-no-encontrado');
    expect(noEncontradoEl).toBeTruthy();
    const titulo = noEncontradoEl.querySelector('.titulo-vuelo');
    expect(titulo).toBeTruthy();
  });
});

