// Archivo: services/tareasService.js
// Este archivo actúa como intermediario entre las peticiones al servidor (api/)
// y la pantalla del estudiante (ui/tareasUI.js).
// Coordina la búsqueda de usuarios, la carga de sus tareas, la edición y la exportación.

// Importamos las funciones del servidor que necesitamos para trabajar con tareas y usuarios
import {
    buscarUsuarioPorDocumento, // busca un usuario por su número de documento de identidad
    obtenerTareasDeUsuario,    // trae las tareas asignadas a un usuario específico
    actualizarTarea,           // envía al servidor los datos modificados de una tarea
} from '../api/tareasApi.js';

// Importamos las funciones que controlan lo que se ve en la pantalla del estudiante
import {
    ocultarDatosUsuario,   // oculta la tarjeta con los datos del usuario encontrado
    agregarTareaATabla,    // agrega una fila a la tabla de tareas del estudiante
    actualizarFilaTarea,   // actualiza una fila existente de la tabla (no se usa actualmente)
    eliminarFilaTarea,     // elimina una fila de la tabla (no se usa en modo estudiante)
    mostrarModalEdicion,   // muestra el modal con el formulario de edición de tarea
    ocultarModalEdicion,   // oculta el modal de edición de tarea
    mostrarEstadoVacio,    // muestra el mensaje de "no hay tareas"
    mostrarSeccionTareas,  // muestra la sección de la tabla de tareas
    ocultarEstadoVacio,    // oculta el mensaje de "no hay tareas"
} from '../ui/tareasUI.js';

// Importamos las funciones de validación del formulario de búsqueda
import {
    validarFormularioBusqueda, // valida que el campo de documento no esté vacío
    mostrarError,              // muestra un mensaje de error debajo de un campo del formulario
    limpiarError,              // borra el mensaje de error de un campo del formulario
} from '../utils/validaciones.js';

// Importamos las funciones para mostrar mensajes al usuario
import {
    mostrarNotificacion,  // muestra un toast (mensaje emergente corto) en la pantalla
    mostrarConfirmacion,  // muestra un cuadro de diálogo de confirmación (no se usa aquí)
} from '../utils/notificaciones.js';

// Importamos la función para descargar tareas como archivo JSON
// Le pasamos un arreglo de una sola tarea para exportar de forma individual
import { exportarTareasJSON } from '../utils/exportacion.js';

// Importamos las funciones de filtrado y ordenamiento de la lista de tareas
import { filtrarTareas }  from '../utils/filtros.js';
import { ordenarTareas }  from '../utils/ordenamiento.js';

// Importamos las funciones de navegación del panel principal
import { registrarEventosNavegacion, activarModoInicio } from '../ui/modoUI.js';

// ── ESTADO LOCAL DEL MODO ESTUDIANTE ─────────────────────────────────────────

// Guardamos los datos del usuario encontrado en la búsqueda (nombre, id, correo, etc.)
let usuarioActual     = null;
// Guardamos la lista completa de tareas del usuario para filtrarla y ordenarla localmente
let tareasRegistradas = [];

// Guardamos los criterios de filtrado activos (en blanco = sin filtro)
// La infraestructura está lista para agregar controles de filtro en el HTML si se necesitan
let filtroEstadoActivo  = '';
let filtroUsuarioActivo = '';
let criterioOrdenActivo = '';

// ── FUNCIONES INTERNAS DEL MÓDULO ────────────────────────────────────────────

// Función privada que limpia la pantalla y el estado del modo estudiante completamente
// Se llama antes de hacer una nueva búsqueda y cuando el usuario presiona el botón Volver
function reiniciarVistaModoUsuario() {
    // Limpiamos los datos guardados en memoria
    usuarioActual     = null;
    tareasRegistradas = [];

    // Ocultamos la tarjeta con los datos del usuario encontrado anteriormente
    ocultarDatosUsuario();

    // Ocultamos la sección de la tabla de tareas si existe en el HTML
    const seccion = document.getElementById('tasksSection');
    if (seccion) seccion.classList.add('hidden');

    // Vaciamos el cuerpo de la tabla eliminando todas las filas anteriores
    const tbody = document.getElementById('tasksTableBody');
    if (tbody) {
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    }

    // Limpiamos el campo de búsqueda del documento para dejarlo vacío
    const inputDocumento = document.getElementById('userDocument');
    if (inputDocumento) inputDocumento.value = '';

    // Limpiamos el mensaje de error del campo de documento si hubiera alguno
    const errorDocumento = document.getElementById('userDocumentError');
    if (errorDocumento) errorDocumento.textContent = '';

    // Mostramos el mensaje de estado vacío (sin tareas)
    mostrarEstadoVacio();
}

