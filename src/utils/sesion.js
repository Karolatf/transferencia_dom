// MÓDULO: utils/sesion.js
// CAPA:   Utils
//
// Centraliza el manejo de la sesión en localStorage.
// Ningún otro módulo debe acceder a localStorage directamente.
// Paulo usa obtenerAccessToken() y obtenerRefreshToken() desde fetchConAuth.js.

const KEYS = {
    ACCESS_TOKEN:  'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USUARIO:       'usuarioActual',
};

// Guarda todos los datos de sesión tras un login exitoso
export function guardarSesion({ accessToken, refreshToken, user }) {
    localStorage.setItem(KEYS.ACCESS_TOKEN,  accessToken);
    localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(KEYS.USUARIO,       JSON.stringify(user));
}

// Actualiza solo el accessToken — lo usa el interceptor de Paulo
export function actualizarAccessToken(nuevoToken) {
    localStorage.setItem(KEYS.ACCESS_TOKEN, nuevoToken);
}

// Retorna el accessToken guardado, o null si no hay sesión
export function obtenerAccessToken() {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
}

// Retorna el refreshToken guardado, o null si no hay sesión
export function obtenerRefreshToken() {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
}

// Retorna el objeto del usuario guardado, o null si no hay sesión
export function obtenerUsuarioSesion() {
    const raw = localStorage.getItem(KEYS.USUARIO);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

// Borra todos los datos de sesión (logout)
export function cerrarSesion() {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USUARIO);
}

// Retorna true si hay un token guardado (sesión activa)
export function haySesionActiva() {
    return Boolean(localStorage.getItem(KEYS.ACCESS_TOKEN));
}