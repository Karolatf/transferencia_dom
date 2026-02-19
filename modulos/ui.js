// FUNCIONES DE MANIPULACIÓN DEL DOM / INTERFAZ DE USUARIO

// RF-01 READ   -> addTaskToTable, renderTaskList
// RF-02 CREATE -> addTaskToTable, clearTaskForm
// RF-03 UPDATE -> updateTaskRow, showEditModal, hideEditModal
// RF-04 DELETE -> removeTaskRow

// Este módulo contiene todas las funciones que modifican visualmente la interfaz
// Aquí se controla qué secciones se muestran u ocultan, cómo se renderizan
// los datos en pantalla y cómo se construyen dinámicamente los elementos HTML

// Importamos los elementos del DOM que necesitamos manipular visualmente
// Todos vienen del módulo centralizado dom.js para evitar duplicar selecciones
import {
    userDataSection, userIdSpan, userNameSpan, userEmailSpan,
    taskFormSection, tasksSection, tasksCount,
    tasksTableBody, tasksEmptyState,
    taskTitleInput, taskDescriptionInput, taskStatusSelect,
    taskTitleError, taskDescriptionError, taskStatusError
} from './dom.js';

// Importamos clearError desde validation.js para limpiar los campos del formulario de tareas
// Reutilizamos la función en lugar de duplicar la lógica de limpieza
import { clearError } from './validation.js';

// Muestra la sección de datos del usuario y la llena con su información
// Esta función se llama cuando el servidor encuentra exitosamente al usuario buscado
// Parámetro: user - Objeto con los datos del usuario (id, name, email)
export function displayUserData(user) {
    // Removemos la clase 'hidden' para hacer visible la sección de datos del usuario
    // classList.remove() elimina solo esa clase, sin tocar las demás que pueda tener el elemento
    userDataSection.classList.remove('hidden');

    // Insertamos cada dato del usuario en su span correspondiente del HTML
    // Usamos textContent en lugar de innerHTML para insertar solo texto plano (más seguro)
    userIdSpan.textContent    = user.id;    // Mostramos el documento / ID del usuario
    userNameSpan.textContent  = user.name;  // Mostramos el nombre completo
    userEmailSpan.textContent = user.email; // Mostramos el correo electrónico
}

// Oculta la sección de datos del usuario y limpia su contenido
// Se llama cuando se realiza una nueva búsqueda o cuando hay un error
export function hideUserData() {
    // Agregamos la clase 'hidden' para ocultar visualmente toda la sección
    // classList.add() agrega la clase sin eliminar las que ya tiene
    userDataSection.classList.add('hidden');

    // Limpiamos el contenido de cada span asignando strings vacíos
    // Así evitamos que datos de un usuario anterior queden visibles al ocultarse la sección
    userIdSpan.textContent    = '';
    userNameSpan.textContent  = '';
    userEmailSpan.textContent = '';
}

// Muestra la sección del formulario de registro de tareas
// Solo debe llamarse cuando se ha encontrado un usuario válido
export function showTaskForm() {
    // Removemos la clase 'hidden' para revelar el formulario de tareas
    taskFormSection.classList.remove('hidden');
}

// Oculta la sección del formulario de registro de tareas
// Se llama cuando no hay usuario seleccionado o se reinicia la aplicación
export function hideTaskForm() {
    // Agregamos la clase 'hidden' para ocultar el formulario de tareas
    taskFormSection.classList.add('hidden');
}

// Muestra la sección completa que contiene la tabla de tareas registradas
// Se llama automáticamente cuando se agrega la primera tarea a la tabla
export function showTasksSection() {
    // Removemos la clase 'hidden' para hacer visible la sección de tareas
    tasksSection.classList.remove('hidden');
}

// Actualiza el texto del contador de tareas que aparece en el encabezado de la tabla
// Maneja correctamente el singular ("1 tarea") y el plural ("2 tareas")
// Parámetro: count - El número total actual de tareas registradas
export function updateTaskCounter(count) {
    // Usamos un operador ternario para elegir entre singular y plural según la cantidad
    // Si count es exactamente 1, usamos "tarea"; para cualquier otro número, usamos "tareas"
    const text = count === 1 ? `${count} tarea` : `${count} tareas`;

    // Actualizamos el contenido del elemento contador con el texto ya formateado
    tasksCount.textContent = text;
}

