// Archivo: api/tareasApi.js
// Este archivo contiene todas las peticiones HTTP relacionadas con las tareas del sistema.
// Se comunica con el servidor para obtener, crear, actualizar, eliminar y asignar tareas.
// Este archivo nunca toca el HTML ni modifica la pantalla — solo habla con el servidor.

// Importamos la dirección del servidor y el prefijo de los endpoints
import { API_BASE_URL, API_PREFIX } from '../utils/config.js';
// Importamos la función de petición autenticada que agrega el token JWT automáticamente
import { fetchConAuth } from '../utils/fetchConAuth.js';

// ── OBTENER TODAS LAS TAREAS ──────────────────────────────────────────────────

// Exportamos la función obtenerTodasLasTareas que trae del servidor la lista completa de tareas
// La respuesta del servidor ya incluye los nombres de los usuarios asignados (no solo sus IDs)
export async function obtenerTodasLasTareas() {
    try {
        // Construimos la URL del endpoint y hacemos la petición GET sin usar caché
        const url = `${API_BASE_URL}${API_PREFIX}/tasks`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        // Convertimos la respuesta del servidor a objeto JavaScript
        const json = await response.json();
        // Si el servidor respondió con error, lanzamos el error con su mensaje
        if (!response.ok) throw new Error(json.message || 'Error al obtener todas las tareas');
        // Retornamos el arreglo de tareas listo para mostrar en la tabla
        return json.data;
    } catch (error) {
        console.error('obtenerTodasLasTareas:', error);
        // Si falla la conexión o el servidor, retornamos lista vacía para no romper la pantalla
        return [];
    }
}

// ── OBTENER DATOS DEL DASHBOARD ───────────────────────────────────────────────

// Exportamos la función obtenerDashboard que trae del servidor los contadores de resumen
// Retorna un objeto con: { total, pendientes, enProgreso, completadas }
export async function obtenerDashboard() {
    try {
        // Pedimos al servidor los datos del dashboard
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/dashboard`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al obtener el dashboard');
        // Retornamos el objeto con los contadores de tareas por estado
        return json.data;
    } catch (error) {
        console.error('obtenerDashboard:', error);
        // Si falla, retornamos null para que la pantalla lo maneje sin mostrar datos incorrectos
        return null;
    }
}

// ── OBTENER TAREAS DE UN USUARIO ESPECÍFICO ───────────────────────────────────

// Exportamos la función obtenerTareasDeUsuario que trae del servidor solo las tareas
// que están asignadas al usuario con el id recibido como parámetro
export async function obtenerTareasDeUsuario(userId) {
    try {
        // Construimos la URL con el filtro de usuario en los parámetros de la dirección
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/filter?userId=${userId}`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al obtener tareas del usuario ${userId}`);
        // Retornamos el arreglo de tareas del usuario
        return json.data;
    } catch (error) {
        console.error('obtenerTareasDeUsuario:', error);
        return [];
    }
}

// ── OBTENER UNA TAREA POR SU ID ───────────────────────────────────────────────

// Exportamos la función obtenerTareaPorId que trae del servidor los detalles de una sola tarea
// Recibe el id numérico de la tarea y retorna el objeto completo de esa tarea
export async function obtenerTareaPorId(id) {
    try {
        // Construimos la URL incluyendo el id de la tarea al final
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${id}`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Tarea ${id} no encontrada`);
        // Retornamos el objeto completo de la tarea
        return json.data;
    } catch (error) {
        console.error('obtenerTareaPorId:', error);
        // Si no se encontró la tarea, retornamos null
        return null;
    }
}

// ── CREAR NUEVA TAREA ─────────────────────────────────────────────────────────

// Exportamos la función registrarTarea que envía al servidor los datos de una nueva tarea
// Si hay errores de validación, los adjunta al error lanzado para mostrarlos en el formulario
export async function registrarTarea(datosTarea) {
    // Construimos la URL del endpoint de creación de tareas
    const url = `${API_BASE_URL}${API_PREFIX}/tasks`;
    // Hacemos la petición POST enviando todos los datos de la nueva tarea
    const response = await fetchConAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Convertimos el objeto de datos a texto JSON para enviarlo
        body: JSON.stringify(datosTarea),
    });
    // Leemos la respuesta del servidor
    const json = await response.json();
    if (!response.ok) {
        // Creamos el error con el mensaje del servidor
        const err = new Error(json.message || 'Error al registrar la tarea');
        // Si el servidor envió errores de validación campo por campo (código 400), los adjuntamos al error
        if (response.status === 400 && Array.isArray(json.data) && json.data.length > 0) {
            err.validationErrors = json.data;
            // Usamos el primer error específico como mensaje principal
            err.message = json.data[0].message || json.message || 'Error al registrar la tarea';
        }
        throw err;
    }
    // Si fue exitoso, retornamos los datos de la tarea recién creada
    return json.data;
}

// ── ACTUALIZAR TODOS LOS DATOS DE UNA TAREA ───────────────────────────────────

// Exportamos la función actualizarTarea que envía al servidor todos los campos actualizados de una tarea
// Se usa cuando el admin o instructor editan título, descripción, estado, usuarios asignados o comentario
export async function actualizarTarea(tareaId, datosTarea) {
    // Construimos la URL incluyendo el id de la tarea a actualizar
    const url = `${API_BASE_URL}${API_PREFIX}/tasks/${tareaId}`;
    // Hacemos la petición PUT con todos los campos de la tarea
    const response = await fetchConAuth(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosTarea),
    });
    // Leemos la respuesta del servidor
    const json = await response.json();
    if (!response.ok) {
        // Creamos el error con el mensaje del servidor
        const err = new Error(json.message || `Error al actualizar tarea ${tareaId}`);
        // Si hay errores de validación, los adjuntamos al error para mostrarlos en el formulario
        if (response.status === 400 && Array.isArray(json.data)) {
            err.validationErrors = json.data;
        }
        console.error('actualizarTarea:', err);
        throw err;
    }
    // Retornamos los datos actualizados de la tarea
    return json.data;
}

// ── CAMBIAR SOLO EL ESTADO DE UNA TAREA ──────────────────────────────────────

// Exportamos la función cambiarEstadoTarea que actualiza únicamente el estado de una tarea
// sin modificar ningún otro dato (título, descripción, etc.)
// Los estados posibles son: 'pendiente', 'en_progreso', 'pendiente_aprobacion', 'completada'
export async function cambiarEstadoTarea(tareaId, status) {
    try {
        // Construimos la URL con la sub-ruta /status al final para indicar que solo cambiamos el estado
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${tareaId}/status`;
        // Hacemos la petición PATCH (actualización parcial) enviando solo el nuevo estado
        const response = await fetchConAuth(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al cambiar estado de tarea ${tareaId}`);
        // Retornamos los datos actualizados de la tarea
        return json.data;
    } catch (error) {
        console.error('cambiarEstadoTarea:', error);
        return null;
    }
}

// ── ELIMINAR UNA TAREA ────────────────────────────────────────────────────────

// Exportamos la función eliminarTarea que le dice al servidor que elimine permanentemente una tarea
// Recibe el id numérico de la tarea a eliminar
export async function eliminarTarea(tareaId) {
    try {
        // Hacemos la petición DELETE incluyendo el id de la tarea en la URL
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${tareaId}`;
        const response = await fetchConAuth(url, { method: 'DELETE' });
        const json = await response.json();
        if (!json.success) throw new Error(json.message || `Error al eliminar tarea ${tareaId}`);
        // Retornamos true para indicar que la eliminación fue exitosa
        return true;
    } catch (error) {
        console.error('eliminarTarea:', error);
        // Retornamos false para indicar que la eliminación falló
        return false;
    }
}

// ── ASIGNAR USUARIOS A UNA TAREA ─────────────────────────────────────────────

// Exportamos la función asignarUsuariosATarea que le indica al servidor qué usuarios
// deben quedar asignados a una tarea específica
// Recibe el id de la tarea y un arreglo con los ids de los usuarios a asignar
export async function asignarUsuariosATarea(taskId, userIds) {
    try {
        // Construimos la URL con la sub-ruta /assign al final
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${taskId}/assign`;
        // Hacemos la petición POST enviando el arreglo de ids de usuarios
        const response = await fetchConAuth(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al asignar usuarios a tarea ${taskId}`);
        // Retornamos los datos actualizados de la asignación
        return json.data;
    } catch (error) {
        console.error('asignarUsuariosATarea:', error);
        return null;
    }
}

