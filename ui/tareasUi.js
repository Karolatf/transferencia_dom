// MÓDULO: ui/tareasUI.js
// CAPA:   UI (Manipulación visual de la interfaz)

// Responsabilidad ÚNICA: controlar lo que el usuario ve en pantalla.
// Muestra, oculta y actualiza secciones, construye filas de tabla
// y gestiona el modal de edición.

// REGLAS de esta capa:
//   - SÍ puede leer y escribir en el DOM
//   - SÍ puede importar de utils/
//   - NO puede importar de api/ (la UI no conoce al servidor)
//   - NO puede importar de services/ (evita dependencias circulares)

// RF-01 READ   -> mostrarDatosUsuario, agregarTareaATabla
// RF-02 CREATE -> agregarTareaATabla, limpiarFormularioTareas
// RF-03 UPDATE -> actualizarFilaTarea, mostrarModalEdicion, ocultarModalEdicion
// RF-04 DELETE -> eliminarFilaTarea

// Dependencias: utils/validaciones.js (para limpiarError al resetear formularios)

// Importamos limpiarError desde la capa de utils para usarla al resetear formularios
// Reutilizamos la función en lugar de duplicar esa lógica aquí
import { limpiarError } from '../utils/validaciones.js';

// SELECCIÓN DE ELEMENTOS DEL DOM

// Centralizamos las selecciones aquí dentro del módulo UI para
// que solo esta capa conozca la estructura visual del HTML.
// Si un ID cambia en el HTML, solo se actualiza en este módulo.

// ----- Sección de datos del usuario -----
const seccionDatosUsuario = document.getElementById('userDataSection');
const spanIdUsuario        = document.getElementById('userId');
const spanNombreUsuario    = document.getElementById('userName');
const spanEmailUsuario     = document.getElementById('userEmail');

// ----- Sección del formulario de tareas -----
const seccionFormTareas   = document.getElementById('taskFormSection');
const inputTituloTarea    = document.getElementById('taskTitle');
const inputDescripcion    = document.getElementById('taskDescription');
const selectEstado        = document.getElementById('taskStatus');
const errorTitulo         = document.getElementById('taskTitleError');
const errorDescripcion    = document.getElementById('taskDescriptionError');
const errorEstado         = document.getElementById('taskStatusError');

// ----- Sección de la tabla de tareas -----
const seccionTareas       = document.getElementById('tasksSection');
const contadorTareas      = document.getElementById('tasksCount');
const cuerpoDeLaTabla     = document.getElementById('tasksTableBody');
const mensajeTablaVacia   = document.getElementById('tasksEmptyState');

// FUNCIONES DE CONTROL DE VISIBILIDAD

// Muestra la sección de datos del usuario y la llena con su información
// Se llama cuando el servidor retorna exitosamente el usuario buscado
// Parámetro: usuario - Objeto con los campos id, name, email del usuario encontrado
export function mostrarDatosUsuario(usuario) {
    // Removemos 'hidden' para hacer visible la sección de datos del usuario
    // classList.remove() no afecta las demás clases que el elemento pueda tener
    seccionDatosUsuario.classList.remove('hidden');

    // Llenamos cada span con el dato correspondiente del objeto usuario
    // Usamos textContent (no innerHTML) para evitar inyección de HTML malicioso
    spanIdUsuario.textContent     = usuario.id;
    spanNombreUsuario.textContent = usuario.name;
    spanEmailUsuario.textContent  = usuario.email;
}

// Oculta y limpia la sección de datos del usuario
// Se llama al iniciar una nueva búsqueda para evitar mostrar datos del anterior
export function ocultarDatosUsuario() {
    // Agregamos 'hidden' para que el CSS oculte la sección visualmente
    seccionDatosUsuario.classList.add('hidden');

    // Vaciamos el contenido de cada span para que no queden datos del usuario anterior
    spanIdUsuario.textContent     = '';
    spanNombreUsuario.textContent = '';
    spanEmailUsuario.textContent  = '';
}

// Muestra el formulario de registro de tareas
// Solo se debe llamar cuando hay un usuario válido seleccionado
export function mostrarFormularioTareas() {
    seccionFormTareas.classList.remove('hidden');
}

// Oculta el formulario de registro de tareas
// Se llama cuando no hay usuario activo o al reiniciar la aplicación
export function ocultarFormularioTareas() {
    seccionFormTareas.classList.add('hidden');
}

// Muestra la sección completa de la tabla de tareas
// Se revela automáticamente cuando se agrega la primera tarea
export function mostrarSeccionTareas() {
    seccionTareas.classList.remove('hidden');
}

