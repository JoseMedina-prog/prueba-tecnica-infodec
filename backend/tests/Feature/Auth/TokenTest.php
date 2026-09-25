<?php

namespace Tests\Feature\Auth;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Support\CreaTokens;
use Tests\TestCase;

class TokenTest extends TestCase
{
    use RefreshDatabase, CreaTokens;

    protected Usuario $usuario;

    protected function setUp(): void
    {
        parent::setUp();

        $this->usuario = Usuario::create([
            'nombre' => 'Juan Perez',
            'correo' => 'juan@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);
    }

    /**
     * Prueba 1 del PDF
     * Un token válido es aceptado y devuelve el usuario correcto.
     */
    public function test_un_token_valido_es_aceptado_y_devuelve_el_usuario_correcto(): void
    {
        $token = $this->crearTokenValido($this->usuario);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $this->usuario->id,
                    'correo' => $this->usuario->correo,
                    'nombre' => $this->usuario->nombre,
                ],
            ]);
    }

    /**
     * Prueba 2 del PDF
     * Un token con un solo carácter cambiado (en el medio) responde 401 AUTH_TOKEN_INVALID.
     */
    public function test_un_token_con_un_solo_caracter_cambiado_en_el_medio_es_rechazado(): void
    {
        $tokenValido = $this->crearTokenValido($this->usuario);
        $tokenAlterado = $this->crearTokenAlteradoEnElMedio($tokenValido);

        $response = $this->withHeader('Authorization', "Bearer {$tokenAlterado}")
            ->getJson('/api/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_TOKEN_INVALID',
                ],
            ]);
    }

    /**
     * Prueba 3 del PDF
     * Un token creado con otro secreto responde 401 AUTH_TOKEN_INVALID.
     */
    public function test_un_token_creado_con_otro_secreto_es_rechazado(): void
    {
        $tokenOtroSecreto = $this->crearTokenConOtroSecreto($this->usuario);

        $response = $this->withHeader('Authorization', "Bearer {$tokenOtroSecreto}")
            ->getJson('/api/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_TOKEN_INVALID',
                ],
            ]);
    }

    /**
     * Prueba 4 del PDF
     * Un token vencido responde 401 AUTH_TOKEN_EXPIRED.
     */
    public function test_un_token_vencido_es_rechazado(): void
    {
        $tokenVencido = $this->crearTokenVencido($this->usuario);

        $response = $this->withHeader('Authorization', "Bearer {$tokenVencido}")
            ->getJson('/api/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_TOKEN_EXPIRED',
                ],
            ]);
    }

    /**
     * Prueba Extra
     * Un token con encabezado alg="none" es rechazado.
     */
    public function test_un_token_con_algoritmo_none_es_rechazado(): void
    {
        $tokenNone = $this->crearTokenAlgNone($this->usuario);

        $response = $this->withHeader('Authorization', "Bearer {$tokenNone}")
            ->getJson('/api/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_TOKEN_INVALID',
                ],
            ]);
    }
}