// Muestra el mensaje de estado vacío (sin tareas)
// Se llama al inicializar la app y cuando aún no hay tareas registradas
export function showEmptyState() {
    // Removemos la clase 'hidden' para revelar el mensaje de "no hay tareas"
    tasksEmptyState.classList.remove('hidden');
}

// Oculta el mensaje de estado vacío
// Se llama cuando se registra la primera tarea y ya hay contenido en la tabla
export function hideEmptyState() {
    // Agregamos la clase 'hidden' para ocultar el mensaje de estado vacío
    tasksEmptyState.classList.add('hidden');
}

// Convierte el valor técnico del estado de una tarea a texto legible en español
// Parámetro: status - El valor del estado tal como viene del servidor o del select
// Retorna: String formateado y legible para mostrar en la tabla
export function formatTaskStatus(status) {
    // Switch evalúa el valor del status y retorna la etiqueta correspondiente en español
    switch (status) {
        case 'pendiente':
            // Estado inicial de una tarea recién creada
            return 'Pendiente';
        case 'en_progreso':
            // Estado de una tarea que ya se comenzó a trabajar
            return 'En Progreso';
        case 'completada':
            // Estado de una tarea que ya fue terminada
            return 'Completada';
        default:
            // Si el valor no coincide con ninguno de los casos anteriores,
            // retornamos el valor original sin modificar como fallback
            return status;
    }
}

