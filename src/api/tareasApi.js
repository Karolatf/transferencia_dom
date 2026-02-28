// MÓDULO: api/tareasApi.js
// CAPA:   API (Comunicación exclusiva con el servidor)

// Responsabilidad ÚNICA: centralizar TODAS las peticiones HTTP
// que la aplicación hace al servidor (json-server).

// Este módulo usa la API Fetch nativa del navegador.
// NUNCA manipula el DOM ni conoce la existencia de la interfaz.
// NUNCA contiene lógica de validación ni lógica de negocio.
// Solo envía peticiones y retorna respuestas.

// Ventaja: si cambia la fuente de datos (otra API, otra URL),
// solo se modifica ESTE archivo sin tocar handlers ni UI.

// RF-01 READ   -> buscarUsuarioPorDocumento (GET  /users)
// RF-02 CREATE -> registrarTarea            (POST /tasks)
// RF-03 UPDATE -> actualizarTarea           (PATCH /tasks/:id)
// RF-04 DELETE -> eliminarTarea             (DELETE /tasks/:id)

// Dependencias: utils/config.js (solo para la URL base)

// Importamos la URL base desde la capa de utils/configuración
// Así si el puerto cambia, se actualiza en un solo lugar
import { API_BASE_URL } from '../utils/config.js';

// RF-01 – BUSCAR USUARIO (READ / GET)

// Busca un usuario en el servidor filtrando por su número de documento
// Usa el método HTTP GET al endpoint /users
// Parámetro: documentoId - El número de documento ingresado en el formulario
// Retorna: Promesa con el objeto del usuario encontrado, o null si no existe o hay error
export async function buscarUsuarioPorDocumento(documentoId) {
    try {
        // ----- PASO 1: CONSTRUIR LA URL -----
        // Template literal para construir la URL completa del endpoint
        // Resultado: http://localhost:3000/users
        const url = `${API_BASE_URL}/users`;

        // ----- PASO 2: REALIZAR LA PETICIÓN GET -----
        // fetch() realiza GET por defecto (no necesita opciones adicionales)
        // 'await' pausa la ejecución hasta que el servidor responda
        const response = await fetch(url);

        // ----- PASO 3: VERIFICAR SI LA RESPUESTA ES EXITOSA -----
        // response.ok es true solo para códigos HTTP entre 200 y 299
        if (!response.ok) {
            // Si el servidor devolvió error (400, 500, etc.), lanzamos un error
            // Esto hace que la ejecución salte al bloque catch()
            throw new Error('Error al consultar el servidor');
        }

        // ----- PASO 4: CONVERTIR LA RESPUESTA A JSON -----
        // response.json() analiza el cuerpo y lo convierte en array de objetos
        // 'await' pausa hasta que la conversión termine (es asíncrona)
        const usuarios = await response.json();

        // ----- PASO 5: BUSCAR EL USUARIO EN EL ARREGLO -----
        // find() recorre el arreglo y retorna el primero que cumpla la condición
        // Convertimos ambos a string para evitar errores de tipo (número vs string)
        const usuario = usuarios.find(u => u.id.toString() === documentoId.toString());

        // ----- PASO 6: RETORNAR EL RESULTADO -----
        // Si find() encontró el usuario, retornamos ese objeto
        // Si no lo encontró, find() retorna undefined; el operador || lo convierte a null
        return usuario || null;

    } catch (error) {
        // ----- MANEJO DE ERRORES -----
        // Capturamos cualquier error (red caída, servidor inaccesible, error lanzado)
        // para no romper la aplicación con un error no controlado
        console.error('❌ Error al buscar usuario:', error);
        // Retornamos null para que el service sepa que la operación falló
        return null;
    }
}

// RF-02 – REGISTRAR TAREA (CREATE / POST)

// Registra una nueva tarea en el servidor enviando sus datos en el cuerpo
// Usa el método HTTP POST al endpoint /tasks
// Parámetro: datosTarea - Objeto JavaScript con todos los campos de la tarea
// Retorna: Promesa con el objeto de la tarea creada (incluye ID generado), o null si hay error
export async function registrarTarea(datosTarea) {
    try {
        // ----- PASO 1: CONSTRUIR LA URL -----
        // Resultado: http://localhost:3000/tasks
        const url = `${API_BASE_URL}/tasks`;

        // ----- PASO 2: CONFIGURAR LAS OPCIONES DE LA PETICIÓN POST -----
        // A diferencia del GET, el POST necesita opciones para enviar datos
        const opciones = {
            method: 'POST', // Indicamos que es una petición de tipo POST (crear recurso)
            headers: {
                // Le decimos al servidor que el cuerpo viene en formato JSON
                'Content-Type': 'application/json'
            },
            // JSON.stringify() convierte el objeto JavaScript a string JSON para enviarlo
            // El cuerpo de la petición siempre debe ser un string, no un objeto
            body: JSON.stringify(datosTarea)
        };

        // ----- PASO 3: REALIZAR LA PETICIÓN POST -----
        // 'await' pausa hasta que el servidor procese y responda
        const response = await fetch(url, opciones);

        // ----- PASO 4: VERIFICAR SI LA RESPUESTA ES EXITOSA -----
        if (!response.ok) {
            throw new Error('Error al registrar la tarea');
        }

        // ----- PASO 5: CONVERTIR LA RESPUESTA A JSON -----
        // El servidor retorna el objeto de la tarea recién creada, incluyendo el ID generado
        const tareaCreada = await response.json();

        // ----- PASO 6: RETORNAR LA TAREA CREADA -----
        // El service usará este objeto para actualizar el DOM y el estado local
        return tareaCreada;

    } catch (error) {
        console.error('❌ Error al registrar tarea:', error);
        // Retornamos null para que el service informe el error al usuario
        return null;
    }
}

