// MÓDULO: api/tareasApi.js
// CAPA:   API (Comunicación exclusiva con el servidor)
//
// Responsabilidad ÚNICA: centralizar TODAS las peticiones HTTP
// de tareas y búsqueda de usuarios que la aplicación hace al servidor.
//
// Este módulo usa la API Fetch nativa del navegador.
// NUNCA manipula el DOM ni conoce la existencia de la interfaz.
// NUNCA contiene lógica de validación ni lógica de negocio.
// Solo envía peticiones y retorna respuestas.
//
// RF-01 READ   -> buscarUsuarioPorDocumento  (GET    /api/users)
// RF-02 CREATE -> registrarTarea             (POST   /api/tasks)
// RF-03 UPDATE -> actualizarTarea            (PUT    /api/tasks/:id)
// RF-04 DELETE -> eliminarTarea              (DELETE /api/tasks/:id)
// EXTRA        -> obtenerTareasDeUsuario     (GET    /api/tasks/filter?userId=)
// CORRECCIÓN   -> obtenerTodasLasTareas      (GET    /api/tasks)
//   Esta función se agregó para que modoUI.js pueda cargar todas las tareas
//   del admin sin hacer fetch() directamente, respetando la arquitectura de capas.
//
// Importamos la URL base y el prefijo desde config.js.
// Si el puerto o el prefijo cambia, se actualiza solo en ese archivo.
import { API_BASE_URL, API_PREFIX } from '../utils/config.js';

// ── RF-01 — BUSCAR USUARIO POR DOCUMENTO (GET) ──────────────────────────────

// Busca un usuario en el servidor filtrando por su número de documento.
// El backend MySQL tiene los usuarios con un campo 'documento' separado
// del 'id' (que es un número consecutivo 1, 2, 3...).
// Parámetro: documentoId — número de documento ingresado en el formulario.
// Retorna: objeto del usuario encontrado, o null si no existe o hay error.
export async function buscarUsuarioPorDocumento(documentoId) {
    try {
        // Se construye la URL completa del endpoint de usuarios.
        // API_BASE_URL = 'http://localhost:3000'
        // API_PREFIX   = '/api'
        // Resultado:   'http://localhost:3000/api/users'
        const url = `${API_BASE_URL}${API_PREFIX}/users`;

        // fetch() usa GET por defecto; no necesita opciones adicionales.
        const response = await fetch(url);

        // response.ok es true solo para códigos 200-299.
        if (!response.ok) {
            throw new Error('Error al consultar el servidor');
        }

        // Se convierte la respuesta a arreglo de objetos.
        const usuarios = await response.json();

        // El backend devuelve todos los usuarios; filtramos en el cliente.
        // Comparamos el campo 'documento' (no el 'id') porque en MySQL
        // el id es 1,2,3... y el documento es el número de cédula real.
        const usuario = usuarios.find(
            u => u.documento && u.documento.toString() === documentoId.toString()
        );

        // Si find() encontró el usuario retornamos ese objeto.
        // Si no lo encontró, find() retorna undefined; el || lo convierte a null.
        return usuario || null;

    } catch (error) {
        console.error('Error al buscar usuario:', error);
        return null;
    }
}

// ── OBTENER TODAS LAS TAREAS DEL SISTEMA (GET) ──────────────────────────────

// CORRECCIÓN: función nueva agregada para que modoUI.js cargue todas las tareas
// del panel admin sin romper la arquitectura de capas del proyecto.
// Antes modoUI.js hacía fetch() directamente, lo que violaba la regla de que
// la capa ui/ no puede comunicarse con el servidor sin pasar por api/.
// Retorna: arreglo completo de tareas, o arreglo vacío si hay error.
export async function obtenerTodasLasTareas() {
    try {
        // Resultado: 'http://localhost:3000/api/tasks'
        const url = `${API_BASE_URL}${API_PREFIX}/tasks`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Error al obtener todas las tareas');
        }

        // El backend retorna el arreglo completo de tareas con assignedUsersDisplay resuelto.
        // getAllTasks() en el modelo ya cruza los IDs con los nombres de usuarios.
        const tareas = await response.json();
        return tareas;

    } catch (error) {
        console.error('Error al obtener todas las tareas:', error);
        // Retornamos arreglo vacío para que la UI pueda mostrar estado vacío sin romper.
        return [];
    }
}

// ── OBTENER TAREAS DE UN USUARIO ESPECÍFICO (GET con filtro) ─────────────────

