// MANEJADORES DE EVENTOS

// RF-01 READ   -> handleSearchFormSubmit (busca usuario)
// RF-02 CREATE -> handleTaskFormSubmit   (crea tarea)
// RF-03 UPDATE -> handleEditTask         (abre modal y guarda edición)
// RF-04 DELETE -> handleDeleteTask       (confirma y elimina)

// Este módulo contiene las funciones que responden a las acciones del usuario
// Como los eventos de submit, input y change de los formularios
// Cada handler orquesta la validación, la lógica de negocio y la actualización de la UI

// Importamos los elementos del DOM necesarios para leer valores y mostrar errores
import {
    userDocumentInput, userDocumentError,
    taskTitleInput, taskDescriptionInput, taskStatusSelect,
    taskTitleError, taskDescriptionError, taskStatusError
} from './dom.js';

// Importamos las funciones de validación para verificar los formularios antes de procesarlos
import { validateSearchForm, validateTaskForm, showError, clearError } from './validation.js';

// Importamos las funciones de UI para mostrar datos y controlar la visibilidad de secciones
// También se importan las nuevas funciones para actualizar y eliminar filas del DOM (RF-03 y RF-04)
import {
    displayUserData, showTaskForm, addTaskToTable, clearTaskForm,
    hideUserData, hideTaskForm,
    updateTaskRow,   // Actualiza una fila existente en la tabla ← NUEVO (RF-03)
    removeTaskRow,   // Elimina una fila de la tabla              ← NUEVO (RF-04)
    showEditModal,   // Muestra el modal de edición               ← NUEVO (RF-03)
    hideEditModal    // Oculta el modal de edición                ← NUEVO (RF-03)
} from './ui.js';

// Importamos las funciones de API, incluyendo las nuevas de actualizar y eliminar (RF-03 y RF-04)
import {
    searchUserByDocument,
    registerTask,
    updateTask,  // Envía PATCH al servidor ← NUEVO (RF-03)
    deleteTask   // Envía DELETE al servidor ← NUEVO (RF-04)
} from './api.js';

// Importamos el estado global y sus funciones de modificación
// Usamos las funciones setter en lugar de modificar las variables directamente
import {
    currentUser, setCurrentUser, resetState,
    addTask, taskCounter, incrementTaskCounter,
    removeTaskFromState,  // Elimina una tarea del arreglo local ← NUEVO (RF-04)
    updateTaskInState     // Actualiza una tarea en el arreglo local ← NUEVO (RF-03)
} from './state.js';

// Función auxiliar que reinicia el estado de la aplicación a su punto inicial
// Se ejecuta antes de cada nueva búsqueda para limpiar datos del usuario anterior
function resetApplicationState() {
    // Llamamos a resetState() del módulo de estado para limpiar currentUser
    resetState();

    // Ocultamos y vaciamos la sección de datos del usuario anterior
    hideUserData();

    // Ocultamos el formulario de tareas porque ya no hay usuario activo
    hideTaskForm();
}

