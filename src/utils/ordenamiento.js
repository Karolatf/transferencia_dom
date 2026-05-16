// Archivo: utils/ordenamiento.js
// Este archivo contiene la función que ordena la lista de tareas según el criterio
// que el usuario selecciona en el menú desplegable de ordenamiento del panel.
// Los criterios disponibles son: título A-Z, título Z-A, estado y usuario asignado.

// Mapa que asigna un número a cada estado para poder ordenarlos por su posición en el flujo de trabajo
// El orden lógico del proceso es: pendiente → en progreso → pendiente de aprobación → completada
const ORDEN_ESTADOS = {
    pendiente:            0, // primera etapa: la tarea aún no se ha iniciado
    en_progreso:          1, // segunda etapa: el estudiante está trabajando en ella
    pendiente_aprobacion: 2, // tercera etapa: el estudiante terminó y espera revisión del admin o instructor
    completada:           3, // etapa final: el admin o instructor aprobó y dio por cerrada la tarea
};

// Exportamos la función ordenarTareas que recibe la lista de tareas y el criterio de ordenamiento
// y retorna una nueva lista ordenada sin modificar la original
export function ordenarTareas(tareas, criterio) {
    // Si no se eligió ningún criterio, retornamos una copia de la lista sin cambiar el orden
    if (!criterio) return [...tareas];

    // Creamos una copia superficial de la lista con slice() para no modificar el arreglo original
    return tareas.slice().sort((a, b) => {
        // Evaluamos el criterio de ordenamiento seleccionado
        switch (criterio) {

            // Ordenar por título de A a Z (orden alfabético ascendente en español)
            case 'titulo_asc':
                return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });

            // Ordenar por título de Z a A (orden alfabético descendente en español)
            case 'titulo_desc':
                return b.title.localeCompare(a.title, 'es', { sensitivity: 'base' });

            // Ordenar por estado siguiendo el flujo de trabajo (pendiente primero, completada al final)
            case 'estado': {
                // Obtenemos el número de posición de cada tarea — si el estado no está en el mapa usamos 99 (al final)
                const pa = ORDEN_ESTADOS[a.status] ?? 99;
                const pb = ORDEN_ESTADOS[b.status] ?? 99;
                // Restamos los números: resultado negativo pone a 'a' antes que 'b'
                return pa - pb;
            }

            // Ordenar por nombre del usuario asignado (orden alfabético en español)
            case 'usuario':
                return (a.assignedUsersDisplay || '').localeCompare(
                    b.assignedUsersDisplay || '', 'es', { sensitivity: 'base' }
                );

            // Ordenar por título (criterio del modo usuario — igual que titulo_asc)
            case 'titulo':
                return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });

            // Ordenar por fecha de creación usando el ID como referencia (IDs más altos = más recientes)
            case 'fecha':
                return Number(a.id) - Number(b.id);

            // Si el criterio no coincide con ninguno de los anteriores, no cambiamos el orden
            default:
                return 0;
        }
    });
}
