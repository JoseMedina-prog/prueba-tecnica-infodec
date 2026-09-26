<?php

namespace Tests\Feature\Externos;

use App\Models\Ciudad;
use App\Models\Clima;
use App\Models\Consulta;
use App\Models\TasaCambio;
use App\Models\Usuario;
use Carbon\Carbon;
use Database\Seeders\CiudadSeeder;
use Database\Seeders\MonedaSeeder;
use Database\Seeders\PaisSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\Support\CreaTokens;
use Tests\TestCase;

/**
 * Caché y respaldo del clima (tabla climas) y de la tasa (tasas_cambio),
 * y el comando externos:actualizar. El tiempo se fija con travelTo.
 */
class CacheExternosTest extends TestCase
{
    use RefreshDatabase, CreaTokens;

    protected string $token;
    protected Ciudad $tokio;
    protected Carbon $ahora;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([MonedaSeeder::class, PaisSeeder::class, CiudadSeeder::class]);

        $usuario = Usuario::create([
            'nombre' => 'Viajera Cache',
            'correo' => 'cache@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);
        $this->token = $this->crearTokenValido($usuario);
        $this->tokio = Ciudad::where('codigo_iata', 'TYO')->firstOrFail();

        $this->ahora = Carbon::parse('2026-09-26 15:00:00', 'UTC');
        $this->travelTo($this->ahora);
    }

    private function guardarClima(Carbon $obtenidoEn, float $temperatura = 18.0, string $idioma = 'es'): Clima
    {
        return Clima::create([
            'ciudad_id' => $this->tokio->id,
            'idioma' => $idioma,
            'temperatura' => $temperatura,
            'descripcion' => 'nubes guardadas',
            'icono' => '04d',
            'obtenido_en' => $obtenidoEn,
        ]);
    }

    private function climaApi(float $temperatura = 23.4): array
    {
        return ['main' => ['temp' => $temperatura], 'weather' => [['description' => 'cielo claro', 'icon' => '01d']]];
    }

    private function tasaApi(float $tasa = 0.05): array
    {
        return ['result' => 'success', 'conversion_rate' => $tasa, 'time_last_update_unix' => $this->ahora->copy()->startOfDay()->timestamp];
    }

    private function consultar(): \Illuminate\Testing\TestResponse
    {
        return $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/consultas', ['ciudad_id' => $this->tokio->id, 'presupuesto' => 1000000]);
    }

    public function test_clima_guardado_hace_menos_de_30_minutos_se_sirve_de_cache_sin_peticiones_http(): void
    {
        Http::fake();
        $this->guardarClima($this->ahora->copy()->subMinutes(20));

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/externas/clima/{$this->tokio->id}")
            ->assertStatus(200)
            ->assertJson(['data' => [
                'temperatura' => 18.0,
                'descripcion' => 'nubes guardadas',
                'icono' => '04d',
                'obtenido_en' => $this->ahora->copy()->subMinutes(20)->toIso8601String(),
                'fuente' => 'cache',
            ]]);

        Http::assertNothingSent();
    }

    public function test_clima_viejo_con_api_disponible_llama_a_la_api_y_actualiza(): void
    {
        Http::fake(['*/weather*' => Http::response($this->climaApi(23.4), 200)]);
        $this->guardarClima($this->ahora->copy()->subMinutes(45));

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/externas/clima/{$this->tokio->id}")
            ->assertStatus(200)
            ->assertJson(['data' => [
                'temperatura' => 23.4,
                'descripcion' => 'cielo claro',
                'obtenido_en' => $this->ahora->toIso8601String(),
                'fuente' => 'api',
            ]]);

        Http::assertSentCount(1);
        $guardado = Clima::where('ciudad_id', $this->tokio->id)->where('idioma', 'es')->sole();
        $this->assertEquals(23.4, (float) $guardado->temperatura);
        $this->assertTrue($guardado->obtenido_en->equalTo($this->ahora));
    }

    public function test_api_del_clima_caida_con_dato_de_hace_3_horas_usa_respaldo(): void
    {
        Http::fake([
            '*/weather*' => Http::response([], 500),
            '*/pair/COP/*' => Http::response($this->tasaApi(), 200),
        ]);
        $hace3Horas = $this->ahora->copy()->subHours(3);
        $this->guardarClima($hace3Horas, 17.5);

        $respuesta = $this->consultar();

        $respuesta->assertStatus(201)
            ->assertJson(['data' => [
                'clima' => [
                    'temperatura' => 17.5,
                    'obtenido_en' => $hace3Horas->toIso8601String(),
                    'fuente' => 'respaldo',
                ],
                'avisos' => [],
            ]]);

        // La consulta guarda de cuándo es su clima y el historial lo devuelve
        $consulta = Consulta::findOrFail($respuesta->json('data.id'));
        $this->assertTrue($consulta->clima_obtenido_en->equalTo($hace3Horas));

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/consultas/historial')
            ->assertJsonPath('data.0.clima.obtenido_en', $hace3Horas->toIso8601String());
    }

    public function test_api_del_clima_caida_con_dato_de_hace_30_horas_da_clima_no_disponible(): void
    {
        Http::fake([
            '*/weather*' => Http::response([], 500),
            '*/pair/COP/*' => Http::response($this->tasaApi(), 200),
        ]);
        $this->guardarClima($this->ahora->copy()->subHours(30));

        $this->consultar()
            ->assertStatus(201)
            ->assertJson(['data' => [
                'clima' => null,
                'avisos' => [['code' => 'CLIMA_NO_DISPONIBLE']],
            ]]);
    }

    public function test_tasa_del_dia_ya_guardada_se_sirve_de_cache_sin_llamar_a_la_api(): void
    {
        Http::fake();
        // Tasa del día (00:00 UTC) guardada hace 10 horas: más de cache_horas, pero es del día actual
        TasaCambio::create([
            'moneda_origen' => 'COP',
            'moneda_destino' => 'JPY',
            'tasa' => 0.0483,
            'fecha_tasa' => $this->ahora->copy()->startOfDay(),
        ])->forceFill(['updated_at' => $this->ahora->copy()->subHours(10)])->saveQuietly();

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/externas/tasa/JPY')
            ->assertStatus(200)
            ->assertJson(['data' => ['tasa' => 0.0483, 'fuente' => 'cache']]);

        Http::assertNothingSent();
    }

    public function test_tasa_de_otro_dia_obtenida_hace_mas_de_6_horas_se_vuelve_a_pedir(): void
    {
        Http::fake(['*/pair/COP/*' => Http::response($this->tasaApi(0.05), 200)]);
        TasaCambio::create([
            'moneda_origen' => 'COP',
            'moneda_destino' => 'JPY',
            'tasa' => 0.04,
            'fecha_tasa' => $this->ahora->copy()->subDay()->startOfDay(),
        ])->forceFill(['updated_at' => $this->ahora->copy()->subHours(7)])->saveQuietly();

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/externas/tasa/JPY')
            ->assertStatus(200)
            ->assertJson(['data' => ['tasa' => 0.05, 'fuente' => 'api']]);

        Http::assertSentCount(1);
    }

    public function test_comando_externos_actualizar_guarda_8_climas_por_idioma_y_4_tasas(): void
    {
        Http::fake([
            '*/weather*' => Http::response($this->climaApi(), 200),
            '*/pair/COP/*' => Http::response($this->tasaApi(), 200),
        ]);

        $this->artisan('externos:actualizar')
            ->expectsOutputToContain('20 actualizaciones correctas')
            ->assertExitCode(0);

        $this->assertSame(8, Clima::where('idioma', 'es')->count());
        $this->assertSame(8, Clima::where('idioma', 'de')->count());
        $this->assertSame(
            ['DKK', 'GBP', 'INR', 'JPY'],
            TasaCambio::orderBy('moneda_destino')->pluck('moneda_destino')->unique()->values()->all()
        );
    }

    public function test_comando_externos_actualizar_sigue_si_una_llamada_falla(): void
    {
        $latTokio = (string) $this->tokio->latitud;

        Http::fake([
            // El clima de Tokio falla (en los dos idiomas); el resto responde bien
            '*/weather*' => fn (Request $peticion) => str_contains($peticion->url(), "lat={$latTokio}")
                ? Http::response([], 500)
                : Http::response($this->climaApi(), 200),
            '*/pair/COP/INR' => Http::response([], 503),
            '*/pair/COP/*' => Http::response($this->tasaApi(), 200),
        ]);

        $this->artisan('externos:actualizar')
            ->expectsOutputToContain('3 de 20 actualizaciones fallaron')
            ->assertExitCode(1);

        $this->assertSame(14, Clima::count());
        $this->assertSame(0, Clima::where('ciudad_id', $this->tokio->id)->count());
        $this->assertSame(3, TasaCambio::count());
        $this->assertFalse(TasaCambio::where('moneda_destino', 'INR')->exists());
    }
}