// Muestra el mensaje de "no hay tareas registradas"
// Se llama al inicializar la app y cuando se eliminan todas las tareas
export function mostrarEstadoVacio() {
    mensajeTablaVacia.classList.remove('hidden');
}

// Oculta el mensaje de estado vacío
// Se llama cuando hay al menos una tarea en la tabla
export function ocultarEstadoVacio() {
    mensajeTablaVacia.classList.add('hidden');
}

// FUNCIONES DE ACTUALIZACIÓN DE CONTADORES

// Actualiza el texto del contador de tareas en el encabezado de la tabla
// Gestiona correctamente el singular ("1 tarea") y el plural ("2 tareas")
// Parámetro: cantidad - El número total actual de tareas en la tabla
export function actualizarContadorTareas(cantidad) {
    // Ternario para elegir entre singular y plural según la cantidad
    const texto = cantidad === 1 ? `${cantidad} tarea` : `${cantidad} tareas`;
    contadorTareas.textContent = texto;
}

// FUNCIONES DE FORMATO DE DATOS

// Convierte el valor técnico del estado a texto legible en español
// Parámetro: estado - El valor tal como viene del servidor ('pendiente', 'en_progreso', etc.)
// Retorna: String formateado para mostrar en la tabla al usuario
export function formatearEstadoTarea(estado) {
    // Switch evalúa el estado y retorna la etiqueta correspondiente
    switch (estado) {
        case 'pendiente':
            return 'Pendiente';
        case 'en_progreso':
            return 'En Progreso';
        case 'completada':
            return 'Completada';
        default:
            // Si el valor no coincide con ningún caso, retornamos el original como fallback
            return estado;
    }
}

// FUNCIONES DE CONSTRUCCIÓN Y MANIPULACIÓN DE LA TABLA

// Crea y retorna una fila completa de tabla (TR) con los datos de una tarea
// Demuestra la creación dinámica de elementos HTML con JavaScript puro (sin innerHTML)
// Parámetros:
//   tarea  - Objeto con los datos de la tarea (title, description, status, userName)
//   indice - Índice numérico para numerar la fila correlativamente (desde 0)
// Retorna: Elemento TR listo para insertar en el DOM
export function crearFilaTarea(tarea, indice) {
    // ----- PASO 1: CREAR EL ELEMENTO FILA -----
    // createElement() crea un nuevo elemento en memoria (aún no está en el DOM)
    const fila = document.createElement('tr');
    // Guardamos el ID de la tarea en un atributo data para identificarla después
    // dataset.id es equivalente a setAttribute('data-id', tarea.id)
    fila.dataset.id = tarea.id;

    // ----- PASO 2: CELDA DE NÚMERO CORRELATIVO -----
    const celdaNumero = document.createElement('td');
    // Sumamos 1 porque los índices empiezan en 0 pero mostramos desde 1
    celdaNumero.textContent = indice + 1;

    // ----- PASO 3: CELDA DE TÍTULO -----
    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    // ----- PASO 4: CELDA DE DESCRIPCIÓN -----
    const celdaDescripcion = document.createElement('td');
    celdaDescripcion.textContent = tarea.description;

    // ----- PASO 5: CELDA DE ESTADO (con badge visual) -----
    const celdaEstado = document.createElement('td');
    // Creamos un span que actuará como badge (etiqueta con color) para el estado
    const badgeEstado = document.createElement('span');
    // Clase base que aplica el estilo general del badge (padding, border-radius, etc.)
    badgeEstado.classList.add('status-badge');
    // Clase dinámica según el estado para aplicar el color correcto (ej: status-pendiente)
    badgeEstado.classList.add(`status-${tarea.status}`);
    // Texto legible del estado formateado al español
    badgeEstado.textContent = formatearEstadoTarea(tarea.status);
    celdaEstado.appendChild(badgeEstado);

    // ----- PASO 6: CELDA DE NOMBRE DE USUARIO -----
    const celdaUsuario = document.createElement('td');
    celdaUsuario.textContent = tarea.userName;

    // ----- PASO 7: CELDA DE ACCIONES (botones Editar y Eliminar) -----
    const celdaAcciones = document.createElement('td');

    // El contenedor usa la clase 'task-actions' definida en styles.css
    // que aplica display:flex para alinear los botones en fila con gap
    const contenedorAcciones = document.createElement('div');
    contenedorAcciones.classList.add('task-actions');

    // Botón de editar (RF-03)
    // Usa las clases 'btn-action btn-action--edit' definidas en styles.css
    // que le dan el fondo azul pastel con texto azul oscuro
    const botonEditar = document.createElement('button');
    botonEditar.textContent = '✏️ Editar';
    botonEditar.classList.add('btn-action', 'btn-action--edit');
    // Guardamos el ID de la tarea y la acción en atributos data
    // El handler de la tabla leerá estos atributos para saber qué hacer
    botonEditar.dataset.id     = tarea.id;
    botonEditar.dataset.action = 'edit';
    botonEditar.type           = 'button'; // Evita que dispare submit si está dentro de un form

    // Botón de eliminar (RF-04)
    // Usa 'btn-action btn-action--delete': fondo rojo pastel con texto rojo oscuro
    const botonEliminar = document.createElement('button');
    botonEliminar.textContent = '🗑️ Eliminar';
    botonEliminar.classList.add('btn-action', 'btn-action--delete');
    botonEliminar.dataset.id     = tarea.id;
    botonEliminar.dataset.action = 'delete';
    botonEliminar.type           = 'button'; // Evita que dispare submit si está dentro de un form

    // Insertamos ambos botones en el div contenedor y este en la celda
    contenedorAcciones.appendChild(botonEditar);
    contenedorAcciones.appendChild(botonEliminar);
    celdaAcciones.appendChild(contenedorAcciones);

    // ----- PASO 8: ENSAMBLAR LA FILA -----
    // appendChild() inserta cada celda en orden dentro de la fila
    fila.appendChild(celdaNumero);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDescripcion);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaUsuario);
    fila.appendChild(celdaAcciones);

    // Retornamos la fila completa para que el llamador la inserte en la tabla
    return fila;
}

