<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Representa una ciudad destino con sus coordenadas geográficas para consultas meteorológicas.
 */
class Ciudad extends Model
{
    use HasFactory;

    protected $table = 'ciudades';

    protected $fillable = [
        'pais_id',
        'nombre',
        'latitud',
        'longitud',
    ];

    protected function casts(): array
    {
        return [
            'latitud' => 'decimal:6',
            'longitud' => 'decimal:6',
        ];
    }

    /**
     * País al que pertenece la ciudad.
     */
    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_id');
    }

    /**
     * Consultas turísticas realizadas para esta ciudad.
     */
    public function consultas(): HasMany
    {
        return $this->hasMany(Consulta::class, 'ciudad_id');
    }
}
