<?php

namespace App\Http\Controllers;

use App\Http\Resources\SalidaResource;
use App\Services\PaisService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Tablero de salidas de la pantalla de login. Endpoint público de solo lectura:
 * no requiere token porque se muestra antes de iniciar sesión y sus datos no son sensibles.
 */
class SalidaController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PaisService $paisService
    ) {}

    /**
     * Retorna las ciudades destino con su código IATA y los nombres traducidos.
     */
    public function index(): JsonResponse
    {
        return $this->successResponse(SalidaResource::collection($this->paisService->salidas()));
    }
}
