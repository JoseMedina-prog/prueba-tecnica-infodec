<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Ciudad;
use App\Models\Consulta;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Collection;

class ConsultaService
{
    public function __construct(
        protected ClimaService $climaService,
        protected MonedaService $monedaService
    ) {}

    /**
     * Procesa una consulta de viaje integrando clima y conversión de divisa.
     *
     * @param Usuario $usuario Usuario autenticado que realiza la consulta
     * @param int $ciudadId ID de la ciudad destino
     * @param float $presupuesto Presupuesto en COP
     * @param string $idioma Idioma para traducciones ('es' o 'de')
     * @return array Datos formateados de la consulta creada
     * @throws ApiException Si ambas APIs externas fallan simultáneamente
     */
    public function crear(Usuario $usuario, int $ciudadId, float $presupuesto, string $idioma = 'es'): array
    {
        // 1. Cargar la ciudad con país y moneda asociada en una sola consulta para evitar N+1
        $ciudad = Ciudad::with('pais.moneda')->find($ciudadId);
        if (!$ciudad) {
            throw new ApiException(422, 'VALIDATION_ERROR');
        }

        $pais = $ciudad->pais;
        $moneda = $pais->moneda;

        $climaData = null;
        $tasaData = null;
        $valorConvertido = null;
        $avisos = [];
        $errorClima = null;
        $errorMoneda = null;

        // 2. Consulta de clima:
        // Si la API falla (ApiException 502/504), no se cancela la operación global.
        // Se tolera el fallo dejando clima en null y agregando el aviso CLIMA_NO_DISPONIBLE.
        try {
            $climaData = $this->climaService->obtenerClima($ciudad, $idioma);
        } catch (ApiException $e) {
            $errorClima = $e;
            $avisos[] = [
                'code' => 'CLIMA_NO_DISPONIBLE',
                'message' => __('api.CLIMA_NO_DISPONIBLE'),
            ];
        }

        // 3. Consulta de moneda:
        // Si la API de cambio falla pero hay tasa histórica en BD, se usa como respaldo (fuente 'respaldo').
        // Si falla y no existe respaldo (ApiException 502/504), se tolera dejando conversion en null
        // y agregando el aviso CONVERSION_NO_DISPONIBLE.
        try {
            $tasaData = $this->monedaService->obtenerTasa($moneda->codigo);
            $valorConvertido = $this->monedaService->convertir($presupuesto, (float) $tasaData['tasa']);
        } catch (ApiException $e) {
            $errorMoneda = $e;
            $avisos[] = [
                'code' => 'CONVERSION_NO_DISPONIBLE',
                'message' => __('api.CONVERSION_NO_DISPONIBLE'),
            ];
        }

        // 4. Fallo catastrófico de ambas APIs:
        // Si fallan tanto clima como moneda (sin respaldo), se relanza la excepción de la moneda
        // (502 o 504) y NO se persiste ningún registro en la base de datos.
        if ($errorClima !== null && $errorMoneda !== null) {
            throw $errorMoneda;
        }

        // 5. Persistencia de la consulta:
        // Se asocia siempre al usuario autenticado (del token), nunca a un parámetro de la petición.
        $consulta = Consulta::create([
            'usuario_id' => $usuario->id,
            'ciudad_id' => $ciudad->id,
            'presupuesto_cop' => $presupuesto,
            'clima_temperatura' => $climaData ? $climaData['temperatura'] : null,
            'clima_descripcion' => $climaData ? $climaData['descripcion'] : null,
            'tasa' => $tasaData ? $tasaData['tasa'] : null,
            'valor_convertido' => $valorConvertido,
            'fecha_tasa' => $tasaData ? $tasaData['fecha_tasa'] : null,
        ]);

        // Traducción de nombres geográficos según el idioma activo
        $traducidoPais = __("lugares.paises.{$pais->codigo}");
        $nombrePais = ($traducidoPais !== "lugares.paises.{$pais->codigo}") ? $traducidoPais : $pais->nombre;

        $traducidoCiudad = __("lugares.ciudades.{$ciudad->nombre}");
        $nombreCiudad = ($traducidoCiudad !== "lugares.ciudades.{$ciudad->nombre}") ? $traducidoCiudad : $ciudad->nombre;

        $traducidoMoneda = __("lugares.monedas.{$moneda->codigo}");
        $nombreMoneda = ($traducidoMoneda !== "lugares.monedas.{$moneda->codigo}") ? $traducidoMoneda : $moneda->nombre;

        return [
            'id' => $consulta->id,
            'fecha' => $consulta->created_at?->toIso8601String(),
            'pais' => [
                'id' => $pais->id,
                'codigo' => $pais->codigo,
                'nombre' => $nombrePais,
            ],
            'ciudad' => [
                'id' => $ciudad->id,
                'nombre' => $nombreCiudad,
            ],
            'presupuesto_cop' => (float) $consulta->presupuesto_cop,
            'clima' => $climaData ? [
                'temperatura' => (float) $climaData['temperatura'],
                'descripcion' => (string) $climaData['descripcion'],
                'icono' => (string) $climaData['icono'],
            ] : null,
            'moneda' => [
                'codigo' => $moneda->codigo,
                'nombre' => $nombreMoneda,
                'simbolo' => $moneda->simbolo,
            ],
            'conversion' => $tasaData ? [
                'valor' => (float) $valorConvertido,
                'tasa' => (float) $tasaData['tasa'],
                'fecha_tasa' => is_string($tasaData['fecha_tasa']) ? $tasaData['fecha_tasa'] : $tasaData['fecha_tasa']->toIso8601String(),
                'fuente' => (string) $tasaData['fuente'],
            ] : null,
            'avisos' => $avisos,
        ];
    }

    /**
     * Obtiene las últimas 5 consultas exclusivas del usuario autenticado,
     * precargando ciudad, país y moneda para evitar consultas N+1.
     *
     * @param Usuario $usuario Usuario autenticado
     * @return Collection<int, Consulta>
     */
    public function historial(Usuario $usuario): Collection
    {
        return Consulta::with('ciudad.pais.moneda')
            ->where('usuario_id', $usuario->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get();
    }
}
