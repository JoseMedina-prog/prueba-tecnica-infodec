<?php

namespace Tests\Unit;

use App\Models\Usuario;
use App\Services\TokenService;
use Illuminate\Support\Str;
use Tests\TestCase;

class TokenServiceTest extends TestCase
{
    /**
     * Prueba unitaria directa de emisión y validación de access tokens en TokenService.
     */
    public function test_token_service_emite_y_valida_access_tokens(): void
    {
        $usuario = new Usuario([
            'nombre' => 'Test Token',
            'correo' => 'token@travelapp.test',
            'idioma' => 'es',
        ]);
        $usuario->id = 42;

        $servicio = app(TokenService::class);
        $familiaId = (string) Str::uuid();

        $token = $servicio->emitirAccessToken($usuario, $familiaId);
        $this->assertIsString($token);
        $this->assertNotEmpty($token);

        $claims = $servicio->validarAccessToken($token);
        $this->assertEquals(42, $claims['sub']);
        $this->assertEquals($familiaId, $claims['sid']);
        $this->assertEquals('es', $claims['idioma']);
    }
}
