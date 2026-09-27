<?php

namespace Tests\Feature\Auth;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    protected Usuario $usuario;

    protected function setUp(): void
    {
        parent::setUp();

        RateLimiter::clear('login:usuario.login@travelapp.test|127.0.0.1');

        $this->usuario = Usuario::create([
            'nombre' => 'Usuario Login',
            'correo' => 'usuario.login@travelapp.test',
            'password_hash' => Hash::make('ClaveCorrecta123'),
            'idioma' => 'es',
        ]);
    }

    /**
     * Prueba 7 del PDF
     * Contraseña incorrecta responde 401 AUTH_INVALID_CREDENTIALS en los intentos 1 a 5,
     * y el 6.º intento responde 429 TOO_MANY_ATTEMPTS con la cabecera Retry-After.
     */
    public function test_contrasena_incorrecta_bloquea_al_sexto_intento_con_retry_after(): void
    {
        // Intentos 1 a 5: deben responder 401 AUTH_INVALID_CREDENTIALS
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
                ->postJson('/api/auth/login', [
                    'correo' => 'usuario.login@travelapp.test',
                    'password' => 'ClaveIncorrecta',
                ]);

            $response->assertStatus(401)
                ->assertJson([
                    'success' => false,
                    'error' => [
                        'code' => 'AUTH_INVALID_CREDENTIALS',
                    ],
                ]);
        }

        // Intento 6: debe responder 429 TOO_MANY_ATTEMPTS e incluir la cabecera Retry-After
        $bloqueadoResponse = $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->postJson('/api/auth/login', [
                'correo' => 'usuario.login@travelapp.test',
                'password' => 'ClaveIncorrecta',
            ]);

        $bloqueadoResponse->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'TOO_MANY_ATTEMPTS',
                ],
            ]);

        $retryAfter = $bloqueadoResponse->headers->get('Retry-After');
        $this->assertNotEmpty($retryAfter);
        $this->assertGreaterThan(0, (int) $retryAfter);
    }

    /**
     * Password spraying: 20 fallos por minuto desde una misma IP con correos distintos
     * (cada correo lleva un solo fallo, lejos de su propio límite de 5). El intento 21 desde esa IP
     * responde 429 con Retry-After aunque el correo sea nuevo; otra IP no queda afectada.
     */
    public function test_veinte_fallos_con_correos_distintos_desde_una_ip_bloquean_el_intento_21(): void
    {
        $usuarios = Usuario::factory()->count(21)->create();

        foreach ($usuarios->take(20) as $usuario) {
            $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.7'])
                ->postJson('/api/auth/login', [
                    'correo' => $usuario->correo,
                    'password' => 'ClaveIncorrecta1',
                ])
                ->assertStatus(401)
                ->assertJsonPath('error.code', 'AUTH_INVALID_CREDENTIALS');
        }

        $bloqueado = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.7'])
            ->postJson('/api/auth/login', [
                'correo' => $usuarios->last()->correo,
                'password' => 'ClaveIncorrecta1',
            ]);

        $bloqueado->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJsonPath('error.code', 'TOO_MANY_ATTEMPTS');
        $this->assertGreaterThan(0, (int) $bloqueado->headers->get('Retry-After'));

        // Desde otra IP el mismo correo sigue pudiendo intentar
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.8'])
            ->postJson('/api/auth/login', [
                'correo' => $usuarios->last()->correo,
                'password' => 'ClaveIncorrecta1',
            ])
            ->assertStatus(401);
    }
}
