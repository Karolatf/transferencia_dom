// MÓDULO: utils/filtros.js
// CAPA:   Utils (Funciones puras e independientes)

// Responsabilidad ÚNICA: filtrar un arreglo de tareas según criterios de
// estado y/o ID de usuario, sin tocar el DOM ni conocer la API.

// Esta función es PURA: recibe datos y devuelve datos.
// No tiene efectos secundarios ni dependencias externas.

// Dependencias: NINGUNA

// Filtra un arreglo de tareas aplicando uno o ambos criterios simultáneamente.
// Parámetros:
//   tareas      - Arreglo completo de tareas registradas (del estado del service)
//   filtroEstado  - String con el estado a filtrar ('pendiente', 'en_progreso', 'completada')
//                   Si viene vacío (''), no se aplica este filtro.
//   filtroUsuario - String con el ID de usuario a filtrar.
//                   Si viene vacío (''), no se aplica este filtro.
// Retorna: Nuevo arreglo con las tareas que cumplen AMBOS criterios activos.
export function filtrarTareas(tareas, filtroEstado, filtroUsuario) {
    // Hacemos trim() a los filtros para ignorar espacios accidentales
    const estadoActivo  = filtroEstado.trim();
    const usuarioActivo = filtroUsuario.trim();

    // Si no hay ningún filtro activo, devolvemos una copia del arreglo completo
    if (!estadoActivo && !usuarioActivo) {
        return [...tareas];
    }

    // filter() recorre el arreglo y conserva solo las tareas que pasen AMBAS verificaciones
    return tareas.filter(tarea => {
        // ----- VERIFICACIÓN POR ESTADO -----
        // Si el filtro de estado está activo, comparamos el estado de la tarea con el filtro
        // Si el filtro no está activo (cadena vacía), esta condición es true automáticamente
        const cumpleEstado = !estadoActivo || tarea.status === estadoActivo;

        // ----- VERIFICACIÓN POR USUARIO -----
        // Convertimos ambos a string para evitar errores de tipo (número vs string)
        // Si el filtro no está activo, esta condición es true automáticamente
        const cumpleUsuario = !usuarioActivo ||
            tarea.userId.toString() === usuarioActivo;

        // La tarea pasa el filtro solo si cumple AMBAS condiciones
        return cumpleEstado && cumpleUsuario;
    });
}