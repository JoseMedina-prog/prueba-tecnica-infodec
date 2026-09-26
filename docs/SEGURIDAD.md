# Pasabordo — Arquitectura de Seguridad OWASP y Guía Técnica

Este documento detalla las medidas de seguridad defensiva implementadas en **Pasabordo** (backend Laravel 11 y frontend Angular 20), estructuradas bajo los marcos de referencia **OWASP Top 10:2025** y **OWASP API Security Top 10 (2023)**.

---

## 1. Matriz de Cobertura OWASP Top 10:2025

| Categoría OWASP 2025 | Riesgo (1 línea) | Mitigación en Pasabordo | Archivos Clave |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | Acceso no autorizado a rutas, datos o recursos de otros usuarios. | Autenticación obligatoria mediante JWT en middleware; resolución de `$request->user()`; las consultas del historial filtran estrictamente por `where('usuario_id', $usuario->id)`. | `app/Http/Middleware/AuthTokenMiddleware.php`, `app/Services/ConsultaService.php` |
| **A02: Security Misconfiguration** | Cabeceras HTTP inseguras, stacktraces expuestos o fuga de software. | Middleware de cabeceras estrictas (`nosniff`, `DENY`, `no-referrer`, `CSP`, `Permissions-Policy`, `no-store` en auth), remoción activa de `X-Powered-By`; `APP_DEBUG=false` en producción y respuestas 500 sanitizadas. | `app/Http/Middleware/CabecerasSeguridad.php`, `bootstrap/app.php` |
| **A03: Software Supply Chain Failures** | Dependencias vulnerables introducidas durante el desarrollo o build. | Bloqueo estricto con lockfiles versionados (`composer.lock` y `package-lock.json`), escaneo automatizado en CI con `composer audit` y `npm audit --omit=dev --audit-level=high`. | `.github/workflows/ci.yml`, `composer.lock`, `package-lock.json` |
| **A04: Cryptographic Failures** | Criptografía débil, exposición de secretos o hashing vulnerable. | Algoritmo dual: cifrado simétrico AES-256-GCM para payloads de token, firmas HMAC-SHA256, contraseñas hasheadas con Bcrypt (costo 12), secretos fuera del repositorio vía `.env`. | `app/Services/TokenService.php`, `config/token.php` |
| **A05: Injection** | Inyección SQL, comandos del sistema o manipulación de parámetros. | Uso 100% de Eloquent ORM con consultas preparadas por PDO; cero sentencias `DB::raw` o `whereRaw`; casteo forzado de tipos y validación previa de identificadores. | `app/Services/ConsultaService.php`, `app/Http/Controllers/` |
| **A06: Insecure Design** | Diseño arquitectónico sin defensas contra abusos o ataques de fuerza bruta. | Límite estricto de intentos de login con mitigación de timing attack mediante hash ficticio (`Hash::check(..., self::DUMMY_HASH)`); rotación obligatoria de refresh tokens y revocación total ante reuso. | `app/Services/AuthService.php`, `app/Providers/AppServiceProvider.php` |
| **A07: Authentication Failures** | Credenciales débiles, fijación de sesión o reutilización de tokens. | Reglas de contraseñas robustas (mínimo 8 caracteres, mayúscula, minúscula y número); revocación inmediata en tabla `tokens_revocados` por `jti`; expiración corta de access token (15 min). | `app/Http/Requests/RegistroRequest.php`, `app/Services/TokenService.php` |
| **A08: Software or Data Integrity Failures** | Datos manipulados en tránsito o serializaciones inseguras. | Verificación de firma criptográfica HS256 y descifrado autenticado con etiqueta GCM; validación estricta de payloads con FormRequests antes de tocar modelos. | `app/Services/TokenService.php`, `app/Http/Requests/` |
| **A09: Security Logging & Alerting Failures** | Ausencia de telemetría de eventos de seguridad para auditoría forense. | Canal de log dedicado `seguridad` en formato JSON por línea; registro de 7 eventos críticos con IPs, trace_id y correos enmascarados; comando CLI `seguridad:resumen`. | `app/Services/SeguridadLogger.php`, `app/Console/Commands/SeguridadResumenCommand.php` |
| **A10: Mishandling of Exceptional Conditions** | Fuga de detalles técnicos o comportamiento impredecible tras fallos. | Manejador centralizado de excepciones en `bootstrap/app.php` que transforma cualquier error en JSON estándar con `code`, mensaje traducido y `trace_id`; nunca expone credenciales ni datos de APIs externas. | `bootstrap/app.php` |