// Inserta una tarea nueva en la tabla y actualiza los contadores y estados visuales
// Se llama después de que el servidor confirma el registro exitoso (RF-02)
// Parámetros:
//   tarea    - Objeto de la tarea retornado por el servidor (incluye el ID generado)
//   contador - Número correlativo actual de tareas (para numerar la fila)
export function agregarTareaATabla(tarea, contador) {
    // ----- PASO 1: CREAR LA FILA -----
    // Usamos el contador actual como índice para numerar la fila (contador empieza en 0)
    const nuevaFila = crearFilaTarea(tarea, contador);

    // ----- PASO 2: INSERTAR LA FILA EN LA TABLA -----
    // appendChild() agrega la fila al final del tbody de la tabla
    cuerpoDeLaTabla.appendChild(nuevaFila);

    // ----- PASO 3: ACTUALIZAR EL CONTADOR VISUAL -----
    // Mostramos el nuevo total de tareas en el encabezado de la sección
    // Sumamos 1 al contador porque el incremento ya se hizo en el service antes de llamar aquí
    actualizarContadorTareas(contador + 1);

    // ----- PASO 4: OCULTAR EL ESTADO VACÍO -----
    // Como ya hay al menos una tarea, ocultamos el mensaje de "no hay tareas"
    ocultarEstadoVacio();

    // ----- PASO 5: MOSTRAR LA SECCIÓN DE TAREAS -----
    // Revelamos la sección completa si era la primera tarea registrada
    mostrarSeccionTareas();
}

// Limpia todos los campos del formulario de tareas y sus mensajes de error
// Se llama después de registrar una tarea exitosamente (RF-02)
export function limpiarFormularioTareas() {
    // Vaciamos cada campo del formulario asignando string vacío
    inputTituloTarea.value = '';
    inputDescripcion.value = '';
    selectEstado.value     = '';

    // Limpiamos los mensajes de error y estilos de error de cada campo
    // Reutilizamos limpiarError de la capa de utils para no duplicar lógica
    limpiarError(errorTitulo,      inputTituloTarea);
    limpiarError(errorDescripcion, inputDescripcion);
    limpiarError(errorEstado,      selectEstado);
}

// RF-03 – ACTUALIZACIÓN EN EL DOM (UPDATE)

