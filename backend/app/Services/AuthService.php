<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Usuario;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Hash;

/**
 * Servicio encargado de la lógica de autenticación y gestión de usuarios.
 */
class AuthService
{
    /**
     * Registra un nuevo usuario en la plataforma.
     *
     * @param array $datos Datos validados del formulario de registro
     * @return Usuario
     * @throws ApiException Si el correo ya existe (409) o falla la inserción
     */
    public function registrar(array $datos): Usuario
    {
        $correo = strtolower(trim($datos['correo']));

        // Verificación previa de existencia de correo
        if (Usuario::where('correo', $correo)->exists()) {
            throw new ApiException(
                409,
                'USER_ALREADY_EXISTS',
                'El correo electrónico ya se encuentra registrado.'
            );
        }

        try {
            // Se genera el hash de la contraseña usando el algoritmo seguro por defecto (Bcrypt)
            return Usuario::create([
                'nombre' => trim($datos['nombre']),
                'correo' => $correo,
                'password_hash' => Hash::make($datos['password']),
                'idioma' => $datos['idioma'] ?? 'es',
            ]);
        } catch (QueryException $e) {
            // Manejo de condición de carrera / colisión concurrente (código 23505 en PostgreSQL)
            if ($e->getCode() === '23505' || str_contains($e->getMessage(), 'usuarios_correo_unique')) {
                throw new ApiException(
                    409,
                    'USER_ALREADY_EXISTS',
                    'El correo electrónico ya se encuentra registrado.'
                );
            }

            throw $e;
        }
    }
}
