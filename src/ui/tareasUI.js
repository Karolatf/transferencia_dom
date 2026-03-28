// MÓDULO: ui/tareasUI.js
// CAPA: UI (Manipulación visual de la interfaz)
//
// Responsabilidad única: controlar lo que el usuario ve en pantalla.
// Muestra, oculta y actualiza secciones, construye filas de tabla
// y gestiona el modal de edición.
//
// CORRECCIÓN APLICADA EN ESTA VERSIÓN:
//   El archivo estaba guardado como 'tareasUi.js' (U minúscula en Ui).
//   Todos los módulos del proyecto lo importan como 'tareasUI.js' (UI mayúscula).
//   En Linux el sistema de archivos es case-sensitive, por lo que el servidor
//   no encontraba el archivo y lanzaba un error de importación en producción.
//   Solución: renombrar el archivo a 'tareasUI.js' para que coincida con
//   todas las rutas de importación del proyecto.
//
// Reglas de esta capa:
//   SI puede leer y escribir en el DOM
//   SI puede importar de utils/
//   NO puede importar de api/ (la UI no conoce al servidor)
//   NO puede importar de services/ (evita dependencias circulares)
//
// RF-01 READ   -> mostrarDatosUsuario, agregarTareaATabla
// RF-03 UPDATE -> actualizarFilaTarea, mostrarModalEdicion, ocultarModalEdicion
// RF-04 DELETE -> eliminarFilaTarea

// Se importa limpiarError desde utils para usarla al resetear formularios.
// Es la única dependencia de este módulo: el resto trabaja directamente con el DOM.
import { limpiarError } from '../utils/validaciones.js';

// ── SELECCIÓN DE ELEMENTOS DEL DOM ───────────────────────────────────────────
// Se centralizan aquí para que solo esta capa conozca la estructura del HTML.
// Si un ID cambia en el HTML, solo se actualiza en este módulo.

// Sección de datos del usuario (nombre, documento, correo)
const seccionDatosUsuario = document.getElementById('userDataSection');
const spanIdUsuario        = document.getElementById('userId');
const spanNombreUsuario    = document.getElementById('userName');
const spanEmailUsuario     = document.getElementById('userEmail');

// Sección del formulario de tareas (no se usa activamente en el modo usuario actual,
// pero se conserva para compatibilidad con el HTML existente)
const seccionFormTareas   = document.getElementById('taskFormSection');
const inputTituloTarea    = document.getElementById('taskTitle');
const inputDescripcion    = document.getElementById('taskDescription');
const selectEstado        = document.getElementById('taskStatus');
const errorTitulo         = document.getElementById('taskTitleError');
const errorDescripcion    = document.getElementById('taskDescriptionError');
const errorEstado         = document.getElementById('taskStatusError');

// Sección de la tabla de tareas del modo usuario
const seccionTareas       = document.getElementById('tasksSection');
const contadorTareas      = document.getElementById('tasksCount');
const cuerpoDeLaTabla     = document.getElementById('tasksTableBody');
// Mensaje que se muestra cuando no hay tareas para mostrar en la tabla
const mensajeTablaVacia   = document.getElementById('tasksEmptyState');

// ── FUNCIONES DE CONTROL DE VISIBILIDAD ──────────────────────────────────────

// Muestra la sección de datos del usuario y la llena con su información.
// Se llama cuando el servidor retorna exitosamente el usuario buscado.
// Parámetro: usuario — objeto con los campos id/documento, name, email.
export function mostrarDatosUsuario(usuario) {
    // Se remueve 'hidden' para hacer visible la sección
    seccionDatosUsuario.classList.remove('hidden');
    // Se usa textContent (no innerHTML) para evitar inyección de HTML malicioso
    // Se muestra el documento como identificador visible, no el id interno de MySQL
    spanIdUsuario.textContent     = usuario.documento || usuario.id;
    spanNombreUsuario.textContent = usuario.name;
    spanEmailUsuario.textContent  = usuario.email;
}

