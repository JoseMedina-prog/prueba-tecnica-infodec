<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Representa un token de refresco con rotación por familia y hash SHA-256 para emisión de nuevos access tokens.
 */
class RefreshToken extends Model
{
    use HasFactory;

    protected $table = 'refresh_tokens';

    protected $fillable = [
        'usuario_id',
        'token_hash',
        'familia_id',
        'expira_en',
        'usado_en',
        'revocado_en',
    ];

    protected function casts(): array
    {
        return [
            'expira_en' => 'datetime',
            'usado_en' => 'datetime',
            'revocado_en' => 'datetime',
        ];
    }

    /**
     * Usuario propietario del refresh token.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
