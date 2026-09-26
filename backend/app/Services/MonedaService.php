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
     * Tasa de cambio COP -> destino, con caché y respaldo en tasas_cambio:
     * 1. Si la última tasa guardada del par es del día actual (UTC) o se obtuvo hace menos de
     *    `services.exchange.cache_horas` → se devuelve sin llamar a la API (fuente "cache").
     *    ExchangeRate-API actualiza sus tasas una vez al día, así que no hace falta pedirla en cada consulta.
     * 2. Si no, se llama a la API, se guarda y se devuelve (fuente "api").
     * 3. Si la API falla, se usa la última tasa guardada (fuente "respaldo").
     * 4. Si no hay ninguna guardada, 502/504.
     *
     * @param string $destino Código ISO de la moneda destino (GBP, JPY, INR, DKK)
     * @return array{tasa: float, fecha_tasa: string, fuente: string}
     * @throws ApiException 504 EXTERNAL_API_TIMEOUT o 502 EXTERNAL_API_ERROR si falla y no hay respaldo
     */
    public function obtenerTasa(string $destino): array
    {
        $destino = strtoupper(trim($destino));
        $ultima = $this->ultimaGuardada($destino);

        if ($ultima && $this->sigueVigente($ultima)) {
            return $this->formatear($ultima, 'cache');
        }

        try {
            return $this->actualizarTasa($destino);
        } catch (ApiException $e) {
            if ($ultima) {
                Log::warning("Fallo en API externa de cambio. Utilizando tasa de respaldo histórica para par COP-{$destino}.", [
                    'moneda_destino' => $destino,
                    'fuente' => 'respaldo',
                ]);

                return $this->formatear($ultima, 'respaldo');
            }

            throw $e;
        }
    }

    /**
     * Pide la tasa a la API SIN mirar la caché y la guarda (fuente "api").
     * La usa obtenerTasa cuando la caché venció y el comando externos:actualizar.
     *
     * @throws ApiException 504 EXTERNAL_API_TIMEOUT o 502 EXTERNAL_API_ERROR
     */
    public function actualizarTasa(string $destino): array
    {
        $destino = strtoupper(trim($destino));
        $baseUrl = rtrim(config('services.exchange.base_url', 'https://v6.exchangerate-api.com/v6'), '/');
        $apiKey = config('services.exchange.key');
        $timeout = (float) config('services.exchange.timeout', 5.0);

        try {
            // Nota de seguridad: La URL contiene la clave en el path. NUNCA loguear la URL ni la excepción cruda.
            $response = Http::timeout($timeout)
                ->acceptJson()
                ->get("{$baseUrl}/{$apiKey}/pair/COP/{$destino}");
        } catch (ConnectionException $e) {
            Log::warning('Fallo de conexión o timeout al consultar API de tipo de cambio', [
                'servicio' => 'ExchangeRate-API',
                'moneda_destino' => $destino,
                'tipo_error' => 'ConnectionException/Timeout',
            ]);

            throw new ApiException(504, 'EXTERNAL_API_TIMEOUT');
        } catch (Throwable $e) {
            Log::warning('Excepción al consultar API de tipo de cambio', [
                'servicio' => 'ExchangeRate-API',
                'moneda_destino' => $destino,
                'tipo_error' => get_class($e),
            ]);

            throw new ApiException(502, 'EXTERNAL_API_ERROR');
        }

        if (!$response->successful()) {
            Log::warning('Respuesta no exitosa de API de tipo de cambio', [
                'servicio' => 'ExchangeRate-API',
                'moneda_destino' => $destino,
                'http_status' => $response->status(),
            ]);

            throw new ApiException(502, 'EXTERNAL_API_ERROR');
        }

        $data = $response->json();
        if (
            !is_array($data) ||
            ($data['result'] ?? '') !== 'success' ||
            !isset($data['conversion_rate']) ||
            !is_numeric($data['conversion_rate']) ||
            $data['conversion_rate'] <= 0
        ) {
            Log::warning('Estructura de respuesta inválida en API de tipo de cambio', [
                'servicio' => 'ExchangeRate-API',
                'moneda_destino' => $destino,
            ]);

            throw new ApiException(502, 'EXTERNAL_API_ERROR');
        }

        $fechaUnix = isset($data['time_last_update_unix']) ? (int) $data['time_last_update_unix'] : time();

        $registro = TasaCambio::updateOrCreate(
            [
                'moneda_origen' => 'COP',
                'moneda_destino' => $destino,
                'fecha_tasa' => Carbon::createFromTimestamp($fechaUnix),
            ],
            [
                'tasa' => (float) $data['conversion_rate'],
            ]
        );

        // Si la API devolvió la misma tasa ya guardada, updateOrCreate no toca updated_at:
        // se marca igual para que la caché cuente desde esta consulta a la API.
        if (!$registro->wasRecentlyCreated && !$registro->wasChanged()) {
            $registro->touch();
        }

        return $this->formatear($registro, 'api');
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

    private function ultimaGuardada(string $destino): ?TasaCambio
    {
        return TasaCambio::where('moneda_origen', 'COP')
            ->where('moneda_destino', $destino)
            ->latest('fecha_tasa')
            ->latest('updated_at')
            ->first();
    }

    /** Tasa del día actual (UTC) u obtenida de la API hace menos de cache_horas. */
    private function sigueVigente(TasaCambio $tasa): bool
    {
        $delDia = $tasa->fecha_tasa->copy()->utc()->isSameDay(now()->utc());
        $reciente = $tasa->updated_at !== null
            && $tasa->updated_at->gt(now()->subHours((int) config('services.exchange.cache_horas', 6)));

        return $delDia || $reciente;
    }

    /**
     * @return array{tasa: float, fecha_tasa: string, fuente: string}
     */
    private function formatear(TasaCambio $tasa, string $fuente): array
    {
        return [
            'tasa' => (float) $tasa->tasa,
            'fecha_tasa' => $tasa->fecha_tasa->toIso8601String(),
            'fuente' => $fuente,
        ];
    }
}
