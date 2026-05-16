// Archivo: ui/tareasUI.js
// Este archivo controla todo lo que el estudiante ve en su panel de tareas:
// muestra y oculta secciones, construye las filas de la tabla de tareas,
// y maneja el modal de edición donde el estudiante puede cambiar el estado de una tarea.
// Este archivo no llama al servidor directamente — solo muestra y oculta cosas en pantalla.

// Importamos la función para limpiar mensajes de error de los campos del formulario
import { limpiarError } from '../utils/validaciones.js';
// Importamos la función para regresar a la ruta anterior al cerrar un modal
import { volverDeModal } from '../router.js';
// Importamos las constantes con los nombres de las rutas de la aplicación
import { RUTAS } from '../rutas.js';

// ── REFERENCIAS A ELEMENTOS DEL HTML ─────────────────────────────────────────
// Guardamos referencias a los elementos del HTML que usamos frecuentemente
// para no tener que buscarlos en el DOM cada vez que los necesitamos

// Sección que muestra los datos del usuario encontrado (nombre, documento, correo)
const seccionDatosUsuario = document.getElementById('userDataSection');
// Span donde mostramos el documento o id del usuario
const spanIdUsuario        = document.getElementById('userId');
// Span donde mostramos el nombre completo del usuario
const spanNombreUsuario    = document.getElementById('userName');
// Span donde mostramos el correo electrónico del usuario
const spanEmailUsuario     = document.getElementById('userEmail');

// Sección que contiene la tabla de tareas del usuario
const seccionTareas    = document.getElementById('tasksSection');
// Elemento que muestra el contador de tareas encontradas ("3 tareas")
const contadorEl       = document.getElementById('tasksCount');
// Cuerpo de la tabla donde se insertan las filas de tareas
const cuerpoDeLaTabla  = document.getElementById('tasksTableBody');
// Elemento que muestra el mensaje "no hay tareas" cuando la lista está vacía
const mensajeVacio     = document.getElementById('tasksEmptyState');

// ── FUNCIONES DE VISIBILIDAD ──────────────────────────────────────────────────

// Exportamos la función mostrarDatosUsuario que revela la tarjeta con los datos del usuario
// y llena los campos con la información del usuario encontrado
export function mostrarDatosUsuario(usuario) {
    // Quitamos la clase 'hidden' para que la sección sea visible
    seccionDatosUsuario.classList.remove('hidden');
    // Llenamos cada campo con el dato correspondiente del usuario
    spanIdUsuario.textContent     = usuario.documento || usuario.id;
    spanNombreUsuario.textContent = usuario.name;
    spanEmailUsuario.textContent  = usuario.email;
}

// Exportamos la función ocultarDatosUsuario que oculta la tarjeta de datos del usuario
// y limpia los textos para que no queden datos visibles del usuario anterior
export function ocultarDatosUsuario() {
    // Agregamos la clase 'hidden' para ocultar la sección
    seccionDatosUsuario.classList.add('hidden');
    // Limpiamos los textos de todos los campos
    spanIdUsuario.textContent     = '';
    spanNombreUsuario.textContent = '';
    spanEmailUsuario.textContent  = '';
}

// Exportamos la función mostrarSeccionTareas que revela la sección de la tabla de tareas
export function mostrarSeccionTareas()  { seccionTareas.classList.remove('hidden'); }

// Exportamos la función ocultarSeccionTareas que oculta la sección de la tabla de tareas
export function ocultarSeccionTareas()  { seccionTareas.classList.add('hidden'); }

// Exportamos la función mostrarEstadoVacio que revela el mensaje "no hay tareas"
export function mostrarEstadoVacio()    { mensajeVacio.classList.remove('hidden'); }

// Exportamos la función ocultarEstadoVacio que oculta el mensaje "no hay tareas"
export function ocultarEstadoVacio()    { mensajeVacio.classList.add('hidden'); }

// ── CONTADOR DE TAREAS ────────────────────────────────────────────────────────

// Exportamos la función actualizarContadorTareas que actualiza el texto que dice cuántas tareas hay
// Escribe "1 tarea" en singular o "3 tareas" en plural según la cantidad
export function actualizarContadorTareas(cantidad) {
    contadorEl.textContent = cantidad === 1 ? `${cantidad} tarea` : `${cantidad} tareas`;
}

// ── FORMATO DE ESTADO ─────────────────────────────────────────────────────────

