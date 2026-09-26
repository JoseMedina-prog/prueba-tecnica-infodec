<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega el código IATA de 3 letras a cada ciudad (LON, TYO…).
 * Antes el frontend lo asignaba por id de ciudad, que depende del orden de inserción.
 *
 * Se hace en tres pasos para aplicarla sobre datos existentes sin perder nada:
 * 1. columna nullable, 2. se llenan los códigos por nombre de ciudad, 3. NOT NULL + UNIQUE.
 * En PostgreSQL la migración corre en una transacción: si algo falla, no queda nada a medias.
 */
return new class extends Migration
{
    /** Código IATA por nombre de ciudad (el mismo nombre que usa CiudadSeeder). */
    private const CODIGOS = [
        'Londres' => 'LON',
        'Mánchester' => 'MAN',
        'Tokio' => 'TYO',
        'Osaka' => 'OSA',
        'Nueva Delhi' => 'DEL',
        'Bombay' => 'BOM',
        'Copenhague' => 'CPH',
        'Aarhus' => 'AAR',
    ];

    public function up(): void
    {
        Schema::table('ciudades', function (Blueprint $table) {
            $table->char('codigo_iata', 3)->nullable();
        });

        foreach (self::CODIGOS as $nombre => $codigo) {
            DB::table('ciudades')->where('nombre', $nombre)->update(['codigo_iata' => $codigo]);
        }

        // Una ciudad sin código haría fallar el NOT NULL con un error poco claro: mejor avisar cuál es.
        $sinCodigo = DB::table('ciudades')->whereNull('codigo_iata')->pluck('nombre');
        if ($sinCodigo->isNotEmpty()) {
            throw new RuntimeException(
                'Ciudades sin código IATA conocido: ' . $sinCodigo->implode(', ')
                . '. Agrégalas a CODIGOS en esta migración antes de aplicarla.'
            );
        }

        Schema::table('ciudades', function (Blueprint $table) {
            $table->char('codigo_iata', 3)->nullable(false)->change();
            $table->unique('codigo_iata');
        });
    }

    public function down(): void
    {
        Schema::table('ciudades', function (Blueprint $table) {
            $table->dropUnique(['codigo_iata']);
            $table->dropColumn('codigo_iata');
        });
    }
};
