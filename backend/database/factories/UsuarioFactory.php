<?php

namespace Database\Factories;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Usuario>
 */
class UsuarioFactory extends Factory
{
    /**
     * El nombre del modelo correspondiente a la factory.
     */
    protected $model = Usuario::class;

    /**
     * Contraseña en caché para evitar re-hashear innecesariamente en pruebas.
     */
    protected static ?string $password = null;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->name(),
            'correo' => fake()->unique()->safeEmail(),
            'password_hash' => static::$password ??= Hash::make('Prueba123'),
            'idioma' => 'es',
        ];
    }
}
