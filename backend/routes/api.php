<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConsultaController;
use App\Http\Controllers\ExternasController;
use App\Http\Controllers\PaisController;
use App\Http\Controllers\SalidaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Rutas públicas y protegidas de la API de Travel App.
|
*/

Route::prefix('auth')->group(function () {
    // Rutas públicas de autenticación (sin middleware)
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:registro')
        ->name('auth.register');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('/refresh', [AuthController::class, 'refresh'])->name('auth.refresh');

    // Rutas protegidas por AuthTokenMiddleware
    Route::middleware(['auth.token', 'throttle:api'])->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
    });
});

// Tablero de salidas del login: PÚBLICO y de solo lectura (sin auth.token). Solo expone el código
// IATA y los nombres traducidos de ciudad y país; limitado a 30 peticiones por minuto por IP.
Route::get('/salidas', [SalidaController::class, 'index'])
    ->middleware('throttle:salidas')
    ->name('salidas.index');

// Rutas protegidas por AuthTokenMiddleware con límite general 'api' (60/min)
Route::middleware(['auth.token', 'throttle:api'])->group(function () {
    // Países y ciudades
    Route::get('/paises', [PaisController::class, 'index'])->name('paises.index');
    Route::get('/paises/{id}/ciudades', [PaisController::class, 'ciudades'])
        ->whereNumber('id')
        ->name('paises.ciudades');

    // Consultas turísticas y conversiones de presupuesto
    Route::get('/consultas/historial', [ConsultaController::class, 'historial'])->name('consultas.historial');
    Route::post('/consultas', [ConsultaController::class, 'crear'])
        ->withoutMiddleware('throttle:api')
        ->middleware('throttle:consultas')
        ->name('consultas.crear');
    Route::post('/conversion', [ConsultaController::class, 'crear'])
        ->withoutMiddleware('throttle:api')
        ->middleware('throttle:consultas')
        ->name('conversion.crear');

    // APIs externas directas para pruebas y diagnóstico
    Route::prefix('externas')
        ->withoutMiddleware('throttle:api')
        ->middleware('throttle:externas')
        ->group(function () {
            Route::get('/clima/{ciudadId}', [ExternasController::class, 'clima'])
                ->whereNumber('ciudadId')
                ->name('externas.clima');

            Route::get('/tasa/{codigoMoneda}', [ExternasController::class, 'tasa'])
                ->name('externas.tasa');
        });
});
