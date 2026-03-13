// MÓDULO: ui/tareasUI.js
// CAPA: UI (Manipulación visual de la interfaz)

// Responsabilidad única: controlar lo que el usuario ve en pantalla.
// Muestra, oculta y actualiza secciones, construye filas de tabla
// y gestiona el modal de edición.

// Reglas de esta capa:
//   SI puede leer y escribir en el DOM
//   SI puede importar de utils/
//   NO puede importar de api/ (la UI no conoce al servidor)
//   NO puede importar de services/ (evita dependencias circulares)

// RF-01 READ   -> mostrarDatosUsuario, agregarTareaATabla
// RF-03 UPDATE -> actualizarFilaTarea, mostrarModalEdicion, ocultarModalEdicion
// RF-04 DELETE -> eliminarFilaTarea

// Se importa limpiarError desde utils para usarla al resetear formularios
import { limpiarError } from '../utils/validaciones.js';

// SELECCIÓN DE ELEMENTOS DEL DOM
// Se centralizan aquí para que solo esta capa conozca la estructura del HTML
// Si un ID cambia en el HTML, solo se actualiza en este módulo

// Sección de datos del usuario (nombre, documento, correo)
const seccionDatosUsuario = document.getElementById('userDataSection');
const spanIdUsuario        = document.getElementById('userId');
const spanNombreUsuario    = document.getElementById('userName');
const spanEmailUsuario     = document.getElementById('userEmail');

// Sección del formulario de tareas (se mantiene en el DOM pero no se usa en modo usuario actual)
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
// Mensaje que se muestra cuando no hay tareas para mostrar
const mensajeTablaVacia   = document.getElementById('tasksEmptyState');

// FUNCIONES DE CONTROL DE VISIBILIDAD

// Muestra la sección de datos del usuario y la llena con su información
// Se llama cuando el servidor retorna exitosamente el usuario buscado
// Parámetro: usuario — objeto con los campos id/documento, name, email del usuario encontrado
export function mostrarDatosUsuario(usuario) {
    // Se remueve 'hidden' para hacer visible la sección
    seccionDatosUsuario.classList.remove('hidden');
    // Se usan textContent (no innerHTML) para evitar inyección de HTML
    // Se muestra el documento como identificador visible, no el id interno
    spanIdUsuario.textContent     = usuario.documento || usuario.id;
    spanNombreUsuario.textContent = usuario.name;
    spanEmailUsuario.textContent  = usuario.email;
}

// Oculta y limpia la sección de datos del usuario
// Se llama al iniciar una nueva búsqueda para evitar mostrar datos del anterior
export function ocultarDatosUsuario() {
    // Se agrega 'hidden' para que el CSS oculte la sección
    seccionDatosUsuario.classList.add('hidden');
    // Se vacían los spans para no dejar datos visibles del usuario anterior
    spanIdUsuario.textContent     = '';
    spanNombreUsuario.textContent = '';
    spanEmailUsuario.textContent  = '';
}

// Muestra el formulario de registro de tareas (solo se usa si hay flujo de creación)
export function mostrarFormularioTareas() {
    seccionFormTareas.classList.remove('hidden');
}

// Oculta el formulario de registro de tareas
export function ocultarFormularioTareas() {
    seccionFormTareas.classList.add('hidden');
}

// Muestra la sección completa de la tabla de tareas
// Se revela automáticamente cuando hay tareas para mostrar
export function mostrarSeccionTareas() {
    seccionTareas.classList.remove('hidden');
}

// Muestra el mensaje de "no hay tareas registradas"
// Se llama al inicializar la app y cuando se eliminan todas las tareas
export function mostrarEstadoVacio() {
    mensajeTablaVacia.classList.remove('hidden');
}

// Oculta el mensaje de estado vacío
// Se llama cuando hay al menos una tarea para mostrar en la tabla
export function ocultarEstadoVacio() {
    mensajeTablaVacia.classList.add('hidden');
}

// FUNCIONES DE ACTUALIZACIÓN DE CONTADORES

// Actualiza el texto del contador de tareas en el encabezado de la tabla
// Gestiona correctamente el singular ("1 tarea") y el plural ("2 tareas")
// Parámetro: cantidad — número total actual de tareas en la tabla
export function actualizarContadorTareas(cantidad) {
    const texto = cantidad === 1 ? `${cantidad} tarea` : `${cantidad} tareas`;
    contadorTareas.textContent = texto;
}

// FUNCIONES DE FORMATO DE DATOS

// Convierte el valor técnico del estado a texto legible en español
// Parámetro: estado — el valor del campo status ('pendiente', 'en_progreso', 'completada')
// Retorna: string formateado para mostrar en la tabla al usuario
export function formatearEstadoTarea(estado) {
    switch (estado) {
        case 'pendiente':   return 'Pendiente';
        case 'en_progreso': return 'En Progreso';
        case 'completada':  return 'Completada';
        default:            return estado;
    }
}

