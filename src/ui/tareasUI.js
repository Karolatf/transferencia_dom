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
import { volverDeModal } from '../router.js';
import { RUTAS } from '../rutas.js';

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

// Convierte el valor técnico del estado a texto legible en español.
// Se usa en los badges de la tabla del panel usuario y en actualizarFilaTarea.
// ACTUALIZACIÓN v3.4.0: incluye el cuarto estado pendiente_aprobacion.
export function formatearEstadoTarea(estado) {
    const mapa = {
        pendiente:            'Pendiente',
        en_progreso:          'En Progreso',
        // El usuario marca este estado cuando considera que terminó su trabajo
        pendiente_aprobacion: 'Por aprobar',
        completada:           'Completada',
        // Estado asignado automáticamente cuando la nota es menor a 70
        reprobada:            'Reprobada',
    };
    // Si el estado no existe en el mapa se retorna el valor original como fallback
    return mapa[estado] || estado;
}

// ── CONSTRUCCIÓN DE FILA ──────────────────────────────────────────────────────

// Crea un TR completo con columnas: #, Título, Descripción, Estado, Comentario, Acciones
// Los botones llevan data-id y data-action para la delegación en tareasService.js.
//
// CAMBIO: el botón "Eliminar" fue reemplazado por dos botones:
//   - "✏️ Editar tarea"  (data-action="edit")   — abre el modal de edición
//   - "⬇️ Exportar JSON" (data-action="export") — descarga la tarea como .json
// Esto mejora la experiencia del usuario en el panel de usuario, donde la
// eliminación de tareas es responsabilidad exclusiva del administrador.
// crearBotonIconoUsuario — botón circular con ícono Lucide (igual que admin/instructor)
function crearBotonIconoUsuario(nombreIcono, tooltip, claseColor, handler) {
    const btn = document.createElement('button');
    btn.className = `btn-accion-icono ${claseColor}`;
    btn.title     = tooltip;
    btn.type      = 'button';
    const icono   = document.createElement('i');
    icono.setAttribute('data-lucide', nombreIcono);
    icono.classList.add('icono-accion');
    btn.appendChild(icono);
    if (handler) btn.addEventListener('click', handler);
    return btn;
}

export function crearFilaTarea(tarea, indice) {
    const fila = document.createElement('tr');
    fila.dataset.id = tarea.id;

    const celdaNum = document.createElement('td');
    celdaNum.textContent = indice + 1;

    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    // Descripción con botón Ver tarea (igual que admin/instructor)
    const celdaDesc = document.createElement('td');
    celdaDesc.style.maxWidth = '0';
    const spanDesc = document.createElement('span');
    spanDesc.className   = 'celda-desc__texto';
    spanDesc.textContent = tarea.description || '—';
    celdaDesc.appendChild(spanDesc);
    const btnVer = document.createElement('button');
    btnVer.type      = 'button';
    btnVer.className = 'celda-desc__btn-ver';
    btnVer.dataset.id     = tarea.id;
    btnVer.dataset.action = 'ver';
    btnVer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver tarea';
    celdaDesc.appendChild(btnVer);

    const celdaEstado = document.createElement('td');
    const badge = document.createElement('span');
    badge.classList.add('status-badge', `status-${tarea.status}`);
    badge.textContent = formatearEstadoTarea(tarea.status);
    celdaEstado.appendChild(badge);

    const celdaComentario = document.createElement('td');
    celdaComentario.textContent = tarea.comment || '—';

    // Acciones con botón ícono circular igual que admin/instructor
    const celdaAcciones = document.createElement('td');
    const contenedor = document.createElement('div');
    contenedor.classList.add('task-actions');

    // Botón Editar — siempre visible; el handler bloquea la acción si la tarea está bloqueada
    const btnEditar = crearBotonIconoUsuario('pencil', 'Editar tarea', 'btn-accion--amarillo', null);
    btnEditar.dataset.id     = tarea.id;
    btnEditar.dataset.action = 'edit';

    // Botón Exportar — circular con ícono descarga
    const btnExportar = crearBotonIconoUsuario('download', 'Exportar tarea', 'btn-accion--azul', null);
    btnExportar.dataset.id     = tarea.id;
    btnExportar.dataset.action = 'export';

    contenedor.appendChild(btnEditar);
    contenedor.appendChild(btnExportar);
    celdaAcciones.appendChild(contenedor);

    fila.appendChild(celdaNum);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDesc);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaComentario);
    fila.appendChild(celdaAcciones);

    if (window.lucide) window.lucide.createIcons();
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
    // Se eliminan las cinco clases de estado posibles antes de agregar la nueva
    badge.classList.remove('status-pendiente', 'status-en_progreso', 'status-pendiente_aprobacion', 'status-completada', 'status-reprobada');
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

