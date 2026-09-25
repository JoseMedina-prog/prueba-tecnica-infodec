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
        Schema::create('tasas_cambio', function (Blueprint $table) {
            $table->id();
            $table->char('moneda_origen', 3);
            $table->char('moneda_destino', 3);
            $table->decimal('tasa', 20, 10);
            $table->timestamp('fecha_tasa');
            $table->timestamps();

            $table->index(['moneda_origen', 'moneda_destino', 'fecha_tasa']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasas_cambio');
    }
};
