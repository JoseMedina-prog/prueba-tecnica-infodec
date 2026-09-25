<?php

namespace Database\Seeders;

use App\Models\Moneda;
use Illuminate\Database\Seeder;

class MonedaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $monedas = [
            [
                'codigo' => 'GBP',
                'nombre' => 'Libra esterlina',
                'simbolo' => '£',
            ],
            [
                'codigo' => 'JPY',
                'nombre' => 'Yen',
                'simbolo' => '¥',
            ],
            [
                'codigo' => 'INR',
                'nombre' => 'Rupia india',
                'simbolo' => '₹',
            ],
            [
                'codigo' => 'DKK',
                'nombre' => 'Corona danesa',
                'simbolo' => 'kr',
            ],
        ];

        foreach ($monedas as $moneda) {
            Moneda::updateOrCreate(
                ['codigo' => $moneda['codigo']],
                [
                    'nombre' => $moneda['nombre'],
                    'simbolo' => $moneda['simbolo'],
                ]
            );
        }
    }
}
