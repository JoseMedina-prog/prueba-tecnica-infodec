<?php

use App\Http\Controllers\AuthController;
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

    // Rutas protegidas por AuthTokenMiddleware
    Route::middleware('auth.token')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
    });
});