// Exportamos la función formatearEstadoTarea que convierte el valor técnico del estado
// en un texto legible en español para mostrar en los badges de la tabla
export function formatearEstadoTarea(estado) {
    const mapa = {
        pendiente:            'Pendiente',       // la tarea aún no se ha iniciado
        en_progreso:          'En Progreso',     // el estudiante está trabajando en ella
        pendiente_aprobacion: 'Por aprobar',     // el estudiante terminó y espera revisión
        completada:           'Completada',      // el admin o instructor la aprobó
        reprobada:            'Reprobada',       // la calificación fue menor a 70
    };
    // Si el estado no está en el mapa, retornamos el valor tal cual (sin cambios)
    return mapa[estado] || estado;
}

// ── CONSTRUCCIÓN DE FILAS DE LA TABLA ─────────────────────────────────────────

// Función privada que crea un botón circular con ícono de Lucide para la columna de acciones
// Recibe el nombre del ícono, el tooltip (texto al pasar el mouse), la clase de color y el handler opcional
function crearBotonIconoUsuario(nombreIcono, tooltip, claseColor, handler) {
    // Creamos el botón con las clases de estilo del proyecto
    const btn = document.createElement('button');
    btn.className = `btn-accion-icono ${claseColor}`;
    btn.title     = tooltip;     // texto que aparece al pasar el mouse sobre el botón
    btn.type      = 'button';    // type="button" para que no envíe el formulario si está dentro de uno
    // Creamos el elemento de ícono de Lucide — createIcons() lo convierte en SVG
    const icono   = document.createElement('i');
    icono.setAttribute('data-lucide', nombreIcono);
    icono.classList.add('icono-accion');
    btn.appendChild(icono);
    // Si se pasó un handler, lo registramos como listener del clic
    if (handler) btn.addEventListener('click', handler);
    return btn;
}

// Exportamos la función crearFilaTarea que construye una fila completa de la tabla de tareas
// con todas sus celdas: número, título, descripción, estado, comentario y botones de acción
export function crearFilaTarea(tarea, indice) {
    // Creamos el elemento <tr> (fila de tabla) y le asignamos el id de la tarea como atributo de datos
    const fila = document.createElement('tr');
    fila.dataset.id = tarea.id; // guardamos el id para poder encontrar esta fila después

    // Celda con el id numérico de la tarea
    const celdaNum = document.createElement('td');
    celdaNum.textContent = tarea.id;

    // Celda con el título de la tarea
    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    // Celda de descripción con botón "Ver tarea" para abrir el detalle completo
    const celdaDesc = document.createElement('td');
    celdaDesc.style.maxWidth = '0'; // fuerza el truncado del texto largo con CSS
    const spanDesc = document.createElement('span');
    spanDesc.className   = 'celda-desc__texto'; // el CSS trunca el texto si es muy largo
    spanDesc.textContent = tarea.description || '—'; // si no hay descripción, mostramos un guión
    celdaDesc.appendChild(spanDesc);
    // Botón pequeño "Ver tarea" con ícono de ojo
    const btnVer = document.createElement('button');
    btnVer.type      = 'button';
    btnVer.className = 'celda-desc__btn-ver';
    btnVer.dataset.id     = tarea.id;     // id de la tarea para identificarla al hacer clic
    btnVer.dataset.action = 'ver';        // acción "ver" para el manejador de clics delegado
    btnVer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver tarea';
    celdaDesc.appendChild(btnVer);

    // Celda con el badge de color que muestra el estado de la tarea
    const celdaEstado = document.createElement('td');
    const badge = document.createElement('span');
    // Las clases 'status-badge' y 'status-pendiente' (por ejemplo) aplican el color del estado
    badge.classList.add('status-badge', `status-${tarea.status}`);
    badge.textContent = formatearEstadoTarea(tarea.status);
    celdaEstado.appendChild(badge);

    // Celda con el comentario del admin o instructor sobre la tarea
    const celdaComentario = document.createElement('td');
    celdaComentario.textContent = tarea.comment || '—'; // si no hay comentario, mostramos guión

    // Celda de acciones con los botones de editar y exportar
    const celdaAcciones = document.createElement('td');
    const contenedor = document.createElement('div');
    contenedor.classList.add('task-actions'); // clase CSS que alinea los botones en fila

    // Botón "Editar tarea" — ícono de lápiz amarillo — abre el modal para cambiar el estado
    const btnEditar = crearBotonIconoUsuario('pencil', 'Editar tarea', 'btn-accion--amarillo', null);
    btnEditar.dataset.id     = tarea.id;  // id para identificar qué tarea se va a editar
    btnEditar.dataset.action = 'edit';    // acción para el manejador delegado

    // Botón "Exportar tarea" — ícono de descarga azul — guarda la tarea como archivo JSON
    const btnExportar = crearBotonIconoUsuario('download', 'Exportar tarea', 'btn-accion--azul', null);
    btnExportar.dataset.id     = tarea.id;   // id para identificar qué tarea se va a exportar
    btnExportar.dataset.action = 'export';   // acción para el manejador delegado

    contenedor.appendChild(btnEditar);
    contenedor.appendChild(btnExportar);
    celdaAcciones.appendChild(contenedor);

    // Ensamblamos todas las celdas en la fila en el orden correcto
    fila.appendChild(celdaNum);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDesc);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaComentario);
    fila.appendChild(celdaAcciones);

    // Inicializamos los íconos de Lucide que hay dentro de la fila recién creada
    if (window.lucide) window.lucide.createIcons();
    return fila;
}

