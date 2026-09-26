<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Limitador para creación de consultas y conversiones: 20 por minuto por usuario
        RateLimiter::for('consultas', function (Request $request) {
            $clave = $request->user()?->id ?: ($request->attributes->get('token_claims')['sub'] ?? $request->ip());
            return Limit::perMinute(20)->by($clave);
        });

        // Limitador para endpoints de diagnóstico de APIs externas: 30 por minuto por usuario
        RateLimiter::for('externas', function (Request $request) {
            $clave = $request->user()?->id ?: ($request->attributes->get('token_claims')['sub'] ?? $request->ip());
            return Limit::perMinute(30)->by($clave);
        });

        // Limitador del registro público (OWASP API6: flujo de negocio sensible sin sesión):
        // 10 por minuto y 30 por hora por IP. Cuenta toda petición a /auth/register, válida o no:
        // el 409 USER_ALREADY_EXISTS revela qué correos existen y este límite frena la enumeración.
        RateLimiter::for('registro', function (Request $request) {
            return [
                Limit::perMinute(10)->by('registro:minuto:' . $request->ip()),
                Limit::perHour(30)->by('registro:hora:' . $request->ip()),
            ];
        });

        // Limitador del tablero de salidas público (sin sesión): 30 por minuto por IP
        RateLimiter::for('salidas', function (Request $request) {
            return Limit::perMinute(30)->by('salidas:' . $request->ip());
        });

        // Limitador general de respaldo para el resto de rutas protegidas: 60 por minuto por usuario
        RateLimiter::for('api', function (Request $request) {
            $clave = $request->user()?->id ?: ($request->attributes->get('token_claims')['sub'] ?? $request->ip());
            return Limit::perMinute(60)->by($clave);
        });
    }
}
