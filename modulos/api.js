
// FUNCIONES DE COMUNICACIÓN CON EL SERVIDOR

// Importamos la URL base del servidor desde el módulo de configuración
// Así si el puerto o la dirección cambia, solo se actualiza en config.js

// RF-01 READ   -> searchUserByDocument (GET /users)
// RF-02 CREATE -> registerTask (POST /tasks)
// RF-03 UPDATE -> updateTask (PATCH /tasks/:id)
// RF-04 DELETE -> deleteTask (DELETE /tasks/:id)

// Este módulo centraliza todas las peticiones HTTP que la aplicación hace al servidor
// Usa la API Fetch nativa del navegador para comunicarse con json-server
// Separar la lógica de red aquí permite cambiar la fuente de datos (ej: otra API) sin tener que modificar los manejadores de eventos ni la lógica de UI

// Importamos la URL base del servidor desde el módulo de configuración
// Así si el puerto o la dirección cambia, solo se actualiza en config.js
import { API_BASE_URL } from './config.js';

// Busca un usuario en el servidor filtrando por su número de documento (ID)
// Esta función usa fetch() para hacer una petición HTTP GET al endpoint /users
// Parámetro: documentId - El documento del usuario ingresado en el formulario de búsqueda
// Retorna: Promesa que resuelve con el objeto del usuario encontrado, o null si no existe o hay error
export async function searchUserByDocument(documentId) {
    try {
        // ----- PASO 1: CONSTRUIR LA URL -----
        // Usamos template literal para construir la URL completa del endpoint de usuarios
        // El resultado sería algo como: http://localhost:3000/users
        const url = `${API_BASE_URL}/users`;

        // ----- PASO 2: REALIZAR LA PETICIÓN GET -----
        // fetch() realiza una petición HTTP GET por defecto (sin opciones adicionales)
        // 'await' pausa la ejecución aquí hasta que el servidor responda
        // La respuesta llega como un objeto Response, no como datos directamente
        const response = await fetch(url);

        // ----- PASO 3: VERIFICAR SI LA RESPUESTA ES EXITOSA -----
        // response.ok es true solo si el código de estado HTTP está entre 200 y 299
        if (!response.ok) {
            // Si el servidor devolvió un error (400, 500, etc.), lanzamos un error manualmente
            // Esto hace que la ejecución salte al bloque catch()
            throw new Error('Error al consultar el servidor');
        }

        // ----- PASO 4: CONVERTIR LA RESPUESTA A JSON -----
        // response.json() analiza el cuerpo de la respuesta y lo convierte en un arreglo de objetos
        // 'await' pausa hasta que la conversión termine (es una operación asíncrona)
        const users = await response.json();

        // ----- PASO 5: BUSCAR EL USUARIO EN EL ARREGLO -----
        // find() recorre el arreglo y retorna el primer elemento que cumple la condición
        // Convertimos ambos valores a string con toString() para evitar errores de comparación ya que el ID en el servidor puede ser número y el input del formulario es siempre string
        const user = users.find(u => u.id.toString() === documentId.toString());

        // ----- PASO 6: RETORNAR EL RESULTADO -----
        // Si find() encontró el usuario, retornamos ese objeto
        // Si no lo encontró, find() retorna undefined y el operador || convierte eso a null
        return user || null;

    } catch (error) {
        // ----- MANEJO DE ERRORES -----
        // Si ocurre cualquier error (red caída, servidor inaccesible, error lanzado arriba), lo capturamos aquí para no romper la aplicación con un error no controlado
        console.error('Error al buscar usuario:', error);
        // Retornamos null para indicar que no se pudo obtener el usuario
        // El handler que llama esta función verifica este null para mostrar el mensaje adecuado
        return null;
    }
}

// Registra una nueva tarea en el servidor enviando sus datos
// Esta función usa fetch() para hacer una petición HTTP POST al endpoint /tasks
// Parámetro: taskData - Objeto JavaScript con todos los campos de la tarea a registrar
// Retorna: Promesa que resuelve con el objeto de la tarea creada (incluye ID generado), o null si hay error
export async function registerTask(taskData) {
    try {
        // ----- PASO 1: CONSTRUIR LA URL -----
        // Construimos la URL completa del endpoint de tareas
        // El resultado sería algo como: http://localhost:3000/tasks
        const url = `${API_BASE_URL}/tasks`;

        // ----- PASO 2: CONFIGURAR LAS OPCIONES DE LA PETICIÓN POST -----
        // A diferencia del GET, el POST necesita opciones adicionales para enviar datos
        const options = {
            method: 'POST', // Indicamos que es una petición de tipo POST (crear recurso)
            headers: {
                // Le decimos al servidor que el cuerpo de la petición está en formato JSON
                'Content-Type': 'application/json'
            },
            // JSON.stringify() convierte el objeto JavaScript a un string JSON para enviarlo
            // El cuerpo de la petición siempre debe ser un string, no un objeto
            body: JSON.stringify(taskData)
        };

        // ----- PASO 3: REALIZAR LA PETICIÓN POST -----
        // Pasamos la URL y las opciones a fetch() para hacer el POST
        // 'await' pausa hasta que el servidor procese la petición y responda
        const response = await fetch(url, options);

        // ----- PASO 4: VERIFICAR SI LA RESPUESTA ES EXITOSA -----
        // Verificamos que el servidor haya creado el recurso correctamente
        if (!response.ok) {
            // Si el servidor respondió con un error, lanzamos un error para ir al catch
            throw new Error('Error al registrar la tarea');
        }

        // ----- PASO 5: CONVERTIR LA RESPUESTA A JSON -----
        // El servidor retorna el objeto de la tarea recién creada, incluyendo el ID generado
        // Convertimos la respuesta a un objeto JavaScript con response.json()
        const createdTask = await response.json();

        // ----- PASO 6: RETORNAR LA TAREA CREADA -----
        // Retornamos el objeto completo de la tarea para que el handler la agregue a la tabla
        return createdTask;

    } catch (error) {
        // ----- MANEJO DE ERRORES -----
        // Capturamos cualquier error de red o del servidor para no romper la aplicación
        console.error('Error al registrar tarea:', error);
        // Retornamos null para que el handler sepa que la operación falló
        return null;
    }
}