---

## 2. OWASP API Security Top 10 (2023)

| Riesgo API | Aplicabilidad en Pasabordo | Implementación y Defensa |
| :--- | :--- | :--- |
| **API1: Broken Object Level Authorization (BOLA)** | Historial y consultas por usuario | El usuario no puede consultar datos ajenos: `GET /api/consultas/historial` no acepta parámetro de `usuario_id`; siempre consulta el ID del token verificado en BD. |
| **API2: Broken Authentication** | Endpoint de login y refresh | Identificación de intentos fallidos por clave compuesta `login:{correo}|{ip}`; bloqueo al 5.º fallo; detección y revocación masiva ante reuso de refresh token. |
| **API3: Broken Object Property Level Authorization** | Exposición excesiva de datos | Los controladores y `ConsultaResource` devuelven únicamente los campos necesarios para la UI; nunca se retornan hashes, IDs internos ajenos ni timestamps del sistema. |
| **API4: Unrestricted Resource Consumption** | Agotamiento de CPU, memoria y APIs | Límite de tamaño de cuerpo (16 KB) vía middleware; limitadores de tasa `RateLimiter::for` (consultas: 20/min, externas: 30/min, general: 60/min); historial limitado a 5 registros en la consulta SQL (`limit(5)`). |
| **API7: Server-Side Request Forgery (SSRF)** | Peticiones a OpenWeatherMap y ExchangeRate | Los endpoints externos no permiten ingresar URLs arbitrarias. Las URLs base están fijadas en configuración (`WEATHER_API_URL`, `EXCHANGE_API_URL`); coordenadas y monedas provienen exclusivamente de la base de datos local. |
| **API8: Security Misconfiguration** | Cabeceras, CORS y métodos HTTP | CORS restringido al origen frontend (`http://localhost:4200`); `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY`; `Cache-Control: no-store` en autenticación; rechazo de verbos no permitidos con 405. |
| **API10: Unsafe Consumption of APIs** | Consumo de APIs externas | Timeouts de 5 segundos en cliente HTTP; manejo controlado de caídas y timeouts de APIs de terceros con fallback a valores de respaldo (BD) o avisos controlados sin interrumpir la operación global. |

---

## 3. Tabla de Límites de Frecuencia y Datos

