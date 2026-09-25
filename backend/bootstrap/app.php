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
                    ], $e->getStatusCode(), $e->getHeaders());
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

                if ($e instanceof NotFoundHttpException || $e instanceof ModelNotFoundException) {
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'NOT_FOUND',
                            'message' => 'El recurso solicitado no fue encontrado.',
                        ],
                        'trace_id' => $traceId,
                    ], 404);
                }

                if ($e instanceof MethodNotAllowedHttpException) {
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'METHOD_NOT_ALLOWED',
                            'message' => 'El método HTTP no está permitido para esta ruta.',
                        ],
                        'trace_id' => $traceId,
                    ], 405);
                }

                if ($e instanceof ThrottleRequestsException) {
                    $headers = method_exists($e, 'getHeaders') ? $e->getHeaders() : [];

                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'TOO_MANY_ATTEMPTS',
                            'message' => 'Demasiados intentos. Por favor intente más tarde.',
                        ],
                        'trace_id' => $traceId,
                    ], 429, $headers);
                }

                if ($e instanceof HttpExceptionInterface) {
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'HTTP_ERROR',
                            'message' => $e->getMessage() ?: 'Error en la petición HTTP.',
                        ],
                        'trace_id' => $traceId,
                    ], $e->getStatusCode(), $e->getHeaders());
                }

                // Fallback 500: registrar excepción real en el log con el trace_id sin exponer datos al cliente
                Log::error("Error 500 interno [trace_id: {$traceId}]: " . $e->getMessage(), [
                    'trace_id' => $traceId,
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);

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