// RF-03 – ACTUALIZACIÓN DE TAREAS (UPDATE)

// Actualiza una tarea existente en el servidor enviando solo los campos modificados
// Usa el método HTTP PATCH porque modifica únicamente los campos indicados, no reemplaza el recurso completo (eso sería PUT)
//   Parámetros:
//   taskId   - ID de la tarea a actualizar (necesario para construir la URL correcta)
//   taskData - Objeto con los campos que se desean modificar (título, descripción, estado, etc.)
// Retorna: Promesa que resuelve con el objeto de la tarea actualizada, o null si hubo error
export async function updateTask(taskId, taskData) {
    try {
        // ----- PASO 1: CONSTRUIR LA URL DEL RECURSO ESPECÍFICO -----
        // El endpoint de actualización incluye el ID de la tarea en la URL
        // Ejemplo: http://localhost:3000/tasks/5
        const url = `${API_BASE_URL}/tasks/${taskId}`;

        // ----- PASO 2: CONFIGURAR LA PETICIÓN PATCH -----
        // PATCH indica que solo se envían los campos que cambian, no el recurso completo
        const options = {
            method: 'PATCH', // Actualización parcial del recurso (RF-03)
            headers: {
                // Informamos al servidor que el cuerpo viene en formato JSON
                'Content-Type': 'application/json'
            },
            // Convertimos el objeto JavaScript a string JSON para enviarlo en el cuerpo
            body: JSON.stringify(taskData)
        };

        // ----- PASO 3: REALIZAR LA PETICIÓN PATCH -----
        // 'await' pausa la función hasta recibir respuesta del servidor
        const response = await fetch(url, options);

        // ----- PASO 4: VERIFICAR SI LA RESPUESTA ES EXITOSA -----
        // response.ok es true para códigos 200-299 (200 = OK en este caso)
        if (!response.ok) {
            // Si el servidor respondió con error (404, 500, etc.), lanzamos un error
            throw new Error(`Error al actualizar la tarea con ID ${taskId}`);
        }

        // ----- PASO 5: CONVERTIR LA RESPUESTA A JSON -----
        // El servidor devuelve la tarea con los datos ya actualizados
        const updatedTask = await response.json();

        // ----- PASO 6: RETORNAR LA TAREA ACTUALIZADA -----
        // Retornamos el objeto completo para que el handler actualice el DOM
        return updatedTask;

    } catch (error) {
        // ----- MANEJO DE ERRORES -----
        // Capturamos cualquier error de red, timeout o del servidor
        console.error('Error al actualizar tarea:', error);
        // Retornamos null para que el handler muestre el mensaje de error al usuario
        return null;
    }
}

// RF-04 – ELIMINACIÓN DE TAREAS (DELETE)

// Elimina una tarea del servidor enviando su identificador único en la URL
// El método DELETE no requiere cuerpo (body) en la petición, solo el ID en la URL
// Parámetro: taskId - ID único de la tarea que se desea eliminar
// Retorna: Promesa que resuelve con true si se eliminó exitosamente, o false si hubo error
export async function deleteTask(taskId) {
    try {
        // ----- PASO 1: CONSTRUIR LA URL DEL RECURSO A ELIMINAR -----
        // El ID de la tarea forma parte de la URL para identificar exactamente cuál eliminar
        // Ejemplo: http://localhost:3000/tasks/5
        const url = `${API_BASE_URL}/tasks/${taskId}`;

        // ----- PASO 2: CONFIGURAR LA PETICIÓN DELETE -----
        // El método DELETE solo necesita el método HTTP; no lleva body ni Content-Type
        const options = {
            method: 'DELETE' // Indica al servidor que debe borrar este recurso (RF-04)
        };

        // ----- PASO 3: REALIZAR LA PETICIÓN DELETE -----
        // 'await' pausa la función hasta que el servidor confirme la eliminación
        const response = await fetch(url, options);

        // ----- PASO 4: VERIFICAR SI LA ELIMINACIÓN FUE EXITOSA -----
        // json-server devuelve 200 OK al eliminar correctamente
        if (!response.ok) {
            // Si el recurso no existía (404) o hubo error del servidor (500), lanzamos error
            throw new Error(`Error al eliminar la tarea con ID ${taskId}`);
        }

        // ----- PASO 5: RETORNAR CONFIRMACIÓN -----
        // Retornamos true para indicar que la operación fue exitosa
        // El handler usará este valor para saber si debe actualizar el DOM
        return true;

    } catch (error) {
        // ----- MANEJO DE ERRORES -----
        // Capturamos errores de red, servidor o de la petición en sí
        console.error('Error al eliminar tarea:', error);
        // Retornamos false para que el handler informe al usuario sobre el fallo
        return false;
    }
}