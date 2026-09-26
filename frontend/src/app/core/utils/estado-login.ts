/**
 * Datos que otras pantallas le pasan al login por el `state` de la navegación:
 * - `sesionExpirada`: lo pone AuthService.limpiarSesion(true) cuando la sesión se cae a mitad del uso.
 * - `correo` y `mensajeExito`: los pone el registro al crear la cuenta.
 */
export interface EstadoLogin {
  sesionExpirada: boolean;
  correo: string | null;
  mensajeExito: string | null;
}

/**
 * Lee el estado que llegó al login y lo borra de inmediato.
 * El navegador conserva `history.state` al recargar, así que sin este borrado un F5 en /login
 * volvería a mostrar el aviso. Se reemplaza la entrada actual sin esas claves y se conserva el
 * resto (p. ej. `navigationId`, que usa el router de Angular).
 */
export function consumirEstadoLogin(): EstadoLogin {
  const estado: Record<string, unknown> = history.state ?? {};
  const { sesionExpirada, correo, mensajeExito, ...resto } = estado;

  if (sesionExpirada !== undefined || correo !== undefined || mensajeExito !== undefined) {
    history.replaceState(resto, '');
  }

  return {
    sesionExpirada: sesionExpirada === true,
    correo: typeof correo === 'string' ? correo : null,
    mensajeExito: typeof mensajeExito === 'string' ? mensajeExito : null
  };
}
