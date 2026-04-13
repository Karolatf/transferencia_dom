// MÓDULO: ui/modoUI.js
// CAPA:   UI

// Responsabilidad: gestionar qué vista está activa (inicio, usuario, admin),
// el modal dinámico de usuario del panel admin, filtros y ordenamiento.
//
// Toda petición HTTP pasa por los módulos de api/.
// Toda notificación pasa por notificaciones.js.

import {
    obtenerTodasLasTareas,
    obtenerTareasDeUsuario,
    eliminarTarea,
    registrarTarea,
    obtenerDashboard,
    actualizarTarea,
} from '../api/tareasApi.js';

import {
    obtenerTodosLosUsuarios,
    crearUsuario,
    eliminarUsuario,
    // Se importa actualizarUsuario para el nuevo flujo de edición de usuario
    actualizarUsuario,
} from '../api/usuariosApi.js';

import {
    mostrarNotificacion,
    mostrarConfirmacion,
} from '../utils/notificaciones.js';

import { filtrarTareas }  from '../utils/filtros.js';
import {
    mostrarModalEdicion,
    ocultarModalEdicion,
} from './tareasUI.js';
import { ordenarTareas }  from '../utils/ordenamiento.js';
import { exportarTareasJSON } from '../utils/exportacion.js';
import { validarFormularioUsuario } from '../utils/validaciones.js';

// ── REFERENCIAS A VISTAS ──────────────────────────────────────────────────────

const pantallaInicio = document.getElementById('pantallaInicio');
const vistaUsuario   = document.getElementById('vistaUsuario');
const vistaAdmin     = document.getElementById('vistaAdmin');

function ocultarTodo() {
    pantallaInicio.classList.add('hidden');
    vistaUsuario.classList.add('hidden');
    vistaAdmin.classList.add('hidden');
}

export function activarModoInicio() {
    ocultarTodo();
    pantallaInicio.classList.remove('hidden');
    document.body.dataset.modo = 'inicio';
}

export function activarModoUsuario() {
    ocultarTodo();
    vistaUsuario.classList.remove('hidden');
    document.body.dataset.modo = 'usuario';
}

export function activarModoAdmin() {
    ocultarTodo();
    vistaAdmin.classList.remove('hidden');
    document.body.dataset.modo = 'admin';
    // Carga inicial en paralelo: no bloqueamos la UI
    cargarDashboard();
    cargarTablaUsuarios();
    cargarTodasLasTareas();
    // Se inicializa el dropdown de usuarios de la card "Crear Tarea"
    // Se llama aquí para que los checkboxes carguen cuando el admin entra al panel
    inicializarDropdownUsuarios();
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

async function cargarDashboard() {
    const data = await obtenerDashboard();
    if (!data) return;

    const el = {
        total:      document.getElementById('dashboardTotal'),
        pendiente:  document.getElementById('dashboardPendiente'),
        progreso:   document.getElementById('dashboardProgreso'),
        completada: document.getElementById('dashboardCompletada'),
    };

    if (el.total)      el.total.textContent      = data.total;
    if (el.pendiente)  el.pendiente.textContent   = data.pendientes;
    if (el.progreso)   el.progreso.textContent    = data.enProgreso;
    if (el.completada) el.completada.textContent  = data.completadas;
}

// ── TABLA USUARIOS ────────────────────────────────────────────────────────────

export async function cargarTablaUsuarios() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const usuarios = await obtenerTodosLosUsuarios();

    if (!usuarios) {
        await mostrarNotificacion('Error al cargar los usuarios', 'error');
        return;
    }
    // Dentro de cargarTablaUsuarios, después de obtener los usuarios y antes de vaciar el tbody
    // Se actualiza el contador de usuarios con el mismo formato que el contador de tareas
    const contadorUsuariosEl = document.getElementById('adminUsersCount');
    if (contadorUsuariosEl) {
        const cantidad = usuarios ? usuarios.length : 0;
        // Texto con singular o plural según la cantidad
        contadorUsuariosEl.textContent = `${cantidad} ${cantidad === 1 ? 'usuario' : 'usuarios'}`;
    }

    // Vaciar tbody con removeChild para respetar la regla del proyecto
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (usuarios.length === 0) {
        const fila = document.createElement('tr');
        const td   = document.createElement('td');
        td.colSpan        = 5;
        td.textContent    = 'No hay usuarios registrados';
        td.style.textAlign = 'center';
        td.style.color    = '#9ca3af';
        fila.appendChild(td);
        tbody.appendChild(fila);
        return;
    }

    usuarios.forEach(function(usuario, indice) {
        tbody.appendChild(crearFilaUsuario(usuario, indice));
    });
}

