<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Ciudad;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ClimaService
{
    /**
     * Consulta el clima actual para una ciudad mediante OpenWeatherMap.
     *
     * @param Ciudad $ciudad Ciudad a consultar (con latitud y longitud)
     * @param string $idioma Idioma para la descripción ('es' o 'de')
     * @return array ['temperatura' => float, 'descripcion' => string, 'icono' => string]
     * @throws ApiException 504 EXTERNAL_API_TIMEOUT o 502 EXTERNAL_API_ERROR
     */
    public function obtenerClima(Ciudad $ciudad, string $idioma = 'es'): array
    {
        $baseUrl = rtrim(config('services.weather.base_url', 'https://api.openweathermap.org/data/2.5'), '/');
        $apiKey = config('services.weather.key') ?? config('services.weather.api_key');
        $timeout = (float) config('services.weather.timeout', 5.0);

        $lang = in_array(strtolower($idioma), ['es', 'de']) ? strtolower($idioma) : 'es';

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
