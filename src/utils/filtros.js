// MÓDULO: utils/filtros.js
// CAPA:   Utils (Funciones puras e independientes)

// Responsabilidad ÚNICA: filtrar un arreglo de tareas según criterios de
// estado y/o ID de usuario, sin tocar el DOM ni conocer la API.

// Esta función es PURA:
//   - Recibe datos como parámetros
//   - Devuelve datos nuevos sin modificar los originales
//   - No produce efectos secundarios
//   - No depende de variables externas

// Dependencias: NINGUNA
// (no importa nada de otros módulos)

// Flujo de uso:
// tareasService.js → llama filtrarTareas() → recibe arreglo filtrado → pinta tabla

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

// Filtra un arreglo de tareas aplicando uno o ambos criterios simultáneamente.
// Parámetros:
//   tareas        - Arreglo completo de tareas (viene de tareasRegistradas en el service)
//   filtroEstado  - String con el estado a filtrar ('pendiente', 'en_progreso', 'completada')
//                   Si viene vacío (''), este criterio se ignora completamente.
//   filtroUsuario - String con el ID de usuario a filtrar.
//                   Si viene vacío (''), este criterio se ignora completamente.
// Retorna: Nuevo arreglo con las tareas que cumplen AMBOS criterios activos.
//          Si no hay ningún criterio activo, retorna una copia del arreglo completo.
export function filtrarTareas(tareas, filtroEstado, filtroUsuario) {

    // ----- PASO 1: LIMPIAR LOS FILTROS RECIBIDOS -----
    // trim() elimina espacios accidentales que el usuario pudo haber escrito
    // Así '  pendiente  ' y 'pendiente' se tratan igual
    const estadoActivo  = filtroEstado.trim();
    const usuarioActivo = filtroUsuario.trim();

    // ----- PASO 2: VERIFICAR SI HAY FILTROS ACTIVOS -----
    // Si ambos filtros están vacíos, no hay nada que filtrar
    // Retornamos una copia con spread para no exponer el arreglo original
    if (!estadoActivo && !usuarioActivo) {
        return [...tareas];
    }

    // ----- PASO 3: FILTRAR EL ARREGLO -----
    // filter() recorre el arreglo y conserva solo las tareas que
    // pasen AMBAS verificaciones al mismo tiempo
    return tareas.filter(tarea => {

        // ----- VERIFICACIÓN POR ESTADO -----
        // Si el filtro de estado está activo, comparamos tarea.status con el filtro
        // Si el filtro NO está activo (cadena vacía), el operador ! lo convierte en true
        // automáticamente, haciendo que esta condición no afecte el resultado
        const cumpleEstado = !estadoActivo || tarea.status === estadoActivo;

        // ----- VERIFICACIÓN POR USUARIO -----
        // Convertimos ambos valores a string con toString() para evitar errores
        // de tipo cuando userId es número y el filtro viene como string del input
        // Si el filtro NO está activo, la condición es true automáticamente
        const cumpleUsuario = !usuarioActivo ||
            tarea.userId.toString() === usuarioActivo;

        // La tarea pasa el filtro solo si cumple LAS DOS condiciones
        // Si cualquiera es false, filter() descarta esa tarea del resultado
        return cumpleEstado && cumpleUsuario;
    });
}