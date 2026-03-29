// MÓDULO: services/tareasService.js
// CAPA:   Services

// Coordina las operaciones del MODO USUARIO:
// búsqueda de usuario, carga de sus tareas, edición y eliminación.
// Es el intermediario entre la capa API y la capa UI para este flujo.

import {
    buscarUsuarioPorDocumento,
    obtenerTareasDeUsuario,
    actualizarTarea,
    eliminarTarea,
} from '../api/tareasApi.js';

import {
    ocultarDatosUsuario,
    agregarTareaATabla,
    actualizarFilaTarea,
    eliminarFilaTarea,
    mostrarModalEdicion,
    ocultarModalEdicion,
    mostrarEstadoVacio,
    mostrarSeccionTareas,
    ocultarEstadoVacio,
} from '../ui/tareasUI.js';

import {
    validarFormularioBusqueda,
    mostrarError,
    limpiarError,
} from '../utils/validaciones.js';

import {
    mostrarNotificacion,
    mostrarConfirmacion,
} from '../utils/notificaciones.js';

import { filtrarTareas }  from '../utils/filtros.js';
import { ordenarTareas }  from '../utils/ordenamiento.js';
import { registrarEventosNavegacion, activarModoInicio } from '../ui/modoUI.js';

// ── ESTADO LOCAL (modo usuario) ───────────────────────────────────────────────

let usuarioActual     = null;
let tareasRegistradas = [];

// Filtros activos en el modo usuario (no hay controles en el HTML actual,
// pero la infraestructura queda lista para agregarlos)
let filtroEstadoActivo  = '';
let filtroUsuarioActivo = '';
let criterioOrdenActivo = '';

// ── FUNCIONES PRIVADAS ────────────────────────────────────────────────────────

function reiniciarVistaModoUsuario() {
    usuarioActual     = null;
    tareasRegistradas = [];

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

    if (tareasOrdenadas.length === 0) {
        mostrarEstadoVacio();
        return;
    }

    ocultarEstadoVacio();
    mostrarSeccionTareas();

    tareasOrdenadas.forEach(function(tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

// ── RF-01: BUSCAR USUARIO POR DOCUMENTO ──────────────────────────────────────

export async function manejarBusquedaUsuario(event) {
    event.preventDefault();

    const inputDocumento = document.getElementById('userDocument');
    const errorDocumento = document.getElementById('userDocumentError');

    const esValido = validarFormularioBusqueda(inputDocumento, errorDocumento);
    if (!esValido) return;

    // Se guarda el valor ANTES de reiniciar porque reiniciarVistaModoUsuario()
    // limpia el input y el valor quedaría vacío al llamar buscarUsuarioPorDocumento
    const documentoABuscar = inputDocumento.value.trim();

    reiniciarVistaModoUsuario();

    const usuario = await buscarUsuarioPorDocumento(documentoABuscar);

    if (!usuario) {
        mostrarError(
            errorDocumento,
            inputDocumento,
            'No se encontró ningún usuario con ese documento'
        );
        return;
    }

    usuarioActual = usuario;

    let tareas = [];
    try {
        tareas            = await obtenerTareasDeUsuario(usuario.id);
        tareasRegistradas = tareas;
    } catch (err) {
        console.error('Error cargando tareas del usuario:', err);
        tareas = [];
    }

    mostrarResultadoUsuarioFijo(usuario, tareas);
}

function mostrarResultadoUsuarioFijo(usuario, tareas) {
    // Mostrar sección de datos del usuario
    const seccionDatos = document.getElementById('userDataSection');
    if (seccionDatos) seccionDatos.classList.remove('hidden');

    const spanId     = document.getElementById('userId');
    const spanNombre = document.getElementById('userName');
    const spanEmail  = document.getElementById('userEmail');

    if (spanId)     spanId.textContent     = usuario.documento || usuario.id;
    if (spanNombre) spanNombre.textContent = usuario.name;
    if (spanEmail)  spanEmail.textContent  = usuario.email;

    // Mostrar sección de tareas
    const seccionTareas = document.getElementById('tasksSection');
    if (seccionTareas) seccionTareas.classList.remove('hidden');

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

    tareas.forEach(function(tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

// ── RF-03: EDITAR TAREA ───────────────────────────────────────────────────────

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
        };

        const tareaActualizada = await actualizarTarea(tareaId, datosActualizados);

        if (tareaActualizada) {
            const indice = tareasRegistradas.findIndex(
                t => t.id.toString() === tareaActualizada.id.toString()
            );

            if (indice !== -1) {
                // El backend devuelve el comment correctamente; se guarda el local
                // como respaldo por si el backend aún no lo incluye en la respuesta
                tareasRegistradas[indice] = {
                    ...tareaActualizada,
                    comment: comentario,
                };
            }

            refrescarTabla();
            ocultarModalEdicion();
            await mostrarNotificacion('Tarea actualizada exitosamente', 'exito');
        } else {
            await mostrarNotificacion('Error al actualizar la tarea', 'error');
        }

        formulario.removeEventListener('submit', manejarGuardadoEdicion);
    }

    formulario.addEventListener('submit', manejarGuardadoEdicion);
}

// ── RF-04: ELIMINAR TAREA ─────────────────────────────────────────────────────

export async function manejarEliminacionTarea(tarea) {
    const confirmado = await mostrarConfirmacion(
        `¿Eliminar la tarea "${tarea.title}"?`,
        'Esta acción no se puede deshacer.',
        'Sí, eliminar'
    );
    if (!confirmado) return;

    const eliminada = await eliminarTarea(tarea.id);

    if (eliminada) {
        tareasRegistradas = tareasRegistradas.filter(
            t => t.id.toString() !== tarea.id.toString()
        );
        eliminarFilaTarea(tarea.id);
        refrescarTabla();
        await mostrarNotificacion('Tarea eliminada exitosamente', 'exito');
    } else {
        await mostrarNotificacion('Error al eliminar la tarea', 'error');
    }
}

// ── DELEGACIÓN DE EVENTOS EN LA TABLA ────────────────────────────────────────

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

// ── REGISTRO DE LISTENERS (llamado desde main.js) ─────────────────────────────

export function registrarEventListeners() {

    // Formulario de búsqueda modo usuario
    const formBusqueda = document.getElementById('searchUserForm');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', manejarBusquedaUsuario);
    }

    // Limpiar error mientras el usuario escribe
    const inputDoc = document.getElementById('userDocument');
    const errorDoc = document.getElementById('userDocumentError');
    if (inputDoc && errorDoc) {
        inputDoc.addEventListener('input', function() {
            limpiarError(errorDoc, inputDoc);
        });
    }

    // Delegación de clicks en tabla de tareas del modo usuario
    const tbody = document.getElementById('tasksTableBody');
    if (tbody) {
        tbody.addEventListener('click', manejarClicEnTabla);
    }

    // Botones del modal de edición
    const btnCerrarModal = document.getElementById('editCloseBtn');
    if (btnCerrarModal) btnCerrarModal.addEventListener('click', ocultarModalEdicion);

    const btnCancelarModal = document.getElementById('editCancelBtn');
    if (btnCancelarModal) btnCancelarModal.addEventListener('click', ocultarModalEdicion);

    // Todos los eventos de navegación y del panel admin
    registrarEventosNavegacion();
}