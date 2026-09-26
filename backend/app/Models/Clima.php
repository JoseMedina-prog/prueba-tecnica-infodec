<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Último clima obtenido de OpenWeatherMap para una ciudad en un idioma.
 * Sirve de caché (evita llamadas repetidas) y de respaldo si la API falla.
 */
class Clima extends Model
{
    protected $table = 'climas';

    protected $fillable = [
        'ciudad_id',
        'idioma',
        'temperatura',
        'descripcion',
        'icono',
        'obtenido_en',
    ];

    protected function casts(): array
    {
        return [
            'temperatura' => 'decimal:2',
            'obtenido_en' => 'datetime',
        ];
    }

    /**
     * Ciudad a la que pertenece este clima.
     */
    public function ciudad(): BelongsTo
    {
        return $this->belongsTo(Ciudad::class, 'ciudad_id');
    }
}
