// VARIABLES DE ESTADO DE LA APLICACIÓN

// Este módulo centraliza el estado global de la aplicación
// En lugar de tener variables sueltas en el script principal, las agrupamos aquí para tener un único lugar donde consultar o modificar el estado actual del sistema

// Variable que almacenará los datos del usuario actualmente seleccionado
// Inicia en null porque al cargar la app aún no se ha buscado ningún usuario
// Se llenará cuando el usuario sea encontrado exitosamente en el servidor
export let currentUser = null;

// Arreglo que almacenará todas las tareas registradas durante la sesión
// Inicia vacío y se irá llenando conforme se registren nuevas tareas
export let registeredTasks = [];

// Contador que lleva el número total de tareas registradas
// Se usa para numerar las filas de la tabla de forma correlativa
export let taskCounter = 0;

// Actualiza la variable currentUser con el usuario recibido como parámetro
// Parámetro: user - Objeto con los datos del usuario (id, name, email), o null para limpiar
// Se usa 'export' para que el módulo de manejadores pueda llamar esta función
export function setCurrentUser(user) {
    // Asignamos el nuevo valor directamente a la variable de estado
    currentUser = user;
}

// Incrementa el contador de tareas en 1 y retorna el nuevo valor
// Se llama cada vez que una tarea es registrada exitosamente
// Retorna: El nuevo valor del contador después de incrementar
export function incrementTaskCounter() {
    // El operador ++ incrementa taskCounter en 1
    taskCounter++;
    // Retornamos el valor actualizado para que quien llame sepa el total actual
    return taskCounter;
}

// Agrega una nueva tarea al arreglo local de tareas registradas
// Parámetro: task - Objeto de tarea retornado por el servidor (incluye el ID generado)
export function addTask(task) {
    // push() inserta el elemento al final del arreglo
    registeredTasks.push(task);
}

// RF-03 – ACTUALIZACIÓN EN EL ESTADO LOCAL (UPDATE)

// Reemplaza una tarea existente en el arreglo local con sus datos actualizados
// Se llama después de que el servidor confirma la actualización exitosa (RF-03)
// Mantiene el estado local sincronizado con la información real del servidor
// Parámetro: updatedTask - Objeto con los datos actualizados que devolvió el servidor
export function updateTaskInState(updatedTask) {
    // Buscamos el índice de la tarea en el arreglo usando su ID como referencia
    // findIndex() recorre el arreglo y retorna el índice del primer elemento que cumple la condición
    // Convertimos ambos IDs a string para garantizar una comparación segura
    const index = registeredTasks.findIndex(
        t => t.id.toString() === updatedTask.id.toString()
    );

    // Si findIndex() no encontró la tarea, retorna -1
    // Verificamos que el índice sea válido antes de intentar actualizar
    if (index !== -1) {
        // Reemplazamos el objeto completo en esa posición del arreglo
        // con los datos actualizados que devolvió el servidor
        registeredTasks[index] = updatedTask;
    } else {
        // Si no se encontró la tarea en el estado, lo registramos para depuración
        console.warn(`No se encontró la tarea con id ${updatedTask.id} en el estado local`);
    }
}

// RF-04 – ELIMINACIÓN DEL ESTADO LOCAL (DELETE)

// Elimina una tarea del arreglo local por su ID
// Se llama después de que el servidor confirma la eliminación exitosa (RF-04)
// Mantiene el arreglo local sincronizado con los datos reales del servidor
// Parámetro: taskId - ID de la tarea que se desea eliminar del arreglo local
export function removeTaskFromState(taskId) {
    // filter() crea un NUEVO arreglo con solo los elementos que cumplen la condición
    // En este caso, conservamos todas las tareas EXCEPTO la que tiene el ID indicado
    // Convertimos ambos IDs a string para garantizar la comparación correcta
    registeredTasks = registeredTasks.filter(
        t => t.id.toString() !== taskId.toString()
    );
    // Nota: filter() no modifica el arreglo original, por eso reasignamos la variable
}

// Reinicia el estado de la aplicación a sus valores iniciales
// Se llama cuando el usuario realiza una nueva búsqueda para limpiar la sesión anterior
export function resetState() {
    // Limpiamos el usuario actual dejándolo en null
    currentUser = null;
    // Nota: no limpiamos registeredTasks ni taskCounter para preservar el historial de tareas
}