| Recurso / Operación | Límite Aplicado | Clave del Límite | Respuesta al Exceder | Justificación Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **Login (`/auth/login`)** | 5 intentos / minuto | `login:{correo}\|{ip}` | 429 `TOO_MANY_ATTEMPTS` + `Retry-After` | Previene ataques de fuerza bruta y credential stuffing sobre cuentas de usuario. |
| **Refresh (`/auth/refresh`)** | 30 peticiones / min | `refresh:{ip}` | 429 `TOO_MANY_ATTEMPTS` + `Retry-After` | Evita ataques de denegación de servicio sobre la base de datos y la rotación criptográfica. |
| **Consultas (`/consultas`, `/conversion`)** | 20 peticiones / min | Usuario autenticado (ID) | 429 `TOO_MANY_ATTEMPTS` + `Retry-After` | Protege la cuota de las APIs externas de clima y divisas, evitando sobrecostos y agotamiento de recursos. |
| **Diagnóstico (`/externas/*`)** | 30 peticiones / min | Usuario autenticado (ID) | 429 `TOO_MANY_ATTEMPTS` + `Retry-After` | Previene abusos sobre los endpoints de prueba y consumo de APIs de terceros. |
| **Rutas protegidas (General)** | 60 peticiones / min | Usuario autenticado (ID) | 429 `TOO_MANY_ATTEMPTS` + `Retry-After` | Respaldo general para mitigar scraping, bucles accidentales de clientes o flooding. |
| **Tamaño del Cuerpo HTTP** | Máximo 16 KB (16.384 bytes) | Por petición (`CONTENT_LENGTH` o `getContent()`) | 413 `PAYLOAD_TOO_LARGE` | Los payloads válidos pesan < 1 KB; previene ataques de denegación de servicio por memoria o CPU al procesar JSON gigante. |
| **Historial de Consultas** | Máximo 5 registros | Consulta SQL (`LIMIT 5`) | 200 con array de ≤ 5 elementos | Requerimiento estricto del caso de uso; evita carga excesiva de memoria y tráfico de red innecesario. |

---

## 4. Minimización de Datos: Campos Retornados por Endpoint

| Endpoint | Método | Código | Campos Expuestos en `data` | Campos Excluidos Intencionalmente |
| :--- | :---: | :---: | :--- | :--- |
| `/api/auth/register` | POST | 201 | `id`, `nombre`, `correo`, `idioma` | `password_hash`, tokens, `created_at`, `updated_at` |
| `/api/auth/login` | POST | 200 | `access_token`, `refresh_token`, `token_type`, `expires_in`, `usuario: { id, nombre, correo, idioma }` | `password_hash`, `token_hash`, `familia_id`, timestamps internos |
| `/api/auth/refresh` | POST | 200 | `access_token`, `refresh_token`, `token_type`, `expires_in`, `usuario: { id, nombre, correo, idioma }` | `token_hash`, `familia_id`, hashes internos |
| `/api/auth/me` | GET | 200 | `id`, `nombre`, `correo`, `idioma` | `password_hash`, timestamps internos |
| `/api/auth/logout` | POST | 200 | `message` | Datos de sesión, claims de tokens |
| `/api/paises` | GET | 200 | Array de `[{ id, nombre, codigo_iso }]` | Timestamps, llaves foráneas no requeridas |
| `/api/paises/{id}/ciudades` | GET | 200 | Array de `[{ id, nombre, pais_id }]` | Coordenadas internas no solicitadas en combo, timestamps |
| `/api/consultas` / `/conversion` | POST | 201 | `id`, `fecha`, `pais`, `ciudad`, `presupuesto_cop`, `clima`, `moneda`, `conversion`, `avisos` | `usuario_id`, `updated_at`, IDs de auditoría interna |
| `/api/consultas/historial` | GET | 200 | Array de 5 items con estructura `ConsultaResource` (`id`, `fecha`, `pais`, `ciudad`, `presupuesto_cop`, `clima`, `moneda`, `conversion`) | `usuario_id` (de otros o propio), `updated_at`, timestamps internos |
| `/api/externas/clima/{ciudadId}` | GET | 200 | `temperatura`, `condicion`, `icono`, `fuente`, `fecha_consulta` | Coordenadas crudas, respuestas HTTP completas de proveedores |
| `/api/externas/tasa/{codigoMoneda}` | GET | 200 | `moneda_origen`, `moneda_destino`, `tasa`, `fuente`, `fecha_actualizacion` | Respuestas completas de proveedor, códigos HTTP ajenos |

---

## 5. Auditoría de Eventos de Seguridad (A09)

### 5.1. Qué registra y formato
Los eventos se almacenan en `storage/logs/seguridad.log` utilizando un canal Monolog con `JsonFormatter` (una línea JSON válida por evento).

