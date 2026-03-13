// MÓDULO: services/tareasService.js
// CAPA: Services — lógica intermedia entre API y UI
// Responsabilidad: coordinar operaciones de búsqueda, edición y eliminación
// de tareas en el MODO USUARIO.
// En modo usuario:
//   - El usuario busca por documento
//   - El resultado se muestra FIJO debajo del formulario (no en modal flotante)
//   - La tabla muestra título, descripción, estado y un comentario
//   - Cada fila tiene botón Editar (celeste pastel) y Eliminar (rojo pastel)
//   - Editar abre el modal existente del HTML con SweetAlert2 para confirmaciones
//   - Eliminar usa SweetAlert2 importado de notificaciones.js
// Flujo: Evento DOM → service → api → respuesta → service → ui → DOM

import {
    buscarUsuarioPorDocumento,
    actualizarTarea,
    eliminarTarea
} from '../api/tareasApi.js';

// Se importan las funciones de UI que manipulan el DOM de la sección de tareas
import {
    ocultarDatosUsuario,
    agregarTareaATabla,
    actualizarFilaTarea,
    eliminarFilaTarea,
    mostrarModalEdicion,
    ocultarModalEdicion,
    mostrarEstadoVacio
} from '../ui/tareasUI.js';

// Se importan las funciones de validación de formularios
import {
    validarFormularioBusqueda,
    mostrarError,
    limpiarError
} from '../utils/validaciones.js';

// Se importan las funciones de SweetAlert2 para notificaciones y confirmaciones
// Estas reemplazan los alert/confirm nativos del navegador con UI más bonita
import {
    mostrarNotificacion,
    mostrarConfirmacion
} from '../utils/notificaciones.js';

import { filtrarTareas }   from '../utils/filtros.js';
import { ordenarTareas }   from '../utils/ordenamiento.js';

// Se importan las funciones de navegación que registran los eventos de los botones
import {
    registrarEventosNavegacion,
    activarModoInicio
} from '../ui/modoUI.js';

// Se importa la URL base para construir peticiones directas al servidor
import { API_BASE_URL } from '../utils/config.js';

// Estado local del modo usuario
// usuarioActual guarda el objeto del usuario encontrado en la búsqueda
let usuarioActual     = null;
// tareasRegistradas guarda el arreglo de tareas del usuario para filtrar y ordenar localmente
let tareasRegistradas = [];
// contadorTareas rastrea la cantidad de tareas visibles para numerar las filas de la tabla
let contadorTareas    = 0;

// Estado de filtros activos en la tabla del modo usuario
// Se usan para aplicar filtros sin repetir la petición al servidor
let filtroEstadoActivo  = '';
let filtroUsuarioActivo = '';
let criterioOrdenActivo = '';

// Reinicia la vista del usuario al iniciar una nueva búsqueda
// Limpia los datos del usuario anterior y vacía la tabla para no mostrar datos obsoletos
function reiniciarVistaModoUsuario() {
    usuarioActual     = null;
    tareasRegistradas = [];
    contadorTareas    = 0;
    // Se oculta y limpia la sección de datos del usuario del HTML
    ocultarDatosUsuario();

    // Se oculta la sección de tareas que se reveló al mostrar resultados anteriores
    const seccion = document.getElementById('tasksSection');
    if (seccion) seccion.classList.add('hidden');

    // Se vacía el tbody de la tabla para no mostrar filas de búsquedas anteriores
    const tbody = document.getElementById('tasksTableBody');
    if (tbody) {
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    }
    // Se muestra el mensaje de "no hay tareas" mientras no haya resultados
    mostrarEstadoVacio();
}

