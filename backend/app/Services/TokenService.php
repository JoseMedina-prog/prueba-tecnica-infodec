<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\RefreshToken;
use App\Models\Usuario;
use DomainException;
use Firebase\JWT\BeforeValidException;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\SignatureInvalidException;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;
use Throwable;
use UnexpectedValueException;

/**
 * Servicio de emisión, cifrado, firma y validación de tokens de acceso y refresco.
 */
class TokenService
{
    protected string $claveFirma;
    protected string $claveCifrado;
    protected int $accessTtl;
    protected int $refreshTtl;
    protected Encrypter $encrypter;

    public function __construct()
    {
        $secretBase64 = config('token.secret');
        $secreto = is_string($secretBase64) ? base64_decode($secretBase64, true) : false;

        if ($secreto === false || strlen($secreto) !== 32) {
            throw new RuntimeException('Configuración inválida: APP_TOKEN_SECRET debe decodificar en base64 a exactamente 32 bytes.');
        }

        // Derivación de claves independientes mediante HKDF (RFC 5869)
        $this->claveFirma = hash_hkdf('sha256', $secreto, 32, 'jwt-firma');
        $this->claveCifrado = hash_hkdf('sha256', $secreto, 32, 'jwt-cifrado');

        $this->accessTtl = (int) config('token.access_ttl', 15);
        $this->refreshTtl = (int) config('token.refresh_ttl', 7);

        $this->encrypter = new Encrypter($this->claveCifrado, 'aes-256-gcm');
    }

    /**
     * Emite un token de acceso firmado con HS256 y cifrado con AES-256-GCM.
     *
     * Incluye el claim 'sid' (Session ID / familia_id) para asociar el access token
     * a su familia de refresh tokens y permitir la revocación granular por sesión en el logout.
     */
    public function emitirAccessToken(Usuario $usuario, ?string $familiaId = null): string
    {
        $ahora = time();
        $familia = $familiaId ?? (string) Str::uuid();

        $payload = [
            'sub' => $usuario->id,
            'iat' => $ahora,
            'exp' => $ahora + ($this->accessTtl * 60),
            'jti' => (string) Str::uuid(),
            'sid' => $familia, // Vinculación unívoca con la familia de refresh tokens de esta sesión
            'idioma' => $usuario->idioma,
            'iss' => config('app.url'),
            'aud' => 'travel-app',
        ];

        // 1. Firmar el payload con HS256
        $jwt = JWT::encode($payload, $this->claveFirma, 'HS256');

        // 2. Cifrar el JWT con AES-256-GCM
        return $this->encrypter->encryptString($jwt);
    }

    /**
     * Valida y descifra un access token, devolviendo sus claims.
     *
     * @param string $token Token cifrado
     * @return array Claims validados
     * @throws ApiException Si el token es inválido o ha expirado
     */
    public function validarAccessToken(string $token): array
    {
        // 1. Descifrar con el Encrypter (AES-256-GCM)
        try {
            $jwt = $this->encrypter->decryptString($token);
        } catch (DecryptException $e) {
            throw new ApiException(
                401,
                'AUTH_TOKEN_INVALID',
                'El token de autenticación es inválido o ha sido alterado.'
            );
        }

        // 2. Decodificar y verificar la firma fija HS256 (rechaza alg none y algoritmos inesperados)
        JWT::$leeway = 0;

        try {
            $decoded = JWT::decode($jwt, new Key($this->claveFirma, 'HS256'));
        } catch (ExpiredException $e) {
            throw new ApiException(
                401,
                'AUTH_TOKEN_EXPIRED',
                'El token de acceso ha expirado.'
            );
        } catch (SignatureInvalidException | BeforeValidException | UnexpectedValueException | DomainException | InvalidArgumentException | Throwable $e) {
            throw new ApiException(
                401,
                'AUTH_TOKEN_INVALID',
                'El token de autenticación es inválido o ha sido alterado.'
            );
        }

        $claims = (array) $decoded;

        // 3. Validar iss, aud y presencia obligatoria de sid (identificador de sesión)
        $esperadoIss = config('app.url');
        $esperadoAud = 'travel-app';

        if (($claims['iss'] ?? null) !== $esperadoIss || ($claims['aud'] ?? null) !== $esperadoAud) {
            throw new ApiException(
                401,
                'AUTH_TOKEN_INVALID',
                'El token de autenticación es inválido o no corresponde a esta aplicación.'
            );
        }

        if (empty($claims['sid']) || !is_string($claims['sid'])) {
            throw new ApiException(
                401,
                'AUTH_TOKEN_INVALID',
                'El token de autenticación es inválido o carece de identificador de sesión.'
            );
        }

        return $claims;
    }

    /**
     * Emite un token de refresco plano y almacena su hash SHA-256 en la base de datos.
     *
     * @param Usuario $usuario
     * @param string|null $familiaId
     * @return string Token plano generado
     */
    public function emitirRefreshToken(Usuario $usuario, ?string $familiaId = null): string
    {
        $tokenPlano = bin2hex(random_bytes(32));
        $familia = $familiaId ?? (string) Str::uuid();
        $expiraEn = Carbon::now()->addDays($this->refreshTtl);

        RefreshToken::create([
            'usuario_id' => $usuario->id,
            'token_hash' => hash('sha256', $tokenPlano),
            'familia_id' => $familia,
            'expira_en' => $expiraEn,
        ]);

        return $tokenPlano;
    }

    /**
     * Retorna el tiempo de vida en segundos del token de acceso (para expires_in).
     */
    public function getExpiresInSeconds(): int
    {
        return $this->accessTtl * 60;
    }
}