// Actualiza visualmente una fila existente con los nuevos datos de la tarea
// Se llama después de que el servidor confirma la actualización exitosa
// Parámetro: tareaActualizada - Objeto con los datos actualizados que devuelve el servidor
export function actualizarFilaTarea(tareaActualizada) {
    // ----- PASO 1: ENCONTRAR LA FILA EN EL DOM -----
    // Buscamos el TR que tenga el data-id igual al ID de la tarea actualizada
    // Esta es la razón por la que guardamos el ID como data-attribute al crear la fila
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaActualizada.id}"]`);

    // ----- PASO 2: VERIFICAR QUE LA FILA EXISTE -----
    if (!fila) {
        console.warn(`⚠️ No se encontró la fila con id ${tareaActualizada.id} para actualizar`);
        return;
    }

    // ----- PASO 3: ACTUALIZAR TÍTULO (celda índice 1) -----
    fila.cells[1].textContent = tareaActualizada.title;

    // ----- PASO 4: ACTUALIZAR DESCRIPCIÓN (celda índice 2) -----
    fila.cells[2].textContent = tareaActualizada.description;

    // ----- PASO 5: ACTUALIZAR EL BADGE DE ESTADO (celda índice 3) -----
    const celdaEstado = fila.cells[3];
    const badge       = celdaEstado.querySelector('.status-badge');

    // Removemos todas las clases de estado anteriores para evitar acumulación
    badge.classList.remove('status-pendiente', 'status-en_progreso', 'status-completada');

    // Agregamos la clase del nuevo estado para aplicar el color correcto
    badge.classList.add(`status-${tareaActualizada.status}`);

    // Actualizamos el texto del badge al nuevo estado en español
    badge.textContent = formatearEstadoTarea(tareaActualizada.status);
}

// RF-04 – ELIMINACIÓN EN EL DOM (DELETE)

// Elimina visualmente la fila de una tarea de la tabla
// Se llama después de que el servidor confirma la eliminación exitosa
// También actualiza el contador y muestra el estado vacío si ya no quedan tareas
// Parámetro: tareaId - ID de la tarea cuya fila debe ser eliminada
export function eliminarFilaTarea(tareaId) {
    // ----- PASO 1: ENCONTRAR LA FILA EN EL DOM -----
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaId}"]`);

    // ----- PASO 2: VERIFICAR QUE LA FILA EXISTE -----
    if (!fila) {
        console.warn(`⚠️ No se encontró la fila con id ${tareaId} para eliminar`);
        return;
    }

    // ----- PASO 3: ELIMINAR LA FILA DEL DOM -----
    // remove() extrae el elemento del DOM completamente (no solo lo oculta)
    fila.remove();

    // ----- PASO 4: CONTAR LAS FILAS RESTANTES -----
    const filasRestantes = cuerpoDeLaTabla.querySelectorAll('tr').length;

    // ----- PASO 5: ACTUALIZAR EL CONTADOR VISUAL -----
    actualizarContadorTareas(filasRestantes);

    // ----- PASO 6: MOSTRAR ESTADO VACÍO SI NO HAY TAREAS -----
    // Si no quedaron más filas, mostramos el mensaje de "no hay tareas"
    if (filasRestantes === 0) {
        mostrarEstadoVacio();
    }
}

// RF-03 – MODAL DE EDICIÓN (UPDATE)

// Muestra el modal de edición con los datos actuales de la tarea precargados
// Permite al usuario ver la información existente y decidir qué modificar
// Parámetro: tarea - Objeto con los datos actuales de la tarea a editar
export function mostrarModalEdicion(tarea) {
    // ----- PASO 1: OBTENER EL MODAL DEL DOM -----
    const modal = document.getElementById('editModal');

    // ----- PASO 2: PRECARGAR LOS DATOS ACTUALES EN LOS CAMPOS DEL MODAL -----
    // El usuario ve lo que ya tiene y solo cambia lo que necesita
    document.getElementById('editTaskTitle').value       = tarea.title;
    document.getElementById('editTaskDescription').value = tarea.description;
    document.getElementById('editTaskStatus').value      = tarea.status;

    // ----- PASO 3: GUARDAR EL ID EN UN CAMPO OCULTO -----
    // Así el handler de guardar sabe a qué tarea enviar el PATCH
    document.getElementById('editTaskId').value = tarea.id;

    // ----- PASO 4: REVELAR EL MODAL -----
    // Removemos 'hidden' para hacer visible el overlay y el modal
    modal.classList.remove('hidden');
}

// Oculta el modal de edición y limpia sus campos
// Se llama cuando el usuario cancela o cuando se guarda exitosamente
export function ocultarModalEdicion() {
    // ----- PASO 1: OBTENER EL MODAL DEL DOM -----
    const modal = document.getElementById('editModal');

    // ----- PASO 2: OCULTAR EL MODAL -----
    modal.classList.add('hidden');

    // ----- PASO 3: LIMPIAR LOS CAMPOS DEL FORMULARIO DEL MODAL -----
    // Dejamos los campos vacíos para la próxima apertura del modal
    document.getElementById('editTaskTitle').value       = '';
    document.getElementById('editTaskDescription').value = '';
    document.getElementById('editTaskStatus').value      = '';
    document.getElementById('editTaskId').value          = '';
}