// Archivo: utils/sesion.js
// Este archivo es el único responsable de guardar y leer los datos de sesión del usuario
// en el almacenamiento local del navegador (localStorage).
// Ningún otro archivo del proyecto accede al localStorage directamente — todo pasa por aquí.

// Definimos un objeto con las tres claves que usamos para guardar datos en el navegador
const KEYS = {
    ACCESS_TOKEN:  'accessToken',   // clave para el token de acceso (dura 1 hora)
    REFRESH_TOKEN: 'refreshToken',  // clave para el token de renovación (dura 7 días)
    USUARIO:       'usuarioActual', // clave para los datos del usuario (nombre, rol, id, etc.)
};

// Exportamos la función guardarSesion que recibe el accessToken, el refreshToken y el objeto de usuario
// y los guarda todos en el almacenamiento local del navegador al momento de hacer login
export function guardarSesion({ accessToken, refreshToken, user }) {
    // Guardamos el token de acceso corto en el navegador
    localStorage.setItem(KEYS.ACCESS_TOKEN,  accessToken);
    // Guardamos el token de renovación largo en el navegador
    localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
    // Guardamos el objeto del usuario convertido a texto, porque localStorage solo guarda texto
    localStorage.setItem(KEYS.USUARIO,       JSON.stringify(user));
}

// Exportamos la función actualizarAccessToken que reemplaza solo el token de acceso corto
// cuando el sistema renueva la sesión automáticamente (Silent Refresh)
export function actualizarAccessToken(nuevoToken) {
    // Sobreescribimos el token de acceso con el nuevo que llegó del servidor
    localStorage.setItem(KEYS.ACCESS_TOKEN, nuevoToken);
}

// Exportamos la función obtenerAccessToken que lee y retorna el token de acceso guardado
// Si no hay sesión activa, el navegador retorna null
export function obtenerAccessToken() {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
}

// Exportamos la función obtenerRefreshToken que lee y retorna el token de renovación guardado
// Si no hay sesión activa, el navegador retorna null
export function obtenerRefreshToken() {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
}

// Exportamos la función obtenerUsuarioSesion que lee los datos del usuario guardados
// Los convierte de texto de vuelta a objeto JavaScript, o retorna null si no hay sesión
export function obtenerUsuarioSesion() {
    // Leemos el texto guardado en el navegador
    const raw = localStorage.getItem(KEYS.USUARIO);
    // Si no hay nada guardado, retornamos null directamente
    if (!raw) return null;
    // Intentamos convertir el texto a objeto — si el texto está corrupto retornamos null
    try { return JSON.parse(raw); } catch { return null; }
}

// Exportamos la función cerrarSesion que borra los tres datos de sesión del navegador
// Se llama al hacer logout o cuando la sesión expira definitivamente
export function cerrarSesion() {
    // Borramos el token de acceso del navegador
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    // Borramos el token de renovación del navegador
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    // Borramos los datos del usuario del navegador
    localStorage.removeItem(KEYS.USUARIO);
}

// Exportamos la función haySesionActiva que verifica si el usuario tiene sesión iniciada
// Retorna true si hay un token de acceso guardado, o false si no hay ninguno
export function haySesionActiva() {
    // Boolean() convierte cualquier valor a true o false
    // Si hay un token guardado es true, si localStorage retorna null es false
    return Boolean(localStorage.getItem(KEYS.ACCESS_TOKEN));
}
