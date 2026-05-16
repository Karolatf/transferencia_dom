// Archivo: api/usuariosApi.js
// Este archivo contiene todas las peticiones HTTP relacionadas con la gestión de usuarios.
// Se comunica con el servidor para crear, leer, actualizar, desactivar y eliminar usuarios.
// Este archivo nunca toca el HTML ni modifica la pantalla — solo habla con el servidor.

// Importamos la dirección del servidor y el prefijo de los endpoints
import { API_BASE_URL, API_PREFIX } from '../utils/config.js';
// Importamos la función de petición autenticada que agrega el token JWT automáticamente
import { fetchConAuth } from '../utils/fetchConAuth.js';

// ── OBTENER TODOS LOS USUARIOS ────────────────────────────────────────────────

// Exportamos la función obtenerTodosLosUsuarios que trae del servidor la lista completa de usuarios
export async function obtenerTodosLosUsuarios() {
    try {
        // Hacemos la petición GET sin caché para siempre tener la lista actualizada
        const url = `${API_BASE_URL}${API_PREFIX}/users`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al obtener los usuarios');
        // Retornamos el arreglo de todos los usuarios del sistema
        return json.data;
    } catch (error) {
        console.error('obtenerTodosLosUsuarios:', error);
        // Retornamos null para que quien llame esta función sepa que falló la carga
        return null;
    }
}

// ── OBTENER UN USUARIO POR SU ID ──────────────────────────────────────────────

// Exportamos la función obtenerUsuarioPorId que trae del servidor los datos de un solo usuario
// Recibe el id numérico del usuario y retorna su objeto completo
export async function obtenerUsuarioPorId(id) {
    try {
        // Hacemos la petición GET incluyendo el id del usuario en la URL
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;
        const response = await fetchConAuth(url);
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Usuario ${id} no encontrado`);
        // Retornamos los datos completos del usuario
        return json.data;
    } catch (error) {
        console.error('obtenerUsuarioPorId:', error);
        return null;
    }
}

// ── OBTENER LAS TAREAS DE UN USUARIO ─────────────────────────────────────────

// Exportamos la función obtenerTareasDeUsuarioById que trae del servidor las tareas
// asignadas a un usuario específico, usando la ruta de usuarios (no la de tareas)
export async function obtenerTareasDeUsuarioById(userId) {
    try {
        // Hacemos la petición GET a la sub-ruta /tasks del usuario
        const url = `${API_BASE_URL}${API_PREFIX}/users/${userId}/tasks`;
        const response = await fetchConAuth(url);
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al obtener tareas del usuario ${userId}`);
        // Retornamos el arreglo de tareas asignadas al usuario
        return json.data;
    } catch (error) {
        console.error('obtenerTareasDeUsuarioById:', error);
        return [];
    }
}

// ── CREAR NUEVO USUARIO ───────────────────────────────────────────────────────

// Exportamos la función crearUsuario que envía al servidor los datos de un nuevo usuario
// El administrador usa esta función para crear cuentas de estudiantes directamente desde el panel
export async function crearUsuario(datosUsuario) {
    try {
        // Hacemos la petición POST enviando los datos del nuevo usuario
        const url = `${API_BASE_URL}${API_PREFIX}/users`;
        const response = await fetchConAuth(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos documento, nombre, correo del nuevo usuario
            body: JSON.stringify(datosUsuario),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al crear el usuario');
        // Retornamos los datos del usuario recién creado (incluyendo el id asignado por el servidor)
        return json.data;
    } catch (error) {
        console.error('crearUsuario:', error);
        return null;
    }
}

// ── ACTUALIZAR DATOS DE UN USUARIO ───────────────────────────────────────────

// Exportamos la función actualizarUsuario que envía al servidor los datos modificados de un usuario
// Solo permite actualizar: documento, nombre y correo
export async function actualizarUsuario(id, datosUsuario) {
    try {
        // Hacemos la petición PUT incluyendo el id del usuario en la URL
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;
        const response = await fetchConAuth(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al actualizar usuario ${id}`);
        // Retornamos los datos actualizados del usuario
        return json.data;
    } catch (error) {
        console.error('actualizarUsuario:', error);
        return null;
    }
}

// ── ELIMINAR USUARIO (eliminación estándar) ───────────────────────────────────

// Exportamos la función eliminarUsuario que le pide al servidor eliminar permanentemente un usuario
// Solo funciona si el usuario NO tiene tareas pendientes o en progreso
// Requiere un motivo de eliminación de al menos 10 caracteres para el registro de auditoría
export async function eliminarUsuario(id, reason) {
    try {
        // Hacemos la petición DELETE enviando el motivo de eliminación en el cuerpo
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;
        const response = await fetchConAuth(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al eliminar usuario ${id}`);
        // Retornamos true si la eliminación fue exitosa
        return true;
    } catch (error) {
        console.error('eliminarUsuario:', error);
        // Relanzamos el error para que el panel del admin pueda mostrar el mensaje específico al usuario
        throw error;
    }
}

// ── CAMBIAR EL ROL DE UN USUARIO ─────────────────────────────────────────────

// Exportamos la función cambiarRolUsuario que actualiza el rol de un usuario en el sistema
// Solo el administrador puede usar esta función
// Los roles disponibles son: 'admin', 'instructor' y 'user' (estudiante)
export async function cambiarRolUsuario(id, role) {
    try {
        // Hacemos la petición PATCH a la sub-ruta /role del usuario para cambiar solo el rol
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}/role`;
        const response = await fetchConAuth(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos el nuevo rol al servidor
            body: JSON.stringify({ role }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al cambiar el rol del usuario ${id}`);
        // Retornamos el usuario actualizado con su nuevo rol
        return json.data;
    } catch (error) {
        console.error('cambiarRolUsuario:', error);
        return null;
    }
}

