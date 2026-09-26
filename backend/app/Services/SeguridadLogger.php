<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class SeguridadLogger
{
    /**
     * Enmascara una dirección de correo electrónico según OWASP.
     * Ejemplo: prueba@travelapp.test -> p***@travelapp.test
     * Ejemplo: j***@gmail.com
     */
    public static function enmascararCorreo(?string $correo): ?string
    {
        if (!$correo || !str_contains($correo, '@')) {
            return null;
        }

        $partes = explode('@', trim($correo), 2);
        $local = $partes[0];
        $dominio = $partes[1] ?? '';

        $primerCaracter = mb_substr($local, 0, 1);

        return "{$primerCaracter}***@{$dominio}";
    }

    /**
     * Registra un evento de seguridad estructurado en el canal "seguridad" en formato JSON.
     *
     * @param string $evento Nombre del evento (login_fallido, bloqueo_intentos, token_invalido, token_vencido, token_revocado_usado, reuso_refresh, limite_consumo)
     * @param string|null $traceId Identificador de traza
     * @param string|null $ip Dirección IP del cliente
     * @param int|null $usuarioId ID del usuario si se conoce
     * @param string|null $correo Correo del usuario (será enmascarado automáticamente)
     */
    public static function registrar(
        string $evento,
        ?string $traceId = null,
        ?string $ip = null,
        ?int $usuarioId = null,
        ?string $correo = null
    ): void {
        $traceId = $traceId ?: (request()?->attributes->get('trace_id') ?: (string) Str::uuid());
        $ip = $ip ?: (request()?->ip() ?: '127.0.0.1');

        $datos = [
            'evento' => $evento,
            'trace_id' => $traceId,
            'ip' => $ip,
            'fecha' => now()->toIso8601String(),
            'usuario_id' => $usuarioId,
            'correo' => self::enmascararCorreo($correo),
        ];

        // Nivel warning para bloqueo_intentos, reuso_refresh y limite_consumo; info para el resto.
        $esWarning = in_array($evento, ['bloqueo_intentos', 'reuso_refresh', 'limite_consumo'], true);

        try {
            $logger = Log::channel('seguridad');
        } catch (Throwable) {
            $logger = null;
        }

        if ($logger) {
            if ($esWarning) {
                $logger->warning($evento, $datos);
            } else {
                $logger->info($evento, $datos);
            }
        } else {
            if ($esWarning) {
                Log::warning($evento, $datos);
            } else {
                Log::info($evento, $datos);
            }
        }
    }
}
