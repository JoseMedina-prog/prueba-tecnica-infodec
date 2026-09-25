<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Representa un usuario registrado en el sistema con credenciales de acceso y preferencias.
 */
class Usuario extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [
        'nombre',
        'correo',
        'password_hash',
        'idioma',
    ];

    protected $hidden = [
        'password_hash',
    ];

    /**
     * Sobrescribe el método de autenticación de Laravel para usar password_hash en lugar de password.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Historial de consultas turísticas realizadas por el usuario.
     */
    public function consultas(): HasMany
    {
        return $this->hasMany(Consulta::class, 'usuario_id');
    }

    /**
     * Refresh tokens emitidos para este usuario.
     */
    public function refreshTokens(): HasMany
    {
        return $this->hasMany(RefreshToken::class, 'usuario_id');
    }

    /**
     * Tokens revocados asociados a este usuario.
     */
    public function tokensRevocados(): HasMany
    {
        return $this->hasMany(TokenRevocado::class, 'usuario_id');
    }
}
