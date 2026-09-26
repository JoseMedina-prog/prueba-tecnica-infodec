<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Fila del tablero de salidas público (pantalla de login).
 * Solo expone el código IATA y los nombres traducidos de la ciudad y el país:
 * sin ids, coordenadas, monedas ni timestamps.
 */
class SalidaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'codigo_iata' => $this->codigo_iata,
            'ciudad' => $this->traducir('ciudades', $this->nombre, $this->nombre),
            'pais' => $this->traducir('paises', $this->pais->codigo, $this->pais->nombre),
        ];
    }

    /** Nombre traducido según Accept-Language; si no hay traducción, el nombre guardado. */
    private function traducir(string $grupo, string $clave, string $respaldo): string
    {
        $traducido = __("lugares.{$grupo}.{$clave}");

        return $traducido !== "lugares.{$grupo}.{$clave}" ? $traducido : $respaldo;
    }
}
