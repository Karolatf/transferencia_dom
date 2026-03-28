// MÓDULO: api/usuariosApi.js
// CAPA: API (comunicación exclusiva con el servidor)

// Responsabilidad única: centralizar todas las peticiones HTTP
// relacionadas con usuarios al backend Express (servidor_backend_parejas).

// Este módulo usa la API Fetch nativa del navegador.
// NUNCA manipula el DOM ni conoce la interfaz.
// Solo envía peticiones y retorna respuestas.

// Endpoints que cubre este módulo:
//   GET    /api/users       -> obtenerTodosLosUsuarios
//   GET    /api/users/:id   -> obtenerUsuarioPorId
//   POST   /api/users       -> crearUsuario
//   PUT    /api/users/:id   -> actualizarUsuario
//   DELETE /api/users/:id   -> eliminarUsuario

// Importamos la URL base y el prefijo de rutas desde config.js.
// Si el servidor cambia de puerto o prefijo, solo se edita ese archivo.
import { API_BASE_URL, API_PREFIX } from '../utils/config.js';

// OBTENER TODOS LOS USUARIOS (GET)

// Obtiene el arreglo completo de usuarios del sistema.
// Retorna: arreglo de usuarios, o null si hubo error.
export async function obtenerTodosLosUsuarios() {
    try {
        // Resultado: 'http://localhost:3000/api/users'
        const url = `${API_BASE_URL}${API_PREFIX}/users`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Error al obtener los usuarios');
        }

        const usuarios = await response.json();
        return usuarios;

    } catch (error) {
        console.error('Error en obtenerTodosLosUsuarios:', error);
        return null;
    }
}

// OBTENER USUARIO POR ID (GET)

// Busca un usuario específico usando su id interno (no el documento).
// El backend expone GET /api/users/:id para esto.
// Parámetro: id — el id numérico del usuario (1, 2, 3...).
// Retorna: objeto del usuario encontrado, o null si no existe o hay error.
export async function obtenerUsuarioPorId(id) {
    try {
        // Resultado: 'http://localhost:3000/api/users/1'
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;

        const response = await fetch(url);

        // El backend responde 404 si el usuario no existe.
        if (!response.ok) {
            throw new Error(`Usuario con id ${id} no encontrado`);
        }

        const usuario = await response.json();
        return usuario;

    } catch (error) {
        console.error('Error en obtenerUsuarioPorId:', error);
        return null;
    }
}

// CREAR USUARIO (POST)

// Crea un usuario nuevo en el backend.
// El backend asigna el id automáticamente (AUTO_INCREMENT en MySQL).
// Parámetro: datosUsuario — objeto con documento, name y email.
// Retorna: el usuario creado con su id asignado por MySQL, o null si hubo error.
export async function crearUsuario(datosUsuario) {
    try {
        // Resultado: 'http://localhost:3000/api/users'
        const url = `${API_BASE_URL}${API_PREFIX}/users`;

        const opciones = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosUsuario)
        };

        const response = await fetch(url, opciones);

        // El backend responde 201 Created cuando el usuario se crea correctamente.
        if (!response.ok) {
            throw new Error('Error al crear el usuario');
        }

        const usuarioCreado = await response.json();
        return usuarioCreado;

    } catch (error) {
        console.error('Error en crearUsuario:', error);
        return null;
    }
}

// ACTUALIZAR USUARIO (PUT)

// Actualiza los datos de un usuario existente en el backend.
// El backend solo permite actualizar: documento, name, email.
// Parámetros:
//   id           — id numérico del usuario a actualizar.
//   datosUsuario — objeto con los campos a modificar.
// Retorna: el usuario con los datos actualizados, o null si hubo error.
export async function actualizarUsuario(id, datosUsuario) {
    try {
        // Resultado: 'http://localhost:3000/api/users/1'
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;

        const opciones = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosUsuario)
        };

        const response = await fetch(url, opciones);

        // El backend responde 404 si el usuario no existe.
        if (!response.ok) {
            throw new Error(`Error al actualizar el usuario con id ${id}`);
        }

        const usuarioActualizado = await response.json();
        return usuarioActualizado;

    } catch (error) {
        console.error('Error en actualizarUsuario:', error);
        return null;
    }
}

// ELIMINAR USUARIO (DELETE)

// Elimina un usuario del backend.
// El método DELETE no necesita cuerpo en la petición.
// Parámetro: id — el id numérico del usuario a eliminar.
// Retorna: true si fue exitoso, o false si hubo error.
export async function eliminarUsuario(id) {
    try {
        // Resultado: 'http://localhost:3000/api/users/1'
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;

        // DELETE solo necesita el método; no lleva body.
        const opciones = {
            method: 'DELETE'
        };

        const response = await fetch(url, opciones);

        // El backend responde 404 si el usuario no existe.
        if (!response.ok) {
            throw new Error(`Error al eliminar el usuario con id ${id}`);
        }

        return true;

    } catch (error) {
        console.error('Error en eliminarUsuario:', error);
        return false;
    }
}