// Oculta y limpia la sección de datos del usuario.
// Se llama al iniciar una nueva búsqueda para no mostrar datos del anterior.
export function ocultarDatosUsuario() {
    seccionDatosUsuario.classList.add('hidden');
    // Se vacían los spans para que no queden datos visibles al ocultar la sección
    spanIdUsuario.textContent     = '';
    spanNombreUsuario.textContent = '';
    spanEmailUsuario.textContent  = '';
}

// Muestra el formulario de registro de tareas (solo si hay flujo de creación manual).
export function mostrarFormularioTareas() {
    seccionFormTareas.classList.remove('hidden');
}

// Oculta el formulario de registro de tareas.
export function ocultarFormularioTareas() {
    seccionFormTareas.classList.add('hidden');
}

// Muestra la sección completa de la tabla de tareas.
// Se revela automáticamente cuando hay tareas para mostrar.
export function mostrarSeccionTareas() {
    seccionTareas.classList.remove('hidden');
}

// Muestra el mensaje de "no hay tareas registradas".
// Se llama al inicializar la app y cuando se eliminan todas las tareas.
export function mostrarEstadoVacio() {
    mensajeTablaVacia.classList.remove('hidden');
}

// Oculta el mensaje de estado vacío.
// Se llama cuando hay al menos una tarea para mostrar en la tabla.
export function ocultarEstadoVacio() {
    mensajeTablaVacia.classList.add('hidden');
}

// ── FUNCIONES DE ACTUALIZACIÓN DE CONTADORES ─────────────────────────────────

// Actualiza el texto del contador de tareas en el encabezado de la tabla.
// Gestiona correctamente singular ("1 tarea") y plural ("2 tareas").
// Parámetro: cantidad — número total actual de tareas en la tabla.
export function actualizarContadorTareas(cantidad) {
    const texto = cantidad === 1 ? `${cantidad} tarea` : `${cantidad} tareas`;
    contadorTareas.textContent = texto;
}

// ── FUNCIONES DE FORMATO DE DATOS ────────────────────────────────────────────

// Convierte el valor técnico del estado a texto legible en español.
// Parámetro: estado — el valor del campo status ('pendiente', 'en_progreso', 'completada').
// Retorna: string formateado para mostrar al usuario en la tabla.
export function formatearEstadoTarea(estado) {
    switch (estado) {
        case 'pendiente':   return 'Pendiente';
        case 'en_progreso': return 'En Progreso';
        case 'completada':  return 'Completada';
        default:            return estado;
    }
}

// ── FUNCIONES DE CONSTRUCCIÓN Y MANIPULACIÓN DE LA TABLA ─────────────────────