// Construye una fila de la tabla de usuarios del panel admin
// Ahora incluye tres botones: Ver/Asignar, Editar y Eliminar
// Parámetros:
//   usuario — objeto del usuario a representar
//   indice  — posición en la lista (para el # correlativo)
function crearFilaUsuario(usuario, indice) {
    const fila = document.createElement('tr');

    const celdaNum = document.createElement('td');
    celdaNum.textContent = indice + 1;

    const celdaDoc = document.createElement('td');
    celdaDoc.textContent = usuario.documento || usuario.id;

    const celdaNombre = document.createElement('td');
    celdaNombre.textContent = usuario.name;

    const celdaEmail = document.createElement('td');
    celdaEmail.textContent = usuario.email;

    const celdaAcciones = document.createElement('td');
    const contenedor    = document.createElement('div');
    contenedor.classList.add('task-actions');

    // Botón Ver / Asignar — abre el modal de tareas del usuario
    const btnVer = document.createElement('button');
    btnVer.textContent = 'Ver / Asignar';
    btnVer.classList.add('btn-action', 'btn-action--edit');
    btnVer.type = 'button';
    btnVer.addEventListener('click', function() { abrirModalUsuario(usuario); });

    // NUEVO: Botón Editar — abre el modal de edición de datos del usuario
    // Sigue el mismo patrón de los demás botones de acción del proyecto
    const btnEditar = document.createElement('button');
    btnEditar.textContent = '✏️ Editar';
    btnEditar.classList.add('btn-action', 'btn-action--edit');
    btnEditar.type = 'button';
    btnEditar.addEventListener('click', function() { abrirModalEditarUsuario(usuario); });

    // Botón Eliminar — pide confirmación antes de eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = '🗑️ Eliminar';
    btnEliminar.classList.add('btn-action', 'btn-action--delete');
    btnEliminar.type = 'button';
    btnEliminar.addEventListener('click', async function() {
        const confirmado = await mostrarConfirmacion(
            '¿Eliminar usuario?',
            `"${usuario.name}" será eliminado permanentemente.`,
            'Sí, eliminar'
        );
        if (!confirmado) return;

        const eliminado = await eliminarUsuario(usuario.id);
        if (eliminado) {
            await mostrarNotificacion('Usuario eliminado correctamente', 'exito');
            cargarTablaUsuarios();
            cargarTodasLasTareas();
            cargarDashboard();
        } else {
            await mostrarNotificacion('Error al eliminar el usuario', 'error');
        }
    });

    // Se agregan los tres botones al contenedor de acciones
    contenedor.appendChild(btnVer);
    contenedor.appendChild(btnEditar);
    contenedor.appendChild(btnEliminar);
    celdaAcciones.appendChild(contenedor);

    fila.appendChild(celdaNum);
    fila.appendChild(celdaDoc);
    fila.appendChild(celdaNombre);
    fila.appendChild(celdaEmail);
    fila.appendChild(celdaAcciones);

    return fila;
}

// ── MODAL EDITAR USUARIO ──────────────────────────────────────────────────────

// Abre un modal dinámico para editar los datos de un usuario (nombre, correo, documento)
// Sigue la misma lógica de construcción que abrirModalUsuario: createElement + appendChild
// Parámetro: usuario — objeto con los datos actuales del usuario a editar
async function abrirModalEditarUsuario(usuario) {

    // Se cierra cualquier modal de edición de usuario que ya esté abierto
    cerrarModalEditarUsuarioExistente();

    // Overlay oscuro que cubre toda la pantalla
    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay';
    overlay.id        = 'modalEditarUsuarioOverlay';

    // Contenedor del modal
    const modal = document.createElement('div');
    modal.className = 'modal-usuario';

    // ── Header del modal ──────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'modal-usuario__header';

    const infoTexto = document.createElement('div');

    // Título con el nombre actual del usuario
    const titulo = document.createElement('h2');
    titulo.className   = 'modal-usuario__titulo';
    titulo.textContent = `Editar: ${usuario.name}`;

    const subtitulo = document.createElement('p');
    subtitulo.className   = 'modal-usuario__subtitulo';
    subtitulo.textContent = `Documento actual: ${usuario.documento || usuario.id}`;

    infoTexto.appendChild(titulo);
    infoTexto.appendChild(subtitulo);

    // Botón de cierre en la esquina del header
    const btnCerrar = document.createElement('button');
    btnCerrar.className   = 'modal-usuario__cerrar';
    btnCerrar.type        = 'button';
    btnCerrar.textContent = '✕';
    btnCerrar.addEventListener('click', cerrarModalEditarUsuarioExistente);

    header.appendChild(infoTexto);
    header.appendChild(btnCerrar);
    modal.appendChild(header);

    // ── Cuerpo: formulario de edición ─────────────────────────────────────────
    const cuerpo = document.createElement('div');
    cuerpo.className = 'modal-usuario__asignar';

    const formEditar = document.createElement('form');
    formEditar.className = 'form';

    // GRUPO DOCUMENTO
    const grupoDoc = document.createElement('div');
    grupoDoc.className = 'form__group';
    const labelDoc = document.createElement('label');
    labelDoc.setAttribute('for', 'editar-usuario-documento');
    labelDoc.className   = 'form__label';
    labelDoc.textContent = 'Número de documento';
    const inputDoc = document.createElement('input');
    inputDoc.type        = 'text';
    inputDoc.id          = 'editar-usuario-documento';
    inputDoc.className   = 'form__input';
    inputDoc.placeholder = 'Ej: 1097497124';
    // Se pre-rellena con el valor actual del usuario
    inputDoc.value       = usuario.documento || '';
    grupoDoc.appendChild(labelDoc);
    grupoDoc.appendChild(inputDoc);

    // GRUPO NOMBRE
    const grupoNombre = document.createElement('div');
    grupoNombre.className = 'form__group';
    const labelNombre = document.createElement('label');
    labelNombre.setAttribute('for', 'editar-usuario-nombre');
    labelNombre.className   = 'form__label';
    labelNombre.textContent = 'Nombre completo';
    const inputNombre = document.createElement('input');
    inputNombre.type        = 'text';
    inputNombre.id          = 'editar-usuario-nombre';
    inputNombre.className   = 'form__input';
    inputNombre.placeholder = 'Ej: Karol Torres';
    // Se pre-rellena con el valor actual del usuario
    inputNombre.value       = usuario.name || '';
    grupoNombre.appendChild(labelNombre);
    grupoNombre.appendChild(inputNombre);

    // GRUPO EMAIL
    const grupoEmail = document.createElement('div');
    grupoEmail.className = 'form__group';
    const labelEmail = document.createElement('label');
    labelEmail.setAttribute('for', 'editar-usuario-email');
    labelEmail.className   = 'form__label';
    labelEmail.textContent = 'Correo electrónico';
    const inputEmail = document.createElement('input');
    inputEmail.type        = 'email';
    inputEmail.id          = 'editar-usuario-email';
    inputEmail.className   = 'form__input';
    inputEmail.placeholder = 'Ej: usuario@correo.com';
    // Se pre-rellena con el valor actual del usuario
    inputEmail.value       = usuario.email || '';
    grupoEmail.appendChild(labelEmail);
    grupoEmail.appendChild(inputEmail);

    // Botón de submit del formulario de edición
    const btnGuardar = document.createElement('button');
    btnGuardar.type      = 'submit';
    btnGuardar.className = 'btn btn--admin-primary';
    const spanBtn = document.createElement('span');
    spanBtn.className   = 'btn__text';
    spanBtn.textContent = 'Guardar Cambios';
    btnGuardar.appendChild(spanBtn);

    formEditar.appendChild(grupoDoc);
    formEditar.appendChild(grupoNombre);
    formEditar.appendChild(grupoEmail);
    formEditar.appendChild(btnGuardar);

    // Listener del submit: llama a la API para actualizar y recarga la tabla
    formEditar.addEventListener('submit', async function(event) {
        event.preventDefault();

        const documento = inputDoc.value.trim();
        const nombre    = inputNombre.value.trim();
        const email     = inputEmail.value.trim();

        // Se valida que ningún campo esté vacío antes de enviar al servidor
        if (!documento || !nombre || !email) {
            await mostrarNotificacion('Todos los campos son obligatorios', 'advertencia');
            return;
        }

        // Se llama a la capa API con el id del usuario y los datos nuevos
        const usuarioActualizado = await actualizarUsuario(usuario.id, {
            documento,
            name:  nombre,
            email,
        });

        if (usuarioActualizado) {
            cerrarModalEditarUsuarioExistente();
            await mostrarNotificacion(`${nombre} fue actualizado correctamente`, 'exito');
            // Se recarga la tabla para reflejar los datos actualizados
            cargarTablaUsuarios();
        } else {
            await mostrarNotificacion('Error al actualizar el usuario', 'error');
        }
    });

    cuerpo.appendChild(formEditar);
    modal.appendChild(cuerpo);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Clic en el overlay oscuro cierra el modal (igual que el modal de asignar)
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) cerrarModalEditarUsuarioExistente();
    });
}

