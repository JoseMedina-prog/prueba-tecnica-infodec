<?php

namespace Tests\Feature\Auth;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Mockery;
use Psr\Log\LoggerInterface;
use Tests\TestCase;

class RegistroTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Prueba Extra
     * Registro con correo duplicado responde 409 USER_ALREADY_EXISTS.
     */
    public function test_registro_con_correo_duplicado_devuelve_409(): void
    {
        Usuario::create([
            'nombre' => 'Existente',
            'correo' => 'duplicado@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);

        $response = $this->postJson('/api/auth/register', [
            'nombre' => 'Nuevo Intentador',
            'correo' => 'duplicado@travelapp.test',
            'password' => 'OtraClave123',
            'password_confirmation' => 'OtraClave123',
            'idioma' => 'es',
        ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'USER_ALREADY_EXISTS',
                ],
            ]);
    }

    /**
     * Prueba Extra
     * Registro exitoso crea el usuario y devuelve tokens de acceso y refresco.
     */
    public function test_registro_exitoso_crea_usuario(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'nombre' => 'Nuevo Usuario',
            'correo' => 'nuevo@travelapp.test',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'idioma' => 'es',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'nombre',
                    'correo',
                    'idioma',
                ],
            ]);

        $this->assertDatabaseHas('usuarios', [
            'correo' => 'nuevo@travelapp.test',
        ]);
    }

    /**
     * Prueba Extra - Defensa en profundidad OWASP / CRLF Injection
     * Un correo con caracteres de control (\r\n) es rechazado con 422 VALIDATION_ERROR en el campo correo.
     */
    public function test_registro_con_crlf_en_correo_devuelve_422(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'nombre' => 'Test Inyeccion',
            'correo' => "a@b.com\r\nBcc: x@y.com",
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'idioma' => 'es',
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
        $this->assertContains('correo', $camposConError);
    }

    /**
     * OWASP API6 (flujo de negocio sensible): el registro está limitado a 10 por minuto por IP.
     * El undécimo responde 429 TOO_MANY_ATTEMPTS con Retry-After, no crea el usuario
     * y deja el evento limite_consumo en el canal de seguridad.
     */
    public function test_el_undecimo_registro_en_un_minuto_devuelve_429(): void
    {
        Log::spy();
        $canalSpy = Mockery::spy(LoggerInterface::class);
        Log::shouldReceive('channel')->with('seguridad')->andReturn($canalSpy);

        $registrar = fn (int $n) => $this->postJson('/api/auth/register', [
            'nombre' => "Viajero {$n}",
            'correo' => "viajero{$n}@travelapp.test",
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'idioma' => 'es',
        ]);

        for ($n = 1; $n <= 10; $n++) {
            $registrar($n)->assertStatus(201);
        }

        $bloqueado = $registrar(11);

        $bloqueado->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJson([
                'success' => false,
                'error' => ['code' => 'TOO_MANY_ATTEMPTS'],
            ]);
        $this->assertDatabaseMissing('usuarios', ['correo' => 'viajero11@travelapp.test']);

        $canalSpy->shouldHaveReceived('warning')->withArgs(
            fn ($evento, $datos) => $evento === 'limite_consumo' && isset($datos['ip'])
        );
    }

    /**
     * El límite por hora (30) también aplica aunque los registros se repartan en varios minutos.
     */
    public function test_el_registro_31_en_una_hora_devuelve_429(): void
    {
        $inicio = now();

        for ($n = 1; $n <= 30; $n++) {
            // 6 registros por minuto: nunca se llega al límite de 10 por minuto
            $this->travelTo($inicio->copy()->addSeconds(intdiv($n - 1, 6) * 61));
            $this->postJson('/api/auth/register', [
                'nombre' => "Viajero {$n}",
                'correo' => "hora{$n}@travelapp.test",
                'password' => 'Password123',
                'password_confirmation' => 'Password123',
                'idioma' => 'es',
            ])->assertStatus(201);
        }

        $this->travelTo($inicio->copy()->addMinutes(10));
        $this->postJson('/api/auth/register', [
            'nombre' => 'Viajero 31',
            'correo' => 'hora31@travelapp.test',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'idioma' => 'es',
        ])->assertStatus(429)->assertHeader('Retry-After');
    }
}

