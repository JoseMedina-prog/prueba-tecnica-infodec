<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RefreshRequest;
use App\Http\Requests\RegistroRequest;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para la gestión de autenticación, registro, inicio, renovación y cierre de sesión.
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
     * Renueva el par de tokens (access y refresh) mediante rotación.
     */
    public function refresh(RefreshRequest $request): JsonResponse
    {
        $data = $this->authService->refrescar(
            $request->validated('refresh_token'),
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

    /**
     * Cierra la sesión revocando el token de acceso actual y los refresh tokens de su familia.
     */
    public function logout(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $claims = $request->attributes->get('token_claims', []);

        $this->authService->logout($usuario, $claims);

        return $this->successResponse([
            'message' => 'Sesión cerrada correctamente.',
        ], 200);
    }
}