// Crea y retorna una fila completa de tabla (elemento TR) con los datos de una tarea
// Esta función demuestra la creación dinámica de elementos HTML con JavaScript puro
// Parámetros:
//   task  - Objeto con los datos de la tarea (title, description, status, userName)
//   index - Índice de la tarea en el arreglo, usado para numerar la fila
// Retorna: Elemento TR completo con todas sus celdas listas para insertar en el DOM
export function createTaskRow(task, index) {
    // ----- PASO 1: CREAR EL ELEMENTO FILA -----
    // createElement() crea un nuevo elemento HTML del tipo especificado (tr = table row)
    // Este elemento aún no está insertado en el DOM, solo existe en memoria
    const row = document.createElement('tr');

    // Guardamos el ID de la tarea como atributo data en la fila
    // Esto nos permite identificar qué tarea es cuando el usuario haga clic en Editar o Eliminar
    // dataset.id es equivalente a setAttribute('data-id', task.id)
    row.dataset.id = task.id;

    // ----- PASO 2: CREAR Y LLENAR LA CELDA DE NÚMERO -----
    // Creamos una celda de datos (td = table data) para el número correlativo
    const numberCell = document.createElement('td');
    // Sumamos 1 al índice porque los índices del arreglo empiezan en 0 pero mostramos desde 1
    numberCell.textContent = index + 1;

    // ----- PASO 3: CREAR Y LLENAR LA CELDA DE TÍTULO -----
    const titleCell = document.createElement('td');
    // Insertamos el título de la tarea como texto plano en la celda
    titleCell.textContent = task.title;

    // ----- PASO 4: CREAR Y LLENAR LA CELDA DE DESCRIPCIÓN -----
    const descriptionCell = document.createElement('td');
    // Insertamos la descripción de la tarea como texto plano en la celda
    descriptionCell.textContent = task.description;

    // ----- PASO 5: CREAR Y LLENAR LA CELDA DE ESTADO -----
    const statusCell = document.createElement('td');
    // Creamos un span que actuará como badge (etiqueta visual) para el estado
    const statusBadge = document.createElement('span');
    // Agregamos la clase base 'status-badge' que da el estilo general del badge
    statusBadge.classList.add('status-badge');
    // Agregamos una clase dinámica según el estado: status-pendiente, status-en_progreso, status-completada
    // Esta clase determina el color del badge (rojo, amarillo, verde, etc.)
    statusBadge.classList.add(`status-${task.status}`);
    // Insertamos el texto del estado ya formateado al español con formatTaskStatus()
    statusBadge.textContent = formatTaskStatus(task.status);
    // Insertamos el span-badge dentro de la celda de estado
    statusCell.appendChild(statusBadge);

    // ----- PASO 6: CREAR Y LLENAR LA CELDA DE USUARIO -----
    const userCell = document.createElement('td');
    // Insertamos el nombre del usuario que creó la tarea (guardado en el objeto de tarea)
    userCell.textContent = task.userName;

    // ----- PASO 7: CREAR LA CELDA DE ACCIONES (RF-03 y RF-04) -----
    // Esta celda contiene los botones de Editar y Eliminar para el CRUD completo
    const actionsCell = document.createElement('td');
    // Aplicamos la clase CSS que define el layout de los botones de acción
    actionsCell.classList.add('task-actions');

    // --- Botón Editar (RF-03 UPDATE) ---
    const editBtn = document.createElement('button');
    // Clase base de botón de acción más clase específica de editar (color azul)
    editBtn.classList.add('btn-action', 'btn-action--edit');
    // Emoji + texto para que sea intuitivo sin depender de íconos externos
    editBtn.textContent = '✏️ Editar';
    // Guardamos el ID de la tarea en el atributo data del botón
    // Cuando se haga clic, el handler leerá este valor para saber qué tarea editar
    editBtn.dataset.id = task.id;
    // Marcamos el botón con un tipo de acción para identificarlo fácilmente desde el handler
    editBtn.dataset.action = 'edit';

    // --- Botón Eliminar (RF-04 DELETE) ---
    const deleteBtn = document.createElement('button');
    // Clase base de botón de acción más clase específica de eliminar (color rojo)
    deleteBtn.classList.add('btn-action', 'btn-action--delete');
    // Emoji + texto para que sea intuitivo sin depender de íconos externos
    deleteBtn.textContent = '🗑️ Eliminar';
    // Guardamos el ID de la tarea para que el handler sepa cuál eliminar
    deleteBtn.dataset.id = task.id;
    // Marcamos el botón con tipo de acción para el manejador de eventos delegado
    deleteBtn.dataset.action = 'delete';

    // Insertamos ambos botones dentro de la celda de acciones
    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);

    // ----- PASO 8: AGREGAR TODAS LAS CELDAS A LA FILA -----
    // appendChild() inserta cada celda como hijo del elemento fila, en el orden que se agregan
    // El orden aquí determina el orden de las columnas en la tabla
    row.appendChild(numberCell);      // Columna 1: número
    row.appendChild(titleCell);       // Columna 2: título
    row.appendChild(descriptionCell); // Columna 3: descripción
    row.appendChild(statusCell);      // Columna 4: estado (con badge)
    row.appendChild(userCell);        // Columna 5: usuario
    row.appendChild(actionsCell);     // Columna 6: acciones (editar / eliminar) ← NUEVO

    // ----- PASO 9: RETORNAR LA FILA COMPLETA -----
    // Retornamos el TR ya ensamblado con todas sus celdas para que addTaskToTable() lo inserte
    return row;
}

// Agrega una nueva tarea a la tabla en el DOM y actualiza todos los elementos relacionados
// Orquesta la creación de la fila, la inserción, el contador y los estados visuales
// Parámetros:
//   task    - Objeto con los datos de la tarea a mostrar en la tabla
//   counter - Valor actual del contador (antes de incrementar) para numerar la fila
export function addTaskToTable(task, counter) {
    // ----- PASO 1: CREAR LA FILA -----
    // Llamamos a createTaskRow() para construir el elemento TR con todas sus celdas
    // Pasamos el contador actual como índice para que la fila muestre el número correcto
    const taskRow = createTaskRow(task, counter);

    // ----- PASO 2: INSERTAR LA FILA EN LA TABLA -----
    // appendChild() inserta la nueva fila al final del tbody de la tabla
    // Cada nueva tarea aparecerá debajo de las anteriores
    tasksTableBody.appendChild(taskRow);

    // ----- PASO 3: ACTUALIZAR EL CONTADOR VISUAL -----
    // Actualizamos el texto del encabezado que muestra cuántas tareas hay en total
    // Sumamos 1 al counter porque ya se incrementó en el handler antes de llamar esta función
    updateTaskCounter(counter + 1);

    // ----- PASO 4: OCULTAR EL ESTADO VACÍO -----
    // Como ya hay al menos una tarea, ocultamos el mensaje de "no hay tareas"
    hideEmptyState();

    // ----- PASO 5: MOSTRAR LA SECCIÓN DE TAREAS -----
    // Nos aseguramos de que la sección de tareas esté visible (por si era la primera tarea)
    showTasksSection();
}

