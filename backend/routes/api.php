<?php

use App\Http\Controllers\AuthController;
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

// Rutas de países y ciudades (protegidas por auth.token)
Route::middleware('auth.token')->group(function () {
    Route::get('/paises', [PaisController::class, 'index'])->name('paises.index');
    Route::get('/paises/{id}/ciudades', [PaisController::class, 'ciudades'])
        ->whereNumber('id')
        ->name('paises.ciudades');
});
