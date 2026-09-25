<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExternasController;
use App\Http\Controllers\PaisController;
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
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('/refresh', [AuthController::class, 'refresh'])->name('auth.refresh');

    // Rutas protegidas por AuthTokenMiddleware
    Route::middleware('auth.token')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
    });
});

// Rutas protegidas por AuthTokenMiddleware
Route::middleware('auth.token')->group(function () {
    // Países y ciudades
    Route::get('/paises', [PaisController::class, 'index'])->name('paises.index');
    Route::get('/paises/{id}/ciudades', [PaisController::class, 'ciudades'])
        ->whereNumber('id')
        ->name('paises.ciudades');

    // APIs externas directas para pruebas y diagnóstico
    Route::prefix('externas')->group(function () {
        Route::get('/clima/{ciudadId}', [ExternasController::class, 'clima'])
            ->whereNumber('ciudadId')
            ->name('externas.clima');

        Route::get('/tasa/{codigoMoneda}', [ExternasController::class, 'tasa'])
            ->name('externas.tasa');
    });
});
