<?php

return [
    'required' => 'Das Feld :attribute ist erforderlich.',
    'string' => 'Das Feld :attribute muss eine Zeichenkette sein.',
    'email' => 'Das Feld :attribute muss eine gültige E-Mail-Adresse sein.',
    'max' => [
        'numeric' => 'Das Feld :attribute darf nicht größer als :max sein.',
        'string' => 'Das Feld :attribute darf maximal :max Zeichen lang sein.',
    ],
    'min' => [
        'numeric' => 'Das Feld :attribute muss mindestens :min sein.',
        'string' => 'Das Feld :attribute muss mindestens :min Zeichen lang sein.',
    ],
    'confirmed' => 'Die Bestätigung für :attribute stimmt nicht überein.',
    'in' => 'Der ausgewählte Wert für :attribute ist ungültig.',
    'regex' => 'Das Format von :attribute ist ungültig.',
    'numeric' => 'Das Feld :attribute muss eine Zahl sein.',
    'gt' => [
        'numeric' => 'Das Feld :attribute muss größer als :value sein.',
    ],
    'integer' => 'Das Feld :attribute muss eine ganze Zahl sein.',
    'exists' => 'Der ausgewählte Wert für :attribute ist nicht vorhanden.',
    'decimal' => 'Das Feld :attribute muss :decimal Dezimalstellen haben.',

    'custom' => [
        'password' => [
            'regex' => 'Das Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten.',
            'confirmed' => 'Die Passwortbestätigung stimmt nicht überein.',
        ],
        'idioma' => [
            'in' => 'Die ausgewählte Sprache muss es oder de sein.',
        ],
    ],

    'attributes' => [
        'nombre' => 'Name',
        'correo' => 'E-Mail',
        'password' => 'Passwort',
        'password_confirmation' => 'Passwortbestätigung',
        'refresh_token' => 'Refresh-Token',
        'idioma' => 'Sprache',
        'presupuesto' => 'Budget',
        'ciudad_id' => 'Stadt',
        'moneda_origen_id' => 'Ausgangswährung',
        'moneda_destino_id' => 'Zielwährung',
        'monto' => 'Betrag',
    ],
];
