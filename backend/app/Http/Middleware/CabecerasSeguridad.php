<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CabecerasSeguridad
{
    /**
     * Aplica cabeceras de seguridad estrictas según OWASP y buenas prácticas web.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Remover X-Powered-By
        if (function_exists('header_remove')) {
            header_remove('X-Powered-By');
        }
        $response->headers->remove('X-Powered-By');

        // Cabeceras de seguridad estándar OWASP
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'no-referrer');
        $response->headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Cache-Control: no-store en rutas de autenticación
        if ($request->is('api/auth/*') || $request->is('auth/*')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
        }

        // Strict-Transport-Security solo si la conexión es HTTPS
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
