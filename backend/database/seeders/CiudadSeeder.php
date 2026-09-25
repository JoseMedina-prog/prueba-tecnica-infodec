<?php

namespace Database\Seeders;

use App\Models\Ciudad;
use App\Models\Pais;
use Illuminate\Database\Seeder;

class CiudadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ciudades = [
            // Inglaterra (GB)
            [
                'pais_codigo' => 'GB',
                'nombre' => 'Londres',
                'latitud' => 51.507400,
                'longitud' => -0.127800,
            ],
            [
                'pais_codigo' => 'GB',
                'nombre' => 'Mánchester',
                'latitud' => 53.480800,
                'longitud' => -2.242600,
            ],
            // Japón (JP)
            [
                'pais_codigo' => 'JP',
                'nombre' => 'Tokio',
                'latitud' => 35.676200,
                'longitud' => 139.650300,
            ],
            [
                'pais_codigo' => 'JP',
                'nombre' => 'Osaka',
                'latitud' => 34.693700,
                'longitud' => 135.502300,
            ],
            // India (IN)
            [
                'pais_codigo' => 'IN',
                'nombre' => 'Nueva Delhi',
                'latitud' => 28.613900,
                'longitud' => 77.209000,
            ],
            [
                'pais_codigo' => 'IN',
                'nombre' => 'Bombay',
                'latitud' => 19.076000,
                'longitud' => 72.877700,
            ],
            // Dinamarca (DK)
            [
                'pais_codigo' => 'DK',
                'nombre' => 'Copenhague',
                'latitud' => 55.676100,
                'longitud' => 12.568300,
            ],
            [
                'pais_codigo' => 'DK',
                'nombre' => 'Aarhus',
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
                    'latitud' => $ciudad['latitud'],
                    'longitud' => $ciudad['longitud'],
                ]
            );
        }
    }
}
