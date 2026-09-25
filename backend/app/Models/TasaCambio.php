<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Representa un registro de tasa de cambio histórica u obtenida de la API externa para conversiones.
 */
class TasaCambio extends Model
{
    use HasFactory;

    protected $table = 'tasas_cambio';

    protected $fillable = [
        'moneda_origen',
        'moneda_destino',
        'tasa',
        'fecha_tasa',
    ];

    protected function casts(): array
    {
        return [
            'tasa' => 'decimal:10',
            'fecha_tasa' => 'datetime',
        ];
    }
}
