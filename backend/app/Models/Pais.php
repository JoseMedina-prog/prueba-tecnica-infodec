<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Representa un país de destino turístico y su asociación con la moneda correspondiente.
 */
class Pais extends Model
{
    use HasFactory;

    protected $table = 'paises';

    protected $fillable = [
        'nombre',
        'codigo',
        'moneda_id',
    ];

    /**
     * Moneda oficial asociada al país.
     */
    public function moneda(): BelongsTo
    {
        return $this->belongsTo(Moneda::class, 'moneda_id');
    }

    /**
     * Ciudades turísticas registradas en este país.
     */
    public function ciudades(): HasMany
    {
        return $this->hasMany(Ciudad::class, 'pais_id');
    }
}