**Eventos tipificados:**
1. `login_fallido` (Nivel: `info`): Contraseña incorrecta o usuario inexistente.
2. `bloqueo_intentos` (Nivel: `warning`): Se sobrepasa el límite de 5 intentos fallidos de login.
3. `token_invalido` (Nivel: `info`): Firma alterada, formato JWT corrupto o usuario inexistente.
4. `token_vencido` (Nivel: `info`): Presentación de access token expirado.
5. `token_revocado_usado` (Nivel: `info`): Intento de uso de un token revocado en blacklist (`jti`).
6. `reuso_refresh` (Nivel: `warning`): Presentación de refresh token ya utilizado (posible robo de sesión).
7. `limite_consumo` (Nivel: `warning`): Exceso de cuota de peticiones por minuto en un endpoint (429).

**Estructura de cada registro JSON:**
```json
{
  "message": "login_fallido",
  "context": {
    "evento": "login_fallido",
    "trace_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "ip": "192.168.1.100",
    "fecha": "2026-09-26T00:29:29+00:00",
    "usuario_id": 3,
    "correo": "j***@gmail.com"
  },
  "level": 200,
  "level_name": "INFO",
  "channel": "seguridad",
  "datetime": "2026-09-26T00:29:29.811426+00:00"
}
```

> **Privacidad y GDPR**: NUNCA se guardan contraseñas, tokens completos ni hashes. El correo electrónico se enmascara automáticamente conservando solo el primer carácter del usuario y el dominio (`j***@gmail.com`).

---

### 5.2. Comando de Inspección: `php artisan seguridad:resumen`

Para auditar y monitorear la seguridad sin comprometer la superficie de ataque, el análisis se realiza mediante un comando de consola Artisan:

#### Resumen de actividad por periodo (por defecto 24 horas)
```bash
php artisan seguridad:resumen --horas=24
```
*Salida:*
- Tabla con el consolidado total agrupado por tipo de evento.
- Tabla con las 5 direcciones IP con más eventos sospechosos en el periodo.

#### Investigación forense por `trace_id` (Código de referencia del usuario)
Cuando un usuario reporta una anomalía o bloqueo, proporciona el "Código de referencia" que muestra la interfaz:
```bash
php artisan seguridad:resumen --trace=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
```
*Salida:*
- Lista cronológica exacta de todos los eventos de seguridad que coincidieron con esa traza, mostrando fecha, evento, IP, usuario y correo enmascarado.

#### ¿Por qué un comando de consola y no un panel web?
Crear un panel de administración web introduciría una nueva superficie crítica de ataque expuesta a Internet, susceptible a **Broken Access Control (A01)**, elevación de privilegios y ataques de CSRF/XSS. Un comando Artisan opera exclusivamente en el servidor mediante acceso administrativo local o SSH con autenticación de clave pública, eliminando por completo ese vector de riesgo.

#### Integración con SIEM en Producción
En un entorno productivo, `storage/logs/seguridad.log` se ingesta de forma desatendida mediante agentes ligeros como:
- **Filebeat / Elastic Stack**: Ingesta del JSON directo a Elasticsearch con dashboards en Kibana.
- **Datadog Agent**: Detección de patrones anómalos de `reuso_refresh` o picos de `bloqueo_intentos`.
- **Wazuh / Splunk**: Reglas de correlación que disparan alertas automáticas por webhook a Slack o PagerDuty cuando una misma IP genera más de 10 eventos `bloqueo_intentos` en 5 minutos.

---

## 6. Limitaciones Conocidas del Entorno Actual

1. **Ventana de 15 minutos en Access Token tras Reuso de Refresh**:
   Si un refresh token es reusado, el backend revoca de inmediato la familia de refresh tokens en la base de datos. Sin embargo, los tokens de acceso ya emitidos tienen un tiempo de vida (TTL) de hasta 15 minutos y se validan de forma stateless (criptográfica). No se invalidan antes de los 15 minutos a menos que el usuario realice un logout explícito (que registra el `jti` en la blacklist).
