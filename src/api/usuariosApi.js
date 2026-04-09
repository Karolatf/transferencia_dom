// MÓDULO: api/usuariosApi.js
// CAPA:   API

// Centraliza todas las peticiones HTTP de usuarios al backend Express + MySQL.
// NUNCA manipula el DOM ni conoce la interfaz.
//
// Endpoints cubiertos:
//   GET    /api/users              -> obtenerTodosLosUsuarios
//   GET    /api/users/:id          -> obtenerUsuarioPorId
//   GET    /api/users/:userId/tasks -> obtenerTareasDeUsuarioById
//   POST   /api/users              -> crearUsuario
//   PUT    /api/users/:id          -> actualizarUsuario
//   DELETE /api/users/:id          -> eliminarUsuario

import { API_BASE_URL, API_PREFIX } from '../utils/config.js';

// ── OBTENER TODOS LOS USUARIOS ────────────────────────────────────────────────
export async function obtenerTodosLosUsuarios() {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users`;
        const response = await fetch(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al obtener los usuarios');
        return json.data;
    } catch (error) {
        console.error('obtenerTodosLosUsuarios:', error);
        return null;
    }
}

// ── OBTENER USUARIO POR ID ────────────────────────────────────────────────────
export async function obtenerUsuarioPorId(id) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;
        const response = await fetch(url);
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Usuario ${id} no encontrado`);
        return json.data;
    } catch (error) {
        console.error('obtenerUsuarioPorId:', error);
        return null;
    }
}

// ── OBTENER TAREAS DE UN USUARIO POR ID (endpoint propio de users) ────────────
// GET /api/users/:userId/tasks
// Alternativa al filtro de tareas; devuelve el mismo resultado.
export async function obtenerTareasDeUsuarioById(userId) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${userId}/tasks`;
        const response = await fetch(url);
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al obtener tareas del usuario ${userId}`);
        return json.data;
    } catch (error) {
        console.error('obtenerTareasDeUsuarioById:', error);
        return [];
    }
}

// ── CREAR USUARIO ─────────────────────────────────────────────────────────────
// POST /api/users
// Cuerpo: { documento, name, email }
export async function crearUsuario(datosUsuario) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al crear el usuario');
        return json.data;
    } catch (error) {
        console.error('crearUsuario:', error);
        return null;
    }
}

// ── ACTUALIZAR USUARIO ────────────────────────────────────────────────────────
// PUT /api/users/:id
// Solo permite actualizar: documento, name, email (el modelo ignora el resto)
export async function actualizarUsuario(id, datosUsuario) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al actualizar usuario ${id}`);
        return json.data;
    } catch (error) {
        console.error('actualizarUsuario:', error);
        return null;
    }
}

// ── ELIMINAR USUARIO ──────────────────────────────────────────────────────────
// DELETE /api/users/:id
export async function eliminarUsuario(id) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;
        const response = await fetch(url, { method: 'DELETE' });
        const json = await response.json();
        if (!json.success) throw new Error(json.message || `Error al eliminar usuario ${id}`);
        return true;
    } catch (error) {
        console.error('eliminarUsuario:', error);
        return false;
    }
}