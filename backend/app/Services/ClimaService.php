<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Ciudad;
use App\Models\Clima;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ClimaService
{
    /**
     * Clima actual de una ciudad, con caché y respaldo en la tabla climas:
     * 1. Guardado hace menos de `services.weather.cache_minutos` → se devuelve sin llamar a la API (fuente "cache").
     * 2. Si no, se llama a OpenWeatherMap, se guarda y se devuelve (fuente "api").
     * 3. Si la API falla y hay uno guardado hace menos de `services.weather.respaldo_horas` → fuente "respaldo".
     * 4. Si no hay nada utilizable, se relanza el 502/504 de la API.
     *
     * @param Ciudad $ciudad Ciudad a consultar (con latitud y longitud)
     * @param string $idioma Idioma para la descripción ('es' o 'de')
     * @return array{temperatura: float, descripcion: string, icono: string, obtenido_en: string, fuente: string}
     * @throws ApiException 504 EXTERNAL_API_TIMEOUT o 502 EXTERNAL_API_ERROR si falla y no hay respaldo
     */
    public function obtenerClima(Ciudad $ciudad, string $idioma = 'es'): array
    {
        $lang = $this->normalizarIdioma($idioma);
        $guardado = Clima::where('ciudad_id', $ciudad->id)->where('idioma', $lang)->first();

        $cacheMinutos = (int) config('services.weather.cache_minutos', 30);
        if ($guardado && $guardado->obtenido_en->gt(now()->subMinutes($cacheMinutos))) {
            return $this->formatear($guardado, 'cache');
        }

        try {
            return $this->actualizar($ciudad, $lang);
        } catch (ApiException $e) {
            $respaldoHoras = (int) config('services.weather.respaldo_horas', 24);
            if ($guardado && $guardado->obtenido_en->gt(now()->subHours($respaldoHoras))) {
                // Sin URL ni clave: solo qué se usó y de cuándo es
                Log::warning('Fallo en API externa de clima. Se usa el último clima guardado como respaldo.', [
                    'servicio' => 'OpenWeatherMap',
                    'ciudad_id' => $ciudad->id,
                    'idioma' => $lang,
                    'obtenido_en' => $guardado->obtenido_en->toIso8601String(),
                    'fuente' => 'respaldo',
                ]);

                return $this->formatear($guardado, 'respaldo');
            }

            throw $e;
        }
    }

    /**
     * Pide el clima a la API SIN mirar la caché y lo guarda en climas (fuente "api").
     * La usa obtenerClima cuando la caché venció y el comando externos:actualizar.
     *
     * @throws ApiException 504 EXTERNAL_API_TIMEOUT o 502 EXTERNAL_API_ERROR
     */
    public function actualizar(Ciudad $ciudad, string $idioma = 'es'): array
    {
        $lang = $this->normalizarIdioma($idioma);
        $datos = $this->consultarApi($ciudad, $lang);

        $registro = Clima::updateOrCreate(
            ['ciudad_id' => $ciudad->id, 'idioma' => $lang],
            $datos + ['obtenido_en' => now()]
        );

        return $this->formatear($registro, 'api');
    }

    private function normalizarIdioma(string $idioma): string
    {
        return in_array(strtolower($idioma), ['es', 'de'], true) ? strtolower($idioma) : 'es';
    }

    /**
     * @return array{temperatura: float, descripcion: string, icono: string, obtenido_en: string, fuente: string}
     */
    private function formatear(Clima $clima, string $fuente): array
    {
        return [
            'temperatura' => round((float) $clima->temperatura, 1),
            'descripcion' => (string) $clima->descripcion,
            'icono' => (string) $clima->icono,
            'obtenido_en' => $clima->obtenido_en->toIso8601String(),
            'fuente' => $fuente,
        ];
    }

    /**
     * Llamada a OpenWeatherMap con validación estricta de la respuesta.
     *
     * @return array{temperatura: float, descripcion: string, icono: string}
     * @throws ApiException 504 EXTERNAL_API_TIMEOUT o 502 EXTERNAL_API_ERROR
     */
    private function consultarApi(Ciudad $ciudad, string $lang): array
    {
        $baseUrl = rtrim(config('services.weather.base_url', 'https://api.openweathermap.org/data/2.5'), '/');
        $apiKey = config('services.weather.key');
        $timeout = (float) config('services.weather.timeout', 5.0);

        try {
            $response = Http::timeout($timeout)
                ->acceptJson()
                ->get("{$baseUrl}/weather", [
                    'lat' => $ciudad->latitud,
                    'lon' => $ciudad->longitud,
                    'units' => 'metric',
                    'lang' => $lang,
                    'appid' => $apiKey,
                ]);
        } catch (ConnectionException $e) {
            // Registro seguro: solo servicio y tipo de error, NUNCA el mensaje original ni la URL
            Log::error('Fallo de conexión o timeout en servicio externo', [
                'servicio' => 'OpenWeatherMap',
                'tipo_error' => 'ConnectionException/Timeout',
            ]);

            throw new ApiException(504, 'EXTERNAL_API_TIMEOUT');
        } catch (Throwable $e) {
            Log::error('Error al invocar servicio externo', [
                'servicio' => 'OpenWeatherMap',
                'tipo_error' => get_class($e),
            ]);

            throw new ApiException(502, 'EXTERNAL_API_ERROR');
        }

        // Validación estricta de la respuesta HTTP
        if (!$response->successful()) {
            Log::error('Respuesta HTTP no exitosa de servicio externo', [
                'servicio' => 'OpenWeatherMap',
                'http_status' => $response->status(),
                'tipo_error' => 'HttpErrorResponse',
            ]);

            throw new ApiException(502, 'EXTERNAL_API_ERROR');
        }

        $data = $response->json();

        // ANTES de usar la respuesta, verificar estructura requerida
        if (
            !is_array($data) ||
            !isset($data['main']['temp']) ||
            !is_numeric($data['main']['temp']) ||
            !isset($data['weather'][0]['description']) ||
            !is_string($data['weather'][0]['description'])
        ) {
            Log::error('Respuesta con estructura inválida o datos incompletos de servicio externo', [
                'servicio' => 'OpenWeatherMap',
                'tipo_error' => 'InvalidDataStructure',
            ]);

            throw new ApiException(502, 'EXTERNAL_API_ERROR');
        }

        return [
            'temperatura' => round((float) $data['main']['temp'], 1),
            'descripcion' => (string) $data['weather'][0]['description'],
            'icono' => (string) ($data['weather'][0]['icon'] ?? ''),
        ];
    }
}