// ── QUITAR UN USUARIO DE UNA TAREA ───────────────────────────────────────────

// Exportamos la función quitarUsuarioDeTarea que elimina la asignación de un usuario específico
// de una tarea específica (sin eliminar ni al usuario ni a la tarea)
export async function quitarUsuarioDeTarea(taskId, userId) {
    try {
        // Construimos la URL con el id de la tarea y el id del usuario en la ruta
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${taskId}/users/${userId}`;
        // Hacemos la petición DELETE para remover la asignación
        const response = await fetchConAuth(url, { method: 'DELETE' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al quitar usuario ${userId} de tarea ${taskId}`);
        // Retornamos los datos actualizados
        return json.data;
    } catch (error) {
        console.error('quitarUsuarioDeTarea:', error);
        return null;
    }
}

// ── BUSCAR USUARIO POR NÚMERO DE DOCUMENTO ────────────────────────────────────

// Exportamos la función buscarUsuarioPorDocumento que consulta al servidor si existe
// un usuario con el número de documento de identidad recibido como parámetro
// Se usa en el formulario de asignación de tareas para buscar al estudiante a asignar
export async function buscarUsuarioPorDocumento(documentoId) {
    try {
        // Construimos la URL con el documento en la ruta — encodeURIComponent maneja caracteres especiales
        const url = `${API_BASE_URL}${API_PREFIX}/users/by-document/${encodeURIComponent(documentoId.toString().trim())}`;
        // Hacemos la petición GET sin caché para siempre encontrar usuarios recién creados
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        // Si el servidor responde 404, significa que no existe un usuario con ese documento
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(json.message || 'Error al consultar el servidor');
        // Retornamos los datos del usuario encontrado
        return json.data;
    } catch (error) {
        console.error('buscarUsuarioPorDocumento:', error);
        return null;
    }
}
