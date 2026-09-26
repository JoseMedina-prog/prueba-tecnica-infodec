<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Secreto aleatorio de 32 bytes por ejecución para aislamiento de pruebas
        Config::set('token.secret', base64_encode(random_bytes(32)));

        // Claves falsas para asegurar que ninguna prueba use credenciales reales
        Config::set('services.weather.key', 'fake-weather-api-key-test');
        Config::set('services.exchange.key', 'fake-exchange-api-key-test');

        // Canal de seguridad aislado para que las pruebas no alteren el log de producción/local
        Config::set('logging.channels.seguridad.path', storage_path('logs/seguridad-testing.log'));

        // Previene que cualquier prueba realice llamadas externas a internet
        Http::preventStrayRequests();
    }
}
