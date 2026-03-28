// MÓDULO: services/tareasService.js
// CAPA: Services — lógica intermedia entre API y UI
// Responsabilidad: coordinar operaciones de búsqueda, edición y eliminación
// de tareas en el MODO USUARIO.

import {
    buscarUsuarioPorDocumento,
    obtenerTareasDeUsuario,
    actualizarTarea,
    eliminarTarea
} from '../api/tareasApi.js';

// ✅ CORRECCIÓN 1: import corregido de '../ui/tareasUI.js' → '../ui/tareasUi.js'
//
// ¿Por qué fallaba?
// El archivo en disco se llama 'tareasUi.js' (la 'i' es minúscula).
// En Linux (y en Vite) el sistema de archivos distingue mayúsculas.
// 'tareasUI.js' y 'tareasUi.js' son archivos distintos para el sistema.
// El import con mayúscula no encontraba el archivo → pantalla en blanco.
import {
    ocultarDatosUsuario,
    agregarTareaATabla,
    actualizarFilaTarea,
    eliminarFilaTarea,
    mostrarModalEdicion,
    ocultarModalEdicion,
    mostrarEstadoVacio
} from '../ui/tareasUi.js';

import {
    validarFormularioBusqueda,
    mostrarError,
    limpiarError
} from '../utils/validaciones.js';

import {
    mostrarNotificacion,
    mostrarConfirmacion
} from '../utils/notificaciones.js';

import { filtrarTareas }  from '../utils/filtros.js';
import { ordenarTareas }  from '../utils/ordenamiento.js';

import {
    registrarEventosNavegacion,
    activarModoInicio
} from '../ui/modoUI.js';

// ─────────────────────────────────────────────
// Estado local del módulo
// ─────────────────────────────────────────────

let usuarioActual     = null;
let tareasRegistradas = [];
let contadorTareas    = 0;

let filtroEstadoActivo  = '';
let filtroUsuarioActivo = '';
let criterioOrdenActivo = '';

// ─────────────────────────────────────────────
// Funciones privadas
// ─────────────────────────────────────────────

function reiniciarVistaModoUsuario() {
    usuarioActual     = null;
    tareasRegistradas = [];
    contadorTareas    = 0;

    ocultarDatosUsuario();

    const seccion = document.getElementById('tasksSection');
    if (seccion) seccion.classList.add('hidden');

    const tbody = document.getElementById('tasksTableBody');
    if (tbody) {
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    }

    const inputDocumento = document.getElementById('userDocument');
    if (inputDocumento) inputDocumento.value = '';

    const errorDocumento = document.getElementById('userDocumentError');
    if (errorDocumento) errorDocumento.textContent = '';

    mostrarEstadoVacio();
}