// Repinta la tabla del modo usuario aplicando los filtros y el orden activos
// Se llama después de editar o eliminar una tarea para reflejar el cambio en la tabla
function refrescarTabla() {
    // Se aplican los filtros activos al arreglo de tareas registradas
    const tareasFiltradas = filtrarTareas(tareasRegistradas, filtroEstadoActivo, filtroUsuarioActivo);
    // Se aplica el criterio de orden activo sobre las tareas ya filtradas
    const tareasOrdenadas = ordenarTareas(tareasFiltradas, criterioOrdenActivo);

    // Se obtiene el tbody de la tabla para repintarlo
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    // Se vacía el tbody antes de repintar para evitar duplicar filas
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    // Se agrega una fila por cada tarea del arreglo filtrado y ordenado
    tareasOrdenadas.forEach(function(tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

// RF-01: Buscar usuario por documento (modo usuario)
// Limpia el estado anterior, busca el usuario en el servidor y muestra sus tareas
// El resultado se muestra FIJO debajo del formulario, no en un modal flotante
export async function manejarBusquedaUsuario(event) {
    event.preventDefault();

    const inputDocumento = document.getElementById('userDocument');
    const errorDocumento = document.getElementById('userDocumentError');

    // Se valida que el campo de documento no esté vacío antes de buscar
    const esValido = validarFormularioBusqueda(inputDocumento, errorDocumento);
    if (!esValido) return;

    // Se limpia cualquier resultado anterior antes de mostrar el nuevo
    reiniciarVistaModoUsuario();

    // Se busca el usuario en el servidor por su número de documento
    const usuario = await buscarUsuarioPorDocumento(inputDocumento.value.trim());

    // Si no se encontró ningún usuario se muestra el error en el campo
    if (!usuario) {
        mostrarError(
            errorDocumento,
            inputDocumento,
            'No se encontro ningun usuario con ese documento'
        );
        return;
    }

    // Se guarda el usuario encontrado en el estado local del service
    usuarioActual = usuario;

<<<<<<< HEAD
    // ----- PASO 4: VALIDAR EL FORMULARIO -----
    // validarFormularioTareas() verifica todos los campos y muestra errores.
    // Si algún campo falla, retorna false y detenemos la ejecución.
    const esValido = validarFormularioTareas(
        inputTitulo, inputDesc, selectEst,
        errorTitulo, errorDesc, errorEst
    );
    if (!esValido) return;

    // ----- PASO 5: CONSTRUIR EL OBJETO DE TAREA -----
    // trim() elimina espacios accidentales en los campos de texto
    const datosTarea = {
        title:       inputTitulo.value.trim(),
        description: inputDesc.value.trim(),
        status:      selectEst.value,
        userId:      usuarioActual.documento,  // ← antes era usuarioActual.id
        userName:    usuarioActual.name,
        completed:   selectEst.value === 'completada'
    };

    // ----- PASO 6: LLAMAR A LA CAPA API -----
    const tareaCreada = await registrarTarea(datosTarea);

    // ----- PASO 7: PROCESAR EL RESULTADO -----
    if (tareaCreada) {

        // REGISTRO EXITOSO
        tareasRegistradas.push(tareaCreada); // Guardamos en el estado local
        contadorTareas++;
        limpiarFormularioTareas();

        // RF01+RF02: refrescamos la tabla para que los filtros y el orden activos
        // se apliquen también sobre la tarea recién agregada
        refrescarTabla();

        mostrarNotificacion('Tarea registrada exitosamente', 'exito');

    } else {

        // ERROR EN EL REGISTRO
        mostrarNotificacion('Error al registrar la tarea. Por favor, intenta nuevamente.', 'error');
=======
    // Se obtienen las tareas del usuario del servidor filtrando por su id interno
    let tareas = [];
    try {
        const res = await fetch(`${API_BASE_URL}/tasks?userId=${usuario.id}`);
        tareas    = await res.json();
        // Se guardan las tareas en el estado local para filtrar y ordenar sin nueva petición
        tareasRegistradas = tareas;
        contadorTareas    = tareas.length;
    } catch (err) {
        console.error('Error cargando tareas del usuario:', err);
>>>>>>> upstream/release
    }

    // Se muestra el bloque de datos del usuario debajo del formulario
    mostrarResultadoUsuarioFijo(usuario, tareas);
}

// Construye y muestra el resultado de búsqueda de forma FIJA en la vista usuario
// En lugar de abrir un modal flotante, se revela la sección que ya existe en el HTML
// Parámetros:
//   usuario — objeto del usuario encontrado
//   tareas  — arreglo de tareas asignadas a ese usuario
function mostrarResultadoUsuarioFijo(usuario, tareas) {

    // Se revela la sección de datos del usuario que estaba oculta con clase 'hidden'
    const seccionDatos = document.getElementById('userDataSection');
    if (seccionDatos) seccionDatos.classList.remove('hidden');

    // Se llenan los spans de datos del usuario con la información encontrada
    // Se usa textContent (no innerHTML) para evitar inyección de HTML
    const spanId     = document.getElementById('userId');
    const spanNombre = document.getElementById('userName');
    const spanEmail  = document.getElementById('userEmail');

    // Se muestra el documento como identificador visible, no el id interno del servidor
    if (spanId)     spanId.textContent     = usuario.documento || usuario.id;
    if (spanNombre) spanNombre.textContent = usuario.name;
    if (spanEmail)  spanEmail.textContent  = usuario.email;

    // Se revela la sección de la tabla de tareas
    const seccionTareas = document.getElementById('tasksSection');
    if (seccionTareas) seccionTareas.classList.remove('hidden');

    // Se actualiza el contador visual de tareas en el encabezado de la tabla
    const contadorEl = document.getElementById('tasksCount');
    if (contadorEl) {
        contadorEl.textContent = `${tareas.length} ${tareas.length === 1 ? 'tarea' : 'tareas'}`;
    }

    // Se obtiene el tbody de la tabla para llenarlo con las filas de tareas
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    // Se vacía el tbody para no duplicar filas si se hizo una búsqueda previa
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    // Si no hay tareas se muestra el mensaje de estado vacío
    if (tareas.length === 0) {
        mostrarEstadoVacio();
        return;
    }

    // Se oculta el mensaje de estado vacío porque hay tareas para mostrar
    const estadoVacio = document.getElementById('tasksEmptyState');
    if (estadoVacio) estadoVacio.classList.add('hidden');

    // Se crea una fila por cada tarea del usuario usando agregarTareaATabla de tareasUI.js
    tareas.forEach(function(tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

// RF-03: Editar tarea — abre el modal del HTML con los datos actuales de la tarea
// El usuario puede modificar el título, la descripción, el estado y el comentario
export function manejarEdicionTarea(tarea) {
    // Se llama a tareasUI.js para mostrar el modal con los datos precargados
    mostrarModalEdicion(tarea);

    // Se obtiene el formulario del modal del HTML
    const formulario = document.getElementById('editTaskForm');

    // Se define la función que procesa el guardado cuando el usuario hace submit
    // Se declara con nombre para poder removerla después y evitar acumulación de listeners
    async function manejarGuardadoEdicion(event) {
        event.preventDefault();

        // Se leen los valores actuales de cada campo del modal
        const titulo      = document.getElementById('editTaskTitle').value.trim();
        const descripcion = document.getElementById('editTaskDescription').value.trim();
        const estado      = document.getElementById('editTaskStatus').value;
        const tareaId     = document.getElementById('editTaskId').value;
        // El comentario es opcional: si el campo no existe en el DOM se usa string vacío
        const comentEl    = document.getElementById('editTaskComment');
        const comentario  = comentEl ? comentEl.value.trim() : '';

        // Se construye el objeto con los datos actualizados para enviar al servidor
        const datosActualizados = {
            title:       titulo,
            description: descripcion,
            status:      estado,
            comment:     comentario,
            // completed es un campo booleano que el servidor usa para marcar tareas terminadas
            completed:   estado === 'completada'
        };

        // Se envía el PATCH al servidor con los datos actualizados
        const tareaActualizada = await actualizarTarea(tareaId, datosActualizados);

        if (tareaActualizada) {
            // Se actualiza el objeto en el arreglo local para reflejar el cambio sin nueva petición
            const indice = tareasRegistradas.findIndex(
                t => t.id.toString() === tareaActualizada.id.toString()
            );
            if (indice !== -1) tareasRegistradas[indice] = tareaActualizada;

            // Se repinta la tabla con la fila actualizada
            refrescarTabla();
            // Se cierra el modal de edición
            ocultarModalEdicion();
            // Se muestra la notificación de éxito usando SweetAlert2 (toast morado)
            mostrarNotificacion('Tarea actualizada exitosamente', 'exito');
        } else {
            // Si el servidor devolvió error se notifica al usuario
            mostrarNotificacion('Error al actualizar la tarea', 'error');
        }

        // Se remueve el listener para no acumular handlers si el usuario abre el modal varias veces
        formulario.removeEventListener('submit', manejarGuardadoEdicion);
    }

    // Se registra el listener en el formulario del modal
    formulario.addEventListener('submit', manejarGuardadoEdicion);
}

// RF-04: Eliminar tarea del modo usuario
// Pide confirmación con SweetAlert2 antes de enviar el DELETE al servidor
export async function manejarEliminacionTarea(tarea) {
    // Se muestra el dialog de confirmación de SweetAlert2 en lugar del confirm nativo
    // SweetAlert2 es más visual: tiene botones coloreados y animaciones
    const confirmado = await mostrarConfirmacion(
        `Eliminar la tarea "${tarea.title}"?`,
        'Esta accion no se puede deshacer.',
        'Si, eliminar'
    );
    // Si el usuario canceló o cerró el dialog no se hace nada
    if (!confirmado) return;

    // Se envía DELETE al servidor para eliminar la tarea por su id
    const eliminada = await eliminarTarea(tarea.id);

    if (eliminada) {
        // Se elimina la tarea del arreglo local para mantener el estado sincronizado
        tareasRegistradas = tareasRegistradas.filter(
            t => t.id.toString() !== tarea.id.toString()
        );
        contadorTareas--;
        // Se elimina la fila visual de la tabla
        eliminarFilaTarea(tarea.id);
        // Se repinta la tabla para actualizar los números correlativos
        refrescarTabla();
        // Se muestra la notificación de éxito
        mostrarNotificacion('Tarea eliminada exitosamente', 'exito');
    } else {
        // Si el servidor devolvió error se notifica al usuario
        mostrarNotificacion('Error al eliminar la tarea', 'error');
    }
}

// Delegación de eventos en el tbody de la tabla del modo usuario
// Se usa un solo listener en el contenedor padre para manejar todos los botones
// de todas las filas, sin registrar un listener por cada botón individual
function manejarClicEnTabla(event) {
    // closest('[data-action]') sube por el DOM desde el elemento clicado
    // hasta encontrar el elemento con atributo data-action (el botón)
    const botonAccion = event.target.closest('[data-action]');
    if (!botonAccion) return;

    // Se leen el id y la acción del botón desde sus atributos data
    const tareaId = botonAccion.dataset.id;
    const accion  = botonAccion.dataset.action;

    // Se busca el objeto de la tarea en el arreglo local usando el id del botón
    const tarea = tareasRegistradas.find(t => t.id.toString() === tareaId.toString());
    if (!tarea) return;

    // Se delega la acción a la función correspondiente según el botón clicado
    if (accion === 'edit')   manejarEdicionTarea(tarea);
    if (accion === 'delete') manejarEliminacionTarea(tarea);
}

// Registro de todos los event listeners de la aplicación
// Se llama desde main.js una única vez al inicializar la aplicación
export function registrarEventListeners() {

    // Formulario de búsqueda por documento del modo usuario
    document.getElementById('searchUserForm')
        .addEventListener('submit', manejarBusquedaUsuario);

    // Limpieza del error de documento mientras el usuario escribe
    document.getElementById('userDocument')
        .addEventListener('input', function() {
            limpiarError(
                document.getElementById('userDocumentError'),
                document.getElementById('userDocument')
            );
        });

    // Delegación de eventos en el tbody de tareas del modo usuario
    // Maneja los clics en Editar y Eliminar de todas las filas desde un solo listener
    document.getElementById('tasksTableBody')
        .addEventListener('click', manejarClicEnTabla);

    // Botón X del modal de edición: cierra el modal sin guardar cambios
    const btnCerrarModal = document.getElementById('editCloseBtn');
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', ocultarModalEdicion);
    }

    // Botón Cancelar del modal de edición: cierra el modal sin guardar cambios
    const btnCancelarModal = document.getElementById('editCancelBtn');
    if (btnCancelarModal) {
        btnCancelarModal.addEventListener('click', ocultarModalEdicion);
    }

    // Se registran los eventos de navegación (botones de inicio, volver, admin, etc.)
    registrarEventosNavegacion();
}