// Crea y retorna una fila completa (TR) con los datos de una tarea.
// Incluye las columnas: #, Título, Descripción, Estado, Comentario, Acciones.
// Los botones Editar y Eliminar llevan data-id y data-action para la delegación
// de eventos que maneja tareasService.js con un solo listener en el tbody.
// Parámetros:
//   tarea  — objeto de la tarea (id, title, description, status, comment).
//   indice — número correlativo para numerar la fila (empieza en 0).
// Retorna: elemento TR listo para insertar en el DOM.
export function crearFilaTarea(tarea, indice) {

    // Se crea el elemento fila y se guarda el id como data-attribute
    const fila = document.createElement('tr');
    // dataset.id permite identificar la fila al actualizar o eliminar sin buscar en el arreglo
    fila.dataset.id = tarea.id;

    // Celda número correlativo (el índice empieza en 0, el usuario ve desde 1)
    const celdaNumero = document.createElement('td');
    celdaNumero.textContent = indice + 1;

    // Celda del título de la tarea
    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    // Celda de la descripción de la tarea
    const celdaDescripcion = document.createElement('td');
    celdaDescripcion.textContent = tarea.description;

    // Celda del estado con badge visual coloreado según el valor del campo status
    const celdaEstado = document.createElement('td');
    const badgeEstado = document.createElement('span');
    // Clase base del badge para estilos generales (padding, border-radius, font-weight)
    badgeEstado.classList.add('status-badge');
    // Clase dinámica que da el color según el estado (ver .status-pendiente en styles.css)
    badgeEstado.classList.add(`status-${tarea.status}`);
    badgeEstado.textContent = formatearEstadoTarea(tarea.status);
    celdaEstado.appendChild(badgeEstado);

    // Celda del comentario de la tarea
    // Si la tarea no tiene comentario se muestra un guion como indicativo visual
    const celdaComentario = document.createElement('td');
    celdaComentario.textContent = tarea.comment || '—';

    // Celda de acciones: contiene los botones Editar y Eliminar
    const celdaAcciones = document.createElement('td');
    const contenedorAcciones = document.createElement('div');
    // task-actions aplica flexbox con gap para separar los botones (ver styles.css)
    contenedorAcciones.classList.add('task-actions');

    // Botón de editar (RF-03): celeste pastel
    // btn-action--edit aplica el fondo #dbeafe con texto #1e40af (ver styles.css)
    const botonEditar = document.createElement('button');
    botonEditar.textContent = '✏️ Editar';
    botonEditar.classList.add('btn-action', 'btn-action--edit');
    // data-id: el id de la tarea que maneja este botón
    botonEditar.dataset.id     = tarea.id;
    // data-action: la acción que debe ejecutar el handler de delegación en tareasService.js
    botonEditar.dataset.action = 'edit';
    // type="button" evita que el clic dispare un submit si el botón está dentro de un form
    botonEditar.type           = 'button';

    // Botón de eliminar (RF-04): rojo pastel
    // btn-action--delete aplica el fondo #fee2e2 con texto #991b1b (ver styles.css)
    const botonEliminar = document.createElement('button');
    botonEliminar.textContent = '🗑️ Eliminar';
    botonEliminar.classList.add('btn-action', 'btn-action--delete');
    botonEliminar.dataset.id     = tarea.id;
    botonEliminar.dataset.action = 'delete';
    botonEliminar.type           = 'button';

    // Se ensamblan los botones en el contenedor y este en la celda
    contenedorAcciones.appendChild(botonEditar);
    contenedorAcciones.appendChild(botonEliminar);
    celdaAcciones.appendChild(contenedorAcciones);

    // Se ensamblan todas las celdas en la fila en el orden del thead del HTML
    fila.appendChild(celdaNumero);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDescripcion);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaComentario);
    fila.appendChild(celdaAcciones);

    return fila;
}

// Inserta una tarea nueva en la tabla y actualiza los contadores y estados visuales.
// Se llama después de que el servidor confirma el registro o al cargar la tabla inicial.
// Parámetros:
//   tarea    — objeto de la tarea (incluye el id asignado por MySQL).
//   contador — índice correlativo para numerar la fila (empieza en 0).
export function agregarTareaATabla(tarea, contador) {

    // Se crea la fila con todos sus datos y botones de acción
    const nuevaFila = crearFilaTarea(tarea, contador);
    // Se inserta la fila al final del tbody de la tabla
    cuerpoDeLaTabla.appendChild(nuevaFila);

    // Se actualiza el contador visual sumando 1 porque el índice empieza en 0
    actualizarContadorTareas(contador + 1);

    // Se oculta el mensaje de estado vacío porque ya hay al menos una tarea
    ocultarEstadoVacio();

    // Se revela la sección de la tabla si era la primera tarea que se agregaba
    mostrarSeccionTareas();
}

// Limpia todos los campos del formulario de tareas y sus mensajes de error.
// Se llama después de registrar una tarea exitosamente.
export function limpiarFormularioTareas() {
    inputTituloTarea.value = '';
    inputDescripcion.value = '';
    selectEstado.value     = '';
    // Se reutiliza limpiarError de utils para no duplicar lógica de limpieza visual
    limpiarError(errorTitulo,      inputTituloTarea);
    limpiarError(errorDescripcion, inputDescripcion);
    limpiarError(errorEstado,      selectEstado);
}

// ── RF-03 — ACTUALIZACIÓN EN EL DOM ──────────────────────────────────────────

