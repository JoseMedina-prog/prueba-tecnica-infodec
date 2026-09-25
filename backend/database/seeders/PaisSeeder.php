<?php

namespace Database\Seeders;

use App\Models\Moneda;
use App\Models\Pais;
use Illuminate\Database\Seeder;

class PaisSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $paises = [
            [
                'nombre' => 'Inglaterra',
                'codigo' => 'GB',
                'moneda_codigo' => 'GBP',
            ],
            [
                'nombre' => 'Japón',
                'codigo' => 'JP',
                'moneda_codigo' => 'JPY',
            ],
            [
                'nombre' => 'India',
                'codigo' => 'IN',
                'moneda_codigo' => 'INR',
            ],
            [
                'nombre' => 'Dinamarca',
                'codigo' => 'DK',
                'moneda_codigo' => 'DKK',
            ],
        ];

        foreach ($paises as $pais) {
            $moneda = Moneda::where('codigo', $pais['moneda_codigo'])->firstOrFail();

            Pais::updateOrCreate(
                ['codigo' => $pais['codigo']],
                [
                    'nombre' => $pais['nombre'],
                    'moneda_id' => $moneda->id,
                ]
            );
        }
    }
}
