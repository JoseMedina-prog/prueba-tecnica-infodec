<?php

namespace Tests\Feature\Salidas;

use App\Models\Ciudad;
use App\Models\Consulta;
use App\Models\Usuario;
use Database\Seeders\CiudadSeeder;
use Database\Seeders\MonedaSeeder;
use Database\Seeders\PaisSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Support\CreaTokens;
use Tests\TestCase;

class SalidaTest extends TestCase
{
    use RefreshDatabase, CreaTokens;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            MonedaSeeder::class,
            PaisSeeder::class,
            CiudadSeeder::class,
        ]);
    }

    /**
     * /api/salidas es público: responde sin token, con las 8 ciudades y SOLO
     * codigo_iata, ciudad y pais, en el formato estándar y con las cabeceras de seguridad.
     */
    public function test_salidas_responde_sin_token_con_8_ciudades_y_solo_3_campos(): void
    {
        $response = $this->getJson('/api/salidas');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(8, 'data')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('X-Trace-Id');

        foreach ($response->json('data') as $salida) {
            $this->assertSame(['codigo_iata', 'ciudad', 'pais'], array_keys($salida));
        }

        $codigos = collect($response->json('data'))->pluck('codigo_iata')->sort()->values()->all();
        $this->assertSame(['AAR', 'BOM', 'CPH', 'DEL', 'LON', 'MAN', 'OSA', 'TYO'], $codigos);
    }

    /**
     * Los nombres de ciudad y país vienen traducidos según Accept-Language.
     */
    public function test_salidas_traduce_ciudad_y_pais_segun_idioma(): void
    {
        $tokioEs = collect($this->withHeader('Accept-Language', 'es')->getJson('/api/salidas')->json('data'))
            ->firstWhere('codigo_iata', 'TYO');
        $londresDe = collect($this->withHeader('Accept-Language', 'de')->getJson('/api/salidas')->json('data'))
            ->firstWhere('codigo_iata', 'LON');

        $this->assertSame(['codigo_iata' => 'TYO', 'ciudad' => 'Tokio', 'pais' => 'Japón'], $tokioEs);
        $this->assertSame('London', $londresDe['ciudad']);
    }

    /**
     * Límite de 30 peticiones por minuto por IP: la 31 responde 429 con el formato estándar.
     */
    public function test_salidas_limita_a_30_por_minuto_por_ip(): void
    {
        for ($i = 1; $i <= 30; $i++) {
            $this->getJson('/api/salidas')->assertStatus(200);
        }

        $this->getJson('/api/salidas')
            ->assertStatus(429)
            ->assertJson([
                'success' => false,
                'error' => ['code' => 'TOO_MANY_ATTEMPTS'],
            ]);
    }

    /**
     * codigo_iata aparece en el listado de ciudades de un país y en el historial.
     */
    public function test_codigo_iata_aparece_en_ciudades_y_en_el_historial(): void
    {
        $usuario = Usuario::create([
            'nombre' => 'Viajera',
            'correo' => 'viajera@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);
        $token = $this->crearTokenValido($usuario);
        $tokio = Ciudad::where('codigo_iata', 'TYO')->firstOrFail();

        $ciudades = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/paises/{$tokio->pais_id}/ciudades");

        $ciudades->assertStatus(200)
            ->assertJsonStructure(['data' => ['*' => ['id', 'nombre', 'codigo_iata']]]);
        $this->assertEqualsCanonicalizing(['OSA', 'TYO'], collect($ciudades->json('data'))->pluck('codigo_iata')->all());

        Consulta::create([
            'usuario_id' => $usuario->id,
            'ciudad_id' => $tokio->id,
            'presupuesto_cop' => 1000000,
            'clima_temperatura' => 19.6,
            'clima_descripcion' => 'lluvia ligera',
            'tasa' => 0.0483,
            'valor_convertido' => 48300,
            'fecha_tasa' => now(),
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/consultas/historial')
            ->assertStatus(200)
            ->assertJsonPath('data.0.ciudad.codigo_iata', 'TYO');
    }
}
