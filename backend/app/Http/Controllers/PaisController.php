<?php

namespace App\Http\Controllers;

use App\Http\Resources\CiudadResource;
use App\Http\Resources\PaisResource;
use App\Services\PaisService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class PaisController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PaisService $paisService
    ) {}

    /**
     * Retorna la lista de países ordenados por nombre con su moneda oficial asociada.
     */
    public function index(): JsonResponse
    {
        $paises = $this->paisService->listar();

        return $this->successResponse(PaisResource::collection($paises));
    }

    /**
     * Retorna la lista de ciudades de un país específico ordenadas por nombre.
     */
    public function ciudades(int $id): JsonResponse
    {
        $ciudades = $this->paisService->ciudadesDe($id);

        return $this->successResponse(CiudadResource::collection($ciudades));
    }
}
