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
            'correo' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Mensajes personalizados de error en español.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'correo.required' => 'El campo correo es obligatorio.',
            'correo.email' => 'El correo electrónico no tiene un formato válido.',
            'password.required' => 'El campo contraseña es obligatorio.',
            'password.string' => 'La contraseña debe ser una cadena de texto.',
        ];
    }
}
