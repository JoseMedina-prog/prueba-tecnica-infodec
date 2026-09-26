<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'weather' => [
        'key' => env('WEATHER_API_KEY'),
        'base_url' => env('WEATHER_BASE_URL', env('WEATHER_API_URL', 'https://api.openweathermap.org/data/2.5')),
        'timeout' => (float) env('WEATHER_TIMEOUT', env('WEATHER_API_TIMEOUT', 5.0)),
        // Un clima guardado con menos de estos minutos se sirve sin llamar a la API (fuente "cache").
        'cache_minutos' => (int) env('WEATHER_CACHE_MINUTOS', 30),
        // Si la API falla, se usa el último clima guardado si tiene menos de estas horas (fuente "respaldo").
        'respaldo_horas' => (int) env('WEATHER_RESPALDO_HORAS', 24),
    ],

    'exchange' => [
        'key' => env('EXCHANGE_API_KEY'),
        'base_url' => env('EXCHANGE_BASE_URL', env('EXCHANGE_API_URL', 'https://v6.exchangerate-api.com/v6')),
        'timeout' => (float) env('EXCHANGE_TIMEOUT', env('EXCHANGE_API_TIMEOUT', 5.0)),
        // Una tasa del día (UTC) u obtenida hace menos de estas horas se sirve sin llamar a la API (fuente "cache").
        'cache_horas' => (int) env('EXCHANGE_CACHE_HORAS', 6),
    ],

];
