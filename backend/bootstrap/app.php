<?php

use App\Exceptions\ApiException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->prependToGroup('api', [
            \App\Http\Middleware\AsignarTraceId::class,
            \App\Http\Middleware\EstablecerIdioma::class,
        ]);

        $middleware->alias([
            'auth.token' => \App\Http\Middleware\AuthTokenMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontFlash([
            'password',
            'password_confirmation',
            'refresh_token',
        ]);

        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $traceId = $request->attributes->get('trace_id') ?? (string) Str::uuid();

                // Asegurar que el idioma esté sincronizado con Accept-Language incluso si la excepción
                // ocurrió antes de que EstablecerIdioma se ejecutara
                $acceptLanguage = $request->header('Accept-Language', '');
                if (str_starts_with(strtolower(trim($acceptLanguage)), 'de')) {
                    \Illuminate\Support\Facades\App::setLocale('de');
                } else {
                    \Illuminate\Support\Facades\App::setLocale('es');
                }

                $headers = ['X-Trace-Id' => $traceId];

                if ($e instanceof ApiException) {
                    $error = [
                        'code' => $e->getErrorCode(),
                        'message' => $e->getErrorMessage(),
                    ];

                    if (!empty($e->getDetails())) {
                        $error['details'] = $e->getDetails();
                    }

                    if ($e->getStatusCode() >= 400 && $e->getStatusCode() < 500) {
                        Log::info("Error 4xx [{$e->getStatusCode()} {$e->getErrorCode()}] en ruta: {$request->path()}");
                    }

                    return response()->json([
                        'success' => false,
                        'error' => $error,
                        'trace_id' => $traceId,
                    ], $e->getStatusCode(), array_merge($headers, $e->getHeaders()));
                }

                if ($e instanceof ValidationException) {
                    $details = [];
                    foreach ($e->errors() as $field => $messages) {
                        foreach ($messages as $message) {
                            $details[] = [
                                'field' => $field,
                                'message' => $message,
                            ];
                        }
                    }

                    Log::info("Error 4xx [422 VALIDATION_ERROR] en ruta: {$request->path()}");

                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'VALIDATION_ERROR',
                            'message' => __('api.VALIDATION_ERROR'),
                            'details' => $details,
                        ],
                        'trace_id' => $traceId,
                    ], 422, $headers);
                }

                if ($e instanceof NotFoundHttpException || $e instanceof ModelNotFoundException) {
                    Log::info("Error 4xx [404 NOT_FOUND] en ruta: {$request->path()}");

                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'NOT_FOUND',
                            'message' => __('api.NOT_FOUND'),
                        ],
                        'trace_id' => $traceId,
                    ], 404, $headers);
                }

                if ($e instanceof MethodNotAllowedHttpException) {
                    Log::info("Error 4xx [405 METHOD_NOT_ALLOWED] en ruta: {$request->path()}");

                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'METHOD_NOT_ALLOWED',
                            'message' => __('api.METHOD_NOT_ALLOWED'),
                        ],
                        'trace_id' => $traceId,
                    ], 405, array_merge($headers, $e->getHeaders()));
                }

                if ($e instanceof ThrottleRequestsException) {
                    Log::info("Error 4xx [429 TOO_MANY_ATTEMPTS] en ruta: {$request->path()}");

                    $throttleHeaders = method_exists($e, 'getHeaders') ? $e->getHeaders() : [];

                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'TOO_MANY_ATTEMPTS',
                            'message' => __('api.TOO_MANY_ATTEMPTS'),
                        ],
                        'trace_id' => $traceId,
                    ], 429, array_merge($headers, $throttleHeaders));
                }

                if ($e instanceof HttpExceptionInterface) {
                    $status = $e->getStatusCode();
                    if ($status >= 400 && $status < 500) {
                        Log::info("Error 4xx [{$status} HTTP_ERROR] en ruta: {$request->path()}");
                    }

                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'HTTP_ERROR',
                            'message' => $e->getMessage() ?: __('api.INTERNAL_ERROR'),
                        ],
                        'trace_id' => $traceId,
                    ], $status, array_merge($headers, $e->getHeaders()));
                }

                // Fallback 500: registrar excepción real en el log con clase, archivo y línea
                // (el trace_id ya está en el contexto del log via Log::withContext)
                Log::error("Error 500 interno: " . $e->getMessage(), [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);

                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INTERNAL_ERROR',
                        'message' => __('api.INTERNAL_ERROR'),
                    ],
                    'trace_id' => $traceId,
                ], 500, $headers);
            }
        });
    })->create();
