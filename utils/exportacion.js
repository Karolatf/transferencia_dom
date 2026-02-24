// MÓDULO: utils/exportacion.js
// CAPA:   Utils (Funciones puras e independientes)

// Responsabilidad ÚNICA: generar y disparar la descarga de un archivo JSON
// con las tareas recibidas como parámetro.

// Separación de responsabilidades:
//   - Este módulo NO conoce el estado interno del service (tareasRegistradas)
//   - Este módulo NO decide qué tareas exportar (eso lo decide el service)
//   - Este módulo NO muestra notificaciones (eso lo hace el service con RF03)
//   - Solo recibe un arreglo y genera la descarga

// Dependencias: NINGUNA
// (no importa nada de otros módulos)

// Flujo de uso:
// tareasService.js → calcula tareas visibles → llama exportarTareasJSON()
//                 → recibe true/false → muestra notificación con mostrarNotificacion()

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

// Genera un archivo JSON descargable con las tareas recibidas como parámetro.
// Parámetro: tareas - Arreglo de tareas a exportar.
//                     El service es responsable de pasar solo las tareas visibles
//                     (ya filtradas y ordenadas) antes de llamar esta función.
// Retorna: true si la descarga se disparó correctamente.
//          false si el arreglo estaba vacío y no se generó ningún archivo.
export function exportarTareasJSON(tareas) {

    // ----- PASO 1: VERIFICAR QUE HAY DATOS PARA EXPORTAR -----
    // No tiene sentido generar un archivo vacío
    // Retornamos false para que el service muestre la notificación correspondiente
    if (!tareas || tareas.length === 0) {
        // Registramos en consola para diagnóstico (el service maneja la UI)
        console.warn('⚠️ No hay tareas visibles para exportar');
        return false;
    }

    // ----- PASO 2: CONVERTIR EL ARREGLO A TEXTO JSON -----
    // JSON.stringify() convierte el arreglo de objetos a un string JSON
    // El segundo argumento (null) indica que no se usa función de reemplazo
    // El tercer argumento (2) agrega indentación de 2 espacios para que el
    // archivo sea legible al abrirlo en un editor de texto
    const contenidoJSON = JSON.stringify(tareas, null, 2);

    // ----- PASO 3: CREAR UN BLOB CON EL CONTENIDO -----
    // Blob (Binary Large Object) representa datos de archivo en memoria
    // El array envuelve el string porque Blob espera un iterable de partes
    // El tipo MIME 'application/json' indica al sistema operativo el tipo de archivo
    const blob = new Blob([contenidoJSON], { type: 'application/json' });

    // ----- PASO 4: CREAR UNA URL TEMPORAL PARA EL BLOB -----
    // createObjectURL() genera una URL del tipo 'blob:http://...' que apunta
    // al Blob en la memoria del navegador
    // Esta URL solo existe mientras la página está cargada en el navegador
    const urlDescarga = URL.createObjectURL(blob);

    // ----- PASO 5: CREAR UN ENLACE <a> PARA DISPARAR LA DESCARGA -----
    // No podemos hacer fetch() de un Blob, así que simulamos un clic en un
    // enlace con el atributo 'download', que le dice al navegador que debe
    // descargar el recurso en lugar de navegarlo
    const enlace = document.createElement('a');
    enlace.href     = urlDescarga;

    // ----- PASO 6: GENERAR EL NOMBRE DEL ARCHIVO -----
    // toISOString() devuelve un string tipo '2026-02-23T14:30:00.000Z'
    // replace() sustituye los caracteres ':' y '.' que son inválidos en
    // nombres de archivo en algunos sistemas operativos
    // slice(0, 19) recorta la parte de milisegundos y la 'Z' final
    // Resultado ejemplo: 'tareas_2026-02-23T14-30-00.json'
    const fechaHora     = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    enlace.download = `tareas_${fechaHora}.json`;

    // ----- PASO 7: INSERTAR EL ENLACE, HACER CLIC Y REMOVERLO -----
    // Algunos navegadores requieren que el enlace esté en el DOM para
    // que el clic programático funcione correctamente
    document.body.appendChild(enlace);

    // click() dispara la descarga como si el usuario hubiera hecho clic
    enlace.click();

    // Removemos el enlace inmediatamente para no dejar rastros en el DOM
    // El enlace ya cumplió su función al hacer click()
    document.body.removeChild(enlace);

    // ----- PASO 8: LIBERAR LA URL TEMPORAL DE MEMORIA -----
    // revokeObjectURL() libera la memoria que ocupa el Blob
    // Usamos setTimeout() para esperar 1 segundo antes de revocar:
    // si revocamos de inmediato, algunos navegadores pueden cancelar la descarga
    // porque aún no terminaron de leer el Blob
    setTimeout(() => URL.revokeObjectURL(urlDescarga), 1000);

    // Retornamos true para que el service sepa que la exportación fue exitosa
    // y pueda mostrar la notificación de éxito al usuario
    return true;
}