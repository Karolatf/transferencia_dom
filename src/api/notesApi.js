// Archivo: api/notesApi.js
// Este archivo contiene las peticiones HTTP para las notas personales tipo post-it del estudiante.
// Se comunica con el servidor para obtener, crear y eliminar notas.
// Este archivo nunca toca el HTML ni modifica la pantalla — solo habla con el servidor.

// Importamos la dirección del servidor y el prefijo de los endpoints
import { API_BASE_URL, API_PREFIX } from '../utils/config.js';
// Importamos la función de petición autenticada que agrega el token JWT automáticamente
import { fetchConAuth }             from '../utils/fetchConAuth.js';

// Construimos la dirección base de todos los endpoints de notas
const BASE = `${API_BASE_URL}${API_PREFIX}/notes`;

// ── OBTENER NOTAS DEL ESTUDIANTE ──────────────────────────────────────────────

// Exportamos la función obtenerNotas que trae del servidor todas las notas
// personales del estudiante autenticado
export async function obtenerNotas() {
    try {
        // Hacemos la petición GET — cache: 'no-store' evita usar datos guardados del navegador
        const res  = await fetchConAuth(BASE, { cache: 'no-store' });
        // Leemos y convertimos la respuesta del servidor a objeto JavaScript
        const json = await res.json();
        // Si el servidor respondió con error, lanzamos el error
        if (!res.ok) throw new Error(json.message);
        // Retornamos el arreglo de notas: cada nota tiene { id, texto, color }
        return json.data;
    } catch (err) {
        console.error('obtenerNotas:', err);
        // Si hubo error, retornamos lista vacía para que la pantalla no se rompa
        return [];
    }
}

// ── CREAR NOTA NUEVA ──────────────────────────────────────────────────────────

// Exportamos la función crearNota que envía al servidor el texto y el color de una nota nueva
// Retorna la nota creada con su id asignado por el servidor, o null si hubo error
export async function crearNota(texto, color) {
    try {
        // Hacemos la petición POST enviando el texto y el color de la nota
        const res  = await fetchConAuth(BASE, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos el texto de la nota y el color elegido por el usuario
            body:    JSON.stringify({ texto, color }),
        });
        // Leemos y convertimos la respuesta del servidor
        const json = await res.json();
        // Si el servidor rechazó la creación, lanzamos el error
        if (!res.ok) throw new Error(json.message);
        // Retornamos la nota recién creada: { id, texto, color }
        return json.data;
    } catch (err) {
        console.error('crearNota:', err);
        // Retornamos null para indicar que la creación falló
        return null;
    }
}

// ── ELIMINAR NOTA ─────────────────────────────────────────────────────────────

// Exportamos la función eliminarNota que le dice al servidor que borre una nota específica
// Recibe el id numérico de la nota a eliminar
export async function eliminarNota(id) {
    try {
        // Hacemos la petición DELETE incluyendo el id de la nota al final de la URL
        const res  = await fetchConAuth(`${BASE}/${id}`, { method: 'DELETE' });
        // Leemos y convertimos la respuesta del servidor
        const json = await res.json();
        // Si el servidor no pudo eliminar la nota, lanzamos el error
        if (!res.ok) throw new Error(json.message);
        // Retornamos true para indicar que la eliminación fue exitosa
        return true;
    } catch (err) {
        console.error('eliminarNota:', err);
        // Retornamos false para indicar que la eliminación falló
        return false;
    }
}
