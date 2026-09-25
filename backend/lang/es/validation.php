<?php

return [
    'required' => 'El campo :attribute es obligatorio.',
    'string' => 'El campo :attribute debe ser una cadena de texto.',
    'email' => 'El campo :attribute debe ser un correo electrónico válido.',
    'max' => [
        'numeric' => 'El campo :attribute no debe ser mayor a :max.',
        'string' => 'El campo :attribute no puede exceder los :max caracteres.',
    ],
    'min' => [
        'numeric' => 'El campo :attribute debe ser de al menos :min.',
        'string' => 'El campo :attribute debe tener al menos :min caracteres.',
    ],
    'confirmed' => 'La confirmación de :attribute no coincide.',
    'in' => 'El campo :attribute seleccionado es inválido.',
    'regex' => 'El formato del campo :attribute es inválido.',
    'numeric' => 'El campo :attribute debe ser un número.',
    'gt' => [
        'numeric' => 'El campo :attribute debe ser mayor que :value.',
    ],
    'integer' => 'El campo :attribute debe ser un número entero.',
    'exists' => 'El campo :attribute seleccionado no existe.',

    'custom' => [
        'password' => [
            'regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
            'confirmed' => 'La confirmación de la contraseña no coincide.',
        ],
        'idioma' => [
            'in' => 'El idioma seleccionado debe ser es o de.',
        ],
    ],

    'attributes' => [
        'nombre' => 'nombre',
        'correo' => 'correo',
        'password' => 'contraseña',
        'password_confirmation' => 'confirmación de la contraseña',
        'refresh_token' => 'refresh_token',
        'idioma' => 'idioma',
        'presupuesto' => 'presupuesto',
        'ciudad_id' => 'ciudad',
        'moneda_origen_id' => 'moneda de origen',
        'moneda_destino_id' => 'moneda de destino',
        'monto' => 'monto',
    ],
];