// Muestra el modal de edición con los datos de la tarea recibida.
// Parámetro soloLecturaTituloDesc (boolean, default false):
//   true  → panel usuario: Título y Descripción quedan como solo lectura
//   false → panel admin:   todos los campos son editables
// Muestra el modal de edición con los datos de la tarea recibida.
// Parámetro soloLecturaTituloDesc (boolean, default false):
//   true  → panel usuario: Título y Descripción quedan como solo lectura,
//            y el select de estado solo muestra las opciones del usuario
//   false → panel admin: todos los campos son editables y el select
//            muestra las tres opciones incluyendo "Completada"
export function mostrarModalEdicion(tarea, soloLecturaTituloDesc = false, modoEdicion = null) {
    const modo = modoEdicion || (soloLecturaTituloDesc ? 'usuario' : 'admin');

    document.getElementById('editTaskId').value          = tarea.id;
    document.getElementById('editTaskTitle').value       = tarea.title;
    document.getElementById('editTaskDescription').value = tarea.description || '';

    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = tarea.comment || '';

    const formEl = document.getElementById('editTaskForm');
    if (formEl) {
        formEl.querySelectorAll('.modal-admin__error').forEach(el => { el.textContent = ''; });
        formEl.querySelectorAll('.modal-admin__input, .modal-admin__select, .modal-admin__textarea')
            .forEach(el => { el.style.borderColor = ''; });
    }

    const inputTitulo  = document.getElementById('editTaskTitle');
    const inputDesc    = document.getElementById('editTaskDescription');
    const selectEstado = document.getElementById('editTaskStatus');

    // Solo el usuario tiene titulo/desc en solo lectura; admin e instructor pueden editarlos
    if (modo === 'usuario') {
        inputTitulo.setAttribute('readonly', true);
        inputDesc.setAttribute('readonly', true);
        inputTitulo.style.opacity = '0.6';
        inputTitulo.style.cursor  = 'not-allowed';
        inputDesc.style.opacity   = '0.6';
        inputDesc.style.cursor    = 'not-allowed';
    } else {
        inputTitulo.removeAttribute('readonly');
        inputDesc.removeAttribute('readonly');
        inputTitulo.style.opacity = '';
        inputTitulo.style.cursor  = '';
        inputDesc.style.opacity   = '';
        inputDesc.style.cursor    = '';
    }

    // Filtrar opciones del select según modo:
    //   instructor -> todos (opcion-instructor)
    //   admin      -> pendiente, en_progreso, pendiente_aprobacion (opcion-admin)
    //   usuario    -> en_progreso, pendiente_aprobacion (opcion-usuario)
    const todasOpciones = selectEstado.querySelectorAll('option[value]');
    todasOpciones.forEach(function(opt) {
        if (modo === 'instructor') {
            opt.style.display = opt.classList.contains('opcion-instructor') ? '' : 'none';
        } else if (modo === 'admin') {
            opt.style.display = opt.classList.contains('opcion-admin') ? '' : 'none';
        } else {
            opt.style.display = opt.classList.contains('opcion-usuario') ? '' : 'none';
        }
    });

    // Asignar valor del estado (con fallback para usuario)
    if (modo === 'usuario') {
        const estadosUsuario = ['en_progreso', 'pendiente_aprobacion'];
        selectEstado.value = estadosUsuario.includes(tarea.status) ? tarea.status : 'en_progreso';
    } else {
        selectEstado.value = tarea.status;
    }

    // Label de calificacion actual - solo lectura, solo visible en admin
    const gradeAdminGrupo = document.getElementById('editGradeAdminGrupo');
    const gradeAdminLabel = document.getElementById('editGradeAdminLabel');
    if (gradeAdminGrupo && gradeAdminLabel) {
        if (modo === 'admin') {
            while (gradeAdminLabel.firstChild) gradeAdminLabel.removeChild(gradeAdminLabel.firstChild);
            if (tarea.grade !== null && tarea.grade !== undefined) {
                const nota  = Number(tarea.grade);
                const nivel = nota >= 70 ? 'Aprobada' : 'Reprobada';
                const color = nota >= 70 ? '#065f46' : '#991b1b';
                const bg    = nota >= 70 ? '#d1fae5' : '#fee2e2';
                gradeAdminLabel.style.cssText =
                    'display:inline-flex;align-items:center;background:' + bg + ';color:' + color + ';' +
                    'border-radius:9999px;padding:0.35rem 0.9rem;font-weight:700;font-size:0.95rem;';
                gradeAdminLabel.textContent = nota + ' / 100 — ' + nivel;
            } else {
                gradeAdminLabel.style.cssText = 'color:#9ca3af;font-style:italic;font-size:0.9rem;';
                gradeAdminLabel.textContent   = 'Sin calificación';
            }
            gradeAdminGrupo.style.display = '';
        } else {
            gradeAdminGrupo.style.display = 'none';
        }
    }

    // Ocultar el checkbox de calificacion si el modo es usuario
    const chkCalifGrupo = document.getElementById('editChkCalifGrupo');
    if (chkCalifGrupo) {
        chkCalifGrupo.style.display = modo === 'usuario' ? 'none' : '';
    }

    // Para el modo usuario, ocultar y limpiar los campos de calificación del instructor
    // Estos campos pueden quedar visibles y con valores si el instructor los usó antes
    if (modo === 'usuario') {
        const gradeGrupo       = document.getElementById('editGradeGrupo');
        const gradeReasonGrupo = document.getElementById('editGradeReasonGrupo');
        const gradeInput       = document.getElementById('editTaskGrade');
        const gradeReasonInput = document.getElementById('editTaskGradeReason');
        if (gradeGrupo)       gradeGrupo.style.display       = 'none';
        if (gradeReasonGrupo) gradeReasonGrupo.style.display = 'none';
        if (gradeInput)       gradeInput.value               = '';
        if (gradeReasonInput) gradeReasonInput.value         = '';
    }

    const editModal = document.getElementById('editModal');
    editModal.classList.remove('hidden');

    // Cerrar al hacer click fuera del panel (en el overlay)
    function cerrarAlClickOverlay(e) {
        if (e.target === editModal) {
            editModal.removeEventListener('click', cerrarAlClickOverlay);
            ocultarModalEdicion();
        }
    }
    editModal.removeEventListener('click', cerrarAlClickOverlay);
    editModal.addEventListener('click', cerrarAlClickOverlay);
}

