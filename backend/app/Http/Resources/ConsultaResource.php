<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConsultaResource extends JsonResource
{
    /**
     * Transforma la consulta en un array para el historial.
     * Mantiene la misma estructura que la creación, sin icono ni fuente (no persistidos)
     * y sin avisos. Si clima o tasa no están disponibles, retornan null.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $ciudad = $this->ciudad;
        $pais = $ciudad?->pais;
        $moneda = $pais?->moneda;

        $traducidoPais = $pais ? __("lugares.paises.{$pais->codigo}") : '';
        $nombrePais = ($traducidoPais !== "lugares.paises.{$pais?->codigo}") ? $traducidoPais : $pais?->nombre;

        $traducidoCiudad = $ciudad ? __("lugares.ciudades.{$ciudad->nombre}") : '';
        $nombreCiudad = ($traducidoCiudad !== "lugares.ciudades.{$ciudad?->nombre}") ? $traducidoCiudad : $ciudad?->nombre;

        $traducidoMoneda = $moneda ? __("lugares.monedas.{$moneda->codigo}") : '';
        $nombreMoneda = ($traducidoMoneda !== "lugares.monedas.{$moneda?->codigo}") ? $traducidoMoneda : $moneda?->nombre;

        return [
            'id' => $this->id,
            'fecha' => $this->created_at?->toIso8601String(),
            'pais' => [
                'codigo' => $pais?->codigo,
                'nombre' => $nombrePais,
            ],
            'ciudad' => [
                'id' => $ciudad?->id,
                'nombre' => $nombreCiudad,
            ],
            'presupuesto_cop' => (float) $this->presupuesto_cop,
            'clima' => $this->clima_temperatura !== null ? [
                'temperatura' => (float) $this->clima_temperatura,
                'descripcion' => $this->clima_descripcion,
            ] : null,
            'moneda' => [
                'codigo' => $moneda?->codigo,
                'nombre' => $nombreMoneda,
                'simbolo' => $moneda?->simbolo,
            ],
            'conversion' => $this->valor_convertido !== null ? [
                'valor' => (float) $this->valor_convertido,
                'tasa' => (float) $this->tasa,
                'fecha_tasa' => $this->fecha_tasa?->toIso8601String(),
            ] : null,
        ];
    }
}