// Exportamos la función agregarTareaATabla que agrega una tarea nueva al final de la tabla
// También actualiza el contador y asegura que la tabla sea visible
export function agregarTareaATabla(tarea, contador) {
    // Agregamos la fila de la tarea al cuerpo de la tabla
    cuerpoDeLaTabla.appendChild(crearFilaTarea(tarea, contador));
    // Actualizamos el contador con el número de tareas mostradas
    actualizarContadorTareas(contador + 1);
    // Ocultamos el mensaje vacío y mostramos la sección de la tabla
    ocultarEstadoVacio();
    mostrarSeccionTareas();
}

// ── ACTUALIZAR UNA FILA EXISTENTE ─────────────────────────────────────────────

// Exportamos la función actualizarFilaTarea que reemplaza los datos de una fila existente
// con los datos actualizados de la tarea (después de guardar cambios)
export function actualizarFilaTarea(tareaActualizada) {
    // Buscamos la fila de la tabla que tiene el id de la tarea actualizada
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaActualizada.id}"]`);
    // Si no encontramos la fila, avisamos en consola y salimos
    if (!fila) { console.warn(`Fila ${tareaActualizada.id} no encontrada`); return; }

    // Actualizamos el contenido de cada celda con los nuevos datos
    fila.cells[1].textContent = tareaActualizada.title;
    fila.cells[2].textContent = tareaActualizada.description || '—';

    // Actualizamos el badge de estado: quitamos la clase anterior y agregamos la nueva
    const badge = fila.cells[3].querySelector('.status-badge');
    // Quitamos todas las clases de estado posibles antes de agregar la correcta
    badge.classList.remove('status-pendiente', 'status-en_progreso', 'status-pendiente_aprobacion', 'status-completada', 'status-reprobada');
    badge.classList.add(`status-${tareaActualizada.status}`);
    badge.textContent = formatearEstadoTarea(tareaActualizada.status);

    // Actualizamos el comentario
    fila.cells[4].textContent = tareaActualizada.comment || '—';
}

// ── ELIMINAR UNA FILA ─────────────────────────────────────────────────────────

// Exportamos la función eliminarFilaTarea que quita una fila de la tabla por el id de la tarea
// También actualiza el contador y muestra el mensaje vacío si no quedan más filas
export function eliminarFilaTarea(tareaId) {
    // Buscamos la fila con ese id de tarea en la tabla
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaId}"]`);
    // Si no encontramos la fila, avisamos en consola y salimos
    if (!fila) { console.warn(`Fila ${tareaId} no encontrada para eliminar`); return; }
    // Eliminamos la fila del DOM
    fila.remove();

    // Contamos cuántas filas quedan después de la eliminación
    const restantes = cuerpoDeLaTabla.querySelectorAll('tr').length;
    // Actualizamos el contador con el número actualizado
    actualizarContadorTareas(restantes);
    // Si no quedan filas, mostramos el mensaje de "sin tareas"
    if (restantes === 0) mostrarEstadoVacio();
}

// ── MODAL DE EDICIÓN DE TAREA ─────────────────────────────────────────────────

