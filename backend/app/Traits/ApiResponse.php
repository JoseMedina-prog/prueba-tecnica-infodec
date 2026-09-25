<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Trait para estandarizar las respuestas JSON de la API.
 */
trait ApiResponse
{
    /**
     * Retorna una respuesta exitosa con estructura { success: true, data: { ... } }
     */
    protected function successResponse(mixed $data = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
        ], $status);
    }
}
