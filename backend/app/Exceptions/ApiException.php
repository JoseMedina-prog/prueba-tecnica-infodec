<?php

namespace App\Exceptions;

use Exception;

/**
 * Excepción de dominio para errores controlados de la API.
 */
class ApiException extends Exception
{
    protected int $statusCode;
    protected string $errorCode;
    protected ?string $messageKey;
    protected array $details;
    protected array $headers;

    public function __construct(
        int $statusCode,
        string $errorCode,
        ?string $messageKey = null,
        array $details = [],
        array $headers = []
    ) {
        $this->statusCode = $statusCode;
        $this->errorCode = $errorCode;
        $this->messageKey = $messageKey;
        $this->details = $details;
        $this->headers = $headers;

        parent::__construct($messageKey ?? $errorCode);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getMessageKey(): ?string
    {
        return $this->messageKey;
    }

    /**
     * Resuelve el mensaje traducido según el idioma activo en el momento de responder.
     */
    public function getErrorMessage(): string
    {
        $key = $this->messageKey ?? $this->errorCode;
        $traducido = __("api.{$key}");

        // Si la clave específica no existe, intenta con el código de error
        if ($traducido === "api.{$key}") {
            $fallback = __("api.{$this->errorCode}");
            return $fallback !== "api.{$this->errorCode}" ? $fallback : $this->errorCode;
        }

        return $traducido;
    }

    public function getDetails(): array
    {
        return $this->details;
    }

    public function getHeaders(): array
    {
        return $this->headers;
    }
}