// Cierra y elimina el modal de edición de usuario si existe en el DOM
function cerrarModalEditarUsuarioExistente() {
    const existing = document.getElementById('modalEditarUsuarioOverlay');
    if (existing) existing.remove();
}

// ── DASHBOARD LOCAL ──────────────────────────────────────────────────────────
// Recalcula los contadores del dashboard usando todasLasTareas en memoria,
// sin hacer ninguna petición al servidor. Se usa después de editar o eliminar.
function actualizarDashboardLocal() {
    const el = {
        total:      document.getElementById('dashboardTotal'),
        pendiente:  document.getElementById('dashboardPendiente'),
        progreso:   document.getElementById('dashboardProgreso'),
        completada: document.getElementById('dashboardCompletada'),
    };
    if (!el.total) return;

    const pendientes  = todasLasTareas.filter(t => t.status === 'pendiente').length;
    const enProgreso  = todasLasTareas.filter(t => t.status === 'en_progreso').length;
    const completadas = todasLasTareas.filter(t => t.status === 'completada').length;

    el.total.textContent      = todasLasTareas.length;
    el.pendiente.textContent  = pendientes;
    el.progreso.textContent   = enProgreso;
    el.completada.textContent = completadas;
}

// ── TABLA TAREAS ADMIN ────────────────────────────────────────────────────────

// Fuente de verdad del admin: todas las tareas sin filtrar
let todasLasTareas = [];

export async function cargarTodasLasTareas() {
    const tareas = await obtenerTodasLasTareas();
    todasLasTareas = tareas || [];
    aplicarFiltrosAdmin();
}

export function aplicarFiltrosAdmin() {
    const tbody         = document.getElementById('adminTasksTableBody');
    const contadorEl    = document.getElementById('adminTasksCount');
    const filtroEstado  = document.getElementById('adminFiltroEstado');
    const filtroUsuario = document.getElementById('adminFiltroUsuario');
    const ordenSelect   = document.getElementById('adminOrdenSelect');

    if (!tbody) return;

    const estado  = filtroEstado  ? filtroEstado.value  : '';
    const termino = filtroUsuario ? filtroUsuario.value  : '';
    const orden   = ordenSelect   ? ordenSelect.value    : '';

    let resultado = filtrarTareas(todasLasTareas, estado, termino);
    resultado     = ordenarTareas(resultado, orden);

    // Vaciar tbody con removeChild para respetar la regla del proyecto
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (contadorEl) {
        contadorEl.textContent = `${resultado.length} ${resultado.length === 1 ? 'tarea' : 'tareas'}`;
    }

    if (resultado.length === 0) {
        const fila = document.createElement('tr');
        const td   = document.createElement('td');
        td.colSpan        = 6;
        td.textContent    = 'No hay tareas que coincidan con los filtros';
        td.style.textAlign = 'center';
        td.style.color    = '#9ca3af';
        fila.appendChild(td);
        tbody.appendChild(fila);
        return;
    }

    resultado.forEach(function(tarea, indice) {
        tbody.appendChild(crearFilaTareaAdmin(tarea, indice));
    });
}

