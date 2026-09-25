<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Pais;
use Illuminate\Database\Eloquent\Collection;

class PaisService
{
    /**
     * Retorna la lista de países ordenados por nombre, precargando la relación de moneda (with)
     * para evitar el problema de consultas N+1.
     *
     * @return Collection
     */
    public function listar(): Collection
    {
        return Pais::with('moneda')->orderBy('nombre', 'asc')->get();
    }

    /**
     * Retorna las ciudades pertenecientes a un país específico, ordenadas por nombre.
     *
     * @param int $paisId Identificador del país
     * @return Collection
     * @throws ApiException Si el país no existe (404 NOT_FOUND)
     */
    public function ciudadesDe(int $paisId): Collection
    {
        $pais = Pais::find($paisId);

        if (!$pais) {
            throw new ApiException(404, 'NOT_FOUND');
        }

        return $pais->ciudades()->orderBy('nombre', 'asc')->get();
    }
}
