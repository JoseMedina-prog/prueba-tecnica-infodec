<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Usuario;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Servicio encargado de la lógica de autenticación y gestión de usuarios.
 */
class AuthService
{
    /**
     * Hash Bcrypt ficticio válido para mitigar ataques de temporización (timing attacks).
     */
    protected const DUMMY_HASH = '$2y$12$e8x/kM.hZp0jLkWjUeQe5eI5Lw/9mZ6U3jU4w7L8K9J0m1n2o3p4q';

    public function __construct(
        protected TokenService $tokenService
    ) {}

    /**
     * Registra un nuevo usuario en la plataforma.
     *
     * @param array $datos Datos validados del formulario de registro
     * @return Usuario
     * @throws ApiException Si el correo ya existe (409) o falla la inserción
     */
    public function registrar(array $datos): Usuario
    {
        $correo = strtolower(trim($datos['correo']));

        // Verificación previa de existencia de correo
        if (Usuario::where('correo', $correo)->exists()) {
            throw new ApiException(
                409,
                'USER_ALREADY_EXISTS',
                'El correo electrónico ya se encuentra registrado.'
            );
        }

        try {
            // Se genera el hash de la contraseña usando el algoritmo seguro por defecto (Bcrypt)
            return Usuario::create([
                'nombre' => trim($datos['nombre']),
                'correo' => $correo,
                'password_hash' => Hash::make($datos['password']),
                'idioma' => $datos['idioma'] ?? 'es',
            ]);
        } catch (QueryException $e) {
            // Manejo de condición de carrera / colisión concurrente (código 23505 en PostgreSQL)
            if ($e->getCode() === '23505' || str_contains($e->getMessage(), 'usuarios_correo_unique')) {
                throw new ApiException(
                    409,
                    'USER_ALREADY_EXISTS',
                    'El correo electrónico ya se encuentra registrado.'
                );
            }

            throw $e;
        }
    }

    /**
     * Autentica a un usuario y emite tokens de acceso y refresco.
     *
     * @param string $correo
     * @param string $password
     * @param string $ip
     * @return array Datos de autenticación y tokens
     * @throws ApiException Si supera el límite de intentos (429) o credenciales inválidas (401)
     */
    public function login(string $correo, string $password, string $ip): array
    {
        $correoNormalizado = strtolower(trim($correo));
        $throttleKey = "login:{$correoNormalizado}|{$ip}";

        // 1. Límite de intentos: 5 fallos por minuto antes de verificar contraseña
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $segundos = RateLimiter::availableIn($throttleKey);
            throw new ApiException(
                429,
                'TOO_MANY_ATTEMPTS',
                'Demasiados intentos de inicio de sesión. Por favor intente más tarde.',
                [],
                ['Retry-After' => (string) $segundos]
            );
        }

        // 2. Búsqueda de usuario
        $usuario = Usuario::where('correo', $correoNormalizado)->first();

        // 3. Verificación de contraseña con mitigación de timing attack si el usuario no existe
        if (!$usuario) {
            Hash::check($password, self::DUMMY_HASH);
            RateLimiter::hit($throttleKey, 60);

            throw new ApiException(
                401,
                'AUTH_INVALID_CREDENTIALS',
                'Correo o contraseña inválidos.'
            );
        }

        if (!Hash::check($password, $usuario->password_hash)) {
            RateLimiter::hit($throttleKey, 60);

            throw new ApiException(
                401,
                'AUTH_INVALID_CREDENTIALS',
                'Correo o contraseña inválidos.'
            );
        }

        // 4. Credenciales correctas: limpiar intentos fallidos
        RateLimiter::clear($throttleKey);

        // 5. Emisión de tokens de acceso y refresco
        $accessToken = $this->tokenService->emitirAccessToken($usuario);
        $refreshToken = $this->tokenService->emitirRefreshToken($usuario);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => $this->tokenService->getExpiresInSeconds(),
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'correo' => $usuario->correo,
                'idioma' => $usuario->idioma,
            ],
        ];
    }
}