// FUNCIONES DE CONSTRUCCIÓN Y MANIPULACIÓN DE LA TABLA

// Crea y retorna una fila completa (TR) con los datos de una tarea
// Incluye las columnas: #, Título, Descripción, Estado, Comentario, Acciones
// Los botones Editar (celeste pastel) y Eliminar (rojo pastel) quedan en la última columna
// Los botones tienen data-id y data-action para que tareasService.js los maneje por delegación
// Parámetros:
//   tarea  — objeto con los datos de la tarea (id, title, description, status, comment, userName)
//   indice — número correlativo para numerar la fila (desde 0)
// Retorna: elemento TR listo para insertar en el DOM
export function crearFilaTarea(tarea, indice) {

    // Se crea el elemento fila y se guarda el id de la tarea como data-attribute
    const fila = document.createElement('tr');
    // dataset.id permite identificar la fila al actualizar o eliminar
    fila.dataset.id = tarea.id;

    // Celda de número correlativo (el usuario ve desde 1, el índice empieza en 0)
    const celdaNumero = document.createElement('td');
    celdaNumero.textContent = indice + 1;

    // Celda del título de la tarea
    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    // Celda de la descripción de la tarea
    const celdaDescripcion = document.createElement('td');
    celdaDescripcion.textContent = tarea.description;

    // Celda del estado con badge visual coloreado según el estado
    const celdaEstado = document.createElement('td');
    const badgeEstado = document.createElement('span');
    // Clase base del badge para el estilo general (padding, border-radius, etc.)
    badgeEstado.classList.add('status-badge');
    // Clase dinámica según el estado para el color (status-pendiente, status-en_progreso, etc.)
    badgeEstado.classList.add(`status-${tarea.status}`);
    badgeEstado.textContent = formatearEstadoTarea(tarea.status);
    celdaEstado.appendChild(badgeEstado);

    // Celda del comentario de la tarea
    // Si la tarea no tiene comentario aún se muestra un guion indicativo
    const celdaComentario = document.createElement('td');
    celdaComentario.textContent = tarea.comment || '—';

    // Celda de acciones: contiene los botones Editar y Eliminar
    const celdaAcciones = document.createElement('td');
    // El contenedor usa flexbox definido en la clase task-actions de styles.css
    const contenedorAcciones = document.createElement('div');
    contenedorAcciones.classList.add('task-actions');

    // Botón de editar (RF-03)
    // btn-action--edit aplica el fondo celeste pastel (#dbeafe) con texto azul oscuro (#1e40af)
    // Estos estilos están definidos en styles.css y respetan la paleta del proyecto
    const botonEditar = document.createElement('button');
    botonEditar.textContent = '✏️ Editar';
    botonEditar.classList.add('btn-action', 'btn-action--edit');
    // data-id y data-action permiten que el handler de delegación en tareasService.js
    // identifique qué tarea y qué acción ejecutar sin necesidad de closures individuales
    botonEditar.dataset.id     = tarea.id;
    botonEditar.dataset.action = 'edit';
    // type="button" evita que el clic dispare un submit si el botón está dentro de un form
    botonEditar.type           = 'button';

    // Botón de eliminar (RF-04)
    // btn-action--delete aplica el fondo rojo pastel (#fee2e2) con texto rojo oscuro (#991b1b)
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

    // Se ensamblan todas las celdas en la fila en el orden que aparecen en el thead del HTML
    fila.appendChild(celdaNumero);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDescripcion);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaComentario);
    fila.appendChild(celdaAcciones);

    // Se retorna la fila completa para que el llamador la inserte en la tabla
    return fila;
}

