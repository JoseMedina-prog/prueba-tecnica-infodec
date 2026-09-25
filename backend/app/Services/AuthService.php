<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\RefreshToken;
use App\Models\TokenRevocado;
use App\Models\Usuario;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * Servicio encargado de la lógica de autenticación, gestión de sesiones y ciclo de vida de tokens.
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
            throw new ApiException(409, 'USER_ALREADY_EXISTS');
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
                throw new ApiException(409, 'USER_ALREADY_EXISTS');
            }

            throw $e;
        }
    }

    /**
     * Autentica a un usuario y emite tokens de acceso y refresco vinculados por familia de sesión.
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
                null,
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

            throw new ApiException(401, 'AUTH_INVALID_CREDENTIALS');
        }

        if (!Hash::check($password, $usuario->password_hash)) {
            RateLimiter::hit($throttleKey, 60);

            throw new ApiException(401, 'AUTH_INVALID_CREDENTIALS');
        }

        // 4. Credenciales correctas: limpiar intentos fallidos
        RateLimiter::clear($throttleKey);

        // 5. Emisión de tokens: se genera primero familia_id (sid) para asociar unívocamente ambos tokens
        // Para qué sirve el sid: Vincula el access token con su familia de refresh tokens,
        // permitiendo que el logout revoque solo esa sesión sin cerrar sesiones en otros dispositivos.
        $familiaId = (string) Str::uuid();
        $refreshToken = $this->tokenService->emitirRefreshToken($usuario, $familiaId);
        $accessToken = $this->tokenService->emitirAccessToken($usuario, $familiaId);

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

    /**
     * Renueva un par de tokens (access token y refresh token) aplicando rotación estricta y detección de reuso.
     *
     * @param string $refreshPlano Token de refresco recibido del cliente en texto plano
     * @param string $ip Dirección IP del cliente para control de tasa (rate limiting)
     * @return array Nuevo par de tokens y datos de usuario
     * @throws ApiException Si el token es inválido, vencido, revocado o reusado
     */
    public function refrescar(string $refreshPlano, string $ip): array
    {
        // Rate limiting por IP: máximo 10 peticiones de refresco por minuto
        $throttleKey = "refresh:{$ip}";
        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            $segundos = RateLimiter::availableIn($throttleKey);
            throw new ApiException(
                429,
                'TOO_MANY_ATTEMPTS',
                'Demasiados intentos de renovación. Por favor intente más tarde.',
                [],
                ['Retry-After' => (string) $segundos]
            );
        }

        RateLimiter::hit($throttleKey, 60);

        DB::beginTransaction();

        try {
            $tokenHash = hash('sha256', $refreshPlano);

            // Por qué lockForUpdate: Bloquea la fila del refresh token en la base de datos a nivel de transacción
            // para evitar condiciones de carrera si dos peticiones simultáneas intentan usar el mismo token al mismo milisegundo.
            $rt = RefreshToken::where('token_hash', $tokenHash)->lockForUpdate()->first();

            // a y b. No existe el hash
            if (!$rt) {
                DB::rollBack();
                throw new ApiException(401, 'AUTH_TOKEN_INVALID');
            }

            // c. Verificar si ya fue revocado (por ejemplo por un logout de esa sesión)
            // Este paso va ANTES de la detección de reuso para no invalidar todas las sesiones
            // si el usuario simplemente presentó un token que ya había sido cerrado legítimamente.
            if ($rt->revocado_en !== null) {
                DB::rollBack();
                throw new ApiException(401, 'AUTH_TOKEN_REVOKED');
            }

            // d. Detección de reuso de token:
            // Si un refresh token que ya tiene 'usado_en' se vuelve a presentar, indica que hubo una interceptación
            // o duplicación del token (un atacante o un cliente desfasado). Para proteger la cuenta,
            // se invalidan de inmediato TODAS las sesiones activas del usuario y se persiste en BD.
            if ($rt->usado_en !== null) {
                RefreshToken::where('usuario_id', $rt->usuario_id)
                    ->whereNull('revocado_en')
                    ->update(['revocado_en' => Carbon::now()]);

                // Registro seguro en auditoría: nunca se loguea el token plano
                Log::warning("Reuso de refresh token detectado para usuario ID: {$rt->usuario_id}, familia ID: {$rt->familia_id}", [
                    'usuario_id' => $rt->usuario_id,
                    'familia_id' => $rt->familia_id,
                ]);

                DB::commit();

                throw new ApiException(401, 'AUTH_TOKEN_REVOKED', 'AUTH_TOKEN_REUSED');
            }

            // e. Verificar fecha de expiración
            if (Carbon::parse($rt->expira_en)->isPast()) {
                DB::rollBack();
                throw new ApiException(401, 'AUTH_TOKEN_EXPIRED');
            }

            // f. Rotación de refresh tokens:
            // Marcamos el token actual como usado para que nunca vuelva a ser válido,
            // y emitimos un par nuevo (access + refresh) bajo la MISMA familia_id.
            $rt->usado_en = Carbon::now();
            $rt->save();

            $usuario = $rt->usuario;
            if (!$usuario) {
                DB::rollBack();
                throw new ApiException(401, 'AUTH_TOKEN_INVALID');
            }

            $nuevoRefreshToken = $this->tokenService->emitirRefreshToken($usuario, $rt->familia_id);
            $nuevoAccessToken = $this->tokenService->emitirAccessToken($usuario, $rt->familia_id);

            DB::commit();

            return [
                'access_token' => $nuevoAccessToken,
                'refresh_token' => $nuevoRefreshToken,
                'token_type' => 'Bearer',
                'expires_in' => $this->tokenService->getExpiresInSeconds(),
                'usuario' => [
                    'id' => $usuario->id,
                    'nombre' => $usuario->nombre,
                    'correo' => $usuario->correo,
                    'idioma' => $usuario->idioma,
                ],
            ];
        } catch (ApiException $e) {
            throw $e;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cierra la sesión revocando el access token actual en la blacklist y los refresh tokens de su familia.
     *
     * @param Usuario $usuario Usuario autenticado
     * @param array $claims Claims del access token decodificados por el middleware
     * @return void
     */
    public function logout(Usuario $usuario, array $claims): void
    {
        DB::transaction(function () use ($usuario, $claims) {
            $jti = $claims['jti'];
            $exp = $claims['exp'];
            $sid = $claims['sid'];

            // 1. Blacklist del access token actual hasta su expiración natural
            TokenRevocado::firstOrCreate(
                ['jti' => $jti],
                [
                    'usuario_id' => $usuario->id,
                    'expira_en' => Carbon::createFromTimestamp($exp),
                ]
            );

            // 2. Revocación de todos los refresh tokens activos de esa familia (sesión actual)
            RefreshToken::where('familia_id', $sid)
                ->whereNull('revocado_en')
                ->update(['revocado_en' => Carbon::now()]);
        });
    }
}
