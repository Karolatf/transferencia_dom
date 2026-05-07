// MÓDULO: api/notesApi.js
// Centraliza las peticiones HTTP de las notas personales del usuario.

import { API_BASE_URL, API_PREFIX } from '../utils/config.js';
import { fetchConAuth }             from '../utils/fetchConAuth.js';

const BASE = `${API_BASE_URL}${API_PREFIX}/notes`;

// GET /api/notes — retorna las notas del usuario autenticado
export async function obtenerNotas() {
    try {
        const res  = await fetchConAuth(BASE, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        return json.data;          // arreglo de { id, texto, color }
    } catch (err) {
        console.error('obtenerNotas:', err);
        return [];
    }
}

// POST /api/notes — crea una nota nueva
// Retorna la nota creada { id, texto, color } o null si falla
export async function crearNota(texto, color) {
    try {
        const res  = await fetchConAuth(BASE, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ texto, color }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        return json.data;
    } catch (err) {
        console.error('crearNota:', err);
        return null;
    }
}

// DELETE /api/notes/:id — elimina una nota por id
// Retorna true si se eliminó correctamente
export async function eliminarNota(id) {
    try {
        const res  = await fetchConAuth(`${BASE}/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        return true;
    } catch (err) {
        console.error('eliminarNota:', err);
        return false;
    }
}