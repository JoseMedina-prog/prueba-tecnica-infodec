<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaisResource extends JsonResource
{
    /**
     * Transforma el recurso de país en un array para la respuesta JSON.
     * Incluye datos traducidos del país y su moneda asociada, excluyendo timestamps.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $traducidoPais = __("lugares.paises.{$this->codigo}");
        $nombrePais = ($traducidoPais !== "lugares.paises.{$this->codigo}") ? $traducidoPais : $this->nombre;

        $monedaData = null;
        if ($this->moneda) {
            $traducidoMoneda = __("lugares.monedas.{$this->moneda->codigo}");
            $nombreMoneda = ($traducidoMoneda !== "lugares.monedas.{$this->moneda->codigo}") ? $traducidoMoneda : $this->moneda->nombre;

            $monedaData = [
                'codigo' => $this->moneda->codigo,
                'nombre' => $nombreMoneda,
                'simbolo' => $this->moneda->simbolo,
            ];
        }

        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'nombre' => $nombrePais,
            'moneda' => $monedaData,
        ];
    }
}
