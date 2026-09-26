<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CiudadResource extends JsonResource
{
    /**
     * Transforma el recurso de ciudad en un array para la respuesta JSON.
     * Excluye deliberadamente timestamps y coordenadas (latitud/longitud).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $traducido = __("lugares.ciudades.{$this->nombre}");
        $nombre = ($traducido !== "lugares.ciudades.{$this->nombre}") ? $traducido : $this->nombre;

        return [
            'id' => $this->id,
            'nombre' => $nombre,
            'codigo_iata' => $this->codigo_iata,
        ];
    }
}
