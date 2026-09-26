<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Caché y respaldo del clima:
 * a) Tabla climas: último clima obtenido de OpenWeatherMap por ciudad e idioma (la descripción
 *    viene traducida por la API, por eso el idioma es parte de la clave).
 * b) consultas.clima_obtenido_en: de cuándo es el clima guardado en cada consulta.
 * Solo agrega estructura: no toca ni borra datos existentes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('climas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ciudad_id')->constrained('ciudades')->cascadeOnDelete();
            $table->char('idioma', 2);
            $table->decimal('temperatura', 5, 2);
            $table->string('descripcion');
            $table->string('icono');
            $table->timestamp('obtenido_en');
            $table->timestamps();

            $table->unique(['ciudad_id', 'idioma']);
        });

        Schema::table('consultas', function (Blueprint $table) {
            $table->timestamp('clima_obtenido_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('consultas', function (Blueprint $table) {
            $table->dropColumn('clima_obtenido_en');
        });

        Schema::dropIfExists('climas');
    }
};