// Exportamos la función mostrarModalEdicion que abre el modal con los datos de la tarea
// Recibe la tarea, si el título/descripción deben ser de solo lectura, y el modo de edición
// Modo 'usuario': solo puede cambiar el estado — título y descripción son de solo lectura
// Modo 'admin': puede editar todos los campos
// Modo 'instructor': igual que admin pero con opciones de estado distintas
export function mostrarModalEdicion(tarea, soloLecturaTituloDesc = false, modoEdicion = null) {
    // Determinamos el modo de edición: si no se pasó explícitamente, lo inferimos del parámetro booleano
    const modo = modoEdicion || (soloLecturaTituloDesc ? 'usuario' : 'admin');

    // Llenamos los campos ocultos y de texto del formulario con los datos de la tarea
    document.getElementById('editTaskId').value          = tarea.id;
    document.getElementById('editTaskTitle').value       = tarea.title;
    document.getElementById('editTaskDescription').value = tarea.description || '';

    // Llenamos el campo de comentario si existe en el HTML
    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = tarea.comment || '';

    // Limpiamos cualquier error de validación anterior del formulario del modal
    const formEl = document.getElementById('editTaskForm');
    if (formEl) {
        formEl.querySelectorAll('.modal-admin__error').forEach(el => { el.textContent = ''; });
        formEl.querySelectorAll('.modal-admin__input, .modal-admin__select, .modal-admin__textarea')
            .forEach(el => { el.style.borderColor = ''; });
    }

    // Obtenemos referencias a los campos de título, descripción y estado
    const inputTitulo  = document.getElementById('editTaskTitle');
    const inputDesc    = document.getElementById('editTaskDescription');
    const selectEstado = document.getElementById('editTaskStatus');

    // En modo usuario, el título y la descripción son de solo lectura para que no los cambie
    if (modo === 'usuario') {
        inputTitulo.setAttribute('readonly', true);
        inputDesc.setAttribute('readonly', true);
        // Aplicamos estilos visuales para indicar que son de solo lectura
        inputTitulo.style.opacity = '0.6';
        inputTitulo.style.cursor  = 'not-allowed';
        inputDesc.style.opacity   = '0.6';
        inputDesc.style.cursor    = 'not-allowed';
    } else {
        // En modo admin o instructor, quitamos la restricción de solo lectura
        inputTitulo.removeAttribute('readonly');
        inputDesc.removeAttribute('readonly');
        inputTitulo.style.opacity = '';
        inputTitulo.style.cursor  = '';
        inputDesc.style.opacity   = '';
        inputDesc.style.cursor    = '';
    }

    // Filtramos las opciones del select de estado según el modo:
    // Instructor puede ver todas las opciones (incluyendo "Completada" y "Reprobada")
    // Admin puede ver pendiente, en progreso y pendiente de aprobación
    // Usuario solo puede ver "En Progreso" y "Pendiente de aprobación"
    const todasOpciones = selectEstado.querySelectorAll('option[value]');
    todasOpciones.forEach(function(opt) {
        if (modo === 'instructor') {
            // Mostramos solo las opciones marcadas con la clase 'opcion-instructor'
            opt.style.display = opt.classList.contains('opcion-instructor') ? '' : 'none';
        } else if (modo === 'admin') {
            // Mostramos solo las opciones marcadas con la clase 'opcion-admin'
            opt.style.display = opt.classList.contains('opcion-admin') ? '' : 'none';
        } else {
            // Mostramos solo las opciones marcadas con la clase 'opcion-usuario'
            opt.style.display = opt.classList.contains('opcion-usuario') ? '' : 'none';
        }
    });

    // Asignamos el valor actual del estado al select
    if (modo === 'usuario') {
        // En modo usuario solo puede seleccionar "En Progreso" o "Pendiente de aprobación"
        const estadosUsuario = ['en_progreso', 'pendiente_aprobacion'];
        // Si el estado actual no está disponible para el usuario, ponemos "En Progreso" por defecto
        selectEstado.value = estadosUsuario.includes(tarea.status) ? tarea.status : 'en_progreso';
    } else {
        // En admin o instructor, seleccionamos el estado actual de la tarea
        selectEstado.value = tarea.status;
    }

    // Mostramos la calificación actual de la tarea solo en modo admin (solo lectura)
    const gradeAdminGrupo = document.getElementById('editGradeAdminGrupo');
    const gradeAdminLabel = document.getElementById('editGradeAdminLabel');
    if (gradeAdminGrupo && gradeAdminLabel) {
        if (modo === 'admin') {
            // Limpiamos el contenido anterior del label de calificación
            while (gradeAdminLabel.firstChild) gradeAdminLabel.removeChild(gradeAdminLabel.firstChild);
            if (tarea.grade !== null && tarea.grade !== undefined) {
                // Si hay calificación, la mostramos con color verde (aprobada) o rojo (reprobada)
                const nota  = Number(tarea.grade);
                const nivel = nota >= 70 ? 'Aprobada' : 'Reprobada';
                const color = nota >= 70 ? '#065f46' : '#991b1b';
                const bg    = nota >= 70 ? '#d1fae5' : '#fee2e2';
                gradeAdminLabel.style.cssText =
                    'display:inline-flex;align-items:center;background:' + bg + ';color:' + color + ';' +
                    'border-radius:9999px;padding:0.35rem 0.9rem;font-weight:700;font-size:0.95rem;';
                gradeAdminLabel.textContent = nota + ' / 100 — ' + nivel;
            } else {
                // Si no hay calificación, mostramos "Sin calificación" en gris
                gradeAdminLabel.style.cssText = 'color:#9ca3af;font-style:italic;font-size:0.9rem;';
                gradeAdminLabel.textContent   = 'Sin calificación';
            }
            // Mostramos el grupo de calificación en modo admin
            gradeAdminGrupo.style.display = '';
        } else {
            // En otros modos, ocultamos la sección de calificación del admin
            gradeAdminGrupo.style.display = 'none';
        }
    }

    // Ocultamos el checkbox de calificación para el modo usuario
    const chkCalifGrupo = document.getElementById('editChkCalifGrupo');
    if (chkCalifGrupo) {
        chkCalifGrupo.style.display = modo === 'usuario' ? 'none' : '';
    }

    // En modo usuario ocultamos y limpiamos los campos de calificación del instructor
    // para que no queden valores visibles de cuando el instructor usó el modal antes
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

    // Revelamos el modal de edición quitándole la clase 'hidden'
    const editModal = document.getElementById('editModal');
    editModal.classList.remove('hidden');

    // Registramos un listener para cerrar el modal si el usuario hace clic en el overlay (fondo oscuro)
    function cerrarAlClickOverlay(e) {
        if (e.target === editModal) {
            // Quitamos el listener antes de cerrar para no acumular listeners
            editModal.removeEventListener('click', cerrarAlClickOverlay);
            ocultarModalEdicion();
        }
    }
    // Quitamos el listener anterior primero (por si ya había uno) y registramos el nuevo
    editModal.removeEventListener('click', cerrarAlClickOverlay);
    editModal.addEventListener('click', cerrarAlClickOverlay);
}

