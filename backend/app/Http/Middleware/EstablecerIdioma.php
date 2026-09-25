<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class EstablecerIdioma
{
    /**
     * Establece el idioma de la aplicación según la cabecera Accept-Language.
     * Si empieza por "de", establece 'de'; para cualquier otro valor o ausencia, establece 'es'.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $acceptLanguage = $request->header('Accept-Language', '');

        if (str_starts_with(strtolower(trim($acceptLanguage)), 'de')) {
            App::setLocale('de');
        } else {
            App::setLocale('es');
        }

        return $next($request);
    }
}
