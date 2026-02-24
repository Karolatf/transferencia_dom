// MÓDULO: utils/ordenamiento.js
// CAPA:   Utils (Funciones puras e independientes)

// Responsabilidad ÚNICA: ordenar un arreglo de tareas según un criterio
// dado, sin tocar el DOM ni conocer la API ni el estado del service.

// Esta función es PURA:
//   - Recibe el arreglo y el criterio como parámetros
//   - Devuelve un nuevo arreglo ordenado sin modificar el original
//   - No produce efectos secundarios
//   - No depende de variables externas

// Dependencias: NINGUNA
// (no importa nada de otros módulos)

// Flujo de uso:
// tareasService.js → llama ordenarTareas() → recibe arreglo ordenado → pinta tabla

// ─── MAPA DE PRIORIDADES DE ESTADO ───────────────────────────────────────────

// Define el orden lógico de los estados para el ordenamiento por flujo de trabajo.
// Al usar un mapa numérico en lugar de comparar strings, el orden es explícito
// y fácil de modificar si en el futuro cambian los estados disponibles.
// Pendiente es el estado inicial (1), completada es el estado final (3).
const ORDEN_ESTADOS = {
    pendiente:   1,  // Estado inicial — aparece primero en el ordenamiento
    en_progreso: 2,  // Estado intermedio
    completada:  3   // Estado final — aparece último en el ordenamiento
};

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

// Ordena un arreglo de tareas según el criterio recibido.
// Parámetros:
//   tareas   - Arreglo de tareas a ordenar (viene de tareasRegistradas en el service)
//              No se modifica; la función trabaja sobre una copia interna.
//   criterio - String que indica el campo de ordenamiento:
//              'titulo'  → orden alfabético A-Z respetando el español
//              'estado'  → orden por flujo de trabajo usando ORDEN_ESTADOS
//              'fecha'   → orden cronológico usando el ID incremental de json-server
//              ''        → sin ordenamiento; devuelve la lista en el orden original
// Retorna: Nuevo arreglo con las tareas ordenadas según el criterio.
//          Si el criterio está vacío, retorna una copia sin modificar el orden.
export function ordenarTareas(tareas, criterio) {

    // ----- PASO 1: VERIFICAR SI HAY CRITERIO ACTIVO -----
    // Si el criterio viene vacío, no hay nada que ordenar
    // Retornamos una copia con spread para no exponer el arreglo original
    if (!criterio) {
        return [...tareas];
    }

    // ----- PASO 2: CREAR COPIA Y ORDENAR -----
    // slice() crea una copia superficial del arreglo ANTES de ordenar
    // Esto es crítico: sort() muta el arreglo sobre el que trabaja.
    // Si no usáramos slice(), estaríamos mutando tareasRegistradas en el service,
    // lo que rompería la separación de responsabilidades.
    return tareas.slice().sort((a, b) => {

        switch (criterio) {

            // ----- ORDENAMIENTO POR TÍTULO (A-Z) -----
            case 'titulo':
                // localeCompare() compara strings teniendo en cuenta el idioma
                // El locale 'es' garantiza que tildes (á, é, í, ó, ú) y la ñ
                // queden ordenadas correctamente según el español
                // sensitivity: 'base' hace la comparación insensible a mayúsculas
                return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });

            // ----- ORDENAMIENTO POR ESTADO -----
            case 'estado':
                // Buscamos el número de prioridad de cada estado en el mapa
                // El operador ?? asigna 99 si el estado no está en el mapa,
                // haciendo que estados desconocidos queden al final de la lista
                const ordenA = ORDEN_ESTADOS[a.status] ?? 99;
                const ordenB = ORDEN_ESTADOS[b.status] ?? 99;
                // La resta devuelve negativo si a va antes, positivo si b va antes
                return ordenA - ordenB;

            // ----- ORDENAMIENTO POR FECHA DE CREACIÓN -----
            case 'fecha':
                // json-server asigna IDs de forma incremental (1, 2, 3...)
                // El ID más bajo corresponde a la tarea creada primero
                // Number() convierte el ID a número para garantizar comparación
                // numérica correcta (sin él, '10' < '9' porque compara strings)
                return Number(a.id) - Number(b.id);

            // ----- CRITERIO DESCONOCIDO -----
            default:
                // Si llega un criterio no reconocido, retornamos 0
                // para no alterar el orden relativo de los elementos
                return 0;
        }
    });
}