function refrescarTabla() {
    const tareasFiltradas = filtrarTareas(tareasRegistradas, filtroEstadoActivo, filtroUsuarioActivo);
    const tareasOrdenadas = ordenarTareas(tareasFiltradas, criterioOrdenActivo);

    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    tareasOrdenadas.forEach(function(tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

// ─────────────────────────────────────────────
// RF-01: Buscar usuario por documento
// ─────────────────────────────────────────────

export async function manejarBusquedaUsuario(event) {
    event.preventDefault();

    // ✅ CORRECCIÓN 2: se obtienen los elementos del DOM correctamente
    //    para pasarlos a validarFormularioBusqueda y mostrarError.
    //
    // ¿Por qué fallaba antes?
    // El código original hacía:
    //   const esValido = validarFormularioBusqueda(inputDocumento.value.trim());
    //
    // Pero la firma de validarFormularioBusqueda en validaciones.js es:
    //   validarFormularioBusqueda(documentoInput, documentoError)
    //   → recibe los ELEMENTOS del DOM, no el valor string.
    //
    // Al pasarle un string en lugar del elemento, la función intentaba hacer
    // inputDocumento.value sobre un string → retornaba undefined → la validación
    // siempre devolvía false → el formulario nunca avanzaba, se bloqueaba silenciosamente.
    //
    // Solución: pasar el elemento <input> y el elemento <span de error> directamente.
    const inputDocumento = document.getElementById('userDocument');
    const errorDocumento = document.getElementById('userDocumentError');

    // Ahora la llamada es correcta: recibe (elementoInput, elementoError)
    const esValido = validarFormularioBusqueda(inputDocumento, errorDocumento);
    if (!esValido) return;

    reiniciarVistaModoUsuario();

    // Se busca el usuario por el valor del input (no por el elemento)
    const usuario = await buscarUsuarioPorDocumento(inputDocumento.value.trim());

    if (!usuario) {
        // ✅ CORRECCIÓN 3: orden de parámetros corregido en mostrarError
        //
        // ¿Por qué fallaba antes?
        // El código original llamaba:
        //   mostrarError(errorDocumento, inputDocumento, 'No se encontro...')
        //
        // Pero la firma de mostrarError en validaciones.js es:
        //   mostrarError(elementoError, elementoInput, mensaje)
        //   → primer parámetro: el SPAN de error
        //   → segundo parámetro: el INPUT
        //
        // Casualmente el orden era correcto aquí, pero en otros lugares del
        // código original los parámetros estaban invertidos, causando que
        // el mensaje de error se mostrara en el input y el borde rojo
        // se aplicara al span — visualmente no se veía nada.
        //
        // Ahora todos los llamados siguen el orden: (spanError, inputElement, mensaje)
        mostrarError(
            errorDocumento,
            inputDocumento,
            'No se encontro ningun usuario con ese documento'
        );
        return;
    }

    usuarioActual = usuario;

    let tareas = [];
    try {
        // Se obtienen las tareas del usuario usando su id interno de MySQL
        // (usuario.id = 1, 2, 3...) — NO el número de documento
        tareas            = await obtenerTareasDeUsuario(usuario.id);
        tareasRegistradas = tareas;
        contadorTareas    = tareas.length;
    } catch (err) {
        console.error('Error cargando tareas del usuario:', err);
        tareas = [];
    }

    mostrarResultadoUsuarioFijo(usuario, tareas);
}

// Construye y muestra el bloque de resultado de búsqueda en la vista usuario
function mostrarResultadoUsuarioFijo(usuario, tareas) {

    // Se revela la sección de datos del usuario
    const seccionDatos = document.getElementById('userDataSection');
    if (seccionDatos) seccionDatos.classList.remove('hidden');

    // Se llenan los spans con los datos del usuario encontrado
    const spanId     = document.getElementById('userId');
    const spanNombre = document.getElementById('userName');
    const spanEmail  = document.getElementById('userEmail');

    // Se muestra el documento (número de cédula) como identificador visible,
    // no el id interno de MySQL
    if (spanId)     spanId.textContent     = usuario.documento || usuario.id;
    if (spanNombre) spanNombre.textContent = usuario.name;
    if (spanEmail)  spanEmail.textContent  = usuario.email;

    // Se revela la sección de la tabla de tareas
    const seccionTareas = document.getElementById('tasksSection');
    if (seccionTareas) seccionTareas.classList.remove('hidden');

    // Se actualiza el contador visual de tareas
    const contadorEl = document.getElementById('tasksCount');
    if (contadorEl) {
        contadorEl.textContent = `${tareas.length} ${tareas.length === 1 ? 'tarea' : 'tareas'}`;
    }

    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (tareas.length === 0) {
        mostrarEstadoVacio();
        return;
    }

    const estadoVacio = document.getElementById('tasksEmptyState');
    if (estadoVacio) estadoVacio.classList.add('hidden');

    // Se dibuja una fila por cada tarea del usuario
    tareas.forEach(function(tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

// ─────────────────────────────────────────────
// RF-03: Editar tarea
// ─────────────────────────────────────────────

export function manejarEdicionTarea(tarea) {
    mostrarModalEdicion(tarea);

    const formulario = document.getElementById('editTaskForm');

    async function manejarGuardadoEdicion(event) {
        event.preventDefault();

        const titulo      = document.getElementById('editTaskTitle').value.trim();
        const descripcion = document.getElementById('editTaskDescription').value.trim();
        const estado      = document.getElementById('editTaskStatus').value;
        const tareaId     = document.getElementById('editTaskId').value;
        const comentEl    = document.getElementById('editTaskComment');
        const comentario  = comentEl ? comentEl.value.trim() : '';

        const datosActualizados = {
            title:       titulo,
            description: descripcion,
            status:      estado,
            comment:     comentario,
            completed:   estado === 'completada'
        };

        const tareaActualizada = await actualizarTarea(tareaId, datosActualizados);

        if (tareaActualizada) {
            const indice = tareasRegistradas.findIndex(
                t => t.id.toString() === tareaActualizada.id.toString()
            );

            if (indice !== -1) {
                tareasRegistradas[indice] = {
                    ...tareaActualizada,
                    comment: comentario
                };
            }

            refrescarTabla();
            ocultarModalEdicion();
            mostrarNotificacion('Tarea actualizada exitosamente', 'exito');
        } else {
            mostrarNotificacion('Error al actualizar la tarea', 'error');
        }

        formulario.removeEventListener('submit', manejarGuardadoEdicion);
    }

    formulario.addEventListener('submit', manejarGuardadoEdicion);
}

// ─────────────────────────────────────────────
// RF-04: Eliminar tarea
// ─────────────────────────────────────────────

export async function manejarEliminacionTarea(tarea) {
    const confirmado = await mostrarConfirmacion(
        `Eliminar la tarea "${tarea.title}"?`,
        'Esta accion no se puede deshacer.',
        'Si, eliminar'
    );
    if (!confirmado) return;

    const eliminada = await eliminarTarea(tarea.id);

    if (eliminada) {
        tareasRegistradas = tareasRegistradas.filter(
            t => t.id.toString() !== tarea.id.toString()
        );
        contadorTareas--;
        eliminarFilaTarea(tarea.id);
        refrescarTabla();
        mostrarNotificacion('Tarea eliminada exitosamente', 'exito');
    } else {
        mostrarNotificacion('Error al eliminar la tarea', 'error');
    }
}

// ─────────────────────────────────────────────
// Delegación de eventos en la tabla del modo usuario
// ─────────────────────────────────────────────

function manejarClicEnTabla(event) {
    const botonAccion = event.target.closest('[data-action]');
    if (!botonAccion) return;

    const tareaId = botonAccion.dataset.id;
    const accion  = botonAccion.dataset.action;

    const tarea = tareasRegistradas.find(t => t.id.toString() === tareaId.toString());
    if (!tarea) return;

    if (accion === 'edit')   manejarEdicionTarea(tarea);
    if (accion === 'delete') manejarEliminacionTarea(tarea);
}

// ─────────────────────────────────────────────
// Registro de event listeners (llamado desde main.js)
// ─────────────────────────────────────────────

export function registrarEventListeners() {

    // Formulario de búsqueda por documento del modo usuario
    const formBusqueda = document.getElementById('searchUserForm');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', manejarBusquedaUsuario);
    }

    // Limpieza del error del campo documento mientras el usuario escribe
    const inputDoc   = document.getElementById('userDocument');
    const errorDoc   = document.getElementById('userDocumentError');
    if (inputDoc && errorDoc) {
        inputDoc.addEventListener('input', function() {
            // ✅ Orden correcto: (spanError, inputElement)
            limpiarError(errorDoc, inputDoc);
        });
    }

    // Delegación de eventos en el tbody — maneja Editar y Eliminar de todas las filas
    const tbody = document.getElementById('tasksTableBody');
    if (tbody) {
        tbody.addEventListener('click', manejarClicEnTabla);
    }

    // Botón X del modal de edición
    const btnCerrarModal = document.getElementById('editCloseBtn');
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', ocultarModalEdicion);
    }

    // Botón Cancelar del modal de edición
    const btnCancelarModal = document.getElementById('editCancelBtn');
    if (btnCancelarModal) {
        btnCancelarModal.addEventListener('click', ocultarModalEdicion);
    }

    // Eventos de navegación (botones de inicio, volver, admin, etc.)
    registrarEventosNavegacion();
}