function formatearEstado(estado) {
    const mapa = { pendiente: 'Pendiente', en_progreso: 'En Progreso', completada: 'Completada' };
    return mapa[estado] || estado;
}

// Abre el modal de edición compartido para una tarea del panel admin.
// Al guardar, recarga la tabla de tareas y el dashboard.
function manejarEdicionTareaAdmin(tarea) {
    mostrarModalEdicion(tarea);

    const formulario = document.getElementById('editTaskForm');

    async function guardarCambiosAdmin(event) {
        event.preventDefault();

        const tareaId     = document.getElementById('editTaskId').value;
        const titulo      = document.getElementById('editTaskTitle').value.trim();
        const descripcion = document.getElementById('editTaskDescription').value.trim();
        const estado      = document.getElementById('editTaskStatus').value;
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
            // Actualización local: modifica la tarea en memoria y repinta sin fetch
            const idx = todasLasTareas.findIndex(t => t.id.toString() === tareaId.toString());
            if (idx !== -1) {
                todasLasTareas[idx] = {
                    ...todasLasTareas[idx],
                    ...tareaActualizada,
                    comment: comentario,
                };
            }
            ocultarModalEdicion();
            actualizarDashboardLocal();
            aplicarFiltrosAdmin();
            await mostrarNotificacion('Tarea actualizada exitosamente', 'exito');
        } else {
            await mostrarNotificacion('Error al actualizar la tarea', 'error');
        }

        formulario.removeEventListener('submit', guardarCambiosAdmin);
    }

    formulario.addEventListener('submit', guardarCambiosAdmin);
}

function crearFilaTareaAdmin(tarea, indice) {
    const fila = document.createElement('tr');

    const celdaNum = document.createElement('td');
    celdaNum.textContent = indice + 1;

    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    const celdaDesc = document.createElement('td');
    celdaDesc.textContent = tarea.description || '—';

    const celdaEstado = document.createElement('td');
    const badge = document.createElement('span');
    badge.classList.add('status-badge', `status-${tarea.status}`);
    badge.textContent = formatearEstado(tarea.status);
    celdaEstado.appendChild(badge);

    const celdaUsuario = document.createElement('td');
    celdaUsuario.textContent = tarea.assignedUsersDisplay || 'Sin asignar';

    const celdaAcciones = document.createElement('td');
    const contenedor    = document.createElement('div');
    contenedor.classList.add('task-actions');

    // Botón Editar — abre el modal compartido con el modo usuario
    const btnEditar = document.createElement('button');
    btnEditar.textContent = '✏️ Editar';
    btnEditar.classList.add('btn-action', 'btn-action--edit');
    btnEditar.type = 'button';
    btnEditar.addEventListener('click', function() {
        manejarEdicionTareaAdmin(tarea);
    });

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = '🗑️ Eliminar';
    btnEliminar.classList.add('btn-action', 'btn-action--delete');
    btnEliminar.type = 'button';
    btnEliminar.addEventListener('click', async function() {
        const confirmado = await mostrarConfirmacion(
            '¿Eliminar tarea?',
            `"${tarea.title}" será eliminada permanentemente.`,
            'Sí, eliminar'
        );
        if (!confirmado) return;

        const eliminada = await eliminarTarea(tarea.id);
        if (eliminada) {
            // Eliminación local: quita la tarea de memoria y repinta sin fetch
            todasLasTareas = todasLasTareas.filter(t => t.id !== tarea.id);
            actualizarDashboardLocal();
            aplicarFiltrosAdmin();
            await mostrarNotificacion('Tarea eliminada correctamente', 'exito');
        } else {
            await mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
    });

    contenedor.appendChild(btnEditar);
    contenedor.appendChild(btnEliminar);
    celdaAcciones.appendChild(contenedor);

    fila.appendChild(celdaNum);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDesc);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaUsuario);
    fila.appendChild(celdaAcciones);

    return fila;
}

// ── MODAL USUARIO (admin) ─────────────────────────────────────────────────────

