<?php

namespace Tests\Feature\Consultas;

use App\Models\Ciudad;
use App\Models\Usuario;
use Database\Seeders\CiudadSeeder;
use Database\Seeders\MonedaSeeder;
use Database\Seeders\PaisSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\CreaTokens;
use Tests\TestCase;

class ConsultaValidacionTest extends TestCase
{
    use RefreshDatabase, CreaTokens;

    protected Usuario $usuario;
    protected string $token;
    protected Ciudad $ciudad;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            MonedaSeeder::class,
            PaisSeeder::class,
            CiudadSeeder::class,
        ]);

        $this->usuario = Usuario::create([
            'nombre' => 'Test Validador',
            'correo' => 'validador@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);

        $this->token = $this->crearTokenValido($this->usuario);
        $this->ciudad = Ciudad::first();
    }

    public static function proveedorPresupuestoInvalido(): array
    {
        return [
            'presupuesto vacío' => [''],
            'presupuesto negativo' => [-500],
            'presupuesto con letras' => ['cien_mil'],
        ];
    }

    /**
     * Prueba 8 del PDF
     * Presupuesto vacío, negativo o con letras responde 422 VALIDATION_ERROR con el campo "presupuesto" en details.
     */
    #[DataProvider('proveedorPresupuestoInvalido')]
    public function test_presupuesto_invalido_devuelve_error_de_validacion(mixed $presupuesto): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/consultas', [
                'ciudad_id' => $this->ciudad->id,
                'presupuesto' => $presupuesto,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                ],
            ]);

        $details = $response->json('error.details');
        $this->assertIsArray($details);

        $camposConError = array_column($details, 'field');
        $this->assertContains('presupuesto', $camposConError);
    }

    /**
     * Prueba Extra
     * Petición con cuerpo JSON mal formado responde 400 BAD_REQUEST.
     */
    public function test_json_mal_formado_devuelve_bad_request(): void
    {
        $response = $this->call(
            'POST',
            '/api/consultas',
            [],
            [],
            [],
            [
                'HTTP_AUTHORIZATION' => "Bearer {$this->token}",
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
            ],
            '{json_invalido: 123,'
        );

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'BAD_REQUEST',
                ],
            ]);
    }
}
