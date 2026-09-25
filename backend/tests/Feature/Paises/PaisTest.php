<?php

namespace Tests\Feature\Paises;

use App\Models\Usuario;
use Database\Seeders\CiudadSeeder;
use Database\Seeders\MonedaSeeder;
use Database\Seeders\PaisSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Support\CreaTokens;
use Tests\TestCase;

class PaisTest extends TestCase
{
    use RefreshDatabase, CreaTokens;

    protected Usuario $usuario;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            MonedaSeeder::class,
            PaisSeeder::class,
            CiudadSeeder::class,
        ]);

        $this->usuario = Usuario::create([
            'nombre' => 'Explorador',
            'correo' => 'explorador@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);

        $this->token = $this->crearTokenValido($this->usuario);
    }

    /**
     * Prueba Extra
     * País inexistente responde 404 y su mensaje se traduce según Accept-Language: de.
     */
    public function test_pais_inexistente_devuelve_404_con_traduccion_segun_idioma(): void
    {
        // En español
        $resEs = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept-Language' => 'es',
        ])->getJson('/api/paises/9999/ciudades');

        $resEs->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'El recurso solicitado no fue encontrado.',
                ],
            ]);

        // En alemán
        $resDe = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept-Language' => 'de',
        ])->getJson('/api/paises/9999/ciudades');

        $resDe->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Die angeforderte Ressource wurde nicht gefunden.',
                ],
            ]);
    }

    /**
     * Prueba Extra
     * Listado de países precarga monedas y nombres traducidos.
     */
    public function test_listado_de_paises_precarga_monedas(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/paises');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'codigo',
                        'nombre',
                        'moneda' => [
                            'codigo',
                            'nombre',
                            'simbolo',
                        ],
                    ],
                ],
            ]);
    }
}
