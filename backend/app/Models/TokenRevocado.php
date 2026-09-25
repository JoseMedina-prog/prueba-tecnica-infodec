<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Representa un JTI (JWT ID) de access token revocado antes de su expiración natural.
 */
class TokenRevocado extends Model
{
    use HasFactory;

    protected $table = 'tokens_revocados';

    /**
     * Esta tabla solo almacena la fecha de creación (no requiere updated_at).
     */
    const UPDATED_AT = null;

    protected $fillable = [
        'jti',
        'usuario_id',
        'expira_en',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'expira_en' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Usuario titular del token revocado.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