// Exportamos la función ocultarModalEdicion que cierra el modal y limpia todos sus campos
export function ocultarModalEdicion() {
    // Ocultamos el modal agregándole la clase 'hidden'
    document.getElementById('editModal').classList.add('hidden');
    // Limpiamos los campos de texto del formulario
    document.getElementById('editTaskTitle').value       = '';
    document.getElementById('editTaskDescription').value = '';
    document.getElementById('editTaskStatus').value      = '';
    document.getElementById('editTaskId').value          = '';

    // Limpiamos el campo de comentario si existe
    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = '';

    // Ocultamos y limpiamos los campos de calificación del instructor
    const gradeGrupoC       = document.getElementById('editGradeGrupo');
    const gradeReasonGrupoC = document.getElementById('editGradeReasonGrupo');
    const gradeInputC       = document.getElementById('editTaskGrade');
    const gradeReasonInputC = document.getElementById('editTaskGradeReason');
    if (gradeGrupoC)       gradeGrupoC.style.display       = 'none';
    if (gradeReasonGrupoC) gradeReasonGrupoC.style.display = 'none';
    if (gradeInputC)       gradeInputC.value               = '';
    if (gradeReasonInputC) gradeReasonInputC.value         = '';

    // Limpiamos los mensajes de error del formulario del modal
    const formEl = document.getElementById('editTaskForm');
    if (formEl) {
        formEl.querySelectorAll('.modal-admin__error').forEach(el => { el.textContent = ''; });
        formEl.querySelectorAll('.modal-admin__input, .modal-admin__select, .modal-admin__textarea')
            .forEach(el => { el.style.borderColor = ''; });
    }

    // Restauramos el campo de título a estado normal (quitamos el modo solo lectura)
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

    // Restauramos el select de estado por si fue deshabilitado para tareas calificadas
    const selectEstadoEl = document.getElementById('editTaskStatus');
    if (selectEstadoEl) {
        selectEstadoEl.disabled     = false;
        selectEstadoEl.style.opacity = '';
        selectEstadoEl.style.cursor  = '';
    }

    // Si el modal fue abierto a través de una ruta del router, regresamos a la ruta anterior
    const _h = window.location.hash.slice(1);
    if (_h.startsWith(RUTAS.ADMIN.EDITAR_TAREA) || _h.startsWith(RUTAS.USUARIO.EDITAR_TAREA) || _h.startsWith(RUTAS.INSTRUCTOR.EDITAR_TAREA)) volverDeModal();
}
