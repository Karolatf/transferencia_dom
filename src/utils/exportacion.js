// MÓDULO: utils/exportacion.js
// CAPA:   Utils

export function exportarTareasJSON(tareas) {
    if (!tareas || tareas.length === 0) {
        console.warn('No hay tareas visibles para exportar');
        return false;
    }

    const contenidoJSON = JSON.stringify(tareas, null, 2);
    const blob          = new Blob([contenidoJSON], { type: 'application/json' });
    const urlDescarga   = URL.createObjectURL(blob);

    const fechaHora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const enlace    = document.createElement('a');
    enlace.href     = urlDescarga;
    enlace.download = `tareas_${fechaHora}.json`;

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    setTimeout(() => URL.revokeObjectURL(urlDescarga), 1000);
    return true;
}

// exportarListaJSON — función genérica para exportar cualquier arreglo de objetos a JSON
// Se usa para exportar la lista de usuarios (y cualquier otro recurso en el futuro)
// a diferencia de exportarTareasJSON que es específica para tareas
//
// Parámetros:
//   lista    — arreglo de objetos a exportar
//   nombreArchivo — prefijo del nombre del archivo descargado (ej: 'usuarios' → 'usuarios_2025-01-01.json')
//
// Retorna true si la exportación fue exitosa, false si la lista está vacía
export function exportarListaJSON(lista, nombreArchivo) {
    // Validar que la lista no esté vacía antes de intentar exportar
    if (!lista || lista.length === 0) {
        console.warn('No hay datos para exportar en:', nombreArchivo);
        return false; // El llamador mostrará la notificación de advertencia
    }

    // Convertir el arreglo a texto JSON con indentación de 2 espacios para legibilidad
    const contenidoJSON = JSON.stringify(lista, null, 2);

    // Crear un Blob (archivo en memoria) con el tipo MIME correcto para JSON
    const blob = new Blob([contenidoJSON], { type: 'application/json' });

    // Crear una URL temporal que apunta al Blob — válida solo durante la sesión
    const urlDescarga = URL.createObjectURL(blob);

    // Generar la marca de tiempo para el nombre del archivo
    // toISOString() retorna formato "2025-01-01T12:30:00.000Z"
    // replace(/[:.]/g, '-') reemplaza los caracteres que no se permiten en nombres de archivo
    // slice(0, 19) quita los milisegundos y la Z del final
    const fechaHora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Crear un enlace invisible, simular el clic para forzar la descarga, y eliminar el enlace
    const enlace    = document.createElement('a');
    enlace.href     = urlDescarga;
    enlace.download = `${nombreArchivo}_${fechaHora}.json`; // nombre dinámico con fecha
    document.body.appendChild(enlace);
    enlace.click();                         // dispara la descarga del archivo
    document.body.removeChild(enlace);      // limpia el enlace del DOM

    // Liberar la URL temporal después de 1 segundo para no acumular memoria
    setTimeout(() => URL.revokeObjectURL(urlDescarga), 1000);
    return true; // exportación exitosa
}