<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegistroRequest extends FormRequest
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
     * Reglas de validación para el registro de usuarios.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100'],
            'correo' => ['required', 'string', 'email', 'max:150'],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
                'confirmed',
            ],
            'idioma' => ['nullable', 'string', 'in:es,de'],
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
            'nombre.required' => 'El campo nombre es obligatorio.',
            'nombre.string' => 'El nombre debe ser una cadena de texto.',
            'nombre.max' => 'El nombre no puede exceder los 100 caracteres.',

            'correo.required' => 'El campo correo es obligatorio.',
            'correo.email' => 'El correo electrónico no tiene un formato válido.',
            'correo.max' => 'El correo electrónico no puede exceder los 150 caracteres.',

            'password.required' => 'El campo contraseña es obligatorio.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',

            'idioma.in' => 'El idioma seleccionado debe ser es o de.',
        ];
    }
}
