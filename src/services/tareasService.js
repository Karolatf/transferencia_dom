// MÓDULO: services/tareasService.js
// CAPA: Services — lógica intermedia entre API y UI
// Responsabilidad: coordinar operaciones CRUD del modo usuario.
// El modo usuario solo puede editar el estado y comentario de sus tareas.
// Las tareas son creadas y asignadas desde el panel de administrador.
// Flujo: Evento DOM → service → api → respuesta → service → ui → DOM

import {
    buscarUsuarioPorDocumento,
    actualizarTarea,
    eliminarTarea
} from '../api/tareasApi.js';

import {
    mostrarDatosUsuario,
    ocultarDatosUsuario,
    agregarTareaATabla,
    actualizarFilaTarea,
    eliminarFilaTarea,
    mostrarModalEdicion,
    ocultarModalEdicion,
    mostrarEstadoVacio
} from '../ui/tareasUI.js';

import {
    validarFormularioBusqueda,
    mostrarError,
    limpiarError
} from '../utils/validaciones.js';

import {
    mostrarNotificacion,
    mostrarConfirmacion
} from '../utils/notificaciones.js';

import { filtrarTareas }   from '../utils/filtros.js';
import { ordenarTareas }   from '../utils/ordenamiento.js';

import {
    registrarEventosNavegacion,
    activarModoInicio
} from '../ui/modoUI.js';

// Estado local del modo usuario
let usuarioActual     = null;
let tareasRegistradas = [];
let contadorTareas    = 0;

// Estado de filtros activos en la tabla del modo usuario
let filtroEstadoActivo  = '';
let filtroUsuarioActivo = '';
let criterioOrdenActivo = '';

// Reinicia la vista del usuario al iniciar nueva búsqueda
// Limpia datos del usuario anterior y vacia la tabla
function reiniciarVistaModoUsuario() {
    usuarioActual     = null;
    tareasRegistradas = [];
    contadorTareas    = 0;
    ocultarDatosUsuario();

    // Ocultamos la sección de tareas y limpiamos el tbody
    const seccion = document.getElementById('tasksSection');
    if (seccion) seccion.classList.add('hidden');
    const tbody = document.getElementById('tasksTableBody');
    if (tbody) {
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    }
    mostrarEstadoVacio();
}

// Repinta la tabla del modo usuario aplicando filtros y orden activos
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

// RF-01: Buscar usuario por documento (modo usuario)
// Limpia el estado anterior y carga las tareas del usuario encontrado
export async function manejarBusquedaUsuario(event) {
    event.preventDefault();

    const inputDocumento = document.getElementById('userDocument');
    const errorDocumento = document.getElementById('userDocumentError');

    const esValido = validarFormularioBusqueda(inputDocumento, errorDocumento);
    if (!esValido) return;

    // Limpiamos la vista del usuario anterior antes de buscar
    reiniciarVistaModoUsuario();

    const usuario = await buscarUsuarioPorDocumento(inputDocumento.value.trim());

    if (!usuario) {
        mostrarError(
            errorDocumento,
            inputDocumento,
            'No se encontro ningun usuario con ese documento'
        );
        return;
    }

    usuarioActual = usuario;
    mostrarDatosUsuario(usuario);

    // Cargamos las tareas del usuario usando su id interno (no el documento)
    // El campo userId en las tareas guarda el id numérico asignado por json-server
    try {
        const res    = await fetch(`http://localhost:3000/tasks?userId=${usuario.id}`);
        const tareas = await res.json();
        tareasRegistradas = tareas;
        contadorTareas    = tareas.length;
        refrescarTabla();

        const seccion = document.getElementById('tasksSection');
        if (seccion) seccion.classList.remove('hidden');

        // Si hay tareas, ocultamos el mensaje de vacío
        if (tareas.length > 0) {
            const mensajeVacio = document.getElementById('tasksEmptyState');
            if (mensajeVacio) mensajeVacio.classList.add('hidden');
        }
    } catch (err) {
        console.error('Error cargando tareas del usuario:', err);
    }
}

// RF-03: Editar tarea — abre el modal con los datos actuales de la tarea
// El usuario puede cambiar el estado y agregar o editar el comentario
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
            if (indice !== -1) tareasRegistradas[indice] = tareaActualizada;

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

// RF-04: Eliminar tarea del modo usuario
export async function manejarEliminacionTarea(tarea) {
    const confirmado = await mostrarConfirmacion(
        `Eliminar la tarea "${tarea.title}"?`,
        'Eliminar'
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

// Delegación de eventos en la tabla del modo usuario
function manejarClicEnTabla(event) {
    const botonAccion = event.target.closest('[data-action]');
    if (!botonAccion) return;

    const tareaId = botonAccion.dataset.id;
    const accion  = botonAccion.dataset.action;
    const tarea   = tareasRegistradas.find(t => t.id.toString() === tareaId.toString());
    if (!tarea) return;

    if (accion === 'edit')   manejarEdicionTarea(tarea);
    if (accion === 'delete') manejarEliminacionTarea(tarea);
}

// Registro de todos los event listeners de la aplicación
export function registrarEventListeners() {

    // Modo usuario: busqueda de usuario por documento
    document.getElementById('searchUserForm')
        .addEventListener('submit', manejarBusquedaUsuario);
    document.getElementById('userDocument')
        .addEventListener('input', function() {
            limpiarError(
                document.getElementById('userDocumentError'),
                document.getElementById('userDocument')
            );
        });

    // Tabla de tareas del modo usuario — delegación de eventos en el tbody
    document.getElementById('tasksTableBody')
        .addEventListener('click', manejarClicEnTabla);

    // Navegación entre modos (inicio, usuario, admin)
    registrarEventosNavegacion();
}