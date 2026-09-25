<?php

namespace Database\Seeders;

use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsuarioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Usuario::updateOrCreate(
            ['correo' => 'prueba@travelapp.test'],
            [
                'nombre' => 'Usuario Prueba',
                'password_hash' => Hash::make('Prueba123'),
                'idioma' => 'es',
            ]
        );
    }
}
