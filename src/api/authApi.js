// MÓDULO: api/authApi.js
// CAPA:   API
//
// Centraliza las peticiones HTTP de autenticación al backend.
// NUNCA manipula el DOM ni conoce la interfaz.
//
// Endpoints cubiertos:
//   POST /api/auth/login   -> loginUsuario
//   POST /api/auth/refresh -> renovarToken  (lo usa Paulo en fetchConAuth)

import { API_BASE_URL, API_PREFIX } from '../utils/config.js';

// ── LOGIN (ACTUALIZADO) ───────────────────────────────────────────────────────
// POST /api/auth/login
// Cuerpo esperado: { email, password }  ← CAMBIO: antes era { documento, password }
// Respuesta exitosa: { accessToken, refreshToken, user: { id, name, role, documento } }
//
// El backend (auth.service.js de Sebastian) ahora busca el usuario por email.
// El token JWT sigue incluyendo { id, documento, role } en el payload,
// así que el resto del frontend no necesita cambios.
export async function loginUsuario({ email, password }) {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/login`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // CAMBIO: se envía email en lugar de documento
        body: JSON.stringify({ email, password }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || json.message || 'Credenciales incorrectas');
    return json.data;
}

// ── REGISTRO DE USUARIO ───────────────────────────────────────────────────────
// POST /api/auth/register
// Este endpoint fue creado por Sebastián en el Issue B-1.
// Cuerpo: { name, documento, email, password }
// Respuesta exitosa 201: { success, message, data: { usuario sin password } }
// Error 409: email o documento ya registrado
// Error 400: datos inválidos (Zod)
//
// Si la petición falla (409 o 400) lanza un Error con el mensaje del servidor
// para que el modal de registro lo muestre con SweetAlert2.
export async function registrarUsuario({ name, documento, email, password }) {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/register`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, documento, email, password }),
    });
    const json = await response.json();
    // Si el servidor respondió con error (409 email duplicado, 400 validación)
    // se lanza el error para que el llamador (modoUI.js) lo capture y muestre
    if (!response.ok) throw new Error(json.message || 'Error al registrar el usuario');
    return json.data;
}

// ── RENOVAR TOKEN ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Cuerpo: { refreshToken }
// Lo usa el interceptor de Paulo (fetchConAuth.js) para el silent refresh.
export async function renovarToken(refreshToken) {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/refresh`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'No se pudo renovar el token');
    return json.data; // { accessToken }
}