// Obtiene todas las tareas asignadas a un usuario usando su id interno.
// El backend expone GET /api/tasks/filter?userId=:id para filtrar.
// IMPORTANTE: el json-server anterior usaba /tasks?userId=1 directamente.
// El backend Express usa /api/tasks/filter?userId=1 — ruta distinta.
// Esta función reemplaza el fetch directo que había en tareasService.js.
// Parámetro: userId — id interno del usuario (no el número de documento).
// Retorna: arreglo de tareas del usuario, o arreglo vacío si hay error.
export async function obtenerTareasDeUsuario(userId) {
    try {
        // Se construye la URL con el query parameter para filtrar por usuario.
        // Resultado: 'http://localhost:3000/api/tasks/filter?userId=1'
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/filter?userId=${userId}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error al obtener tareas del usuario ${userId}`);
        }

        // El backend retorna el arreglo de tareas que coinciden con el filtro.
        const tareas = await response.json();
        return tareas;

    } catch (error) {
        console.error('Error al obtener tareas del usuario:', error);
        // Retornamos arreglo vacío para que la UI pueda mostrar estado vacío.
        return [];
    }
}

// ── RF-02 — REGISTRAR TAREA (POST) ───────────────────────────────────────────

// Registra una nueva tarea en el servidor enviando sus datos en el cuerpo.
// El backend espera: { title, description, status, assignedUsers }.
// Parámetro: datosTarea — objeto con todos los campos de la tarea.
// Retorna: objeto de la tarea creada (con el id asignado por MySQL), o null.
export async function registrarTarea(datosTarea) {
    try {
        // Resultado: 'http://localhost:3000/api/tasks'
        const url = `${API_BASE_URL}${API_PREFIX}/tasks`;

        const opciones = {
            method: 'POST',
            headers: {
                // El backend tiene app.use(express.json()) que lee este header.
                'Content-Type': 'application/json'
            },
            // JSON.stringify convierte el objeto a string para enviarlo.
            body: JSON.stringify(datosTarea)
        };

        const response = await fetch(url, opciones);

        // El backend responde 201 Created cuando la tarea se registra bien.
        if (!response.ok) {
            throw new Error('Error al registrar la tarea');
        }

        const tareaCreada = await response.json();
        return tareaCreada;

    } catch (error) {
        console.error('Error al registrar tarea:', error);
        return null;
    }
}

// ── RF-03 — ACTUALIZAR TAREA (PUT) ───────────────────────────────────────────

// Actualiza una tarea existente enviando los campos modificados.
// Se usa PUT (no PATCH) porque el backend MySQL maneja la actualización
// general de campos en la ruta PUT /api/tasks/:id del taskController.
// PATCH en el backend solo existe para cambiar el estado (/api/tasks/:id/status).
// Parámetros:
//   tareaId    — ID de la tarea a actualizar.
//   datosTarea — objeto con los campos que se desean modificar (incluyendo comment).
// Retorna: objeto de la tarea actualizada, o null si hubo error.
export async function actualizarTarea(tareaId, datosTarea) {
    try {
        // Resultado: 'http://localhost:3000/api/tasks/5'
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${tareaId}`;

        const opciones = {
            // PUT porque el backend de MySQL lo maneja en PUT /:id
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosTarea)
        };

        const response = await fetch(url, opciones);

        if (!response.ok) {
            throw new Error(`Error al actualizar la tarea con ID ${tareaId}`);
        }

        const tareaActualizada = await response.json();
        return tareaActualizada;

    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        return null;
    }
}

// ── RF-04 — ELIMINAR TAREA (DELETE) ──────────────────────────────────────────

// Elimina una tarea del servidor usando su ID en la URL.
// El método DELETE no requiere cuerpo en la petición.
// Parámetro: tareaId — ID único de la tarea a eliminar.
// Retorna: true si fue exitoso, o false si hubo error.
export async function eliminarTarea(tareaId) {
    try {
        // Resultado: 'http://localhost:3000/api/tasks/5'
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${tareaId}`;

        // DELETE no lleva body ni Content-Type.
        const opciones = {
            method: 'DELETE'
        };

        const response = await fetch(url, opciones);

        // El backend responde 200 OK con mensaje de confirmación al eliminar.
        if (!response.ok) {
            throw new Error(`Error al eliminar la tarea con ID ${tareaId}`);
        }

        return true;

    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        return false;
    }
}