export async function abrirModalUsuario(usuario) {
    cerrarModalUsuarioExistente();

    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay';
    overlay.id        = 'modalUsuarioOverlay';

    const modal = document.createElement('div');
    modal.className = 'modal-usuario';

    // Header
    const header = document.createElement('div');
    header.className = 'modal-usuario__header';

    const infoTexto = document.createElement('div');
    const titulo = document.createElement('h2');
    titulo.className   = 'modal-usuario__titulo';
    titulo.textContent = usuario.name;
    const subtitulo = document.createElement('p');
    subtitulo.className   = 'modal-usuario__subtitulo';
    subtitulo.textContent = `Documento: ${usuario.documento || usuario.id}`;
    infoTexto.appendChild(titulo);
    infoTexto.appendChild(subtitulo);

    const btnCerrar = document.createElement('button');
    btnCerrar.className   = 'modal-usuario__cerrar';
    btnCerrar.type        = 'button';
    btnCerrar.textContent = '✕';
    btnCerrar.addEventListener('click', cerrarModalUsuarioExistente);

    header.appendChild(infoTexto);
    header.appendChild(btnCerrar);
    modal.appendChild(header);

    // Cuerpo: dos columnas
    const cuerpo = document.createElement('div');
    cuerpo.className = 'modal-usuario__cuerpo';

    // ── Columna izquierda: tareas actuales ────────────────────────────────────
    const seccionTareas = document.createElement('div');
    seccionTareas.className = 'modal-usuario__tareas';

    const tituloTareas = document.createElement('h3');
    tituloTareas.className   = 'modal-usuario__seccion-titulo';
    tituloTareas.textContent = 'Tareas asignadas';
    seccionTareas.appendChild(tituloTareas);

    const tareas = await obtenerTareasDeUsuario(usuario.id);

    if (!tareas || tareas.length === 0) {
        const p = document.createElement('p');
        p.className   = 'modal-vacio';
        p.textContent = 'Este usuario no tiene tareas asignadas.';
        seccionTareas.appendChild(p);
    } else {
        tareas.forEach(function(tarea) {
            const item = document.createElement('div');
            item.className = 'modal-tarea-item';

            const texto = document.createElement('span');
            texto.textContent = tarea.title;

            const badge = document.createElement('span');
            badge.classList.add('status-badge', `status-${tarea.status}`);
            badge.textContent = formatearEstado(tarea.status);

            item.appendChild(texto);
            item.appendChild(badge);
            seccionTareas.appendChild(item);
        });
    }

    cuerpo.appendChild(seccionTareas);

    // ── Columna derecha: asignar nueva tarea ──────────────────────────────────
    const seccionAsignar = document.createElement('div');
    seccionAsignar.className = 'modal-usuario__asignar';

    const tituloAsignar = document.createElement('h3');
    tituloAsignar.className   = 'modal-usuario__seccion-titulo';
    tituloAsignar.textContent = 'Asignar nueva tarea';
    seccionAsignar.appendChild(tituloAsignar);

    const formAsignar = document.createElement('form');
    formAsignar.className = 'form';

    // Campo título
    const grupoTitulo = document.createElement('div');
    grupoTitulo.className = 'form__group';
    const labelTitulo = document.createElement('label');
    labelTitulo.setAttribute('for', 'modal-tarea-titulo');
    labelTitulo.className   = 'form__label';
    labelTitulo.textContent = 'Título';
    const inputTitulo = document.createElement('input');
    inputTitulo.type        = 'text';
    inputTitulo.id          = 'modal-tarea-titulo';
    inputTitulo.className   = 'form__input';
    inputTitulo.placeholder = 'Título de la tarea';
    grupoTitulo.appendChild(labelTitulo);
    grupoTitulo.appendChild(inputTitulo);

    // Campo descripción
    const grupoDesc = document.createElement('div');
    grupoDesc.className = 'form__group';
    const labelDesc = document.createElement('label');
    labelDesc.setAttribute('for', 'modal-tarea-desc');
    labelDesc.className   = 'form__label';
    labelDesc.textContent = 'Descripción ';
    const spanOpcional = document.createElement('span');
    spanOpcional.className   = 'form__label--opcional';
    spanOpcional.textContent = '(opcional)';
    labelDesc.appendChild(spanOpcional);
    const textareaDesc = document.createElement('textarea');
    textareaDesc.id          = 'modal-tarea-desc';
    textareaDesc.className   = 'form__input form__textarea';
    textareaDesc.rows        = 2;
    textareaDesc.placeholder = 'Descripción…';
    grupoDesc.appendChild(labelDesc);
    grupoDesc.appendChild(textareaDesc);

    // Campo estado
    const grupoEstado = document.createElement('div');
    grupoEstado.className = 'form__group';
    const labelEstado = document.createElement('label');
    labelEstado.setAttribute('for', 'modal-tarea-estado');
    labelEstado.className   = 'form__label';
    labelEstado.textContent = 'Estado';
    const selectEstado = document.createElement('select');
    selectEstado.id        = 'modal-tarea-estado';
    selectEstado.className = 'form__input';

    const optDefault = document.createElement('option');
    optDefault.value = ''; optDefault.disabled = true; optDefault.selected = true;
    optDefault.textContent = 'Selecciona un estado';

    [['pendiente','Pendiente'],['en_progreso','En Progreso'],['completada','Completada']].forEach(([v, t]) => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = t;
        selectEstado.appendChild(opt);
    });

    selectEstado.insertBefore(optDefault, selectEstado.firstChild);
    grupoEstado.appendChild(labelEstado);
    grupoEstado.appendChild(selectEstado);

    // Botón
    const btnAsignar = document.createElement('button');
    btnAsignar.type      = 'submit';
    btnAsignar.className = 'btn btn--admin-primary';
    const spanBtn = document.createElement('span');
    spanBtn.className   = 'btn__text';
    spanBtn.textContent = 'Asignar Tarea';
    btnAsignar.appendChild(spanBtn);

    formAsignar.appendChild(grupoTitulo);
    formAsignar.appendChild(grupoDesc);
    formAsignar.appendChild(grupoEstado);
    formAsignar.appendChild(btnAsignar);

    formAsignar.addEventListener('submit', async function(event) {
        event.preventDefault();

        const titulo = inputTitulo.value.trim();
        const desc   = textareaDesc.value.trim();
        const estado = selectEstado.value;

        if (!titulo || !estado) {
            await mostrarNotificacion('El título y el estado son obligatorios', 'advertencia');
            return;
        }

        const datosTarea = {
            title:         titulo,
            description:   desc,
            status:        estado,
            assignedUsers: [parseInt(usuario.id, 10) || usuario.id],
        };

        const tareaCreada = await registrarTarea(datosTarea);

        if (tareaCreada) {
            // CORRECCIÓN: se cierra el modal automáticamente al crear la tarea.
            // Antes se rearía el modal llamando de nuevo a abrirModalUsuario(),
            // lo que provocaba que el usuario tuviera que cerrarlo manualmente.
            // Ahora se cierra solo y se recargan los datos en segundo plano.
            cerrarModalUsuarioExistente();
            await mostrarNotificacion(`Tarea "${titulo}" asignada correctamente`, 'exito');
            cargarTodasLasTareas();
            cargarDashboard();
        } else {
            await mostrarNotificacion('Error al asignar la tarea', 'error');
        }
    });

    seccionAsignar.appendChild(formAsignar);
    cuerpo.appendChild(seccionAsignar);
    modal.appendChild(cuerpo);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) cerrarModalUsuarioExistente();
    });
}