// Limpia todos los campos del formulario de tareas y sus mensajes de error
// Se llama después de registrar una tarea exitosamente para dejar el formulario listo
export function clearTaskForm() {
    // Limpiamos el campo de título asignando un string vacío
    taskTitleInput.value = '';

    // Limpiamos el campo de descripción asignando un string vacío
    taskDescriptionInput.value = '';

    // Reseteamos el select de estado a su opción por defecto (sin selección)
    taskStatusSelect.value = '';

    // Limpiamos los mensajes de error y estilos de cada campo por si quedaron de una validación previa
    clearError(taskTitleError, taskTitleInput);
    clearError(taskDescriptionError, taskDescriptionInput);
    clearError(taskStatusError, taskStatusSelect);
}

// RF-03 – ACTUALIZACIÓN DE TAREAS EN EL DOM (UPDATE)

// Actualiza visualmente una fila existente de la tabla con los nuevos datos de la tarea
// Se llama después de que el servidor confirma la actualización exitosa (RF-03)
// De esta manera el DOM queda sincronizado con la información real del servidor
// Parámetro: updatedTask - Objeto con los datos actualizados que devuelve el servidor
export function updateTaskRow(updatedTask) {
    // ----- PASO 1: ENCONTRAR LA FILA EN EL DOM -----
    // Buscamos el TR que tenga el data-id igual al ID de la tarea actualizada
    // Esta es la razón por la que guardamos el ID como data-attribute al crear la fila
    const row = tasksTableBody.querySelector(`tr[data-id="${updatedTask.id}"]`);

    // ----- PASO 2: VERIFICAR QUE LA FILA EXISTE -----
    // Si la fila no se encuentra, salimos para evitar un error de referencia nula
    if (!row) {
        console.warn(`No se encontró la fila con id ${updatedTask.id} para actualizar`);
        return;
    }

    // ----- PASO 3: ACTUALIZAR LA CELDA DE TÍTULO -----
    // Seleccionamos la segunda celda (índice 1) que corresponde al título
    // nth-child(2) sería el selector CSS equivalente, pero con JS usamos el índice del array
    row.cells[1].textContent = updatedTask.title;

    // ----- PASO 4: ACTUALIZAR LA CELDA DE DESCRIPCIÓN -----
    // La descripción está en la tercera celda (índice 2)
    row.cells[2].textContent = updatedTask.description;

    // ----- PASO 5: ACTUALIZAR LA CELDA DE ESTADO -----
    // El badge de estado es un span dentro de la cuarta celda (índice 3)
    // Necesitamos actualizar tanto el texto como las clases CSS del badge
    const statusCell  = row.cells[3];
    const statusBadge = statusCell.querySelector('.status-badge');

    // Removemos todas las clases de estado anteriores para aplicar la nueva correctamente
    // Usamos un arreglo de todos los estados posibles para limpiar cualquiera que esté activo
    statusBadge.classList.remove('status-pendiente', 'status-en_progreso', 'status-completada');

    // Agregamos la clase del nuevo estado para aplicar el color correcto
    statusBadge.classList.add(`status-${updatedTask.status}`);

    // Actualizamos el texto del badge con el estado ya formateado al español
    statusBadge.textContent = formatTaskStatus(updatedTask.status);
}

// RF-04 – ELIMINACIÓN DE TAREAS EN EL DOM (DELETE)

