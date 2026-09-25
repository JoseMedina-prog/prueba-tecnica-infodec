<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\TasaCambio;
use Carbon\Carbon;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class MonedaService
{
    /**
     * Consulta la tasa de cambio COP -> destino, la almacena en base de datos
     * y utiliza la última tasa guardada como respaldo en caso de fallo externo.
     *
     * @param string $destino Código ISO de la moneda destino (GBP, JPY, INR, DKK)
     * @return array ['tasa' => float, 'fecha_tasa' => string, 'fuente' => 'api'|'respaldo']
     * @throws ApiException 504 EXTERNAL_API_TIMEOUT o 502 EXTERNAL_API_ERROR si falla y no hay respaldo
     */
    public function obtenerTasa(string $destino): array
    {
        $destino = strtoupper(trim($destino));
        $baseUrl = rtrim(config('services.exchange.base_url', 'https://v6.exchangerate-api.com/v6'), '/');
        $apiKey = config('services.exchange.key');
        $timeout = (float) config('services.exchange.timeout', 5.0);

        $esErrorConexion = false;
        $falloApi = false;
        $data = null;

        try {
            // Nota de seguridad: La URL contiene la clave en el path. NUNCA loguear la URL ni la excepción cruda.
            $response = Http::timeout($timeout)
                ->acceptJson()
                ->get("{$baseUrl}/{$apiKey}/pair/COP/{$destino}");

            if (!$response->successful()) {
                $falloApi = true;
                Log::warning('Respuesta no exitosa de API de tipo de cambio', [
                    'servicio' => 'ExchangeRate-API',
                    'moneda_destino' => $destino,
                    'http_status' => $response->status(),
                ]);
            } else {
                $data = $response->json();
                if (
                    !is_array($data) ||
                    ($data['result'] ?? '') !== 'success' ||
                    !isset($data['conversion_rate']) ||
                    !is_numeric($data['conversion_rate']) ||
                    $data['conversion_rate'] <= 0
                ) {
                    $falloApi = true;
                    Log::warning('Estructura de respuesta inválida en API de tipo de cambio', [
                        'servicio' => 'ExchangeRate-API',
                        'moneda_destino' => $destino,
                    ]);
                }
            }
        } catch (ConnectionException $e) {
            $esErrorConexion = true;
            $falloApi = true;
            Log::warning('Fallo de conexión o timeout al consultar API de tipo de cambio', [
                'servicio' => 'ExchangeRate-API',
                'moneda_destino' => $destino,
                'tipo_error' => 'ConnectionException/Timeout',
            ]);
        } catch (Throwable $e) {
            $falloApi = true;
            Log::warning('Excepción al consultar API de tipo de cambio', [
                'servicio' => 'ExchangeRate-API',
                'moneda_destino' => $destino,
                'tipo_error' => get_class($e),
            ]);
        }

        // Si la llamada a la API fue exitosa y los datos son válidos
        if (!$falloApi && is_array($data)) {
            $tasa = (float) $data['conversion_rate'];
            $fechaUnix = isset($data['time_last_update_unix']) ? (int) $data['time_last_update_unix'] : time();
            $fechaTasa = Carbon::createFromTimestamp($fechaUnix);

            $registro = TasaCambio::updateOrCreate(
                [
                    'moneda_origen' => 'COP',
                    'moneda_destino' => $destino,
                    'fecha_tasa' => $fechaTasa,
                ],
                [
                    'tasa' => $tasa,
                ]
            );

            return [
                'tasa' => (float) $registro->tasa,
                'fecha_tasa' => $registro->fecha_tasa->toIso8601String(),
                'fuente' => 'api',
            ];
        }

        // Si la API falló: buscar la ÚLTIMA tasa guardada de ese par como respaldo
        $respaldo = TasaCambio::where('moneda_origen', 'COP')
            ->where('moneda_destino', $destino)
            ->latest('fecha_tasa')
            ->first();

        if ($respaldo) {
            Log::warning("Fallo en API externa de cambio. Utilizando tasa de respaldo histórica para par COP-{$destino}.", [
                'moneda_destino' => $destino,
                'fuente' => 'respaldo',
            ]);

            return [
                'tasa' => (float) $respaldo->tasa,
                'fecha_tasa' => $respaldo->fecha_tasa->toIso8601String(),
                'fuente' => 'respaldo',
            ];
        }

        // Si no hay ninguna tasa guardada de respaldo, lanzar el error correspondiente
        if ($esErrorConexion) {
            throw new ApiException(504, 'EXTERNAL_API_TIMEOUT');
        }

        throw new ApiException(502, 'EXTERNAL_API_ERROR');
    }

    /**
     * Convierte un monto en COP a la moneda destino multiplicando por la tasa
     * y redondeando el resultado a 2 decimales.
     *
     * @param float $presupuestoCop Monto en pesos colombianos
     * @param float $tasa Tasa de cambio COP -> destino
     * @return float Monto convertido redondeado a 2 decimales
     */
    public function convertir(float $presupuestoCop, float $tasa): float
    {
        return round($presupuestoCop * $tasa, 2);
    }
}