// Inserta una tarea nueva en la tabla y actualiza los contadores y estados visuales
// Se llama después de que el servidor confirma el registro exitoso o al cargar la tabla
// Parámetros:
//   tarea    — objeto de la tarea (incluye el id asignado por el servidor)
//   contador — índice correlativo para numerar la fila (empieza en 0)
export function agregarTareaATabla(tarea, contador) {

    // Se crea la fila con todos sus datos y botones
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

// Limpia todos los campos del formulario de tareas y sus mensajes de error
// Se llama después de registrar una tarea exitosamente
export function limpiarFormularioTareas() {
    inputTituloTarea.value = '';
    inputDescripcion.value = '';
    selectEstado.value     = '';
    // Se reutiliza limpiarError de utils para no duplicar lógica de limpieza de UI
    limpiarError(errorTitulo,      inputTituloTarea);
    limpiarError(errorDescripcion, inputDescripcion);
    limpiarError(errorEstado,      selectEstado);
}

// RF-03 — ACTUALIZACIÓN EN EL DOM (UPDATE)

// Actualiza visualmente una fila existente con los nuevos datos de la tarea
// Se llama después de que el servidor confirma la actualización exitosa
// Parámetro: tareaActualizada — objeto con los datos actualizados que devuelve el servidor
export function actualizarFilaTarea(tareaActualizada) {

    // Se busca el TR que tenga el data-id igual al ID de la tarea actualizada
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaActualizada.id}"]`);

    // Si no se encontró la fila se registra el aviso en consola y se sale
    if (!fila) {
        console.warn(`No se encontro la fila con id ${tareaActualizada.id} para actualizar`);
        return;
    }

    // Se actualiza el título en la celda índice 1
    fila.cells[1].textContent = tareaActualizada.title;

    // Se actualiza la descripción en la celda índice 2
    fila.cells[2].textContent = tareaActualizada.description;

    // Se actualiza el badge de estado en la celda índice 3
    const celdaEstado = fila.cells[3];
    const badge       = celdaEstado.querySelector('.status-badge');
    // Se remueven todas las clases de estado anteriores para no acumularlas
    badge.classList.remove('status-pendiente', 'status-en_progreso', 'status-completada');
    // Se agrega la clase del nuevo estado
    badge.classList.add(`status-${tareaActualizada.status}`);
    badge.textContent = formatearEstadoTarea(tareaActualizada.status);

    // Se actualiza el comentario en la celda índice 4
    // Si el campo comment llegó vacío del servidor se muestra el guion indicativo
    fila.cells[4].textContent = tareaActualizada.comment || '—';
}

// RF-04 — ELIMINACIÓN EN EL DOM (DELETE)

// Elimina visualmente la fila de una tarea de la tabla
// Se llama después de que el servidor confirma la eliminación exitosa
// Parámetro: tareaId — ID de la tarea cuya fila debe ser eliminada
export function eliminarFilaTarea(tareaId) {

    // Se busca el TR con el data-id de la tarea a eliminar
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaId}"]`);

    // Si no se encontró la fila se registra el aviso en consola y se sale
    if (!fila) {
        console.warn(`No se encontro la fila con id ${tareaId} para eliminar`);
        return;
    }

    // Se elimina la fila del DOM completamente (no solo se oculta)
    fila.remove();

    // Se cuenta las filas que quedan para actualizar el contador
    const filasRestantes = cuerpoDeLaTabla.querySelectorAll('tr').length;
    actualizarContadorTareas(filasRestantes);

    // Si no quedaron más filas se muestra el mensaje de estado vacío
    if (filasRestantes === 0) {
        mostrarEstadoVacio();
    }
}

// RF-03 — MODAL DE EDICIÓN (UPDATE)

// Muestra el modal de edición con los datos actuales de la tarea precargados
// El usuario ve la información actual y solo edita lo que necesita cambiar
// Parámetro: tarea — objeto con los datos actuales de la tarea a editar
export function mostrarModalEdicion(tarea) {

    // Se obtiene el elemento del modal desde el HTML
    const modal = document.getElementById('editModal');

    // Se precargan los campos del modal con los datos actuales de la tarea
    // Así el usuario ve lo que ya tiene antes de modificar
    document.getElementById('editTaskTitle').value       = tarea.title;
    document.getElementById('editTaskDescription').value = tarea.description;
    document.getElementById('editTaskStatus').value      = tarea.status;

    // Se guarda el ID de la tarea en el campo oculto para que el handler del PATCH
    // sepa a qué tarea enviar la actualización al servidor
    document.getElementById('editTaskId').value = tarea.id;

    // Se precarga el comentario si la tarea ya tiene uno guardado
    // El campo es opcional, si no tiene comentario el textarea queda vacío
    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = tarea.comment || '';

    // Se remueve 'hidden' para hacer visible el overlay y el modal
    modal.classList.remove('hidden');
}

// Oculta el modal de edición y limpia todos sus campos
// Se llama cuando el usuario cancela o cuando se guarda exitosamente
export function ocultarModalEdicion() {

    // Se obtiene el elemento del modal desde el HTML
    const modal = document.getElementById('editModal');

    // Se agrega 'hidden' para ocultar el modal y su overlay
    modal.classList.add('hidden');

    // Se limpian todos los campos del formulario del modal para la próxima apertura
    document.getElementById('editTaskTitle').value       = '';
    document.getElementById('editTaskDescription').value = '';
    document.getElementById('editTaskStatus').value      = '';
    document.getElementById('editTaskId').value          = '';

    // Se limpia el campo de comentario si existe en el HTML
    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = '';
}