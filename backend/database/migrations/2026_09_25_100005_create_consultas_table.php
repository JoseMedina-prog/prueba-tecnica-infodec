<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('consultas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('ciudad_id')->constrained('ciudades')->restrictOnDelete();
            $table->decimal('presupuesto_cop', 15, 2);
            $table->decimal('clima_temperatura', 5, 2)->nullable();
            $table->string('clima_descripcion')->nullable();
            $table->decimal('tasa', 20, 10)->nullable();
            $table->decimal('valor_convertido', 18, 2)->nullable();
            $table->timestamp('fecha_tasa')->nullable();
            $table->timestamps();

            $table->index(['usuario_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultas');
    }
};