// Maneja el evento submit del formulario de búsqueda de usuario
// Esta función se ejecuta cuando el usuario hace clic en el botón "Buscar" o presiona Enter
// Es async porque necesita esperar la respuesta del servidor con await
// Parámetro: event - El objeto Event generado automáticamente por el navegador al enviar el formulario
export async function handleSearchFormSubmit(event) {
    // ----- PASO 1: PREVENIR COMPORTAMIENTO POR DEFECTO -----
    // Por defecto, al enviar un formulario el navegador recarga la página
    // preventDefault() cancela esa recarga para que manejemos el envío con JavaScript
    event.preventDefault();

    // ----- PASO 2: VALIDAR EL FORMULARIO -----
    // Verificamos que el campo de documento tenga un valor antes de hacer la petición
    const isValid = validateSearchForm();

    // Si la validación falla (campo vacío), detenemos la ejecución aquí
    // No tiene sentido buscar si no hay documento ingresado
    if (!isValid) return;

    // ----- PASO 3: OBTENER EL VALOR DEL DOCUMENTO -----
    // Leemos el valor del input y usamos trim() para eliminar espacios accidentales
    const documentValue = userDocumentInput.value.trim();

    // ----- PASO 4: REINICIAR EL ESTADO DE LA APLICACIÓN -----
    // Antes de buscar, limpiamos los datos del usuario anterior si los había
    // Esto evita que queden datos viejos visible mientras se espera la respuesta
    resetApplicationState();

    // ----- PASO 5: BUSCAR EL USUARIO EN EL SERVIDOR -----
    // Llamamos a la función asíncrona que consulta la API
    // 'await' pausa aquí hasta recibir la respuesta del servidor
    const user = await searchUserByDocument(documentValue);

    // ----- PASO 6: VERIFICAR SI SE ENCONTRÓ EL USUARIO -----
    if (user) {
        // ----- USUARIO ENCONTRADO -----

        // Guardamos el usuario encontrado en el estado global de la aplicación
        // Usamos el setter para modificar la variable de estado correctamente
        setCurrentUser(user);

        // Mostramos los datos del usuario en la sección correspondiente de la interfaz
        displayUserData(user);

        // Habilitamos y mostramos el formulario para registrar tareas de este usuario
        showTaskForm();

        // Limpiamos el input de búsqueda para que el usuario pueda hacer otra consulta
        userDocumentInput.value = '';

        // Limpiamos cualquier mensaje de error que pueda haber quedado del intento anterior
        clearError(userDocumentError, userDocumentInput);

    } else {
        // ----- USUARIO NO ENCONTRADO -----

        // Mostramos un mensaje de error debajo del campo de documento
        showError(
            userDocumentError,
            userDocumentInput,
            'No se encontró ningún usuario con ese documento'
        );

        // Aseguramos que el estado quede limpio sin usuario activo
        setCurrentUser(null);
    }
}

// Maneja el evento submit del formulario de registro de tareas
// Esta función se ejecuta cuando el usuario hace clic en "Registrar Tarea"
// Es async porque necesita esperar la respuesta del servidor con await
// Parámetro: event - El objeto Event generado al enviar el formulario de tareas
export async function handleTaskFormSubmit(event) {
    // ----- PASO 1: PREVENIR COMPORTAMIENTO POR DEFECTO -----
    // Evitamos que el formulario recargue la página al enviarse
    event.preventDefault();

    // ----- PASO 2: VERIFICAR QUE HAY UN USUARIO SELECCIONADO -----
    // No tiene sentido registrar una tarea si no hay usuario activo
    // currentUser es null si no se ha buscado ningún usuario o si la búsqueda falló
    if (!currentUser) {
        // Alertamos al usuario sobre el requisito previo
        alert('Primero debes buscar y seleccionar un usuario');
        // Detenemos la ejecución sin procesar el formulario
        return;
    }

    // ----- PASO 3: VALIDAR EL FORMULARIO -----
    // Verificamos que todos los campos de la tarea tengan valores válidos
    const isValid = validateTaskForm();

    // Si algún campo falla la validación, detenemos la ejecución
    // La función validateTaskForm() ya se encarga de mostrar los errores en pantalla
    if (!isValid) return;

    // ----- PASO 4: OBTENER LOS VALORES DE LOS CAMPOS -----
    // Leemos y limpiamos (trim) el valor de cada campo del formulario
    const title       = taskTitleInput.value.trim();       // Título de la tarea
    const description = taskDescriptionInput.value.trim(); // Descripción detallada
    const status      = taskStatusSelect.value;            // Estado seleccionado (no necesita trim)

    // ----- PASO 5: CONSTRUIR EL OBJETO DE TAREA -----
    // Armamos el objeto con toda la información que el servidor necesita para crear la tarea
    const taskData = {
        title,                           // Título de la tarea (shorthand de title: title)
        description,                     // Descripción de la tarea
        status,                          // Estado: 'pendiente', 'en_progreso' o 'completada'
        userId:    currentUser.id,       // ID del usuario que crea la tarea (del estado global)
        userName:  currentUser.name,     // Nombre del usuario (para mostrarlo en la tabla sin otra consulta)
        completed: status === 'completada' // Campo booleano derivado del estado, para compatibilidad
    };

    // ----- PASO 6: REGISTRAR LA TAREA EN EL SERVIDOR -----
    // Enviamos el objeto de tarea al servidor y esperamos la respuesta
    // Si tuvo éxito, el servidor retorna el objeto creado con su ID asignado
    const createdTask = await registerTask(taskData);

    // ----- PASO 7: VERIFICAR SI SE REGISTRÓ EXITOSAMENTE -----
    if (createdTask) {
        // ----- TAREA REGISTRADA EXITOSAMENTE -----

        // Guardamos la tarea en el arreglo local de tareas (estado global)
        addTask(createdTask);

        // Agregamos la fila de la tarea a la tabla del DOM
        // Pasamos taskCounter ANTES de incrementarlo para usar el índice correcto
        addTaskToTable(createdTask, taskCounter);

        // Incrementamos el contador global de tareas para la próxima inserción
        incrementTaskCounter();

        // Limpiamos el formulario para que el usuario pueda registrar otra tarea
        clearTaskForm();

        // Notificamos al usuario que la tarea fue creada con éxito
        alert('Tarea registrada exitosamente');

    } else {
        // ----- ERROR AL REGISTRAR LA TAREA -----
        // La función registerTask() retornó null, lo que indica un error en la petición
        alert('Error al registrar la tarea. Por favor, intenta nuevamente.');
    }
}

