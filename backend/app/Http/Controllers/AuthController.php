<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegistroRequest;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Controlador para la gestión de autenticación y registro de usuarios.
 */
class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Registra un nuevo usuario y devuelve sus datos públicos básicos.
     */
    public function register(RegistroRequest $request): JsonResponse
    {
        $usuario = $this->authService->registrar($request->validated());

        return $this->successResponse([
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'correo' => $usuario->correo,
            'idioma' => $usuario->idioma,
        ], 201);
    }
}
