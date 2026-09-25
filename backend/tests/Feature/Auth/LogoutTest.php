<?php

namespace Tests\Feature\Auth;

use App\Models\RefreshToken;
use App\Models\Usuario;
use App\Services\TokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\Support\CreaTokens;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase, CreaTokens;

    protected Usuario $usuario;
    protected TokenService $tokenService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tokenService = app(TokenService::class);
        $this->usuario = Usuario::create([
            'nombre' => 'Ana Gomez',
            'correo' => 'ana@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);
    }

    /**
     * Prueba 5 del PDF
     * Un token usado después del logout responde 401 AUTH_TOKEN_REVOKED.
     */
    public function test_un_token_usado_despues_del_logout_es_rechazado(): void
    {
        $familiaId = (string) Str::uuid();
        $token = $this->tokenService->emitirAccessToken($this->usuario, $familiaId);

        RefreshToken::create([
            'usuario_id' => $this->usuario->id,
            'token_hash' => hash('sha256', 'refresh_token_test'),
            'familia_id' => $familiaId,
            'expira_en' => now()->addDays(7),
        ]);

        // Ejecutar logout
        $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $logoutResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'message' => 'Sesión cerrada correctamente.',
                ],
            ]);

        // Intentar usar el token nuevamente
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_TOKEN_REVOKED',
                ],
            ]);
    }

    /**
     * Prueba Extra
     * Logout de una sesión no afecta otra sesión del mismo usuario (aislamiento por sid).
     */
    public function test_logout_de_una_sesion_no_afecta_otra_sesion_del_mismo_usuario(): void
    {
        // Sesión 1 (Laptop)
        $familia1 = (string) Str::uuid();
        $token1 = $this->tokenService->emitirAccessToken($this->usuario, $familia1);
        RefreshToken::create([
            'usuario_id' => $this->usuario->id,
            'token_hash' => hash('sha256', 'rt_laptop'),
            'familia_id' => $familia1,
            'expira_en' => now()->addDays(7),
        ]);

        // Sesión 2 (Móvil)
        $familia2 = (string) Str::uuid();
        $token2 = $this->tokenService->emitirAccessToken($this->usuario, $familia2);
        RefreshToken::create([
            'usuario_id' => $this->usuario->id,
            'token_hash' => hash('sha256', 'rt_movil'),
            'familia_id' => $familia2,
            'expira_en' => now()->addDays(7),
        ]);

        // Cerrar sesión 1
        $this->withHeader('Authorization', "Bearer {$token1}")
            ->postJson('/api/auth/logout')
            ->assertStatus(200);

        // Token 1 debe estar revocado
        $this->withHeader('Authorization', "Bearer {$token1}")
            ->getJson('/api/auth/me')
            ->assertStatus(401)
            ->assertJsonPath('error.code', 'AUTH_TOKEN_REVOKED');

        // Token 2 de la sesión móvil sigue siendo perfectamente válido
        $this->withHeader('Authorization', "Bearer {$token2}")
            ->getJson('/api/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('data.id', $this->usuario->id);
    }
}
