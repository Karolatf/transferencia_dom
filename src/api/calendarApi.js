// MÓDULO: api/calendarApi.js
// CAPA:   API
//
// Centraliza todas las peticiones HTTP del calendario al backend.
// NUNCA manipula el DOM ni conoce la interfaz.
//
// Endpoints cubiertos:
//   GET    /api/calendar/instructor  → obtenerEventosInstructor
//   GET    /api/calendar/usuario     → obtenerEventosUsuario
//   POST   /api/calendar             → crearEvento
//   DELETE /api/calendar/:id         → eliminarEvento

import { API_BASE_URL, API_PREFIX } from '../utils/config.js';
import { fetchConAuth }             from '../utils/fetchConAuth.js';

const BASE = `${API_BASE_URL}${API_PREFIX}/calendar`;

// ── OBTENER EVENTOS DEL INSTRUCTOR ─────────────────────────────────────────
// GET /api/calendar/instructor
// Retorna todos los eventos creados por el instructor autenticado.
export async function obtenerEventosInstructor() {
    try {
        const response = await fetchConAuth(`${BASE}/instructor`, { cache: 'no-store' });
        const json     = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al obtener eventos');
        return json.data;
    } catch (error) {
        console.error('obtenerEventosInstructor:', error);
        return [];
    }
}

// ── OBTENER EVENTOS DEL USUARIO ────────────────────────────────────────────
// GET /api/calendar/usuario
// Retorna los eventos que el instructor asignó al usuario autenticado.
export async function obtenerEventosUsuario() {
    try {
        const response = await fetchConAuth(`${BASE}/usuario`, { cache: 'no-store' });
        const json     = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al obtener eventos');
        return json.data;
    } catch (error) {
        console.error('obtenerEventosUsuario:', error);
        return [];
    }
}

// ── CREAR EVENTO ────────────────────────────────────────────────────────────
// POST /api/calendar
// Cuerpo: { date, title, tipo, studentId?, taskId?, color? }
// Retorna el evento creado o null si hubo error.
export async function crearEvento(datos) {
    try {
        const response = await fetchConAuth(BASE, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(datos),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al crear evento');
        return json.data;
    } catch (error) {
        console.error('crearEvento:', error);
        return null;
    }
}

// ── ELIMINAR EVENTO ─────────────────────────────────────────────────────────
// DELETE /api/calendar/:id
// Retorna true si se eliminó correctamente, false si hubo error.
export async function eliminarEvento(id) {
    try {
        const response = await fetchConAuth(`${BASE}/${id}`, { method: 'DELETE' });
        const json     = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al eliminar evento');
        return true;
    } catch (error) {
        console.error('eliminarEvento:', error);
        return false;
    }
}