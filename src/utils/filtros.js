// Archivo: utils/filtros.js
// Este archivo contiene la función que filtra la lista de tareas según los criterios
// que el usuario selecciona en los controles de filtro del panel (estado y nombre de usuario).
// Esta función es pura: recibe datos, retorna datos, y no toca el DOM para nada.

// Exportamos la función filtrarTareas que recibe la lista completa de tareas,
// un filtro de estado (ej: "pendiente", "completada") y un texto de búsqueda de usuario
export function filtrarTareas(tareas, filtroEstado, filtroUsuario) {
    // Limpiamos los espacios extra al inicio y al final del filtro de estado
    const estadoActivo  = (filtroEstado  || '').trim();
    // Limpiamos y convertimos a minúsculas el texto de búsqueda de usuario para comparar sin importar mayúsculas
    const usuarioActivo = (filtroUsuario || '').trim().toLowerCase();

    // Si no se aplicó ningún filtro, retornamos una copia de la lista completa sin cambios
    if (!estadoActivo && !usuarioActivo) return [...tareas];

    // Filtramos la lista de tareas: solo pasan las que cumplen AMBAS condiciones al mismo tiempo
    return tareas.filter(tarea => {
        // La tarea cumple el filtro de estado si no hay filtro activo, o si su estado coincide exactamente
        const cumpleEstado = !estadoActivo || tarea.status === estadoActivo;

        // La tarea cumple el filtro de usuario si no hay texto de búsqueda activo,
        // o si el texto aparece en el nombre del usuario asignado (assignedUsersDisplay),
        // o en los documentos de identidad (assignedDocumentos),
        // o en los IDs internos de los usuarios asignados (assignedUsers)
        const cumpleUsuario = !usuarioActivo || (
            (tarea.assignedUsersDisplay &&
             tarea.assignedUsersDisplay.toLowerCase().includes(usuarioActivo)) ||
            (Array.isArray(tarea.assignedDocumentos) &&
             tarea.assignedDocumentos.some(doc => doc.includes(usuarioActivo))) ||
            (Array.isArray(tarea.assignedUsers) &&
             tarea.assignedUsers.some(id => id.toString().includes(usuarioActivo)))
        );

        // Solo incluimos la tarea en el resultado si cumple el filtro de estado Y el de usuario
        return cumpleEstado && cumpleUsuario;
    });
}
