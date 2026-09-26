<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Models\TokenRevocado;
use App\Models\Usuario;
use App\Services\SeguridadLogger;
use App\Services\TokenService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para la validación de tokens de acceso y autenticación en la API.
 */
class AuthTokenMiddleware
{
    public function __construct(
        protected TokenService $tokenService
    ) {}

    /**
     * Procesa la solicitud entrante verificando la autenticación del token en 5 pasos estrictos.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Revisión de cabecera Authorization: Bearer <token>
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            throw new ApiException(
                401,
                'AUTH_TOKEN_MISSING',
                null,
                [],
                ['WWW-Authenticate' => 'Bearer']
            );
        }

        $token = trim(substr($authHeader, 7));

        if ($token === '') {
            throw new ApiException(
                401,
                'AUTH_TOKEN_MISSING',
                null,
                [],
                ['WWW-Authenticate' => 'Bearer']
            );
        }

        // 2 y 3. Descifrado AES-256-GCM y verificación de firma HS256 / expiración
        try {
            $claims = $this->tokenService->validarAccessToken($token);
        } catch (ApiException $e) {
            if ($e->getErrorCode() === 'AUTH_TOKEN_EXPIRED') {
                SeguridadLogger::registrar('token_vencido', ip: $request->ip());
            } elseif ($e->getErrorCode() === 'AUTH_TOKEN_INVALID') {
                SeguridadLogger::registrar('token_invalido', ip: $request->ip());
            }

            throw new ApiException(
                $e->getStatusCode(),
                $e->getErrorCode(),
                $e->getMessageKey(),
                $e->getDetails(),
                array_merge(['WWW-Authenticate' => 'Bearer'], $e->getHeaders())
            );
        }

        // 4. Verificación de revocación previa (blacklist por JTI)
        if (TokenRevocado::where('jti', $claims['jti'])->exists()) {
            SeguridadLogger::registrar(
                'token_revocado_usado',
                ip: $request->ip(),
                usuarioId: isset($claims['sub']) ? (int) $claims['sub'] : null
            );

            throw new ApiException(
                401,
                'AUTH_TOKEN_REVOKED',
                null,
                [],
                ['WWW-Authenticate' => 'Bearer']
            );
        }

        // 5. Verificación de existencia del usuario en base de datos
        $usuario = Usuario::find($claims['sub']);

        if (!$usuario) {
            SeguridadLogger::registrar(
                'token_invalido',
                ip: $request->ip(),
                usuarioId: isset($claims['sub']) ? (int) $claims['sub'] : null
            );

            throw new ApiException(
                401,
                'AUTH_TOKEN_INVALID',
                null,
                [],
                ['WWW-Authenticate' => 'Bearer']
            );
        }

        // Inyección del usuario autenticado en el request para $request->user()
        $request->setUserResolver(fn () => $usuario);

        // Guardado de claims decodificados para acciones como logout
        $request->attributes->set('token_claims', $claims);

        return $next($request);
    }
}
