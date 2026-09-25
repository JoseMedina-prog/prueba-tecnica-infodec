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
    protected array $details;

    public function __construct(
        int $statusCode,
        string $errorCode,
        string $message,
        array $details = []
    ) {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->errorCode = $errorCode;
        $this->details = $details;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getDetails(): array
    {
        return $this->details;
    }
}
