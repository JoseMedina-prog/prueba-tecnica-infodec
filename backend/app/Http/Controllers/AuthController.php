<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegistroRequest;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para la gestión de autenticación, registro e inicio de sesión de usuarios.
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

    /**
     * Autentica a un usuario y entrega tokens de acceso y refresco.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $data = $this->authService->login(
            $request->validated('correo'),
            $request->validated('password'),
            $request->ip() ?? '127.0.0.1'
        );

        return $this->successResponse($data, 200);
    }

    /**
     * Retorna los datos del usuario autenticado actualmente a través de AuthTokenMiddleware.
     */
    public function me(Request $request): JsonResponse
    {
        $usuario = $request->user();

        return $this->successResponse([
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'correo' => $usuario->correo,
            'idioma' => $usuario->idioma,
        ], 200);
    }
}
