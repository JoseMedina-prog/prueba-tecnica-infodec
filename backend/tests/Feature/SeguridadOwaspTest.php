<?php

namespace Tests\Feature;

use App\Models\Ciudad;
use App\Models\Consulta;
use App\Models\Moneda;
use App\Models\Pais;
use App\Models\Usuario;
use App\Services\TokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class SeguridadOwaspTest extends TestCase
{
    use RefreshDatabase;

    protected Usuario $usuario;
    protected string $accessToken;

    protected function setUp(): void
    {
        parent::setUp();

        RateLimiter::clear('login:seguridad.test@travelapp.test|127.0.0.1');

        $this->usuario = Usuario::create([
            'nombre' => 'Usuario Seguridad',
            'correo' => 'seguridad.test@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);

        $tokenService = app(TokenService::class);
        $this->accessToken = $tokenService->emitirAccessToken($this->usuario, (string) \Illuminate\Support\Str::uuid());
    }

    /**
     * Prueba 1: Cabeceras de seguridad presentes, sin X-Powered-By y Cache-Control: no-store en /auth/*.
     */
    public function test_cabeceras_de_seguridad_presentes_y_sin_x_powered_by(): void
    {
        // Petición a ruta protegida
        $response = $this->withHeader('Authorization', "Bearer {$this->accessToken}")
            ->getJson('/api/paises');

        $response->assertStatus(200);
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'no-referrer');
        $this->assertStringContainsString("default-src 'none'", (string) $response->headers->get('Content-Security-Policy'));
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $this->assertFalse($response->headers->has('X-Powered-By'), 'La cabecera X-Powered-By debe ser removida.');

        // Petición a ruta /auth/*: debe incluir Cache-Control no-store
        $authResponse = $this->postJson('/api/auth/login', [
            'correo' => 'seguridad.test@travelapp.test',
            'password' => 'ClaveSegura123',
        ]);

        $authResponse->assertStatus(200);
        $this->assertStringContainsString('no-store', (string) $authResponse->headers->get('Cache-Control'));
    }

    /**
     * Prueba 2: La consulta 21 en un minuto responde 429 TOO_MANY_ATTEMPTS.
     */
    public function test_consulta_21_en_un_minuto_responde_429(): void
    {
        // Limpiar el limitador de consultas para este usuario
        RateLimiter::clear("consultas:{$this->usuario->id}");

        $moneda = Moneda::create([
            'codigo' => 'EUR',
            'nombre' => 'Euro',
            'simbolo' => '€',
        ]);

        $pais = Pais::create([
            'codigo' => 'ES',
            'nombre' => 'España',
            'codigo_iso' => 'ESP',
            'moneda_id' => $moneda->id,
        ]);

        $ciudad = Ciudad::create([
            'nombre' => 'Madrid',
            'pais_id' => $pais->id,
            'latitud' => 40.4168,
            'longitud' => -3.7038,
        ]);

        // Simular APIs externas para que las primeras 20 consultas respondan 201 exitosamente
        Http::fake([
            'https://api.openweathermap.org/*' => Http::response([
                'weather' => [['description' => 'cielo claro', 'icon' => '01d']],
                'main' => ['temp' => 22.5],
            ], 200),
            'https://v6.exchangerate-api.com/*' => Http::response([
                'result' => 'success',
                'conversion_rate' => 0.00022,
                'time_last_update_utc' => 'Sat, 26 Sep 2026 00:00:01 +0000',
            ], 200),
        ]);

        // Realizar 20 consultas
        for ($i = 1; $i <= 20; $i++) {
            $response = $this->withHeader('Authorization', "Bearer {$this->accessToken}")
                ->postJson('/api/consultas', [
                    'ciudad_id' => $ciudad->id,
                    'presupuesto' => 1000000,
                ]);

            $response->assertStatus(201);
        }

        // Consulta 21: debe ser bloqueada por rate limit (429)
        $bloqueado = $this->withHeader('Authorization', "Bearer {$this->accessToken}")
            ->postJson('/api/consultas', [
                'ciudad_id' => $ciudad->id,
                'presupuesto' => 1000000,
            ]);

        $bloqueado->assertStatus(429);
        $bloqueado->assertJson([
            'success' => false,
            'error' => [
                'code' => 'TOO_MANY_ATTEMPTS',
            ],
        ]);
        $this->assertTrue($bloqueado->headers->has('Retry-After'));
    }

    /**
     * Prueba 3: Petición con cuerpo superior a 16 KB responde 413 PAYLOAD_TOO_LARGE.
     */
    public function test_peticion_de_mas_de_16_kb_responde_413(): void
    {
        // Generar un payload de 17 KB (17 * 1024 caracteres)
        $relleno = str_repeat('A', 17 * 1024);

        $response = $this->call(
            'POST',
            '/api/auth/login',
            [],
            [],
            [],
            [
                'CONTENT_LENGTH' => strlen($relleno),
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
            ],
            json_encode(['relleno' => $relleno])
        );

        $response->assertStatus(413);
        $response->assertJson([
            'success' => false,
            'error' => [
                'code' => 'PAYLOAD_TOO_LARGE',
            ],
        ]);
    }

    /**
     * Prueba 4: El historial no expone usuario_id ni campos internos.
     */
    public function test_historial_no_expone_usuario_id_ni_campos_internos(): void
    {
        $moneda = Moneda::create([
            'codigo' => 'USD',
            'nombre' => 'Dólar',
            'simbolo' => '$',
        ]);

        $pais = Pais::create([
            'codigo' => 'US',
            'nombre' => 'Estados Unidos',
            'codigo_iso' => 'USA',
            'moneda_id' => $moneda->id,
        ]);

        $ciudad = Ciudad::create([
            'nombre' => 'Miami',
            'pais_id' => $pais->id,
            'latitud' => 25.7617,
            'longitud' => -80.1918,
        ]);

        Consulta::create([
            'usuario_id' => $this->usuario->id,
            'ciudad_id' => $ciudad->id,
            'presupuesto_cop' => 5000000,
            'clima_temperatura' => 28.0,
            'clima_descripcion' => 'soleado',
            'tasa' => 0.00025,
            'valor_convertido' => 1250.0,
            'fecha_tasa' => now(),
            'fuente_tasa' => 'api',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->accessToken}")
            ->getJson('/api/consultas/historial');

        $response->assertStatus(200);

        $jsonString = $response->getContent();
        $this->assertStringNotContainsString('"usuario_id"', $jsonString);
        $this->assertStringNotContainsString('"updated_at"', $jsonString);
        $this->assertStringNotContainsString('"password_hash"', $jsonString);
        $this->assertStringNotContainsString('"token_hash"', $jsonString);
        $this->assertStringNotContainsString('"familia_id"', $jsonString);
    }

    /**
     * Prueba 5: Un login fallido escribe en el canal seguridad con el correo enmascarado (Log::spy).
     */
    public function test_login_fallido_escribe_en_canal_seguridad_con_correo_enmascarado(): void
    {
        Log::spy();
        $canalSpy = \Mockery::spy(\Psr\Log\LoggerInterface::class);
        Log::shouldReceive('channel')->with('seguridad')->andReturn($canalSpy);

        $response = $this->postJson('/api/auth/login', [
            'correo' => 'seguridad.test@travelapp.test',
            'password' => 'PasswordIncorrecta',
        ]);

        $response->assertStatus(401);

        $canalSpy->shouldHaveReceived('info')->withArgs(function ($evento, $datos) {
            return $evento === 'login_fallido'
                && isset($datos['correo'])
                && $datos['correo'] === 's***@travelapp.test'
                && !isset($datos['password'])
                && !isset($datos['password_hash']);
        });
    }

    /**
     * Prueba 6: El comando seguridad:resumen (con --horas y con --trace) corre sin errores sobre un log de ejemplo.
     */
    public function test_comando_seguridad_resumen_y_filtro_trace_corren_sin_errores(): void
    {
        $logPath = config('logging.channels.seguridad.path');
        $traceId = 'trace-test-uuid-999';

        $eventoJson = json_encode([
            'message' => 'login_fallido',
            'context' => [
                'evento' => 'login_fallido',
                'trace_id' => $traceId,
                'ip' => '10.0.0.1',
                'fecha' => now()->toIso8601String(),
                'usuario_id' => 1,
                'correo' => 'u***@travelapp.test',
            ],
            'level' => 200,
            'level_name' => 'INFO',
            'channel' => 'seguridad',
            'datetime' => now()->toIso8601String(),
            'extra' => [],
        ]);

        file_put_contents($logPath, $eventoJson . PHP_EOL, FILE_APPEND);

        // Ejecutar comando con --horas
        $this->artisan('seguridad:resumen', ['--horas' => 24])
            ->assertSuccessful()
            ->expectsOutputToContain('=== Resumen de eventos de seguridad (Últimas 24 horas) ===');

        // Ejecutar comando con --trace
        $this->artisan('seguridad:resumen', ['--trace' => $traceId])
            ->assertSuccessful()
            ->expectsOutputToContain("=== Eventos de seguridad para trace_id: {$traceId} ===");
    }
}
