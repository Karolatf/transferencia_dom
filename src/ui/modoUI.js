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

    // Vaciar tbody
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

    const btnVer = document.createElement('button');
    btnVer.textContent = 'Ver / Asignar';
    btnVer.classList.add('btn-action', 'btn-action--edit');
    btnVer.type = 'button';
    btnVer.addEventListener('click', function() { abrirModalUsuario(usuario); });

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

    contenedor.appendChild(btnVer);
    contenedor.appendChild(btnEliminar);
    celdaAcciones.appendChild(contenedor);

    fila.appendChild(celdaNum);
    fila.appendChild(celdaDoc);
    fila.appendChild(celdaNombre);
    fila.appendChild(celdaEmail);
    fila.appendChild(celdaAcciones);

    return fila;
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

    // Vaciar tbody
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
            cerrarModalUsuarioExistente();
            await abrirModalUsuario(usuario);
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

// ── REGISTRO DE EVENTOS DE NAVEGACIÓN ────────────────────────────────────────

export function registrarEventosNavegacion() {

    // Botones de la pantalla de inicio
    document.getElementById('btnAccesoUsuario').addEventListener('click', activarModoUsuario);
    document.getElementById('btnAccesoAdmin').addEventListener('click', activarModoAdmin);

    // Botones volver
    document.getElementById('btnVolverUsuario').addEventListener('click', activarModoInicio);
    document.getElementById('btnVolverAdmin').addEventListener('click', activarModoInicio);

    // Actualizar tabla usuarios
    const btnRefrescar = document.getElementById('btnRefrescarUsuarios');
    if (btnRefrescar) btnRefrescar.addEventListener('click', cargarTablaUsuarios);

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
}