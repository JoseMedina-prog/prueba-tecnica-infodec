<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Token Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for custom JWT / HMAC token generation and validation.
    | - secret: Base64 decoded or raw secret key used for signing tokens.
    | - access_ttl: Lifespan of access tokens in minutes (default 15 mins).
    | - refresh_ttl: Lifespan of refresh tokens in days (default 7 days).
    |
    */

    'secret' => env('APP_TOKEN_SECRET'),

    'access_ttl' => (int) env('TOKEN_ACCESS_TTL', 15),

    'refresh_ttl' => (int) env('TOKEN_REFRESH_TTL', 7),

];
