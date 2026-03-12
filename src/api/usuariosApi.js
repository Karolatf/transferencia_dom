// MÓDULO: api/usuariosApi.js
// CAPA: API (comunicación exclusiva con el servidor)

// Responsabilidad única: centralizar todas las peticiones HTTP
// relacionadas con usuarios al backend (servidor_backend_parejas).

// Este módulo usa la API Fetch nativa del navegador.
// NUNCA manipula el DOM ni conoce la interfaz.
// Solo envía peticiones y retorna respuestas.

// Importamos la URL base desde utils/config.js
// Si el puerto del servidor cambia, solo se edita ese archivo
import { API_BASE_URL } from '../utils/config.js';

// Obtiene todos los usuarios del sistema
// Hace GET a /api/users y devuelve el arreglo completo
// Retorna: arreglo de usuarios, o null si hubo error
export async function obtenerTodosLosUsuarios() {
    try {
        // Se construye la URL del endpoint de usuarios del backend nuevo
        const url = `${API_BASE_URL}/api/users`;

        // Se hace la petición GET al servidor
        const response = await fetch(url);

        // Si el servidor responde con error se lanza una excepción
        if (!response.ok) {
            throw new Error('Error al obtener los usuarios');
        }

        // Se convierte la respuesta a un arreglo de objetos JavaScript
        const usuarios = await response.json();

        // Se devuelve el arreglo para que el llamador lo use
        return usuarios;

    } catch (error) {
        console.error('❌ Error en obtenerTodosLosUsuarios:', error);
        return null;
    }
}

// Crea un usuario nuevo en el backend
// Hace POST a /api/users enviando los datos del usuario en el cuerpo
// Parámetro: datosUsuario — objeto con documento, name y email
// Retorna: el usuario creado (con su id asignado), o null si hubo error
export async function crearUsuario(datosUsuario) {
    try {
        // Se construye la URL del endpoint
        const url = `${API_BASE_URL}/api/users`;

        // Se configuran las opciones de la petición POST
        const opciones = {
            method: 'POST',
            headers: {
                // Se indica al servidor que el cuerpo viene en formato JSON
                'Content-Type': 'application/json'
            },
            // Se convierte el objeto a string JSON para enviarlo
            body: JSON.stringify(datosUsuario)
        };

        // Se hace la petición POST al servidor
        const response = await fetch(url, opciones);

        // Si el servidor responde con error se lanza una excepción
        if (!response.ok) {
            throw new Error('Error al crear el usuario');
        }

        // Se convierte la respuesta al objeto del usuario recién creado
        const usuarioCreado = await response.json();

        // Se devuelve el usuario creado para actualizar la UI
        return usuarioCreado;

    } catch (error) {
        console.error('❌ Error en crearUsuario:', error);
        return null;
    }
}

// Elimina un usuario del backend
// Hace DELETE a /api/users/:id
// Parámetro: id — el id numérico del usuario a eliminar
// Retorna: true si fue exitoso, o false si hubo error
export async function eliminarUsuario(id) {
    try {
        // Se construye la URL con el id del usuario en la ruta
        const url = `${API_BASE_URL}/api/users/${id}`;

        // Se configura la petición DELETE (no lleva body)
        const opciones = {
            method: 'DELETE'
        };

        // Se hace la petición DELETE al servidor
        const response = await fetch(url, opciones);

        // Si el servidor responde con error se lanza una excepción
        if (!response.ok) {
            throw new Error(`Error al eliminar el usuario con id ${id}`);
        }

        // Se devuelve true para indicar que la operación fue exitosa
        return true;

    } catch (error) {
        console.error('❌ Error en eliminarUsuario:', error);
        return false;
    }
}