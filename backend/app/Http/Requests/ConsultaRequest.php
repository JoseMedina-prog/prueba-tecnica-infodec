<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConsultaRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para realizar la solicitud.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para la creación de una consulta de viaje.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ciudad_id' => ['required', 'integer', 'exists:ciudades,id'],
            'presupuesto' => ['required', 'numeric', 'gt:0', 'decimal:0,2', 'max:9999999999999.99'],
        ];
    }
}
