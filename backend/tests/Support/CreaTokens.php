<?php

namespace Tests\Support;

use App\Models\Usuario;
use App\Services\TokenService;
use Firebase\JWT\JWT;
use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Str;

trait CreaTokens
{
    /**
     * Genera un token válido para el usuario.
     */
    public function crearTokenValido(Usuario $usuario, ?string $sid = null): string
    {
        $tokenService = app(TokenService::class);
        return $tokenService->emitirAccessToken($usuario, $sid ?? (string) Str::uuid());
    }

    /**
     * Genera un token ya expirado (hace 1 hora).
     */
    public function crearTokenVencido(Usuario $usuario, ?string $sid = null): string
    {
        $secretBase64 = config('token.secret');
        $secreto = base64_decode($secretBase64);
        $claveFirma = hash_hkdf('sha256', $secreto, 32, 'jwt-firma');
        $claveCifrado = hash_hkdf('sha256', $secreto, 32, 'jwt-cifrado');

        $encrypter = new Encrypter($claveCifrado, 'aes-256-gcm');

        $ahora = time();
        $payload = [
            'sub' => $usuario->id,
            'iat' => $ahora - 7200,
            'exp' => $ahora - 3600, // Expiró hace 1 hora
            'jti' => (string) Str::uuid(),
            'sid' => $sid ?? (string) Str::uuid(),
            'idioma' => $usuario->idioma,
            'iss' => config('app.url'),
            'aud' => 'travel-app',
        ];

        $jwt = JWT::encode($payload, $claveFirma, 'HS256');
        return $encrypter->encryptString($jwt);
    }

    /**
     * Genera un token firmado y cifrado con un secreto diferente.
     */
    public function crearTokenConOtroSecreto(Usuario $usuario, ?string $sid = null): string
    {
        $otroSecreto = random_bytes(32);
        $claveFirma = hash_hkdf('sha256', $otroSecreto, 32, 'jwt-firma');
        $claveCifrado = hash_hkdf('sha256', $otroSecreto, 32, 'jwt-cifrado');

        $encrypter = new Encrypter($claveCifrado, 'aes-256-gcm');

        $ahora = time();
        $payload = [
            'sub' => $usuario->id,
            'iat' => $ahora,
            'exp' => $ahora + 900,
            'jti' => (string) Str::uuid(),
            'sid' => $sid ?? (string) Str::uuid(),
            'idioma' => $usuario->idioma,
            'iss' => config('app.url'),
            'aud' => 'travel-app',
        ];

        $jwt = JWT::encode($payload, $claveFirma, 'HS256');
        return $encrypter->encryptString($jwt);
    }

    /**
     * Altera un solo carácter en la mitad del token garantizando que sea distinto
     * y mantenga un carácter base64 válido.
     */
    public function crearTokenAlteradoEnElMedio(string $token): string
    {
        $pos = intdiv(strlen($token), 2);
        $charOriginal = $token[$pos];
        $charNuevo = ($charOriginal === 'A') ? 'B' : 'A';
        $token[$pos] = $charNuevo;

        return $token;
    }

    /**
     * Genera un token con algoritmo 'none' sin firma, cifrado con la clave actual.
     */
    public function crearTokenAlgNone(Usuario $usuario, ?string $sid = null): string
    {
        $secretBase64 = config('token.secret');
        $secreto = base64_decode($secretBase64);
        $claveCifrado = hash_hkdf('sha256', $secreto, 32, 'jwt-cifrado');
        $encrypter = new Encrypter($claveCifrado, 'aes-256-gcm');

        $ahora = time();
        $header = rtrim(strtr(base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'none'])), '+/', '-_'), '=');
        $payload = [
            'sub' => $usuario->id,
            'iat' => $ahora,
            'exp' => $ahora + 900,
            'jti' => (string) Str::uuid(),
            'sid' => $sid ?? (string) Str::uuid(),
            'idioma' => $usuario->idioma,
            'iss' => config('app.url'),
            'aud' => 'travel-app',
        ];
        $payloadEnc = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
        $jwtNone = "{$header}.{$payloadEnc}.";

        return $encrypter->encryptString($jwtNone);
    }
}
