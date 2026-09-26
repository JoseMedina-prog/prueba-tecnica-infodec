<?php

namespace Tests\Feature\Consultas;

use App\Models\Ciudad;
use App\Models\Consulta;
use App\Models\TasaCambio;
use App\Models\Usuario;
use Carbon\Carbon;
use Database\Seeders\CiudadSeeder;
use Database\Seeders\MonedaSeeder;
use Database\Seeders\PaisSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\Support\CreaTokens;
use Tests\TestCase;

class ConsultaCreacionTest extends TestCase
{
    use RefreshDatabase, CreaTokens;

    protected Usuario $usuario;
    protected string $token;
    protected Ciudad $ciudadTokio;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            MonedaSeeder::class,
            PaisSeeder::class,
            CiudadSeeder::class,
        ]);

        $this->usuario = Usuario::create([
            'nombre' => 'Viajero Test',
            'correo' => 'viajero@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);

        $this->token = $this->crearTokenValido($this->usuario);
        $this->ciudadTokio = Ciudad::where('nombre', 'Tokio')->first();
    }

    /**
     * Prueba 9 del PDF
     * La conversión da el valor correcto con una tasa simulada (Http::fake conversion_rate 0.05 y clima fijo),
     * verifica fuente 'api' y que fecha_tasa proviene de time_last_update_unix.
     */
    public function test_la_conversion_da_el_valor_correcto_con_tasa_simulada(): void
    {
        $timestampActualizacion = 1790294401; // Timestamp conocido de last update
        $fechaEsperada = Carbon::createFromTimestamp($timestampActualizacion)->toIso8601String();

        Http::fake([
            '*/weather*' => Http::response([
                'main' => ['temp' => 23.4],
                'weather' => [
                    ['description' => 'cielo claro', 'icon' => '01d'],
                ],
            ], 200),
            '*/pair/COP/*' => Http::response([
                'result' => 'success',
                'conversion_rate' => 0.05,
                'time_last_update_unix' => $timestampActualizacion,
            ], 200),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/consultas', [
                'ciudad_id' => $this->ciudadTokio->id,
                'presupuesto' => 1000000,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'presupuesto_cop' => 1000000,
                    'clima' => [
                        'temperatura' => 23.4,
                        'descripcion' => 'cielo claro',
                        'icono' => '01d',
                    ],
                    'conversion' => [
                        'valor' => 50000.0,
                        'tasa' => 0.05,
                        'fecha_tasa' => $fechaEsperada,
                        'fuente' => 'api',
                    ],
                ],
            ]);

        // Aserción explícita de que fecha_tasa se tomó de time_last_update_unix
        $this->assertEquals(
            $fechaEsperada,
            $response->json('data.conversion.fecha_tasa'),
            'fecha_tasa debe provenir de time_last_update_unix de la API.'
        );
    }

    /**
     * Prueba 10 del PDF
     * Si la API de moneda falla (Http::fake con 500), se utiliza la última tasa guardada
     * en la base de datos con fuente 'respaldo' y el cálculo correcto.
     */
    public function test_si_la_api_de_moneda_falla_se_usa_la_ultima_tasa_guardada_de_respaldo(): void
    {
        $fechaHistorica = now()->subDays(2)->startOfDay();

        // Tasa guardada previamente en base de datos, obtenida hace 2 días
        // (si se hubiera obtenido hace menos de 6 horas, se serviría de caché sin llamar a la API)
        TasaCambio::create([
            'moneda_origen' => 'COP',
            'moneda_destino' => 'JPY',
            'tasa' => 0.04,
            'fecha_tasa' => $fechaHistorica,
        ])->forceFill(['created_at' => $fechaHistorica, 'updated_at' => $fechaHistorica])->saveQuietly();

        Http::fake([
            '*/weather*' => Http::response([
                'main' => ['temp' => 19.0],
                'weather' => [
                    ['description' => 'nubes dispersas', 'icon' => '03d'],
                ],
            ], 200),
            '*/pair/COP/*' => Http::response([], 500),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/consultas', [
                'ciudad_id' => $this->ciudadTokio->id,
                'presupuesto' => 1000000,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'presupuesto_cop' => 1000000,
                    'conversion' => [
                        'valor' => 40000.0, // 1000000 * 0.04
                        'tasa' => 0.04,
                        'fecha_tasa' => $fechaHistorica->toIso8601String(),
                        'fuente' => 'respaldo',
                    ],
                ],
            ]);
    }

    /**
     * Prueba Extra
     * Si falla solo el clima → responde 201 con CLIMA_NO_DISPONIBLE y conversión exitosa.
     */
    public function test_si_falla_solo_el_clima_responde_con_aviso_y_conversion_normal(): void
    {
        Http::fake([
            '*/weather*' => Http::response([], 500),
            '*/pair/COP/*' => Http::response([
                'result' => 'success',
                'conversion_rate' => 0.05,
                'time_last_update_unix' => time(),
            ], 200),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/consultas', [
                'ciudad_id' => $this->ciudadTokio->id,
                'presupuesto' => 100000,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'clima' => null,
                    'conversion' => [
                        'fuente' => 'api',
                    ],
                    'avisos' => [
                        ['code' => 'CLIMA_NO_DISPONIBLE'],
                    ],
                ],
            ]);
    }

    /**
     * Prueba Extra
     * Si fallan las dos APIs (sin respaldo) → responde 502 EXTERNAL_API_ERROR y NO se persiste la consulta.
     */
    public function test_si_fallan_las_dos_apis_sin_respaldo_responde_502_y_no_guarda_consulta(): void
    {
        TasaCambio::truncate();

        Http::fake([
            '*/weather*' => Http::response([], 500),
            '*/pair/COP/*' => Http::response([], 500),
        ]);

        $conteoAntes = Consulta::count();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/consultas', [
                'ciudad_id' => $this->ciudadTokio->id,
                'presupuesto' => 100000,
            ]);

        $response->assertStatus(502)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'EXTERNAL_API_ERROR',
                ],
            ]);

        $this->assertEquals($conteoAntes, Consulta::count(), 'No debe guardarse la consulta si fallan ambas APIs.');
    }

    /**
     * Prueba Extra
     * Timeout en API externa (ConnectionException simulada) responde 504 EXTERNAL_API_TIMEOUT.
     */
    public function test_timeout_de_api_externa_devuelve_504(): void
    {
        Http::fake([
            '*/weather*' => fn () => throw new ConnectionException('Connection timed out'),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/externas/clima/{$this->ciudadTokio->id}");

        $response->assertStatus(504)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'EXTERNAL_API_TIMEOUT',
                ],
            ]);
    }
}
