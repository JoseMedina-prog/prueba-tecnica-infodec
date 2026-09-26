<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta solicitud.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepara y normaliza los datos antes de la validación.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('correo') && is_string($this->correo)) {
            $this->merge([
                'correo' => strtolower(trim($this->correo)),
            ]);
        }
    }

    /**
     * Reglas de validación para el inicio de sesión.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'correo' => ['required', 'string', 'email:rfc,filter', 'max:150', 'not_regex:/[\x00-\x1F\x7F]/'],
            'password' => ['required', 'string', 'max:128'],
        ];
    }

    public function messages(): array
    {
        return [];
    }
}
