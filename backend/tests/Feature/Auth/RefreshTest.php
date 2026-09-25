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

class RefreshTest extends TestCase
{
    use RefreshDatabase, CreaTokens;

    protected Usuario $usuario;
    protected TokenService $tokenService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tokenService = app(TokenService::class);
        $this->usuario = Usuario::create([
            'nombre' => 'Carlos Diaz',
            'correo' => 'carlos@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);
    }

    /**
     * Prueba 6 del PDF
     * Un refresh token usado dos veces responde 401 AUTH_TOKEN_REVOKED (AUTH_TOKEN_REUSED)
     * y revoca todas las sesiones activas del usuario en la base de datos.
     */
    public function test_un_refresh_token_usado_dos_veces_es_revocado_y_cierra_todas_las_sesiones(): void
    {
        // 1. Iniciar sesión para obtener tokens válidos
        $loginRes = $this->postJson('/api/auth/login', [
            'correo' => 'carlos@travelapp.test',
            'password' => 'ClaveSegura123',
        ]);

        $loginRes->assertStatus(200);
        $refreshTokenOriginal = $loginRes->json('data.refresh_token');
        $this->assertNotEmpty($refreshTokenOriginal);

        // Crear una segunda sesión activa simulada para comprobar que se revoque en caso de reuso
        $otraFamilia = (string) Str::uuid();
        RefreshToken::create([
            'usuario_id' => $this->usuario->id,
            'token_hash' => hash('sha256', 'otra_sesion_activa'),
            'familia_id' => $otraFamilia,
            'expira_en' => now()->addDays(7),
        ]);

        // Verificar que hay sesiones activas antes del refresh
        $this->assertEquals(2, RefreshToken::where('usuario_id', $this->usuario->id)->whereNull('revocado_en')->count());

        // 2. Primer uso del refresh token: debe ser exitoso (HTTP 200) y rotar el token
        $primerRefresh = $this->postJson('/api/auth/refresh', [
            'refresh_token' => $refreshTokenOriginal,
        ]);

        $primerRefresh->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'access_token',
                    'refresh_token',
                ],
            ]);

        // 3. Segundo uso del MISMO refresh token (detección de reuso / token replay attack):
        // Debe responder 401 AUTH_TOKEN_REVOKED
        $segundoRefresh = $this->postJson('/api/auth/refresh', [
            'refresh_token' => $refreshTokenOriginal,
        ]);

        $segundoRefresh->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_TOKEN_REVOKED',
                ],
            ]);

        // 4. En la BD NO debe quedar NINGÚN refresh token activo para este usuario
        $activos = RefreshToken::where('usuario_id', $this->usuario->id)
            ->whereNull('revocado_en')
            ->count();

        $this->assertEquals(0, $activos, 'Todas las sesiones del usuario deben haber sido revocadas tras el reuso.');
    }
}
