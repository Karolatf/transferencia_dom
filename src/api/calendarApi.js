// Archivo: api/calendarApi.js
// Este archivo contiene todas las peticiones HTTP relacionadas con el calendario de la aplicación.
// Se comunica con el servidor para obtener, crear y eliminar eventos del calendario.
// Este archivo nunca toca el HTML ni modifica la pantalla — solo habla con el servidor.

// Importamos la dirección del servidor y el prefijo de los endpoints
import { API_BASE_URL, API_PREFIX } from '../utils/config.js';
// Importamos la función de petición autenticada que agrega el token JWT automáticamente
import { fetchConAuth }             from '../utils/fetchConAuth.js';

// Construimos la dirección base de todos los endpoints del calendario
const BASE = `${API_BASE_URL}${API_PREFIX}/calendar`;

// ── OBTENER EVENTOS DEL INSTRUCTOR ────────────────────────────────────────────

// Exportamos la función obtenerEventosInstructor que trae del servidor todos los eventos
// que el instructor autenticado ha creado en su calendario
export async function obtenerEventosInstructor() {
    try {
        // Hacemos la petición GET al servidor — cache: 'no-store' evita que el navegador use respuestas anteriores
        const response = await fetchConAuth(`${BASE}/instructor`, { cache: 'no-store' });
        // Leemos la respuesta del servidor y la convertimos a objeto JavaScript
        const json     = await response.json();
        // Si el servidor respondió con error, lanzamos el error con el mensaje
        if (!response.ok) throw new Error(json.message || 'Error al obtener eventos');
        // Retornamos el arreglo de eventos del instructor
        return json.data;
    } catch (error) {
        console.error('obtenerEventosInstructor:', error);
        // Si hubo un error de red o del servidor, retornamos una lista vacía para no romper la pantalla
        return [];
    }
}

// ── OBTENER EVENTOS DEL ESTUDIANTE ────────────────────────────────────────────

// Exportamos la función obtenerEventosUsuario que trae del servidor los eventos del calendario
// que el instructor asignó al estudiante autenticado
export async function obtenerEventosUsuario() {
    try {
        // Hacemos la petición GET con cache desactivado para siempre tener los datos más recientes
        const response = await fetchConAuth(`${BASE}/usuario`, { cache: 'no-store' });
        // Leemos y convertimos la respuesta
        const json     = await response.json();
        // Si hubo error en el servidor, lanzamos el error
        if (!response.ok) throw new Error(json.message || 'Error al obtener eventos');
        // Retornamos el arreglo de eventos del estudiante
        return json.data;
    } catch (error) {
        console.error('obtenerEventosUsuario:', error);
        // Retornamos lista vacía para no romper el calendario si el servidor falla
        return [];
    }
}

// ── CREAR EVENTO EN EL CALENDARIO ─────────────────────────────────────────────

// Exportamos la función crearEvento que envía al servidor los datos de un nuevo evento
// Recibe un objeto datos con: fecha, título, tipo, y opcionalmente: id del estudiante, id de tarea y color
export async function crearEvento(datos) {
    try {
        // Hacemos la petición POST enviando los datos del evento
        const response = await fetchConAuth(BASE, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            // Convertimos el objeto de datos a texto JSON para enviarlo al servidor
            body:    JSON.stringify(datos),
        });
        // Leemos la respuesta del servidor
        const json = await response.json();
        // Si el servidor rechazó la creación, lanzamos el error
        if (!response.ok) throw new Error(json.message || 'Error al crear evento');
        // Retornamos el evento recién creado tal como lo devuelve el servidor
        return json.data;
    } catch (error) {
        console.error('crearEvento:', error);
        // Retornamos null para indicar que la creación falló
        return null;
    }
}

// ── ELIMINAR EVENTO DEL CALENDARIO ────────────────────────────────────────────

// Exportamos la función eliminarEvento que le dice al servidor que borre un evento específico
// Recibe el id numérico del evento a eliminar
export async function eliminarEvento(id) {
    try {
        // Hacemos la petición DELETE incluyendo el id del evento al final de la URL
        const response = await fetchConAuth(`${BASE}/${id}`, { method: 'DELETE' });
        // Leemos la respuesta del servidor
        const json     = await response.json();
        // Si el servidor no pudo eliminar el evento, lanzamos el error
        if (!response.ok) throw new Error(json.message || 'Error al eliminar evento');
        // Retornamos true para indicar que la eliminación fue exitosa
        return true;
    } catch (error) {
        console.error('eliminarEvento:', error);
        // Retornamos false para indicar que la eliminación falló
        return false;
    }
}
