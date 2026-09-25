<?php

use App\Exceptions\ApiException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $traceId = (string) Str::uuid();

                if ($e instanceof ApiException) {
                    $error = [
                        'code' => $e->getErrorCode(),
                        'message' => $e->getMessage(),
                    ];

                    if (!empty($e->getDetails())) {
                        $error['details'] = $e->getDetails();
                    }

                    return response()->json([
                        'success' => false,
                        'error' => $error,
                        'trace_id' => $traceId,
                    ], $e->getStatusCode());
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

                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'VALIDATION_ERROR',
                            'message' => 'Error de validación en los datos enviados.',
                            'details' => $details,
                        ],
                        'trace_id' => $traceId,
                    ], 422);
                }

                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INTERNAL_ERROR',
                        'message' => 'Ocurrió un error interno en el servidor.',
                    ],
                    'trace_id' => $traceId,
                ], 500);
            }
        });
    })->create();