export function ocultarModalEdicion() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editTaskTitle').value       = '';
    document.getElementById('editTaskDescription').value = '';
    document.getElementById('editTaskStatus').value      = '';
    document.getElementById('editTaskId').value          = '';

    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = '';

    // Limpiar y ocultar campos de calificación del instructor al cerrar
    const gradeGrupoC       = document.getElementById('editGradeGrupo');
    const gradeReasonGrupoC = document.getElementById('editGradeReasonGrupo');
    const gradeInputC       = document.getElementById('editTaskGrade');
    const gradeReasonInputC = document.getElementById('editTaskGradeReason');
    if (gradeGrupoC)       gradeGrupoC.style.display       = 'none';
    if (gradeReasonGrupoC) gradeReasonGrupoC.style.display = 'none';
    if (gradeInputC)       gradeInputC.value               = '';
    if (gradeReasonInputC) gradeReasonInputC.value         = '';

    // Limpiar errores de validación al cerrar
    const formEl = document.getElementById('editTaskForm');
    if (formEl) {
        formEl.querySelectorAll('.modal-admin__error').forEach(el => { el.textContent = ''; });
        formEl.querySelectorAll('.modal-admin__input, .modal-admin__select, .modal-admin__textarea')
            .forEach(el => { el.style.borderColor = ''; });
    }

    // Restaurar inputs a estado normal (sin readonly ni estilos especiales)
    const inputTitulo = document.getElementById('editTaskTitle');
    const inputDesc   = document.getElementById('editTaskDescription');

    if (inputTitulo) {
        inputTitulo.removeAttribute('readonly');
        inputTitulo.style.opacity = '';
        inputTitulo.style.cursor  = '';
    }
    if (inputDesc) {
        inputDesc.removeAttribute('readonly');
        inputDesc.style.opacity = '';
        inputDesc.style.cursor  = '';
    }

    // Re-habilitar el select de estado (puede haber sido deshabilitado en modo admin para tarea calificada)
    const selectEstadoEl = document.getElementById('editTaskStatus');
    if (selectEstadoEl) {
        selectEstadoEl.disabled     = false;
        selectEstadoEl.style.opacity = '';
        selectEstadoEl.style.cursor  = '';
    }

    // Limpiar el hash del router si el modal fue abierto via ruta
    const _h = window.location.hash.slice(1);
    if (_h === RUTAS.ADMIN.EDITAR_TAREA || _h === RUTAS.USUARIO.EDITAR_TAREA || _h === RUTAS.INSTRUCTOR.EDITAR_TAREA) volverDeModal();
}