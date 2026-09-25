<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Representa una consulta de destino con cálculo de presupuesto en moneda extranjera y datos meteorológicos.
 */
class Consulta extends Model
{
    use HasFactory;

    protected $table = 'consultas';

    protected $fillable = [
        'usuario_id',
        'ciudad_id',
        'presupuesto_cop',
        'clima_temperatura',
        'clima_descripcion',
        'tasa',
        'valor_convertido',
        'fecha_tasa',
    ];

    protected function casts(): array
    {
        return [
            'presupuesto_cop' => 'decimal:2',
            'clima_temperatura' => 'decimal:2',
            'tasa' => 'decimal:10',
            'valor_convertido' => 'decimal:2',
            'fecha_tasa' => 'datetime',
        ];
    }

    /**
     * Usuario que realizó la consulta turística.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Ciudad consultada.
     */
    public function ciudad(): BelongsTo
    {
        return $this->belongsTo(Ciudad::class, 'ciudad_id');
    }
}
