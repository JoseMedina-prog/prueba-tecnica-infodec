<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Models\Ciudad;
use App\Services\ClimaService;
use App\Services\MonedaService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExternasController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ClimaService $climaService,
        protected MonedaService $monedaService
    ) {}

    /**
     * Consulta el clima actual para una ciudad mediante su ID.
     */
    public function clima(int $ciudadId, Request $request): JsonResponse
    {
        $ciudad = Ciudad::find($ciudadId);

        if (!$ciudad) {
            throw new ApiException(404, 'NOT_FOUND');
        }

        $idioma = app()->getLocale();
        $clima = $this->climaService->obtenerClima($ciudad, $idioma);

        return $this->successResponse($clima);
    }

    /**
     * Consulta la tasa de cambio COP -> moneda destino. Acepta solo GBP, JPY, INR o DKK.
     */
    public function tasa(string $codigoMoneda): JsonResponse
    {
        $codigoNormalizado = strtoupper(trim($codigoMoneda));
        $monedasPermitidas = ['GBP', 'JPY', 'INR', 'DKK'];

        if (!in_array($codigoNormalizado, $monedasPermitidas, true)) {
            throw new ApiException(404, 'NOT_FOUND');
        }

        $tasaData = $this->monedaService->obtenerTasa($codigoNormalizado);

        return $this->successResponse($tasaData);
    }
}
