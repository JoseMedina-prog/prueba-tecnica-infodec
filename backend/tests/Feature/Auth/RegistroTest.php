<?php

namespace Tests\Feature\Auth;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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
}

