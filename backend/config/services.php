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
        'base_url' => env('WEATHER_API_URL', 'https://api.weatherapi.com/v1'),
        'timeout' => (float) env('WEATHER_API_TIMEOUT', 5.0),
    ],

    'exchange' => [
        'key' => env('EXCHANGE_API_KEY'),
        'base_url' => env('EXCHANGE_API_URL', 'https://v6.exchangerate-api.com/v6'),
        'timeout' => (float) env('EXCHANGE_API_TIMEOUT', 5.0),
    ],

];