// Maneja el evento input del campo de documento en el formulario de búsqueda
// Se ejecuta automáticamente cada vez que el usuario escribe o borra un carácter
// Su propósito es limpiar el error del campo en tiempo real mientras el usuario corrige
export function handleSearchInputChange() {
    // Limpiamos el error del campo de documento inmediatamente al detectar escritura
    // Esto da feedback visual instantáneo: el error desaparece tan pronto el usuario empieza a escribir
    clearError(userDocumentError, userDocumentInput);
}

// Maneja el evento input/change de los campos del formulario de tareas
// Se ejecuta cuando el usuario escribe en cualquier campo o cambia la selección del estado
// Usa el evento para identificar cuál campo cambió y limpiar solo ese error específico
// Parámetro: event - El objeto Event con información sobre qué elemento lo disparó
export function handleTaskInputChange(event) {
    // Obtenemos el elemento específico que generó el evento (el input que cambió)
    // event.target siempre es el elemento que disparó el evento, no el padre
    const target = event.target;

    // Usamos switch para identificar cuál de los tres campos fue modificado
    // Comparamos el ID del elemento para saber qué error debemos limpiar
    switch (target.id) {
        case 'taskTitle':
            // Si el campo que cambió es el título, limpiamos solo el error del título
            clearError(taskTitleError, taskTitleInput);
            break;

        case 'taskDescription':
            // Si el campo que cambió es la descripción, limpiamos solo el error de la descripción
            clearError(taskDescriptionError, taskDescriptionInput);
            break;

        case 'taskStatus':
            // Si el select que cambió es el estado, limpiamos solo el error del estado
            clearError(taskStatusError, taskStatusSelect);
            break;

        // No necesitamos un default porque solo nos interesan estos tres campos
    }
}

// RF-03 – MANEJADORES DE EDICIÓN (UPDATE)

