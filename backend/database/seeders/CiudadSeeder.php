<?php

namespace Database\Seeders;

use App\Models\Ciudad;
use App\Models\Pais;
use Illuminate\Database\Seeder;

class CiudadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Idempotente: updateOrCreate por (país, nombre), así se puede correr sobre datos existentes.
     */
    public function run(): void
    {
        $ciudades = [
            // Inglaterra (GB)
            [
                'pais_codigo' => 'GB',
                'nombre' => 'Londres',
                'codigo_iata' => 'LON',
                'latitud' => 51.507400,
                'longitud' => -0.127800,
            ],
            [
                'pais_codigo' => 'GB',
                'nombre' => 'Mánchester',
                'codigo_iata' => 'MAN',
                'latitud' => 53.480800,
                'longitud' => -2.242600,
            ],
            // Japón (JP)
            [
                'pais_codigo' => 'JP',
                'nombre' => 'Tokio',
                'codigo_iata' => 'TYO',
                'latitud' => 35.676200,
                'longitud' => 139.650300,
            ],
            [
                'pais_codigo' => 'JP',
                'nombre' => 'Osaka',
                'codigo_iata' => 'OSA',
                'latitud' => 34.693700,
                'longitud' => 135.502300,
            ],
            // India (IN)
            [
                'pais_codigo' => 'IN',
                'nombre' => 'Nueva Delhi',
                'codigo_iata' => 'DEL',
                'latitud' => 28.613900,
                'longitud' => 77.209000,
            ],
            [
                'pais_codigo' => 'IN',
                'nombre' => 'Bombay',
                'codigo_iata' => 'BOM',
                'latitud' => 19.076000,
                'longitud' => 72.877700,
            ],
            // Dinamarca (DK)
            [
                'pais_codigo' => 'DK',
                'nombre' => 'Copenhague',
                'codigo_iata' => 'CPH',
                'latitud' => 55.676100,
                'longitud' => 12.568300,
            ],
            [
                'pais_codigo' => 'DK',
                'nombre' => 'Aarhus',
                'codigo_iata' => 'AAR',
                'latitud' => 56.162900,
                'longitud' => 10.203900,
            ],
        ];

        foreach ($ciudades as $ciudad) {
            $pais = Pais::where('codigo', $ciudad['pais_codigo'])->firstOrFail();

            Ciudad::updateOrCreate(
                [
                    'pais_id' => $pais->id,
                    'nombre' => $ciudad['nombre'],
                ],
                [
                    'codigo_iata' => $ciudad['codigo_iata'],
                    'latitud' => $ciudad['latitud'],
                    'longitud' => $ciudad['longitud'],
                ]
            );
        }
    }
}
