<?php

return [
    'BAD_REQUEST' => 'Petición incorrecta o formato JSON inválido.',
    'AUTH_INVALID_CREDENTIALS' => 'Correo o contraseña inválidos.',
    'AUTH_TOKEN_MISSING' => 'El token de autenticación no fue proporcionado.',
    'AUTH_TOKEN_INVALID' => 'El token de autenticación es inválido.',
    'AUTH_TOKEN_EXPIRED' => 'El token ha expirado.',
    'AUTH_TOKEN_REVOKED' => 'El token ha sido revocado.',
    'FORBIDDEN' => 'No tiene permisos para realizar esta acción.',
    'NOT_FOUND' => 'El recurso solicitado no fue encontrado.',
    'USER_ALREADY_EXISTS' => 'El correo electrónico ya se encuentra registrado.',
    'VALIDATION_ERROR' => 'Error de validación en los datos enviados.',
    'TOO_MANY_ATTEMPTS' => 'Demasiados intentos. Por favor intente más tarde.',
    'EXTERNAL_API_ERROR' => 'Error al comunicarse con el servicio externo.',
    'EXTERNAL_API_TIMEOUT' => 'Tiempo de espera agotado al comunicarse con el servicio externo.',
    'INTERNAL_ERROR' => 'Ocurrió un error interno en el servidor.',
    'METHOD_NOT_ALLOWED' => 'El método HTTP no está permitido para esta ruta.',

    // Mensajes especiales y avisos
    'AUTH_TOKEN_REUSED' => 'Reuso de token detectado. Todas las sesiones activas han sido cerradas por seguridad.',
    'SESSION_LOGOUT_SUCCESS' => 'Sesión cerrada correctamente.',
    'CLIMA_NO_DISPONIBLE' => 'Clima no disponible',
    'CONVERSION_NO_DISPONIBLE' => 'Conversión no disponible',
    'PAYLOAD_TOO_LARGE' => 'El tamaño de la petición excede el límite permitido (16 KB).',
];