// Maneja el clic en el botón "Editar" de una fila de la tabla
// Abre el modal de edición precargado con los datos actuales de la tarea
// Esta función recibe la tarea completa para no tener que buscarla de nuevo
// Parámetro: task - Objeto con los datos actuales de la tarea seleccionada
export function handleEditTask(task) {
    // ----- PASO 1: MOSTRAR EL MODAL CON LOS DATOS ACTUALES -----
    // showEditModal() llena los campos del formulario del modal con la información de la tarea
    // y luego lo hace visible quitando la clase 'hidden'
    showEditModal(task);

    // ----- PASO 2: REGISTRAR EL EVENTO DEL FORMULARIO DE EDICIÓN -----
    // Seleccionamos el formulario del modal para registrarle el evento submit
    const editForm = document.getElementById('editTaskForm');

    // Creamos el handler del submit de edición como función nombrada
    // Esto es importante para poder removerlo después y evitar que se acumule
    // cada vez que el usuario abra el modal (de lo contrario se ejecutaría múltiples veces)
    async function handleEditFormSubmit(event) {
        // Prevenimos la recarga de la página que haría el formulario por defecto
        event.preventDefault();

        // ----- PASO 3: OBTENER LOS NUEVOS VALORES DEL FORMULARIO DEL MODAL -----
        // Leemos y limpiamos los valores de cada campo del formulario de edición
        const title       = document.getElementById('editTaskTitle').value.trim();
        const description = document.getElementById('editTaskDescription').value.trim();
        const status      = document.getElementById('editTaskStatus').value;
        const taskId      = document.getElementById('editTaskId').value;

        // ----- PASO 4: VALIDAR QUE LOS CAMPOS NO ESTÉN VACÍOS -----
        // Verificamos manualmente que los campos obligatorios tengan contenido
        if (!title || !description || !status) {
            // Si algún campo falta, alertamos al usuario y detenemos el proceso
            alert('Por favor completa todos los campos antes de guardar.');
            return;
        }

        // ----- PASO 5: CONSTRUIR EL OBJETO CON LOS DATOS ACTUALIZADOS -----
        // Solo incluimos los campos que el usuario puede modificar desde el modal
        const updatedData = {
            title,
            description,
            status,
            // Actualizamos el campo 'completed' para mantener coherencia con el estado
            completed: status === 'completada'
        };

        // ----- PASO 6: ENVIAR LA ACTUALIZACIÓN AL SERVIDOR (PATCH) -----
        // Llamamos a la función de API que hace la petición PATCH con el ID y los nuevos datos
        const updatedTask = await updateTask(taskId, updatedData);

        // ----- PASO 7: VERIFICAR EL RESULTADO Y ACTUALIZAR EL DOM -----
        if (updatedTask) {
            // ----- ACTUALIZACIÓN EXITOSA -----

            // Actualizamos el estado local para mantenerlo sincronizado con el servidor
            updateTaskInState(updatedTask);

            // Actualizamos la fila correspondiente en la tabla del DOM visualmente
            updateTaskRow(updatedTask);

            // Ocultamos y limpiamos el modal de edición
            hideEditModal();

            // Notificamos al usuario que la actualización fue exitosa (RNF-03)
            alert('✅ Tarea actualizada exitosamente');

        } else {
            // ----- ERROR EN LA ACTUALIZACIÓN -----
            // El servidor no respondió correctamente, informamos al usuario (RNF-03)
            alert('❌ Error al actualizar la tarea. Por favor, intenta nuevamente.');
        }

        // ----- PASO 8: REMOVER EL EVENTO SUBMIT DEL FORMULARIO -----
        // Es crucial remover el listener para evitar que se acumulen y se ejecuten múltiples veces
        // si el usuario abre el modal varias veces en la misma sesión
        editForm.removeEventListener('submit', handleEditFormSubmit);
    }

    // Registramos el listener de submit en el formulario del modal
    // Cada vez que se abre el modal, se registra uno nuevo (y el anterior fue removido)
    editForm.addEventListener('submit', handleEditFormSubmit);

    // ----- PASO 9: REGISTRAR EL BOTÓN DE CANCELAR -----
    // El botón de cancelar cierra el modal sin guardar cambios
    const cancelBtn = document.getElementById('editCancelBtn');

    // Función para manejar el clic en cancelar
    function handleCancelEdit() {
        // Ocultamos el modal sin enviar ningún dato al servidor
        hideEditModal();

        // Removemos el listener del submit para evitar acumulación
        editForm.removeEventListener('submit', handleEditFormSubmit);

        // Removemos el listener de cancelar para evitar acumulación
        cancelBtn.removeEventListener('click', handleCancelEdit);
    }

    // Registramos el listener del botón cancelar
    cancelBtn.addEventListener('click', handleCancelEdit);
}

// RF-04 – MANEJADOR DE ELIMINACIÓN (DELETE)

