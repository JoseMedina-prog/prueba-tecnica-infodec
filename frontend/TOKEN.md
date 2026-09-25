# Estrategia de Almacenamiento y Ciclo de Vida de Tokens

En esta aplicación frontend (Angular), la gestión de tokens de autenticación sigue una arquitectura orientada a mitigar vectores comunes de ataque en clientes web (específicamente ataques de Cross-Site Scripting o XSS):

1. **Access Token en Memoria (`signal` reactivo):**  
   El access token no se guarda en `localStorage` ni en ningún almacenamiento web persistente accesible por scripts maliciosos. Al residir exclusivamente en la memoria de la aplicación (mediante un signal de Angular en `TokenStorageService`), si un atacante lograra inyectar código JavaScript no autorizado (XSS), no podría extraer pasivamente el access token desde el almacenamiento persistente del navegador.

2. **Refresh Token en `sessionStorage`:**  
   Para permitir que el usuario recargue la página (`F5`) o navegue entre rutas sin perder su sesión activa, el refresh token se almacena en `sessionStorage`. Esta ubicación garantiza que el token persista durante la sesión actual de la pestaña, pero sea destruido automáticamente por el navegador en cuanto la pestaña o ventana se cierra. Al iniciar la aplicación (`provideAppInitializer`), si existe un refresh token se solicita automáticamente la renovación de sesión (`/api/auth/refresh`) para restaurar el access token en memoria y cargar el perfil (`/api/auth/me`).

3. **Recomendación para Entornos de Producción:**  
   En un entorno de producción de alta seguridad, la arquitectura ideal y más robusta consiste en emitir tanto el refresh token como el access token a través de **cookies HTTP-only con atributos `Secure` y `SameSite=Strict` o `SameSite=Lax`**. Las cookies `httpOnly` son completamente inaccesibles para cualquier script del lado del cliente (`document.cookie`), protegiendo los tokens al 100% frente a robo por vulnerabilidades XSS, delegando la protección contra ataques CSRF a encabezados personalizados y políticas de origen estricto.