function cerrarModalUsuarioExistente() {
    const existing = document.getElementById('modalUsuarioOverlay');
    if (existing) existing.remove();
}

// ── CARDS CONTRAÍBLES ─────────────────────────────────────────────────────────
// Registra el comportamiento de toggle (contraer/desplegar) en las cards del panel admin.
// Cada card tiene un encabezado con clase admin-card__cabecera--toggle y un cuerpo
// con clase admin-card__cuerpo. Al hacer clic en el encabezado (o en la flecha):
//   - Se alterna la clase "oculto" en el cuerpo para ocultarlo o mostrarlo
//   - Se alterna la clase "contraido" en la flecha para rotarla
//   - Se alterna la clase "sin-borde" en el encabezado para quitar el separador
function registrarCardsContraibles() {
    // Pares de [id del encabezado, id del cuerpo] de cada card contraíble
    const pares = [
        ['toggleCrearUsuario', 'cuerpoCrearUsuario'],
        ['toggleUsuarios',     'cuerpoUsuarios'],
        ['toggleTareas',       'cuerpoTareas'],
        // La card de crear tareas se agrega aquí cuando Sebastián la cree
        ['toggleCrearTareas',  'cuerpoCrearTareas'],
    ];

    pares.forEach(function(par) {
        const encabezadoId = par[0];
        const cuerpoId     = par[1];

        const encabezado = document.getElementById(encabezadoId);
        const cuerpo     = document.getElementById(cuerpoId);

        // Si alguno de los dos no existe en el DOM se salta este par
        if (!encabezado || !cuerpo) return;

        const botonFlecha = encabezado.querySelector('.btn-toggle-card');

        // Listener en el encabezado completo para que el clic en cualquier parte lo active
        encabezado.addEventListener('click', function() {
            // Se alterna la visibilidad del cuerpo de la card
            const estaOculto = cuerpo.classList.toggle('oculto');

            // Si está oculto la flecha apunta hacia arriba (clase contraido)
            // Si está visible la flecha apunta hacia abajo (sin clase)
            if (botonFlecha) botonFlecha.classList.toggle('contraido', estaOculto);

            // Se quita el borde inferior del encabezado cuando la card está contraída
            encabezado.classList.toggle('sin-borde', estaOculto);
        });
    });
}

