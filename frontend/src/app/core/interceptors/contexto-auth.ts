import { HttpContextToken } from '@angular/common/http';

/**
 * Marca una petición cuyo 401 lo maneja quien la hace, no el interceptor: no renueva,
 * no limpia la sesión ni redirige. La usa el inicializador de la app al restaurar la sesión,
 * que ante un fallo limpia todo en silencio (sin el aviso de "sesión expirada").
 */
export const SIN_MANEJO_DE_SESION = new HttpContextToken<boolean>(() => false);