// Función privada que vuelve a dibujar la tabla de tareas aplicando los filtros y el orden activo
// Se llama después de guardar cambios en una tarea para actualizar lo que se ve en pantalla
function refrescarTabla() {
    // Aplicamos los filtros de estado y usuario a la lista completa de tareas en memoria
    const tareasFiltradas = filtrarTareas(tareasRegistradas, filtroEstadoActivo, filtroUsuarioActivo);
    // Ordenamos las tareas filtradas según el criterio activo
    const tareasOrdenadas = ordenarTareas(tareasFiltradas, criterioOrdenActivo);

    // Buscamos el cuerpo de la tabla en el HTML
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    // Vaciamos la tabla antes de volver a pintarla
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    // Si no quedaron tareas después del filtro, mostramos el mensaje de "sin tareas"
    if (tareasOrdenadas.length === 0) {
        mostrarEstadoVacio();
        return;
    }

    // Si hay tareas, ocultamos el mensaje vacío y mostramos la tabla
    ocultarEstadoVacio();
    mostrarSeccionTareas();

    // Pintamos cada tarea como una fila de la tabla
    tareasOrdenadas.forEach(function(tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

// ── BUSCAR USUARIO POR DOCUMENTO ─────────────────────────────────────────────

// Exportamos la función manejarBusquedaUsuario que se ejecuta cuando el estudiante
// envía el formulario de búsqueda con su número de documento
export async function manejarBusquedaUsuario(event) {
    // Evitamos que el formulario recargue la página (comportamiento nativo del navegador)
    event.preventDefault();

    // Leemos el campo de documento y el span donde mostrar errores desde el HTML
    const inputDocumento = document.getElementById('userDocument');
    const errorDocumento = document.getElementById('userDocumentError');

    // Validamos que el campo no esté vacío antes de hacer la petición al servidor
    const esValido = await validarFormularioBusqueda(inputDocumento, errorDocumento);
    if (!esValido) return;

    // Guardamos el documento antes de limpiar la vista porque reiniciarVistaModoUsuario() vacía el input
    const documentoABuscar = inputDocumento.value.trim();

    // Limpiamos la vista anterior antes de mostrar el nuevo resultado
    reiniciarVistaModoUsuario();

    // Consultamos al servidor si existe un usuario con ese documento de identidad
    const usuario = await buscarUsuarioPorDocumento(documentoABuscar);

    // Si el servidor no encontró ningún usuario, mostramos el error en el campo y terminamos
    if (!usuario) {
        mostrarError(
            errorDocumento,
            inputDocumento,
            'No se encontró ningún usuario con ese documento'
        );
        return;
    }

    // Guardamos los datos del usuario encontrado en la variable de estado del módulo
    usuarioActual = usuario;

    // Pedimos al servidor las tareas asignadas a este usuario usando su id interno
    let tareas = [];
    try {
        tareas            = await obtenerTareasDeUsuario(usuario.id);
        // Guardamos la lista completa en memoria para filtrarla y ordenarla localmente
        tareasRegistradas = tareas;
    } catch (err) {
        console.error('Error cargando tareas del usuario:', err);
        tareas = [];
    }

    // Mostramos los datos del usuario y su lista de tareas en la pantalla
    mostrarResultadoUsuarioFijo(usuario, tareas);
}

// Función privada que pinta en pantalla los datos del usuario encontrado y su tabla de tareas
function mostrarResultadoUsuarioFijo(usuario, tareas) {
    // Revelamos la tarjeta con los datos del usuario (la quitamos de la clase hidden)
    const seccionDatos = document.getElementById('userDataSection');
    if (seccionDatos) seccionDatos.classList.remove('hidden');

    // Buscamos los elementos del HTML donde mostrar los datos del usuario
    const spanId     = document.getElementById('userId');
    const spanNombre = document.getElementById('userName');
    const spanEmail  = document.getElementById('userEmail');

    // Llenamos cada elemento con el dato correspondiente del usuario
    if (spanId)     spanId.textContent     = usuario.documento || usuario.id;
    if (spanNombre) spanNombre.textContent = usuario.name;
    if (spanEmail)  spanEmail.textContent  = usuario.email;

    // Revelamos la sección de la tabla de tareas
    const seccionTareas = document.getElementById('tasksSection');
    if (seccionTareas) seccionTareas.classList.remove('hidden');

    // Actualizamos el contador de tareas: "3 tareas" o "1 tarea"
    const contadorEl = document.getElementById('tasksCount');
    if (contadorEl) {
        contadorEl.textContent = `${tareas.length} ${tareas.length === 1 ? 'tarea' : 'tareas'}`;
    }

    // Vaciamos el cuerpo de la tabla antes de pintarla desde cero
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    // Si el usuario no tiene tareas, mostramos el mensaje vacío y terminamos
    if (tareas.length === 0) {
        mostrarEstadoVacio();
        return;
    }

    // Ocultamos el mensaje de estado vacío antes de mostrar las filas de tareas
    const estadoVacio = document.getElementById('tasksEmptyState');
    if (estadoVacio) estadoVacio.classList.add('hidden');

    // Pintamos cada tarea como una fila de la tabla
    tareas.forEach(function(tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

// ── EDITAR TAREA ─────────────────────────────────────────────────────────────

// Exportamos la función manejarEdicionTarea que abre el modal de edición con los datos
// de la tarea recibida y guarda los cambios al enviar el formulario del modal
export function manejarEdicionTarea(tarea) {
    // Abrimos el modal de edición — el parámetro true indica que el título y la descripción
    // son de solo lectura en el modo estudiante (no puede cambiarlos, solo el estado)
    mostrarModalEdicion(tarea, true);

    // Buscamos el formulario del modal de edición en el HTML
    const formulario = document.getElementById('editTaskForm');

    // Función interna que se ejecuta cuando el estudiante presiona "Guardar" en el modal
    async function manejarGuardadoEdicion(event) {
        // Evitamos que el formulario recargue la página
        event.preventDefault();

        // Leemos los valores actuales de todos los campos del formulario de edición
        const titulo      = document.getElementById('editTaskTitle').value.trim();
        const descripcion = document.getElementById('editTaskDescription').value.trim();
        const estado      = document.getElementById('editTaskStatus').value;
        const tareaId     = document.getElementById('editTaskId').value;
        const comentEl    = document.getElementById('editTaskComment');
        const comentario  = comentEl ? comentEl.value.trim() : '';

        // Construimos el objeto con los datos actualizados para enviar al servidor
        const datosActualizados = {
            title:       titulo,
            description: descripcion,
            status:      estado,
            comment:     comentario,
        };

        // Enviamos los datos actualizados al servidor y esperamos la respuesta
        const tareaActualizada = await actualizarTarea(tareaId, datosActualizados);

        if (tareaActualizada) {
            // Buscamos la tarea en la lista local para reemplazarla con los datos nuevos
            const indice = tareasRegistradas.findIndex(
                t => t.id.toString() === tareaActualizada.id.toString()
            );

            if (indice !== -1) {
                // Actualizamos la tarea en memoria con los datos del servidor
                // Incluimos el comentario local por si el servidor no lo retorna aún
                tareasRegistradas[indice] = {
                    ...tareaActualizada,
                    comment: comentario,
                };
            }

            // Volvemos a dibujar la tabla con los datos actualizados
            refrescarTabla();
            // Cerramos el modal de edición
            ocultarModalEdicion();
            // Mostramos un mensaje de éxito al estudiante
            await mostrarNotificacion('Tarea actualizada exitosamente', 'exito');
        } else {
            // Si el servidor respondió con error, avisamos al estudiante
            await mostrarNotificacion('Error al actualizar la tarea', 'error');
        }

        // Quitamos este listener del formulario para que no se acumule en la próxima edición
        formulario.removeEventListener('submit', manejarGuardadoEdicion);
    }

    // Registramos el listener de guardado en el formulario del modal
    formulario.addEventListener('submit', manejarGuardadoEdicion);
}

// ── EXPORTAR TAREA INDIVIDUAL ─────────────────────────────────────────────────

// Exportamos la función manejarExportacionTarea que descarga una sola tarea como archivo JSON
// Reutiliza exportarTareasJSON pasando la tarea envuelta en un arreglo de un elemento
export async function manejarExportacionTarea(tarea) {
    // Llamamos a la función de exportación con la tarea dentro de un arreglo
    const exportado = exportarTareasJSON([tarea]);

    // Mostramos el resultado de la exportación al estudiante
    if (exportado) {
        await mostrarNotificacion(`Tarea "${tarea.title}" exportada correctamente`, 'exito');
    } else {
        await mostrarNotificacion('Error al exportar la tarea', 'error');
    }
}

// ── DELEGACIÓN DE EVENTOS EN LA TABLA DE TAREAS ───────────────────────────────

// Función privada que escucha todos los clics en la tabla de tareas del estudiante
// y determina qué acción ejecutar según el atributo data-action del botón presionado
function manejarClicEnTabla(event) {
    // Buscamos el botón más cercano que tenga el atributo data-action (puede ser el botón mismo o un padre)
    const botonAccion = event.target.closest('[data-action]');
    // Si el clic no fue sobre un botón de acción, ignoramos el evento
    if (!botonAccion) return;

    // Leemos el id de la tarea y la acción del botón presionado desde sus atributos de datos
    const tareaId = botonAccion.dataset.id;
    const accion  = botonAccion.dataset.action;

    // Buscamos la tarea en la lista local usando el id leído del botón
    const tarea = tareasRegistradas.find(t => t.id.toString() === tareaId.toString());
    // Si por alguna razón no encontramos la tarea, ignoramos el clic
    if (!tarea) return;

    // Si el botón dice "edit", abrimos el modal de edición con los datos de esa tarea
    if (accion === 'edit')   manejarEdicionTarea(tarea);

    // Si el botón dice "export", descargamos esa tarea como archivo JSON
    if (accion === 'export') manejarExportacionTarea(tarea);
}

// ── REGISTRO DE TODOS LOS EVENTOS (llamado desde main.js al cargar la aplicación) ──

// Exportamos la función registrarEventListeners que conecta todos los botones y formularios
// del modo estudiante con sus respectivas funciones de manejo
export function registrarEventListeners() {

    // Conectamos el formulario de búsqueda de usuario con la función que busca en el servidor
    const formBusqueda = document.getElementById('searchUserForm');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', manejarBusquedaUsuario);
    }

    // Hacemos que el error del campo documento desaparezca cuando el usuario empieza a escribir
    const inputDoc = document.getElementById('userDocument');
    const errorDoc = document.getElementById('userDocumentError');
    if (inputDoc && errorDoc) {
        inputDoc.addEventListener('input', function() {
            limpiarError(errorDoc, inputDoc);
        });
    }

    // Conectamos la tabla de tareas con el manejador de clics delegado
    // Un solo listener maneja todos los botones de todas las filas de la tabla
    const tbody = document.getElementById('tasksTableBody');
    if (tbody) {
        tbody.addEventListener('click', manejarClicEnTabla);
    }

    // Conectamos el botón X del modal de edición para cerrarlo
    const btnCerrarModal = document.getElementById('editCloseBtn');
    if (btnCerrarModal) btnCerrarModal.addEventListener('click', ocultarModalEdicion);

    // Conectamos el botón "Cancelar" del modal de edición para cerrarlo
    const btnCancelarModal = document.getElementById('editCancelBtn');
    if (btnCancelarModal) btnCancelarModal.addEventListener('click', ocultarModalEdicion);

    // Conectamos el botón "Volver" para que limpie la vista y regrese a la pantalla de inicio
    const btnVolver = document.getElementById('btnVolverUsuario');
    if (btnVolver) {
        btnVolver.addEventListener('click', function() {
            // Limpiamos el estado y la pantalla del modo estudiante
            reiniciarVistaModoUsuario();
            // Mostramos la pantalla de inicio y ocultamos las vistas de usuario y admin
            const pantallaInicio = document.getElementById('pantallaInicio');
            const vistaUsuario   = document.getElementById('vistaUsuario');
            const vistaAdmin     = document.getElementById('vistaAdmin');
            if (pantallaInicio) pantallaInicio.classList.remove('hidden');
            if (vistaUsuario)   vistaUsuario.classList.add('hidden');
            if (vistaAdmin)     vistaAdmin.classList.add('hidden');
            // Marcamos en el body que el modo actual es "inicio" para que los estilos CSS funcionen
            document.body.dataset.modo = 'inicio';
        });
    }

    // Registramos todos los eventos de navegación del menú lateral y los formularios del panel
    registrarEventosNavegacion();
}