// ── CAMBIAR LA CONTRASEÑA DEL USUARIO AUTENTICADO ────────────────────────────

// Exportamos la función cambiarPassword que envía al servidor la contraseña actual y la nueva
// El servidor verifica que la contraseña actual sea correcta antes de actualizarla
export async function cambiarPassword(userId, datos) {
    try {
        // Hacemos la petición PATCH a la sub-ruta /password del usuario
        const url = `${API_BASE_URL}${API_PREFIX}/users/${userId}/password`;
        const response = await fetchConAuth(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos la contraseña actual y la nueva: { currentPassword, newPassword }
            body: JSON.stringify(datos),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al cambiar la contraseña');
        // Retornamos true si el cambio fue exitoso
        return true;
    } catch (error) {
        console.error('cambiarPassword:', error);
        // Retornamos el mensaje de error para que el modal lo muestre al usuario
        return { error: error.message };
    }
}

// ── DESACTIVAR UN USUARIO ─────────────────────────────────────────────────────

// Exportamos la función desactivarUsuario que marca al usuario como inactivo en el servidor
// El usuario desactivado no puede iniciar sesión pero sus datos no se eliminan
// Requiere un motivo de desactivación para el registro de auditoría
export async function desactivarUsuario(id, motivo) {
    // Hacemos la petición PATCH a la sub-ruta /deactivate del usuario
    const url      = `${API_BASE_URL}${API_PREFIX}/users/${id}/deactivate`;
    const respuesta = await fetchConAuth(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos el motivo de desactivación al servidor
        body: JSON.stringify({ reason: motivo }),
    });
    const datos    = await respuesta.json();
    // Si el servidor rechaza (usuario con tareas activas, usuario no encontrado, etc.), lanzamos el error
    if (!respuesta.ok) throw new Error(datos.message || 'No se pudo desactivar el usuario');
    // Retornamos los datos actualizados del usuario desactivado
    return datos.data;
}

// ── REACTIVAR UN USUARIO ──────────────────────────────────────────────────────

// Exportamos la función reactivarUsuario que marca al usuario como activo nuevamente en el servidor
// Se usa para restaurar el acceso de un usuario que había sido desactivado
export async function reactivarUsuario(id) {
    // Hacemos la petición PATCH a la sub-ruta /reactivate del usuario
    const url      = `${API_BASE_URL}${API_PREFIX}/users/${id}/reactivate`;
    const respuesta = await fetchConAuth(url, { method: 'PATCH' });
    const datos    = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.message || 'No se pudo reactivar el usuario');
    // Retornamos los datos actualizados del usuario reactivado
    return datos.data;
}

// ── ELIMINAR USUARIO DE FORMA FORZOSA ────────────────────────────────────────

// Exportamos la función forceEliminarUsuario que elimina un usuario sin importar si tiene tareas activas
// Se usa como última opción cuando la eliminación estándar falla por tareas pendientes
// Requiere un motivo de al menos 10 caracteres para el registro de auditoría
export async function forceEliminarUsuario(id, reason) {
    // Hacemos la petición DELETE a la sub-ruta /force del usuario
    const url = `${API_BASE_URL}${API_PREFIX}/users/${id}/force`;
    const respuesta = await fetchConAuth(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos el motivo de la eliminación forzosa
        body: JSON.stringify({ reason }),
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.message || 'No se pudo eliminar el usuario forzosamente');
    // Retornamos true para indicar que la eliminación fue exitosa
    return true;
}
