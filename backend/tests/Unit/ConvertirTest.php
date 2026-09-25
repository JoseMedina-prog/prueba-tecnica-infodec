<?php

namespace Tests\Unit;

use App\Services\MonedaService;
use Tests\TestCase;

class ConvertirTest extends TestCase
{
    /**
     * Prueba 9 del PDF (parte unitaria)
     * MonedaService::convertir es una función pura que multiplica por la tasa y redondea a 2 decimales.
     */
    public function test_moneda_service_convertir_calcula_y_redondea_a_dos_decimales(): void
    {
        $servicio = app(MonedaService::class);

        // Caso 1: 1,000,000 COP con tasa 0.0356 -> 35,600.00
        $this->assertEquals(35600.00, $servicio->convertir(1000000, 0.0356));

        // Caso 2: 1,000,000 COP con tasa 0.05 -> 50,000.00
        $this->assertEquals(50000.00, $servicio->convertir(1000000, 0.05));

        // Caso 3: Redondeo a 2 decimales
        $this->assertEquals(123.46, $servicio->convertir(1000, 0.123456));
    }
}
