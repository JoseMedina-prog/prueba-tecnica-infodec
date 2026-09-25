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
        $paises = Pais::with('moneda')->get();

        return $paises->sortBy(function ($pais) {
            $traducido = __("lugares.paises.{$pais->codigo}");
            return ($traducido !== "lugares.paises.{$pais->codigo}") ? $traducido : $pais->nombre;
        }, SORT_LOCALE_STRING)->values();
    }

    /**
     * Retorna las ciudades pertenecientes a un país específico, ordenadas por su nombre traducido.
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

        $ciudades = $pais->ciudades()->get();

        return $ciudades->sortBy(function ($ciudad) {
            $traducido = __("lugares.ciudades.{$ciudad->nombre}");
            return ($traducido !== "lugares.ciudades.{$ciudad->nombre}") ? $traducido : $ciudad->nombre;
        }, SORT_LOCALE_STRING)->values();
    }
}
