<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Representa una moneda extranjera aceptada en la plataforma para cotizaciones y presupuestos.
 */
class Moneda extends Model
{
    use HasFactory;

    protected $table = 'monedas';

    protected $fillable = [
        'codigo',
        'nombre',
        'simbolo',
    ];

    /**
     * Países que utilizan esta moneda como divisa oficial.
     */
    public function paises(): HasMany
    {
        return $this->hasMany(Pais::class, 'moneda_id');
    }
}