// Maneja el clic en el botón "Eliminar" de una fila de la tabla
// Pide confirmación al usuario antes de proceder con la eliminación (RF-04 requisito)
// Parámetro: task - Objeto con los datos de la tarea a eliminar
export async function handleDeleteTask(task) {
    // ----- PASO 1: PEDIR CONFIRMACIÓN AL USUARIO -----
    // Según RF-04: "La eliminación debe confirmarse antes de ejecutarse"
    // confirm() abre un diálogo nativo del navegador con opciones Aceptar y Cancelar
    // Retorna true si el usuario hace clic en Aceptar, false si hace clic en Cancelar
    const confirmed = confirm(
        `¿Estás seguro de que deseas eliminar la tarea "${task.title}"?\nEsta acción no se puede deshacer.`
    );

    // ----- PASO 2: VERIFICAR SI EL USUARIO CONFIRMÓ -----
    // Si el usuario canceló el diálogo, detenemos la ejecución sin hacer nada
    if (!confirmed) {
        return; // El usuario decidió no eliminar la tarea, salimos
    }

    // ----- PASO 3: ENVIAR LA PETICIÓN DELETE AL SERVIDOR -----
    // Llamamos a la función de API que hace la petición DELETE con el ID de la tarea
    const success = await deleteTask(task.id);

    // ----- PASO 4: VERIFICAR EL RESULTADO Y ACTUALIZAR EL DOM -----
    if (success) {
        // ----- ELIMINACIÓN EXITOSA -----

        // Eliminamos la tarea del estado local para mantenerlo sincronizado
        removeTaskFromState(task.id);

        // Eliminamos la fila visualmente de la tabla del DOM
        removeTaskRow(task.id);

        // Notificamos al usuario que la tarea fue eliminada exitosamente (RNF-03)
        alert('🗑️ Tarea eliminada exitosamente');

    } else {
        // ----- ERROR EN LA ELIMINACIÓN -----
        // Informamos al usuario que algo salió mal (RNF-03 - comunicación clara)
        alert('❌ Error al eliminar la tarea. Por favor, intenta nuevamente.');
    }
}

// RF-03 y RF-04 – MANEJADOR DE CLICS EN LA TABLA (EVENT DELEGATION)

// Maneja los clics en los botones de Editar y Eliminar usando delegación de eventos
// La delegación de eventos consiste en registrar UN SOLO listener en el contenedor padre (tbody)
// en lugar de registrar un listener en cada botón individual
// Esto es importante porque las filas se crean dinámicamente y sus botones no existen al iniciar
// Parámetros:
//   event          - El objeto Event del clic en la tabla
//   registeredTasks - Arreglo con todas las tareas registradas (para buscar la tarea por ID)
export function handleTableClick(event, registeredTasks) {
    // ----- PASO 1: IDENTIFICAR EL ELEMENTO CLICADO -----
    // event.target es el elemento exacto donde el usuario hizo clic
    // Puede ser el botón mismo o cualquier elemento hijo dentro de él
    const target = event.target;

    // ----- PASO 2: VERIFICAR SI EL CLIC FUE EN UN BOTÓN DE ACCIÓN -----
    // Usamos closest() para subir en el árbol del DOM y encontrar el botón más cercano
    // Esto maneja el caso de que el usuario haga clic en el emoji dentro del botón
    const actionBtn = target.closest('[data-action]');

    // Si no se encontró ningún botón de acción en la cadena de clics, salimos
    if (!actionBtn) return;

    // ----- PASO 3: OBTENER EL ID DE LA TAREA Y LA ACCIÓN -----
    // Leemos el ID de la tarea desde el atributo data-id del botón
    const taskId = actionBtn.dataset.id;

    // Leemos la acción (edit o delete) desde el atributo data-action del botón
    const action = actionBtn.dataset.action;

    // ----- PASO 4: BUSCAR LA TAREA EN EL ESTADO LOCAL -----
    // Buscamos el objeto completo de la tarea usando el ID para tener todos sus datos
    // Convertimos taskId a string para comparación segura (puede venir como número o string)
    const task = registeredTasks.find(t => t.id.toString() === taskId.toString());

    // Si no encontramos la tarea en el estado, salimos para evitar errores
    if (!task) {
        console.warn(`No se encontró la tarea con id ${taskId} en el estado local`);
        return;
    }

    // ----- PASO 5: EJECUTAR EL HANDLER CORRESPONDIENTE SEGÚN LA ACCIÓN -----
    // Switch evalúa la acción del botón y llama al handler correcto
    switch (action) {
        case 'edit':
            // El usuario hizo clic en Editar: abrimos el modal de edición (RF-03)
            handleEditTask(task);
            break;

        case 'delete':
            // El usuario hizo clic en Eliminar: pedimos confirmación y eliminamos (RF-04)
            handleDeleteTask(task);
            break;

        default:
            // Si la acción no es reconocida, lo registramos en consola para depuración
            console.warn(`Acción desconocida: ${action}`);
    }
}