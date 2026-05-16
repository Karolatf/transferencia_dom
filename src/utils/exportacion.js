// Archivo: utils/exportacion.js
// Este archivo contiene las funciones para descargar datos de la aplicación como archivos JSON.
// El usuario hace clic en el botón "Exportar" y el navegador descarga un archivo en su computadora.

// Exportamos la función exportarTareasJSON que recibe la lista de tareas visibles
// y genera la descarga de un archivo JSON con todos esos datos
export function exportarTareasJSON(tareas) {
    // Si la lista está vacía o no existe, avisamos en la consola y cancelamos la exportación
    if (!tareas || tareas.length === 0) {
        console.warn('No hay tareas visibles para exportar');
        return false;
    }

    // Convertimos la lista de tareas a texto JSON con sangría de 2 espacios para que sea legible
    const contenidoJSON = JSON.stringify(tareas, null, 2);
    // Creamos un archivo en memoria (Blob) con el texto JSON y le indicamos que es de tipo JSON
    const blob          = new Blob([contenidoJSON], { type: 'application/json' });
    // Creamos una dirección URL temporal que apunta a ese archivo en memoria
    const urlDescarga   = URL.createObjectURL(blob);

    // Generamos la fecha y hora actual para incluirla en el nombre del archivo
    // toISOString() retorna formato "2025-01-01T12:30:00.000Z"
    // replace(/[:.]/g, '-') reemplaza los dos puntos por guiones porque no se permiten en nombres de archivo
    // slice(0, 19) quita los milisegundos y la Z del final
    const fechaHora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Creamos un enlace invisible en el HTML para simular que el usuario hizo clic en "descargar"
    const enlace    = document.createElement('a');
    // Le asignamos al enlace la dirección URL del archivo en memoria
    enlace.href     = urlDescarga;
    // Le asignamos al enlace el nombre que tendrá el archivo descargado, con la fecha incluida
    enlace.download = `tareas_${fechaHora}.json`;

    // Insertamos el enlace en la página, hacemos clic sobre él para forzar la descarga, y lo eliminamos
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    // Esperamos 1 segundo y liberamos la URL temporal para que el navegador libere memoria
    setTimeout(() => URL.revokeObjectURL(urlDescarga), 1000);
    // Retornamos true para indicar que la exportación se completó con éxito
    return true;
}

// Exportamos la función exportarListaJSON que hace lo mismo que exportarTareasJSON
// pero sirve para cualquier tipo de lista (usuarios, eventos, etc.)
// Recibe la lista de datos a exportar y el prefijo que tendrá el nombre del archivo
export function exportarListaJSON(lista, nombreArchivo) {
    // Si la lista está vacía o no existe, avisamos en consola y cancelamos
    if (!lista || lista.length === 0) {
        console.warn('No hay datos para exportar en:', nombreArchivo);
        return false;
    }

    // Convertimos la lista a texto JSON con sangría de 2 espacios
    const contenidoJSON = JSON.stringify(lista, null, 2);
    // Creamos un archivo en memoria de tipo JSON
    const blob = new Blob([contenidoJSON], { type: 'application/json' });
    // Creamos una URL temporal que apunta a ese archivo
    const urlDescarga = URL.createObjectURL(blob);

    // Generamos la marca de tiempo para el nombre del archivo, reemplazando caracteres inválidos
    const fechaHora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Creamos el enlace invisible, le asignamos la URL y el nombre del archivo con fecha
    const enlace    = document.createElement('a');
    enlace.href     = urlDescarga;
    enlace.download = `${nombreArchivo}_${fechaHora}.json`;
    // Insertamos el enlace en la página, hacemos clic para descargar, y lo quitamos del DOM
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    // Liberamos la URL temporal después de 1 segundo
    setTimeout(() => URL.revokeObjectURL(urlDescarga), 1000);
    // Retornamos true para indicar que la exportación fue exitosa
    return true;
}
