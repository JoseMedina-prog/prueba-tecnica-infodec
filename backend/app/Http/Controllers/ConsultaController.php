<?php

namespace App\Http\Controllers;

use App\Http\Requests\ConsultaRequest;
use App\Http\Resources\ConsultaResource;
use App\Services\ConsultaService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsultaController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ConsultaService $consultaService
    ) {}

    /**
     * Registra una nueva consulta turística calculando clima y conversión monetaria.
     */
    public function crear(ConsultaRequest $request): JsonResponse
    {
        $usuario = $request->user();
        $idioma = app()->getLocale();

        $data = $this->consultaService->crear(
            $usuario,
            (int) $request->validated('ciudad_id'),
            (float) $request->validated('presupuesto'),
            $idioma
        );

        return $this->successResponse($data, 201);
    }

    /**
     * Retorna las últimas 5 consultas exclusivas del usuario autenticado.
     */
    public function historial(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $consultas = $this->consultaService->historial($usuario);

        return $this->successResponse(ConsultaResource::collection($consultas));
    }
}
