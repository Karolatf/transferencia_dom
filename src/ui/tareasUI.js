// MÓDULO: ui/tareasUI.js
// CAPA:   UI

// Responsabilidad única: controlar lo que el usuario ve en la vista USUARIO.
// Muestra, oculta y actualiza secciones; construye filas de tabla;
// gestiona el modal de edición.
//
// REGLAS:
//   SI puede leer y escribir en el DOM
//   SI puede importar de utils/
//   NO puede importar de api/ ni de services/

import { limpiarError } from '../utils/validaciones.js';

// ── REFERENCIAS AL DOM ────────────────────────────────────────────────────────

const seccionDatosUsuario = document.getElementById('userDataSection');
const spanIdUsuario        = document.getElementById('userId');
const spanNombreUsuario    = document.getElementById('userName');
const spanEmailUsuario     = document.getElementById('userEmail');

const seccionTareas    = document.getElementById('tasksSection');
const contadorEl       = document.getElementById('tasksCount');
const cuerpoDeLaTabla  = document.getElementById('tasksTableBody');
const mensajeVacio     = document.getElementById('tasksEmptyState');

// ── VISIBILIDAD ───────────────────────────────────────────────────────────────

export function mostrarDatosUsuario(usuario) {
    seccionDatosUsuario.classList.remove('hidden');
    spanIdUsuario.textContent     = usuario.documento || usuario.id;
    spanNombreUsuario.textContent = usuario.name;
    spanEmailUsuario.textContent  = usuario.email;
}

export function ocultarDatosUsuario() {
    seccionDatosUsuario.classList.add('hidden');
    spanIdUsuario.textContent     = '';
    spanNombreUsuario.textContent = '';
    spanEmailUsuario.textContent  = '';
}

export function mostrarSeccionTareas()  { seccionTareas.classList.remove('hidden'); }
export function ocultarSeccionTareas()  { seccionTareas.classList.add('hidden'); }
export function mostrarEstadoVacio()    { mensajeVacio.classList.remove('hidden'); }
export function ocultarEstadoVacio()    { mensajeVacio.classList.add('hidden'); }

// ── CONTADOR ──────────────────────────────────────────────────────────────────

export function actualizarContadorTareas(cantidad) {
    contadorEl.textContent = cantidad === 1 ? `${cantidad} tarea` : `${cantidad} tareas`;
}

// ── FORMATO ───────────────────────────────────────────────────────────────────

export function formatearEstadoTarea(estado) {
    const mapa = { pendiente: 'Pendiente', en_progreso: 'En Progreso', completada: 'Completada' };
    return mapa[estado] || estado;
}

// ── CONSTRUCCIÓN DE FILA ──────────────────────────────────────────────────────

// Crea un TR completo con columnas: #, Título, Descripción, Estado, Comentario, Acciones
// Los botones llevan data-id y data-action para la delegación en tareasService.js
export function crearFilaTarea(tarea, indice) {
    const fila = document.createElement('tr');
    fila.dataset.id = tarea.id;

    // # correlativo
    const celdaNum = document.createElement('td');
    celdaNum.textContent = indice + 1;

    // Título
    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    // Descripción
    const celdaDesc = document.createElement('td');
    celdaDesc.textContent = tarea.description || '—';

    // Estado (badge visual)
    const celdaEstado = document.createElement('td');
    const badge = document.createElement('span');
    badge.classList.add('status-badge', `status-${tarea.status}`);
    badge.textContent = formatearEstadoTarea(tarea.status);
    celdaEstado.appendChild(badge);

    // Comentario
    const celdaComentario = document.createElement('td');
    celdaComentario.textContent = tarea.comment || '—';

    // Acciones: solo Eliminar (Editar está en el panel Admin)
    const celdaAcciones = document.createElement('td');
    const contenedor = document.createElement('div');
    contenedor.classList.add('task-actions');

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent    = '🗑️ Eliminar';
    btnEliminar.classList.add('btn-action', 'btn-action--delete');
    btnEliminar.type           = 'button';
    btnEliminar.dataset.id     = tarea.id;
    btnEliminar.dataset.action = 'delete';

    contenedor.appendChild(btnEliminar);
    celdaAcciones.appendChild(contenedor);

    fila.appendChild(celdaNum);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDesc);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaComentario);
    fila.appendChild(celdaAcciones);

    return fila;
}

export function agregarTareaATabla(tarea, contador) {
    cuerpoDeLaTabla.appendChild(crearFilaTarea(tarea, contador));
    actualizarContadorTareas(contador + 1);
    ocultarEstadoVacio();
    mostrarSeccionTareas();
}

// ── ACTUALIZAR FILA EXISTENTE ─────────────────────────────────────────────────

export function actualizarFilaTarea(tareaActualizada) {
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaActualizada.id}"]`);
    if (!fila) { console.warn(`Fila ${tareaActualizada.id} no encontrada`); return; }

    fila.cells[1].textContent = tareaActualizada.title;
    fila.cells[2].textContent = tareaActualizada.description || '—';

    const badge = fila.cells[3].querySelector('.status-badge');
    badge.classList.remove('status-pendiente', 'status-en_progreso', 'status-completada');
    badge.classList.add(`status-${tareaActualizada.status}`);
    badge.textContent = formatearEstadoTarea(tareaActualizada.status);

    fila.cells[4].textContent = tareaActualizada.comment || '—';
}

// ── ELIMINAR FILA ─────────────────────────────────────────────────────────────

export function eliminarFilaTarea(tareaId) {
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaId}"]`);
    if (!fila) { console.warn(`Fila ${tareaId} no encontrada para eliminar`); return; }
    fila.remove();

    const restantes = cuerpoDeLaTabla.querySelectorAll('tr').length;
    actualizarContadorTareas(restantes);
    if (restantes === 0) mostrarEstadoVacio();
}

// ── MODAL DE EDICIÓN ──────────────────────────────────────────────────────────

export function mostrarModalEdicion(tarea) {
    document.getElementById('editTaskId').value          = tarea.id;
    document.getElementById('editTaskTitle').value       = tarea.title;
    document.getElementById('editTaskDescription').value = tarea.description || '';
    document.getElementById('editTaskStatus').value      = tarea.status;

    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = tarea.comment || '';

    document.getElementById('editModal').classList.remove('hidden');
}

export function ocultarModalEdicion() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editTaskTitle').value       = '';
    document.getElementById('editTaskDescription').value = '';
    document.getElementById('editTaskStatus').value      = '';
    document.getElementById('editTaskId').value          = '';

    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = '';
}