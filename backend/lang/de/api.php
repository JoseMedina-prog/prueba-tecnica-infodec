<?php

return [
    'BAD_REQUEST' => 'Ungültige Anfrage oder fehlerhaftes JSON-Format.',
    'AUTH_INVALID_CREDENTIALS' => 'Ungültige E-Mail-Adresse oder falsches Passwort.',
    'AUTH_TOKEN_MISSING' => 'Kein Authentifizierungstoken bereitgestellt.',
    'AUTH_TOKEN_INVALID' => 'Das Authentifizierungstoken ist ungültig.',
    'AUTH_TOKEN_EXPIRED' => 'Das Authentifizierungstoken ist abgelaufen.',
    'AUTH_TOKEN_REVOKED' => 'Das Authentifizierungstoken wurde widerrufen.',
    'FORBIDDEN' => 'Zugriff verweigert. Unzureichende Berechtigungen.',
    'NOT_FOUND' => 'Die angeforderte Ressource wurde nicht gefunden.',
    'USER_ALREADY_EXISTS' => 'Diese E-Mail-Adresse ist bereits registriert.',
    'VALIDATION_ERROR' => 'Validierungsfehler bei den übermittelten Daten.',
    'TOO_MANY_ATTEMPTS' => 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
    'EXTERNAL_API_ERROR' => 'Fehler bei der Kommunikation mit dem externen Dienst.',
    'EXTERNAL_API_TIMEOUT' => 'Zeitüberschreitung bei der Kommunikation mit dem externen Dienst.',
    'INTERNAL_ERROR' => 'Ein interner Serverfehler ist aufgetreten.',
    'METHOD_NOT_ALLOWED' => 'Die HTTP-Methode ist für diese Route nicht zulässig.',

    // Spezielle Meldungen
    'AUTH_TOKEN_REUSED' => 'Token-Wiederverwendung erkannt. Alle aktiven Sitzungen wurden aus Sicherheitsgründen beendet.',
    'SESSION_LOGOUT_SUCCESS' => 'Sitzung erfolgreich beendet.',
];
