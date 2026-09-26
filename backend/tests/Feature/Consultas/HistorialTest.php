<?php

namespace Tests\Feature\Consultas;

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

class HistorialTest extends TestCase
{
    use RefreshDatabase, CreaTokens;

    protected Usuario $usuarioA;
    protected Usuario $usuarioB;
    protected string $tokenA;
    protected string $tokenB;
    protected Ciudad $ciudad;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            MonedaSeeder::class,
            PaisSeeder::class,
            CiudadSeeder::class,
        ]);

        $this->usuarioA = Usuario::create([
            'nombre' => 'Usuario A',
            'correo' => 'usuarioA@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'es',
        ]);

        $this->usuarioB = Usuario::create([
            'nombre' => 'Usuario B',
            'correo' => 'usuarioB@travelapp.test',
            'password_hash' => Hash::make('ClaveSegura123'),
            'idioma' => 'de',
        ]);

        $this->tokenA = $this->crearTokenValido($this->usuarioA);
        $this->tokenB = $this->crearTokenValido($this->usuarioB);
        $this->ciudad = Ciudad::first();
    }

    /**
     * Prueba Extra
     * El usuario A no ve las consultas del usuario B y el historial devuelve máximo 5 registros en orden desc.
     */
    public function test_historial_aislado_por_usuario_y_maximo_5_consultas(): void
    {
        // Crear 7 consultas para Usuario A
        for ($i = 1; $i <= 7; $i++) {
            Consulta::create([
                'usuario_id' => $this->usuarioA->id,
                'ciudad_id' => $this->ciudad->id,
                'presupuesto_cop' => 100000 * $i,
                'clima_temperatura' => 20.0,
                'clima_descripcion' => 'soleado',
                'tasa' => 0.05,
                'valor_convertido' => 5000 * $i,
                'fecha_tasa' => now(),
            ]);
            usleep(5000);
        }

        // Crear 2 consultas para Usuario B
        for ($j = 1; $j <= 2; $j++) {
            Consulta::create([
                'usuario_id' => $this->usuarioB->id,
                'ciudad_id' => $this->ciudad->id,
                'presupuesto_cop' => 50000 * $j,
                'clima_temperatura' => 15.0,
                'clima_descripcion' => 'nublado',
                'tasa' => 0.05,
                'valor_convertido' => 2500 * $j,
                'fecha_tasa' => now(),
            ]);
            usleep(5000);
        }

        // 1. Consulta del historial de Usuario A
        $resA = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/consultas/historial');

        $resA->assertStatus(200);
        $itemsA = $resA->json('data');
        $this->assertCount(5, $itemsA, 'El usuario A debe ver un máximo de 5 consultas.');

        // Verificar orden descendente de las más recientes
        $presupuestosA = array_column($itemsA, 'presupuesto_cop');
        $this->assertEquals([700000, 600000, 500000, 400000, 300000], $presupuestosA);

        // Ids de país y ciudad: el frontend los usa para "Repetir consulta"
        $this->assertSame($this->ciudad->pais_id, $itemsA[0]['pais']['id']);
        $this->assertSame($this->ciudad->id, $itemsA[0]['ciudad']['id']);

        // 2. Consulta del historial de Usuario B
        $resB = $this->withHeader('Authorization', "Bearer {$this->tokenB}")
            ->getJson('/api/consultas/historial');

        $resB->assertStatus(200);
        $itemsB = $resB->json('data');
        $this->assertCount(2, $itemsB, 'El usuario B debe ver exactamente sus 2 consultas.');

        $presupuestosB = array_column($itemsB, 'presupuesto_cop');
        $this->assertEquals([100000, 50000], $presupuestosB);
    }
}
