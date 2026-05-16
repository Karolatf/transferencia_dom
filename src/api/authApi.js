// Archivo: api/authApi.js
// Este archivo contiene todas las peticiones HTTP relacionadas con la autenticación de usuarios:
// iniciar sesión, registrarse, renovar el token, y el proceso de recuperación de contraseña.
// Este archivo nunca toca el HTML ni modifica la pantalla — solo se comunica con el servidor.

// Importamos la dirección del servidor y el prefijo de los endpoints
import { API_BASE_URL, API_PREFIX } from '../utils/config.js';

// ── INICIAR SESIÓN ────────────────────────────────────────────────────────────

// Exportamos la función loginUsuario que recibe el correo y la contraseña del formulario de login
// y los envía al servidor para verificar las credenciales del usuario
export async function loginUsuario({ email, password }) {
    // Construimos la dirección completa del endpoint de login en el servidor
    const url = `${API_BASE_URL}${API_PREFIX}/auth/login`;
    // Hacemos la petición POST al servidor enviando el correo y la contraseña en formato JSON
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // JSON.stringify convierte el objeto { email, password } a texto para enviarlo al servidor
        body: JSON.stringify({ email, password }),
    });
    // Leemos la respuesta del servidor y la convertimos de texto a objeto JavaScript
    const json = await response.json();
    // Si el servidor rechazó las credenciales (código diferente a 200), lanzamos un error con el mensaje
    if (!response.ok) throw new Error(json.error || json.message || 'Credenciales incorrectas');
    // Si el login fue exitoso, retornamos los datos: { accessToken, refreshToken, user }
    return json.data;
}

// ── REGISTRAR NUEVO USUARIO ───────────────────────────────────────────────────

// Exportamos la función registrarUsuario que envía los datos del formulario de registro al servidor
// para crear una cuenta nueva en el sistema
export async function registrarUsuario({ name, documento, email, password }) {
    // Construimos la dirección del endpoint de registro
    const url = `${API_BASE_URL}${API_PREFIX}/auth/register`;
    // Hacemos la petición POST enviando todos los datos del nuevo usuario
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos nombre, documento de identidad, correo y contraseña
        body: JSON.stringify({ name, documento, email, password }),
    });
    // Leemos la respuesta del servidor
    const json = await response.json();
    // Si el servidor rechazó el registro (correo duplicado, datos inválidos, etc.) lanzamos el error
    // para que el modal de registro lo capture y muestre el mensaje al usuario
    if (!response.ok) throw new Error(json.message || 'Error al registrar el usuario');
    // Si el registro fue exitoso, retornamos los datos del usuario recién creado
    return json.data;
}

// ── RENOVAR TOKEN DE ACCESO ───────────────────────────────────────────────────

// Exportamos la función renovarToken que usa el token de renovación para obtener un nuevo token de acceso
// Esta función la usa fetchConAuth.js de forma automática cuando el token de acceso expira
export async function renovarToken(refreshToken) {
    // Construimos la dirección del endpoint de renovación de token
    const url = `${API_BASE_URL}${API_PREFIX}/auth/refresh`;
    // Hacemos la petición POST enviando el token de renovación al servidor
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos el token de renovación que el servidor valida para emitir uno nuevo
        body: JSON.stringify({ refreshToken }),
    });
    // Leemos la respuesta del servidor
    const json = await response.json();
    // Si el servidor rechazó la renovación, lanzamos un error (la sesión expiró completamente)
    if (!response.ok) throw new Error(json.error || 'No se pudo renovar el token');
    // Si fue exitoso, retornamos el nuevo token de acceso: { accessToken }
    return json.data;
}

// ── PASO 1 DE RECUPERACIÓN DE CONTRASEÑA: SOLICITAR CÓDIGO ────────────────────

// Exportamos la función forgotPassword que envía el correo del usuario al servidor
// para que este genere un código de 6 dígitos y lo envíe al correo del usuario
export async function forgotPassword(email) {
    try {
        // Construimos la dirección del endpoint de solicitud de código
        const url = `${API_BASE_URL}${API_PREFIX}/auth/forgot-password`;
        // Hacemos la petición POST enviando el correo del usuario
        const response = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email }),
        });
        // Leemos la respuesta del servidor
        const json = await response.json();
        // Si el servidor no pudo enviar el correo, lanzamos el error
        if (!response.ok) throw new Error(json.message || 'Error al enviar el correo');
        // Si fue exitoso, retornamos true para indicar que el correo fue enviado
        return true;
    } catch (error) {
        console.error('forgotPassword:', error);
        // Retornamos el error para que el modal lo muestre al usuario
        return { error: error.message };
    }
}

// ── PASO 2 DE RECUPERACIÓN: VERIFICAR EL CÓDIGO RECIBIDO ──────────────────────

// Exportamos la función verifyResetCode que envía el código de 6 dígitos al servidor
// para confirmar que el usuario recibió el correo y el código no ha expirado
export async function verifyResetCode(email, code) {
    try {
        // Construimos la dirección del endpoint de verificación
        const url = `${API_BASE_URL}${API_PREFIX}/auth/verify-reset-code`;
        // Hacemos la petición POST enviando el correo y el código ingresado por el usuario
        const response = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, code }),
        });
        // Leemos la respuesta del servidor
        const json = await response.json();
        // Si el código es incorrecto o expiró, lanzamos el error con el mensaje del servidor
        if (!response.ok) throw new Error(json.message || 'Código incorrecto o expirado');
        // Si el código fue válido, retornamos true para avanzar al paso 3
        return true;
    } catch (error) {
        console.error('verifyResetCode:', error);
        return { error: error.message };
    }
}

// ── PASO 3 DE RECUPERACIÓN: GUARDAR LA NUEVA CONTRASEÑA ──────────────────────

// Exportamos la función resetPassword que envía la nueva contraseña elegida por el usuario al servidor
// para reemplazar la contraseña anterior (solo se llama después de verificar el código correctamente)
export async function resetPassword(email, newPassword) {
    try {
        // Construimos la dirección del endpoint para restablecer la contraseña
        const url = `${API_BASE_URL}${API_PREFIX}/auth/reset-password`;
        // Hacemos la petición POST enviando el correo y la nueva contraseña
        const response = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, newPassword }),
        });
        // Leemos la respuesta del servidor
        const json = await response.json();
        // Si el servidor no pudo actualizar la contraseña, lanzamos el error
        if (!response.ok) throw new Error(json.message || 'Error al restablecer la contraseña');
        // Si fue exitoso, retornamos true para indicar que la contraseña fue cambiada
        return true;
    } catch (error) {
        console.error('resetPassword:', error);
        return { error: error.message };
    }
}