// Elimina visualmente la fila de una tarea de la tabla del DOM
// Se llama después de que el servidor confirma la eliminación exitosa (RF-04)
// También actualiza el contador y muestra el estado vacío si ya no quedan tareas
// Parámetro: taskId - ID de la tarea cuya fila debe ser eliminada del DOM
export function removeTaskRow(taskId) {
    // ----- PASO 1: ENCONTRAR LA FILA EN EL DOM -----
    // Buscamos la fila usando el atributo data-id que asignamos al crearla
    const row = tasksTableBody.querySelector(`tr[data-id="${taskId}"]`);

    // ----- PASO 2: VERIFICAR QUE LA FILA EXISTE -----
    // Protegemos el código ante el caso de que la fila ya no esté en el DOM
    if (!row) {
        console.warn(`No se encontró la fila con id ${taskId} para eliminar`);
        return;
    }

    // ----- PASO 3: ELIMINAR LA FILA DEL DOM -----
    // remove() extrae el elemento del DOM completamente (no solo lo oculta)
    row.remove();

    // ----- PASO 4: VERIFICAR SI QUEDARON FILAS -----
    // Contamos cuántas filas (TR) quedan en el tbody después de la eliminación
    const rowsRemaining = tasksTableBody.querySelectorAll('tr').length;

    // ----- PASO 5: ACTUALIZAR EL CONTADOR VISUAL -----
    // Actualizamos el texto del encabezado con el nuevo total de tareas
    updateTaskCounter(rowsRemaining);

    // ----- PASO 6: MOSTRAR ESTADO VACÍO SI NO HAY TAREAS -----
    // Si no quedaron más filas, mostramos el mensaje de "no hay tareas"
    if (rowsRemaining === 0) {
        showEmptyState();
    }
}

// RF-03 – MODAL DE EDICIÓN (UPDATE)

// Muestra el modal de edición con los datos actuales de la tarea precargados
// Permite al usuario ver y modificar la información antes de guardar
// Parámetro: task - Objeto con los datos actuales de la tarea a editar
export function showEditModal(task) {
    // ----- PASO 1: OBTENER EL MODAL DEL DOM -----
    // Seleccionamos el elemento del modal que creamos en el HTML
    const modal = document.getElementById('editModal');

    // ----- PASO 2: PRECARGAR LOS DATOS ACTUALES DE LA TAREA -----
    // Llenamos cada campo del formulario del modal con los valores actuales de la tarea
    // Así el usuario puede ver qué información tiene y qué quiere cambiar

    // Precargamos el título actual en el input de edición
    document.getElementById('editTaskTitle').value = task.title;

    // Precargamos la descripción actual en el textarea de edición
    document.getElementById('editTaskDescription').value = task.description;

    // Precargamos el estado actual en el select de edición
    document.getElementById('editTaskStatus').value = task.status;

    // ----- PASO 3: GUARDAR EL ID DE LA TAREA EN EL FORMULARIO -----
    // Usamos un campo oculto para rastrear qué tarea se está editando
    // Así el handler sabe a qué ID enviar el PATCH cuando el usuario guarde
    document.getElementById('editTaskId').value = task.id;

    // ----- PASO 4: MOSTRAR EL MODAL -----
    // Removemos la clase 'hidden' para hacer visible el overlay y el modal
    modal.classList.remove('hidden');
}

// Oculta el modal de edición y limpia sus campos
// Se llama cuando el usuario cancela la edición o cuando se guarda exitosamente
export function hideEditModal() {
    // ----- PASO 1: OBTENER EL MODAL DEL DOM -----
    const modal = document.getElementById('editModal');

    // ----- PASO 2: OCULTAR EL MODAL -----
    // Agregamos la clase 'hidden' para ocultar el overlay y el modal
    modal.classList.add('hidden');

    // ----- PASO 3: LIMPIAR LOS CAMPOS DEL FORMULARIO DEL MODAL -----
    // Dejamos los campos vacíos para la próxima vez que se abra el modal
    document.getElementById('editTaskTitle').value = '';
    document.getElementById('editTaskDescription').value = '';
    document.getElementById('editTaskStatus').value = '';
    document.getElementById('editTaskId').value = '';
}