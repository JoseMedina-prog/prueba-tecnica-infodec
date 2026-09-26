<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;

class SeguridadResumenCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seguridad:resumen
                            {--horas=24 : Número de horas hacia atrás a evaluar (por defecto: 24)}
                            {--trace= : Código de referencia (trace_id) concreto a investigar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analiza el registro estructurado de eventos de seguridad (seguridad.log) y genera un resumen';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $logPath = config('logging.channels.seguridad.path', storage_path('logs/seguridad.log'));

        if (!file_exists($logPath) || filesize($logPath) === 0) {
            $this->info("No se han registrado eventos en {$logPath} todavía.");
            return self::SUCCESS;
        }

        $lineas = file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        $eventos = [];

        foreach ($lineas as $linea) {
            $data = json_decode($linea, true);
            if (!is_array($data)) {
                continue;
            }

            // Monolog con JsonFormatter suele anidar el context
            $context = $data['context'] ?? [];
            $evento = $context['evento'] ?? $data['evento'] ?? $data['message'] ?? 'desconocido';
            $traceId = $context['trace_id'] ?? $data['trace_id'] ?? null;
            $ip = $context['ip'] ?? $data['ip'] ?? '127.0.0.1';
            $fecha = $context['fecha'] ?? $data['fecha'] ?? $data['datetime'] ?? null;
            $usuarioId = $context['usuario_id'] ?? $data['usuario_id'] ?? null;
            $correo = $context['correo'] ?? $data['correo'] ?? null;

            $eventos[] = [
                'evento' => $evento,
                'trace_id' => $traceId,
                'ip' => $ip,
                'fecha' => $fecha,
                'usuario_id' => $usuarioId,
                'correo' => $correo,
            ];
        }

        $traceFiltro = $this->option('trace');

        // Modo investigación por trace_id
        if ($traceFiltro) {
            $coincidencias = array_filter($eventos, fn ($e) => ($e['trace_id'] ?? '') === $traceFiltro);

            $this->info("=== Eventos de seguridad para trace_id: {$traceFiltro} ===");

            if (empty($coincidencias)) {
                $this->warn("No se encontraron eventos asociados al trace_id proporcionado.");
                return self::SUCCESS;
            }

            $filas = array_map(fn ($e) => [
                $e['fecha'] ?? '-',
                $e['evento'],
                $e['ip'],
                $e['usuario_id'] !== null ? (string) $e['usuario_id'] : '-',
                $e['correo'] ?? '-',
                $e['trace_id'],
            ], $coincidencias);

            $this->table(['Fecha', 'Evento', 'IP', 'Usuario ID', 'Correo', 'Trace ID'], $filas);

            return self::SUCCESS;
        }

        // Modo resumen por ventana de horas
        $horas = (int) ($this->option('horas') ?: 24);
        $limite = Carbon::now()->subHours($horas);

        $eventosPeriodo = array_filter($eventos, function ($e) use ($limite) {
            if (!$e['fecha']) {
                return true;
            }
            try {
                return Carbon::parse($e['fecha'])->greaterThanOrEqualTo($limite);
            } catch (\Throwable) {
                return true;
            }
        });

        $this->info("=== Resumen de eventos de seguridad (Últimas {$horas} horas) ===");

        // 1. Total por tipo de evento
        $conteoPorTipo = [];
        $conteoPorIp = [];

        foreach ($eventosPeriodo as $e) {
            $tipo = $e['evento'];
            $ip = $e['ip'];

            $conteoPorTipo[$tipo] = ($conteoPorTipo[$tipo] ?? 0) + 1;
            $conteoPorIp[$ip] = ($conteoPorIp[$ip] ?? 0) + 1;
        }

        $filasTipos = [];
        foreach ($conteoPorTipo as $tipo => $total) {
            $filasTipos[] = [$tipo, $total];
        }

        if (empty($filasTipos)) {
            $this->info("No se registraron eventos de seguridad en este periodo.");
            return self::SUCCESS;
        }

        $this->table(['Tipo de Evento', 'Total'], $filasTipos);

        // 2. Top 5 IPs con más eventos
        arsort($conteoPorIp);
        $top5Ips = array_slice($conteoPorIp, 0, 5, true);

        $filasIps = [];
        foreach ($top5Ips as $ip => $total) {
            $filasIps[] = [$ip, $total];
        }

        $this->info("=== Top 5 IPs con más eventos ===");
        $this->table(['Dirección IP', 'Total Eventos'], $filasIps);

        return self::SUCCESS;
    }
}