// Actualiza visualmente una fila existente con los nuevos datos de la tarea.
// Se llama después de que el servidor confirma la actualización exitosa.
// Parámetro: tareaActualizada — objeto con los datos actualizados del servidor.
export function actualizarFilaTarea(tareaActualizada) {

    // Se busca el TR que tenga el data-id igual al ID de la tarea actualizada
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaActualizada.id}"]`);

    // Si no se encontró la fila se registra en consola y se sale sin romper la app
    if (!fila) {
        console.warn(`No se encontro la fila con id ${tareaActualizada.id} para actualizar`);
        return;
    }

    // cells[1] = título (cells[0] es el número correlativo)
    fila.cells[1].textContent = tareaActualizada.title;

    // cells[2] = descripción
    fila.cells[2].textContent = tareaActualizada.description;

    // cells[3] = badge de estado
    const celdaEstado = fila.cells[3];
    const badge       = celdaEstado.querySelector('.status-badge');
    // Se remueven todas las clases de estado anteriores para no acumularlas
    badge.classList.remove('status-pendiente', 'status-en_progreso', 'status-completada');
    // Se agrega la clase del nuevo estado para aplicar el color correcto
    badge.classList.add(`status-${tareaActualizada.status}`);
    badge.textContent = formatearEstadoTarea(tareaActualizada.status);

    // cells[4] = comentario
    // Si el campo comment llegó vacío del servidor se muestra el guion indicativo
    fila.cells[4].textContent = tareaActualizada.comment || '—';
}

// ── RF-04 — ELIMINACIÓN EN EL DOM ────────────────────────────────────────────

// Elimina visualmente la fila de una tarea de la tabla.
// Se llama después de que el servidor confirma la eliminación exitosa.
// Parámetro: tareaId — ID de la tarea cuya fila debe ser eliminada.
export function eliminarFilaTarea(tareaId) {

    // Se busca el TR con el data-id de la tarea a eliminar
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaId}"]`);

    // Si no se encontró la fila se registra en consola y se sale
    if (!fila) {
        console.warn(`No se encontro la fila con id ${tareaId} para eliminar`);
        return;
    }

    // Se elimina la fila del DOM completamente (no solo se oculta)
    fila.remove();

    // Se cuenta las filas que quedan para actualizar el contador visual
    const filasRestantes = cuerpoDeLaTabla.querySelectorAll('tr').length;
    actualizarContadorTareas(filasRestantes);

    // Si no quedaron más filas se muestra el mensaje de tabla vacía
    if (filasRestantes === 0) {
        mostrarEstadoVacio();
    }
}

// ── MODAL DE EDICIÓN (RF-03) ──────────────────────────────────────────────────

// Muestra el modal de edición con los datos actuales de la tarea precargados.
// El usuario ve la información actual y edita solo lo que necesita cambiar.
// Parámetro: tarea — objeto con los datos actuales de la tarea a editar.
export function mostrarModalEdicion(tarea) {

    const modal = document.getElementById('editModal');

    // Se precargan los campos del modal con los datos actuales de la tarea
    // para que el usuario vea lo que ya tiene antes de modificar
    document.getElementById('editTaskTitle').value       = tarea.title;
    document.getElementById('editTaskDescription').value = tarea.description;
    document.getElementById('editTaskStatus').value      = tarea.status;

    // Se guarda el ID de la tarea en el campo oculto para que el handler del PUT
    // sepa a qué tarea enviar la actualización al servidor
    document.getElementById('editTaskId').value = tarea.id;

    // Se precarga el comentario si la tarea ya tiene uno guardado
    // El campo es opcional; si no tiene comentario el textarea queda vacío
    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = tarea.comment || '';

    // Se remueve 'hidden' para hacer visible el overlay y el modal
    modal.classList.remove('hidden');
}

// Oculta el modal de edición y limpia todos sus campos.
// Se llama cuando el usuario cancela o cuando se guarda exitosamente.
export function ocultarModalEdicion() {

    const modal = document.getElementById('editModal');

    // Se agrega 'hidden' para ocultar el modal y su overlay de fondo
    modal.classList.add('hidden');

    // Se limpian todos los campos del formulario para la próxima apertura
    document.getElementById('editTaskTitle').value       = '';
    document.getElementById('editTaskDescription').value = '';
    document.getElementById('editTaskStatus').value      = '';
    document.getElementById('editTaskId').value          = '';

    // Se limpia el campo de comentario si existe en el HTML
    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = '';
}