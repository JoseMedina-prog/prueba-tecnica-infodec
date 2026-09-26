<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class LimitarTamanoCuerpo
{
    /**
     * Límite máximo en bytes (16 KB = 16384 bytes).
     */
    protected const MAX_BYTES = 16384;

    /**
     * Rechaza con 413 PAYLOAD_TOO_LARGE cualquier petición cuyo cuerpo supere 16 KB.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $contentLength = (int) $request->server('CONTENT_LENGTH', 0);
        $bodyLength = strlen($request->getContent());

        if ($contentLength > self::MAX_BYTES || $bodyLength > self::MAX_BYTES) {
            $traceId = $request->attributes->get('trace_id') ?? (string) Str::uuid();

            // Sincronizar idioma con Accept-Language
            $acceptLanguage = $request->header('Accept-Language', '');
            if (str_starts_with(strtolower(trim($acceptLanguage)), 'de')) {
                \Illuminate\Support\Facades\App::setLocale('de');
            } else {
                \Illuminate\Support\Facades\App::setLocale('es');
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'PAYLOAD_TOO_LARGE',
                    'message' => __('api.PAYLOAD_TOO_LARGE'),
                ],
                'trace_id' => $traceId,
            ], 413, [
                'X-Trace-Id' => $traceId,
            ]);
        }

        return $next($request);
    }
}
