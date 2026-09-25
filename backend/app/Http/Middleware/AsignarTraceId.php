<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AsignarTraceId
{
    /**
     * Asigna un identificador único trace_id por petición, valida la sintaxis JSON
     * y asegura que todas las respuestas incluyan la cabecera X-Trace-Id.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $traceId = (string) Str::uuid();
        $request->attributes->set('trace_id', $traceId);
        Log::withContext(['trace_id' => $traceId]);

        // Validación de JSON mal formado cuando la petición declara ser JSON y trae contenido
        if ($request->isJson() && $request->getContent() !== '') {
            json_decode($request->getContent());
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new ApiException(400, 'BAD_REQUEST');
            }
        }

        $response = $next($request);
        $response->headers->set('X-Trace-Id', $traceId);

        return $response;
    }
}