// ── CARD CREAR TAREAS — DROPDOWN DE USUARIOS ──────────────────────────────────
// Inicializa el dropdown de checkboxes de usuarios en la card "Crear Tarea".
// Carga todos los usuarios del sistema desde la API y crea un checkbox por cada uno.
// Parámetros: ninguno — lee y escribe en los elementos del DOM directamente.
async function inicializarDropdownUsuarios() {
    const btn    = document.getElementById('usuariosDropdownBtn');
    const panel  = document.getElementById('usuariosDropdownPanel');
    const texto  = document.getElementById('usuariosDropdownTexto');

    // Si alguno de los elementos no existe no se hace nada (evita errores fuera del admin)
    if (!btn || !panel || !texto) return;

    // Se cargan los usuarios del sistema para poblar el dropdown
    const usuarios = await obtenerTodosLosUsuarios();

    // Se vacía el panel antes de agregar los checkboxes
    while (panel.firstChild) panel.removeChild(panel.firstChild);

    if (!usuarios || usuarios.length === 0) {
        // Si no hay usuarios se muestra un mensaje vacío en el panel
        const vacio = document.createElement('p');
        vacio.className   = 'usuarios-dropdown__vacio';
        vacio.textContent = 'No hay usuarios registrados';
        panel.appendChild(vacio);
    } else {
        // Se crea un checkbox por cada usuario disponible en el sistema
        usuarios.forEach(function(usuario) {
            // Contenedor de la opción: fila con checkbox + nombre
            const opcion = document.createElement('label');
            opcion.className = 'usuarios-dropdown__opcion';

            // Checkbox con el id del usuario como value para enviarlo al backend
            const checkbox = document.createElement('input');
            checkbox.type  = 'checkbox';
            checkbox.value = usuario.id;
            // Al cambiar cualquier checkbox se actualiza el texto del botón
            checkbox.addEventListener('change', function() {
                actualizarTextoDropdown(btn, texto, panel);
            });

            // Texto con el nombre del usuario
            const spanNombre = document.createElement('span');
            spanNombre.textContent = `${usuario.name} (Doc: ${usuario.documento})`;

            opcion.appendChild(checkbox);
            opcion.appendChild(spanNombre);
            panel.appendChild(opcion);
        });
    }

    // Listener del botón: abre o cierra el panel al hacer clic
    btn.addEventListener('click', function(event) {
        // Se evita que el clic llegue al documento y cierre el panel inmediatamente
        event.stopPropagation();

        const estaAbierto = !panel.classList.contains('hidden');

        if (estaAbierto) {
            // Si ya estaba abierto, se cierra
            panel.classList.add('hidden');
            btn.classList.remove('abierto');
            btn.setAttribute('aria-expanded', 'false');
        } else {
            // Si estaba cerrado, se abre
            panel.classList.remove('hidden');
            btn.classList.add('abierto');
            btn.setAttribute('aria-expanded', 'true');
        }
    });

    // Clic en cualquier lugar fuera del dropdown cierra el panel
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('usuariosDropdown');
        if (dropdown && !dropdown.contains(event.target)) {
            panel.classList.add('hidden');
            btn.classList.remove('abierto');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

// Actualiza el texto del botón del dropdown según los checkboxes seleccionados.
// Si ninguno está seleccionado muestra el placeholder.
// Si hay seleccionados muestra los nombres separados por coma (máximo 2 + "y N más").
// Parámetros:
//   btn   — el elemento button del dropdown
//   texto — el span que muestra el texto dentro del botón
//   panel — el div con los checkboxes para leer cuáles están marcados
function actualizarTextoDropdown(btn, texto, panel) {
    // Se buscan todos los checkboxes marcados dentro del panel
    const seleccionados = panel.querySelectorAll('input[type="checkbox"]:checked');

    if (seleccionados.length === 0) {
        // Sin selección se muestra el placeholder original
        texto.textContent = 'Seleccionar usuarios...';
        return;
    }

    // Se recogen los nombres de los labels de los checkboxes seleccionados
    const nombres = Array.from(seleccionados).map(function(cb) {
        // El span con el nombre es el siguiente hermano del checkbox dentro del label
        const label = cb.closest('.usuarios-dropdown__opcion');
        const span  = label ? label.querySelector('span') : null;
        // Solo se toma el nombre (antes del paréntesis del documento)
        return span ? span.textContent.split(' (')[0] : '';
    }).filter(Boolean);

    // Si hay 2 o menos nombres se muestran todos
    // Si hay más se muestran los primeros 2 y "y N más"
    if (nombres.length <= 2) {
        texto.textContent = nombres.join(', ');
    } else {
        texto.textContent = `${nombres.slice(0, 2).join(', ')} y ${nombres.length - 2} más`;
    }
}

// Retorna un arreglo con los IDs numéricos de los usuarios seleccionados en el dropdown.
// Se usa al hacer submit del formulario de crear tarea.
function obtenerIdsSeleccionados() {
    const panel = document.getElementById('usuariosDropdownPanel');
    if (!panel) return [];

    // Se buscan todos los checkboxes marcados y se mapean a número entero
    const checkboxes = panel.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(function(cb) {
        return parseInt(cb.value, 10);
    });
}

// ── REGISTRO DE EVENTOS DE NAVEGACIÓN ────────────────────────────────────────

export function registrarEventosNavegacion() {
    
    // Se registra el comportamiento de toggle en las cards contraíbles del panel admin
    registrarCardsContraibles();

    // Botones de la pantalla de inicio
    document.getElementById('btnAccesoUsuario').addEventListener('click', activarModoUsuario);
    document.getElementById('btnAccesoAdmin').addEventListener('click', activarModoAdmin);

    // Botones volver
    document.getElementById('btnVolverUsuario').addEventListener('click', activarModoInicio);
    document.getElementById('btnVolverAdmin').addEventListener('click', activarModoInicio);

    // Filtros de la tabla admin
    const btnAplicar = document.getElementById('adminBtnAplicarFiltros');
    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltrosAdmin);

    const btnLimpiar = document.getElementById('adminBtnLimpiarFiltros');
    if (btnLimpiar) btnLimpiar.addEventListener('click', function() {
        const fe = document.getElementById('adminFiltroEstado');
        const fu = document.getElementById('adminFiltroUsuario');
        const fo = document.getElementById('adminOrdenSelect');
        if (fe) fe.value = '';
        if (fu) fu.value = '';
        if (fo) fo.value = '';
        aplicarFiltrosAdmin();
    });

    // Exportar JSON
    const btnExportar = document.getElementById('adminBtnExportar');
    if (btnExportar) btnExportar.addEventListener('click', function() {
        const exportado = exportarTareasJSON(todasLasTareas);
        if (!exportado) {
            mostrarNotificacion('No hay tareas para exportar', 'advertencia');
        } else {
            mostrarNotificacion('Exportación completada', 'exito');
        }
    });

    // Búsqueda de usuario en el header del admin
    const formBusqueda = document.getElementById('adminSearchUserForm');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', async function(event) {
            event.preventDefault();
            const input   = document.getElementById('adminUserDocument');
            const termino = (input.value || '').trim().toLowerCase();
            if (!termino) return;

            const usuarios = await obtenerTodosLosUsuarios();
            if (!usuarios) {
                await mostrarNotificacion('Error al buscar usuarios', 'error');
                return;
            }

            const encontrado = usuarios.find(u =>
                u.id.toString()                         === termino ||
                (u.documento && u.documento.toString() === termino) ||
                u.name.toLowerCase().includes(termino)
            );

            if (!encontrado) {
                await mostrarNotificacion(
                    `No se encontró ningún usuario con: "${input.value.trim()}"`,
                    'advertencia'
                );
                return;
            }

            input.value = '';
            abrirModalUsuario(encontrado);
        });
    }

    // Formulario crear usuario en el panel admin
    const formCrear = document.getElementById('createUserForm');
    if (formCrear) {
        formCrear.addEventListener('submit', async function(event) {
            event.preventDefault();

            const docInput    = document.getElementById('newUserId');
            const nameInput   = document.getElementById('newUserName');
            const emailInput  = document.getElementById('newUserEmail');
            const docError    = document.getElementById('newUserIdError');
            const nameError   = document.getElementById('newUserNameError');
            const emailError  = document.getElementById('newUserEmailError');

            const valido = validarFormularioUsuario({
                docInput, nameInput, emailInput,
                docError, nameError, emailError,
            });
            if (!valido) return;

            const nuevoUsuario = {
                documento: docInput.value.trim(),
                name:      nameInput.value.trim(),
                email:     emailInput.value.trim(),
            };

            const usuarioCreado = await crearUsuario(nuevoUsuario);
            if (!usuarioCreado) {
                await mostrarNotificacion(
                    'No se pudo crear el usuario. Verifica que el servidor esté activo.',
                    'error'
                );
                return;
            }

            docInput.value  = '';
            nameInput.value = '';
            emailInput.value = '';
            [docError, nameError, emailError].forEach(el => { if (el) el.textContent = ''; });

            cargarTablaUsuarios();
            abrirModalUsuario(usuarioCreado);
        });
    }

    // Formulario de crear tarea en la card "Crear Tarea" del panel admin
    const formCrearTarea = document.getElementById('createTaskForm');
    if (formCrearTarea) {
        formCrearTarea.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Se leen los valores de los campos del formulario
            const titleInput   = document.getElementById('newTaskTitle');
            const descInput    = document.getElementById('newTaskDescription');
            const statusInput  = document.getElementById('newTaskStatus');
            const commentInput = document.getElementById('newTaskComment');
            const titleError   = document.getElementById('newTaskTitleError');
            const statusError  = document.getElementById('newTaskStatusError');

            // Se limpian los errores previos antes de validar de nuevo
            if (titleError)  titleError.textContent  = '';
            if (statusError) statusError.textContent = '';
            if (titleInput)  titleInput.classList.remove('error');
            if (statusInput) statusInput.classList.remove('error');

            const titulo  = titleInput  ? titleInput.value.trim()  : '';
            const estado  = statusInput ? statusInput.value         : '';

            // Validación mínima en frontend: el backend hace la validación completa
            // Solo se valida que los campos obligatorios no estén vacíos
            let hayError = false;
            if (!titulo) {
                if (titleError) titleError.textContent = 'El título es obligatorio';
                if (titleInput) titleInput.classList.add('error');
                hayError = true;
            }
            if (!estado) {
                if (statusError) statusError.textContent = 'El estado es obligatorio';
                if (statusInput) statusInput.classList.add('error');
                hayError = true;
            }
            if (hayError) return;

            // Se obtienen los IDs de los usuarios seleccionados en el dropdown de checkboxes
            const assignedUsers = obtenerIdsSeleccionados();

            // Se construye el objeto de la nueva tarea para enviar al backend
            const datosTarea = {
                title:         titulo,
                description:   descInput  ? descInput.value.trim()   : '',
                status:        estado,
                comment:       commentInput ? commentInput.value.trim() : '',
                assignedUsers: assignedUsers,
            };

            // Se llama al backend para crear la tarea
            let tareaCreada;
            try {
                tareaCreada = await registrarTarea(datosTarea);
            } catch (errorCreacion) {
                // Si el backend responde 400 (Zod) se muestran los mensajes descriptivos
                if (errorCreacion.errors && errorCreacion.errors.length > 0) {
                    await mostrarNotificacion(errorCreacion.errors[0].message, 'error');
                } else {
                    await mostrarNotificacion(
                        errorCreacion.message || 'No se pudo crear la tarea',
                        'error'
                    );
                }
                return;
            }

            if (tareaCreada) {
                // Se limpia el formulario después de crear exitosamente
                formCrearTarea.reset();

                // Se limpian los checkboxes del dropdown
                const panel = document.getElementById('usuariosDropdownPanel');
                if (panel) {
                    panel.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
                        cb.checked = false;
                    });
                }
                const textoDropdown = document.getElementById('usuariosDropdownTexto');
                if (textoDropdown) textoDropdown.textContent = 'Seleccionar usuarios...';

                // Se recargan la tabla de tareas y el dashboard para reflejar la nueva tarea
                cargarTodasLasTareas();
                cargarDashboard();
                await mostrarNotificacion(`Tarea "${datosTarea.title}" creada correctamente`, 'exito');
            }
        });
    }
}