<?php

namespace App\Console\Commands;

use App\Exceptions\ApiException;
use App\Models\Ciudad;
use App\Models\Moneda;
use App\Services\ClimaService;
use App\Services\MonedaService;
use Illuminate\Console\Command;
use Throwable;

/**
 * Refresca los datos externos guardados: el clima de cada ciudad (en es y de) y la tasa COP de cada moneda.
 * Se programa cada hora en routes/console.php, pero nada depende de él: si el programador no corre,
 * ClimaService y MonedaService siguen usando su caché y su respaldo por sí solos.
 */
class ActualizarExternosCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'externos:actualizar';

    /**
     * @var string
     */
    protected $description = 'Actualiza el clima guardado de las ciudades (es y de) y las tasas de cambio COP';

    /** Idiomas en los que se guarda la descripción del clima. */
    private const IDIOMAS = ['es', 'de'];

    public function handle(ClimaService $climaService, MonedaService $monedaService): int
    {
        $filas = [];

        foreach (Ciudad::orderBy('codigo_iata')->get() as $ciudad) {
            foreach (self::IDIOMAS as $idioma) {
                $filas[] = $this->intentar(
                    'Clima',
                    "{$ciudad->codigo_iata} {$ciudad->nombre}",
                    $idioma,
                    function () use ($climaService, $ciudad, $idioma) {
                        $clima = $climaService->actualizar($ciudad, $idioma);
                        return "{$clima['temperatura']} °C · {$clima['descripcion']}";
                    }
                );
            }
        }

        foreach (Moneda::orderBy('codigo')->pluck('codigo') as $codigo) {
            $filas[] = $this->intentar(
                'Tasa',
                "COP → {$codigo}",
                '—',
                function () use ($monedaService, $codigo) {
                    $tasa = $monedaService->actualizarTasa($codigo);
                    return "{$tasa['tasa']} (fecha_tasa {$tasa['fecha_tasa']})";
                }
            );
        }

        $this->table(['Tipo', 'Destino', 'Idioma', 'Resultado', 'Detalle'], $filas);

        $fallidas = count(array_filter($filas, fn (array $fila) => $fila[3] !== 'ok'));
        $total = count($filas);

        if ($fallidas > 0) {
            // Código de salida 1 para que el programador lo registre como fallo parcial; los que sí respondieron quedaron guardados.
            $this->warn("{$fallidas} de {$total} actualizaciones fallaron; se conservan los datos guardados anteriores.");
            return self::FAILURE;
        }

        $this->info("{$total} actualizaciones correctas.");
        return self::SUCCESS;
    }

    /**
     * Ejecuta una actualización y la convierte en una fila de la tabla, sin dejar que un fallo detenga las demás.
     *
     * @return array{0: string, 1: string, 2: string, 3: string, 4: string}
     */
    private function intentar(string $tipo, string $destino, string $idioma, callable $accion): array
    {
        try {
            return [$tipo, $destino, $idioma, 'ok', $accion()];
        } catch (ApiException $e) {
            return [$tipo, $destino, $idioma, 'falló', $e->getErrorCode()];
        } catch (Throwable $e) {
            // Sin mensaje: podría incluir la URL con la clave de la API
            return [$tipo, $destino, $idioma, 'falló', class_basename($e)];
        }
    }
}