2. **Refresh Token almacenado en `sessionStorage`**:
   Actualmente el frontend almacena tokens en `sessionStorage` para mantener la sesión durante la navegación de pestaña. Si existiera una vulnerabilidad XSS, el token podría ser leído por scripts inyectados.
3. **Sin HTTPS en entorno local**:
   El entorno de desarrollo opera sobre HTTP plano (`localhost`), por lo que la cabecera `Strict-Transport-Security` se encuentra desactivada localmente (solo se activa cuando la petición llega por HTTPS seguro).
4. **Sin Autenticación Multifactor (MFA) ni Recuperación de Contraseña**:
   El sistema no implementa segundo factor de autenticación (TOTP/WebAuthn) ni flujo de recuperación por correo firmado con expiración.
5. **Refresh Token sin vida absoluta máxima**:
   Cada rotación exitosa emite un refresh token nuevo con 7 días de vigencia contados desde esa rotación. No existe un tope máximo absoluto que obligue a reiniciar credenciales transcurridos 30 o 90 días de sesiones activas continuas.

---

## 7. Hoja de Ruta para Despliegue en Producción

Para elevar el nivel de seguridad a estándar bancario/empresarial en producción, se recomienda aplicar las siguientes mejoras:

1. **HTTPS Forzado con HSTS Precargado**:
   Terminación TLS 1.3 obligatoria con cabecera `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` y redirección 301 de HTTP a HTTPS.
2. **Tokens en Cookies `httpOnly`, `Secure` y `SameSite=Strict`**:
   Mover el `refresh_token` a una cookie de solo lectura por el navegador con flags `HttpOnly`, `Secure` y `SameSite=Strict`, eliminando el riesgo de robo por XSS en el cliente.
3. **Content Security Policy (CSP) en Frontend**:
   Configurar una política CSP estricta en el servidor web (Nginx/Cloudflare) que prohíba scripts `unsafe-inline` y restrinja conexiones solo a los dominios autorizados de la API.
4. **Rotación Periódica de `APP_TOKEN_SECRET` con Soporte Multiclave**:
   Permitir un array de claves activas (clave primaria para firmar, clave secundaria para verificar tokens previos) facilitando la rotación de claves secretas sin desconectar a los usuarios activos.
5. **Monitoreo SIEM Activo y Alertas Automatizadas**:
   Configurar reglas automáticas que bloqueen temporalmente en el firewall (WAF / Cloudflare / fail2ban) cualquier dirección IP que acumule múltiples eventos `reuso_refresh` o `bloqueo_intentos`.
6. **Alertas Continuas de Dependencias (Software Supply Chain)**:
   Integrar escaneos programados diarios en el pipeline de CI/CD para detectar vulnerabilidades de día cero (0-day) en bibliotecas de PHP o Node.js antes de que sean explotadas.

---

## 8. Avisos de Dependencias

### 8.1. Política de Soporte y Contexto del Proyecto
De acuerdo con la política oficial de soporte del ecosistema Laravel, **Laravel 11** completó su ciclo de parches de seguridad tras el lanzamiento de Laravel 12. No obstante, las especificaciones de la prueba técnica exigen explícitamente el uso de **Laravel 10 u 11** junto con **PHP 8.2+**. Por este motivo, el proyecto se mantiene en la versión más reciente y estable de dicha rama (`laravel/framework v11.56.1`).

### 8.2. Análisis de Avisos de Seguridad Ignorados en `composer audit`
Para garantizar la reproducibilidad y el éxito del pipeline de Integración Continua (CI) sin falsos positivos, se configuró la directiva `config.audit.ignore` en `backend/composer.json` únicamente tras auditar formalmente que el código fuente de la aplicación **no utiliza las funcionalidades afectadas**.

A continuación se detalla el análisis de cada aviso:

| ID de Aviso | CVE / Referencia | Severidad | Paquete Afectado | Funcionalidad Vulnerable | Aplicabilidad en Pasabordo y Justificación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PKSA-m5cs-t1y6-qpcs** | [GHSA-crmm-hgp2-wgrp](https://github.com/advisories/GHSA-crmm-hgp2-wgrp) | Media (Medium) | `laravel/framework` | *Temporary Signed URL Path Confusion*: Evasión de firma criptográfica en rutas URL temporales firmadas ante diferencias de normalización de ruta. | **No Aplica**: Pasabordo no implementa URLs firmadas ni rutas temporales. El acceso a todos los endpoints protegidos se realiza exclusivamente mediante tokens JWT en cabecera `Authorization: Bearer`. |
| **PKSA-3r5d-mb8f-1qw9** | [GHSA-5vg9-5847-vvmq](https://github.com/advisories/GHSA-5vg9-5847-vvmq) | Alta (High) | `laravel/framework` | *CRLF injection in default email rule*: Inyección de caracteres de salto de línea (`\r\n`) en la regla por defecto de validación de correo que permite manipular encabezados SMTP. | **No Aplica (Defensa en Profundidad)**: La aplicación no envía correos electrónicos ni interactúa con servidores SMTP. Adicionalmente, las solicitudes `RegistroRequest` y `LoginRequest` validan el correo con `email:rfc,filter` (que activa `FILTER_VALIDATE_EMAIL` de PHP) y la regla estricta `not_regex:/[\x00-\x1F\x7F]/`, bloqueando de raíz cualquier carácter de control. |
| **PKSA-mdq4-51ck-6kdq** | CVE-2026-48019 | Alta (High) | `laravel/framework` | *Laravel CRLF injection in default email rule*: Identificador CVE del mismo vector de inyección CRLF al construir mensajes de correo en Laravel. | **No Aplica (Defensa en Profundidad)**: El campo `correo` no pasa por ningún transporte de correo y cualquier intento de inyección de caracteres de escape/salto de línea es rechazado en la capa de validación HTTP. |

### 8.3. Evidencia en el Código Fuente y Pruebas Automatizadas
Se ejecutó una inspección exhaustiva y se agregaron controles defensivos:
1. **URLs Firmadas (`signed`, `temporarySignedRoute`)**:
   - `grep -ri "signed" backend/app/` → 0 coincidencias.
   - `grep -ri "signed" backend/routes/` → 0 coincidencias.
   - En `backend/config/auth.php` únicamente existe la palabra en comentarios de configuración del framework (`"be assigned to..."`).
2. **Envío y Transporte de Correo (`Mail`, `Mailable`, `Notification`)**:
   - `grep -r "Mail" backend/app/` → 0 coincidencias.
   - `grep -r "mail" backend/routes/` → 0 coincidencias.
   - La aplicación no define ninguna clase `Mailable`, no invoca el facade `Illuminate\Support\Facades\Mail`, ni despacha notificaciones por correo electrónico.
3. **Defensa en Profundidad en Validación de Correo**:
   - `RegistroRequest` y `LoginRequest` aplican:
     `'correo' => ['required', 'string', 'email:rfc,filter', 'max:150', 'not_regex:/[\x00-\x1F\x7F]/']`
   - Prueba automatizada en `tests/Feature/Auth/RegistroTest.php` (`test_registro_con_crlf_en_correo_devuelve_422`):
     Envía un payload con `"a@b.com\r\nBcc: x@y.com"` y comprueba que el backend responde con código HTTP **422 Unprocessable Content**, error estructurado `VALIDATION_ERROR` y error explícito en el campo `correo`.

### 8.4. Plan de Migración a Producción
En un entorno de producción comercial o corporativo, se procederá a:
1. Actualizar el framework a **Laravel 12+** (o a la versión LTS / activa vigente con soporte oficial de seguridad).
2. Retirar las directivas de exclusión en `backend/composer.json`.
3. Mantener el escaneo automatizado en el pipeline de CI/CD para detectar cualquier vulnerabilidad emergente de la cadena de suministro de software.