// RF-03 – ACTUALIZAR TAREA (UPDATE / PATCH)

// Actualiza una tarea existente en el servidor enviando solo los campos modificados
// Usa PATCH (no PUT) porque modifica parcialmente el recurso, no lo reemplaza completo
// Parámetros:
//   tareaId    - ID de la tarea a actualizar (para construir la URL con el recurso exacto)
//   datosTarea - Objeto con los campos que se desean modificar
// Retorna: Promesa con el objeto de la tarea actualizada, o null si hubo error
export async function actualizarTarea(tareaId, datosTarea) {
    try {
        // ----- PASO 1: CONSTRUIR LA URL DEL RECURSO ESPECÍFICO -----
        // El ID de la tarea forma parte de la URL para identificar exactamente cuál actualizar
        // Resultado: http://localhost:3000/tasks/5
        const url = `${API_BASE_URL}/tasks/${tareaId}`;

        // ----- PASO 2: CONFIGURAR LA PETICIÓN PATCH -----
        const opciones = {
            method: 'PATCH', // Actualización parcial del recurso (RF-03)
            headers: {
                'Content-Type': 'application/json'
            },
            // Solo enviamos los campos que cambian, no el recurso completo
            body: JSON.stringify(datosTarea)
        };

        // ----- PASO 3: REALIZAR LA PETICIÓN PATCH -----
        // 'await' pausa hasta recibir la respuesta del servidor
        const response = await fetch(url, opciones);

        // ----- PASO 4: VERIFICAR SI LA RESPUESTA ES EXITOSA -----
        // response.ok es true para códigos 200-299 (200 = OK en este caso)
        if (!response.ok) {
            throw new Error(`Error al actualizar la tarea con ID ${tareaId}`);
        }

        // ----- PASO 5: CONVERTIR LA RESPUESTA A JSON -----
        // El servidor devuelve la tarea con los datos ya actualizados
        const tareaActualizada = await response.json();

        // ----- PASO 6: RETORNAR LA TAREA ACTUALIZADA -----
        // El service usará este objeto para actualizar el DOM y el estado local
        return tareaActualizada;

    } catch (error) {
        console.error('❌ Error al actualizar tarea:', error);
        return null;
    }
}

// RF-04 – ELIMINAR TAREA (DELETE)

// Elimina una tarea del servidor usando su ID en la URL
// El método DELETE no requiere cuerpo (body) en la petición
// Parámetro: tareaId - ID único de la tarea a eliminar
// Retorna: Promesa que resuelve con true si fue exitoso, o false si hubo error
export async function eliminarTarea(tareaId) {
    try {
        // ----- PASO 1: CONSTRUIR LA URL DEL RECURSO A ELIMINAR -----
        // Resultado: http://localhost:3000/tasks/5
        const url = `${API_BASE_URL}/tasks/${tareaId}`;

        // ----- PASO 2: CONFIGURAR LA PETICIÓN DELETE -----
        // DELETE solo necesita el método HTTP; no lleva body ni Content-Type
        const opciones = {
            method: 'DELETE' // Indica al servidor que debe borrar este recurso (RF-04)
        };

        // ----- PASO 3: REALIZAR LA PETICIÓN DELETE -----
        // 'await' pausa hasta que el servidor confirme la eliminación
        const response = await fetch(url, opciones);

        // ----- PASO 4: VERIFICAR SI LA ELIMINACIÓN FUE EXITOSA -----
        // json-server devuelve 200 OK al eliminar correctamente
        if (!response.ok) {
            throw new Error(`Error al eliminar la tarea con ID ${tareaId}`);
        }

        // ----- PASO 5: RETORNAR CONFIRMACIÓN -----
        // Retornamos true para indicar que la operación fue exitosa
        return true;

    } catch (error) {
        console.error('❌ Error al eliminar tarea:', error);
        // Retornamos false para que el service informe al usuario sobre el fallo
        return false;
    }
}