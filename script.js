/**
 * ========================================
 * SISTEMA DE GESTIÓN DE TAREAS - EJERCICIO DOM
 * ========================================
 * 
 * Objetivo: Aplicar conceptos del DOM para:
 * - Buscar usuarios existentes en el servidor
 * - Registrar tareas asociadas a usuarios
 * - Crear elementos dinámicamente sin recargar la página
 * - Validar formularios
 * - Manipular el DOM en tiempo real
 * 
 * Autores: Karol Nicolle Torres Fuentes, Juan Sebastian Patiño Hernandez
 * Fecha: 11-02-26
 * Institución: SENA - Técnico en Programación de Software
 */

// ========================================
// 1. CONFIGURACIÓN INICIAL Y CONSTANTES
// ========================================

// URL base del servidor JSON (json-server)
// Este servidor simula una API REST y debe estar corriendo en el puerto 3000
const API_BASE_URL = 'http://localhost:3000';

// ========================================
// 2. SELECCIÓN DE ELEMENTOS DEL DOM
// ========================================

// ----- FORMULARIO DE BÚSQUEDA DE USUARIO -----
// Seleccionamos el formulario completo de búsqueda usando su ID único
const searchUserForm = document.getElementById('searchUserForm');

// Seleccionamos el campo de entrada del documento del usuario
const userDocumentInput = document.getElementById('userDocument');

// Seleccionamos el elemento span donde mostraremos mensajes de error del documento
const userDocumentError = document.getElementById('userDocumentError');

// Seleccionamos el botón de búsqueda para posibles manipulaciones futuras
const searchBtn = document.getElementById('searchBtn');

// ----- SECCIÓN DE DATOS DEL USUARIO -----
// Seleccionamos la sección completa que muestra los datos del usuario encontrado
// Esta sección está oculta por defecto (clase 'hidden')
const userDataSection = document.getElementById('userDataSection');

// Seleccionamos los spans individuales donde mostraremos cada dato del usuario
const userIdSpan = document.getElementById('userId');
const userNameSpan = document.getElementById('userName');
const userEmailSpan = document.getElementById('userEmail');

// ----- FORMULARIO DE REGISTRO DE TAREAS -----
// Seleccionamos la sección que contiene el formulario de tareas
// También está oculta por defecto hasta que se encuentre un usuario
const taskFormSection = document.getElementById('taskFormSection');

// Seleccionamos el formulario completo de registro de tareas
const taskForm = document.getElementById('taskForm');

// Seleccionamos cada campo del formulario de tareas
const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskStatusSelect = document.getElementById('taskStatus');

// Seleccionamos los elementos de error para cada campo del formulario de tareas
const taskTitleError = document.getElementById('taskTitleError');
const taskDescriptionError = document.getElementById('taskDescriptionError');
const taskStatusError = document.getElementById('taskStatusError');

// Seleccionamos el botón de envío del formulario de tareas
const taskSubmitBtn = document.getElementById('taskSubmitBtn');

// ----- SECCIÓN DE TAREAS REGISTRADAS -----
// Seleccionamos la sección completa que muestra la tabla de tareas
const tasksSection = document.getElementById('tasksSection');

// Seleccionamos el contador de tareas que se muestra en el encabezado
const tasksCount = document.getElementById('tasksCount');

// Seleccionamos el tbody de la tabla donde insertaremos las filas de tareas
const tasksTableBody = document.getElementById('tasksTableBody');

// Seleccionamos el estado vacío que se muestra cuando no hay tareas
const tasksEmptyState = document.getElementById('tasksEmptyState');

// ========================================
// 3. VARIABLES DE ESTADO DE LA APLICACIÓN
// ========================================

// Variable que almacenará los datos del usuario actualmente seleccionado
// Se llenará cuando el usuario sea encontrado en el servidor
let currentUser = null;

// Arreglo que almacenará todas las tareas registradas
// Se actualizará cada vez que se agregue una nueva tarea
let registeredTasks = [];

// Contador que llevará el número total de tareas registradas
let taskCounter = 0;

// ========================================
// 4. FUNCIONES DE VALIDACIÓN
// ========================================

/**
 * Valida que un campo no esté vacío ni contenga solo espacios en blanco
 * 
 * @param {string} value - El valor del campo a validar
 * @returns {boolean} - true si el campo es válido (tiene contenido), false si está vacío
 * 
 * Funcionamiento:
 * 1. Recibe el valor del campo como parámetro
 * 2. Usa trim() para eliminar espacios al inicio y final
 * 3. Verifica si después de trim() la longitud es mayor a 0
 * 4. Retorna true si tiene contenido, false si está vacío
 */
function isValidInput(value) {
    // trim() elimina espacios en blanco al inicio y final del string
    // length > 0 verifica que después de limpiar espacios, aún hay contenido
    return value.trim().length > 0;
}

/**
 * Muestra un mensaje de error en un elemento específico del DOM
 * También agrega la clase 'error' al input para mostrar estilo de error
 * 
 * @param {HTMLElement} errorElement - Elemento span donde se mostrará el error
 * @param {HTMLElement} inputElement - Elemento input que tiene el error
 * @param {string} message - Mensaje de error a mostrar
 * 
 * Funcionamiento:
 * 1. Asigna el mensaje de error al textContent del span
 * 2. Agrega la clase 'error' al input para aplicar estilos visuales de error
 */
function showError(errorElement, inputElement, message) {
    // Asignamos el mensaje de error al contenido de texto del elemento span
    errorElement.textContent = message;
    
    // Agregamos la clase 'error' al input para que CSS aplique estilos de error
    // Esta clase puede cambiar el borde a rojo, por ejemplo
    inputElement.classList.add('error');
}

/**
 * Limpia el mensaje de error de un elemento específico
 * También remueve la clase 'error' del input
 * 
 * @param {HTMLElement} errorElement - Elemento span del cual limpiar el error
 * @param {HTMLElement} inputElement - Elemento input del cual remover la clase error
 * 
 * Funcionamiento:
 * 1. Limpia el contenido del span de error
 * 2. Remueve la clase 'error' del input para quitar estilos de error
 */
function clearError(errorElement, inputElement) {
    // Limpiamos el contenido del span asignando un string vacío
    errorElement.textContent = '';
    
    // Removemos la clase 'error' del input para quitar los estilos de error
    inputElement.classList.remove('error');
}

/**
 * Valida el formulario de búsqueda de usuario
 * Verifica que el campo de documento no esté vacío
 * 
 * @returns {boolean} - true si el formulario es válido, false si tiene errores
 * 
 * Flujo de validación:
 * 1. Obtiene el valor del input de documento
 * 2. Asume que el formulario es válido inicialmente
 * 3. Valida el campo usando isValidInput()
 * 4. Si no es válido, muestra error y cambia el estado a false
 * 5. Si es válido, limpia cualquier error previo
 * 6. Retorna el estado final de validación
 */
function validateSearchForm() {
    // Obtenemos el valor actual del input de documento
    const documentValue = userDocumentInput.value;
    
    // Variable de control que indica si el formulario es válido
    // Inicialmente asumimos que sí es válido
    let isValid = true;
    
    // Validamos el campo de documento
    if (!isValidInput(documentValue)) {
        // Si la validación falla, mostramos el error
        showError(
            userDocumentError, 
            userDocumentInput, 
            'El documento del usuario es obligatorio'
        );
        // Marcamos el formulario como inválido
        isValid = false;
    } else {
        // Si la validación pasa, limpiamos cualquier error previo
        clearError(userDocumentError, userDocumentInput);
    }
    
    // Retornamos si el formulario es válido o no
    return isValid;
}

/**
 * Valida el formulario de registro de tareas
 * Verifica que todos los campos estén completos
 * 
 * @returns {boolean} - true si todos los campos son válidos, false si hay errores
 * 
 * Flujo de validación:
 * 1. Obtiene los valores de todos los campos
 * 2. Asume que el formulario es válido inicialmente
 * 3. Valida cada campo uno por uno
 * 4. Para cada campo inválido, muestra error y marca como inválido
 * 5. Para cada campo válido, limpia errores previos
 * 6. Retorna el estado final de validación
 */
function validateTaskForm() {
    // Obtenemos los valores de todos los campos del formulario
    const titleValue = taskTitleInput.value;
    const descriptionValue = taskDescriptionInput.value;
    const statusValue = taskStatusSelect.value;
    
    // Variable de control para el estado de validación
    let isValid = true;
    
    // ----- VALIDACIÓN DEL TÍTULO -----
    if (!isValidInput(titleValue)) {
        // Si el título está vacío, mostramos error
        showError(
            taskTitleError, 
            taskTitleInput, 
            'El título de la tarea es obligatorio'
        );
        // Marcamos el formulario como inválido
        isValid = false;
    } else {
        // Si el título es válido, limpiamos errores
        clearError(taskTitleError, taskTitleInput);
    }
    
    // ----- VALIDACIÓN DE LA DESCRIPCIÓN -----
    if (!isValidInput(descriptionValue)) {
        // Si la descripción está vacía, mostramos error
        showError(
            taskDescriptionError, 
            taskDescriptionInput, 
            'La descripción de la tarea es obligatoria'
        );
        // Marcamos el formulario como inválido
        isValid = false;
    } else {
        // Si la descripción es válida, limpiamos errores
        clearError(taskDescriptionError, taskDescriptionInput);
    }
    
    // ----- VALIDACIÓN DEL ESTADO -----
    if (!isValidInput(statusValue)) {
        // Si no se ha seleccionado un estado, mostramos error
        showError(
            taskStatusError, 
            taskStatusSelect, 
            'Debes seleccionar un estado para la tarea'
        );
        // Marcamos el formulario como inválido
        isValid = false;
    } else {
        // Si se seleccionó un estado, limpiamos errores
        clearError(taskStatusError, taskStatusSelect);
    }
    
    // Retornamos el estado final de validación
    return isValid;
}

// ========================================
// 5. FUNCIONES DE MANIPULACIÓN DEL DOM
// ========================================

/**
 * Muestra la sección de datos del usuario y la completa con información
 * 
 * @param {Object} user - Objeto con los datos del usuario (id, name, email)
 * 
 * Funcionamiento:
 * 1. Remueve la clase 'hidden' de la sección para hacerla visible
 * 2. Inserta cada dato del usuario en su span correspondiente
 */
function displayUserData(user) {
    // Removemos la clase 'hidden' para mostrar la sección
    // classList.remove() quita una clase del elemento
    userDataSection.classList.remove('hidden');
    
    // Insertamos cada dato del usuario en su span correspondiente
    // textContent asigna texto plano (más seguro que innerHTML)
    userIdSpan.textContent = user.id;
    userNameSpan.textContent = user.name;
    userEmailSpan.textContent = user.email;
}

/**
 * Oculta la sección de datos del usuario
 * Útil cuando se realiza una nueva búsqueda o hay un error
 * 
 * Funcionamiento:
 * 1. Agrega la clase 'hidden' a la sección
 * 2. Limpia el contenido de todos los spans
 */
function hideUserData() {
    // Agregamos la clase 'hidden' para ocultar la sección
    userDataSection.classList.add('hidden');
    
    // Limpiamos el contenido de todos los spans
    userIdSpan.textContent = '';
    userNameSpan.textContent = '';
    userEmailSpan.textContent = '';
}

/**
 * Muestra la sección del formulario de tareas
 * Solo debe mostrarse cuando se ha encontrado un usuario
 * 
 * Funcionamiento:
 * 1. Remueve la clase 'hidden' para hacer visible el formulario
 */
function showTaskForm() {
    // Removemos la clase 'hidden' para mostrar el formulario de tareas
    taskFormSection.classList.remove('hidden');
}

/**
 * Oculta la sección del formulario de tareas
 * Se oculta cuando no hay usuario seleccionado
 * 
 * Funcionamiento:
 * 1. Agrega la clase 'hidden' para ocultar el formulario
 */
function hideTaskForm() {
    // Agregamos la clase 'hidden' para ocultar el formulario de tareas
    taskFormSection.classList.add('hidden');
}

/**
 * Muestra la sección de tareas registradas
 * Se muestra cuando hay al menos una tarea
 * 
 * Funcionamiento:
 * 1. Remueve la clase 'hidden' de la sección completa
 */
function showTasksSection() {
    // Removemos la clase 'hidden' para mostrar la sección de tareas
    tasksSection.classList.remove('hidden');
}

/**
 * Actualiza el contador de tareas en la interfaz
 * 
 * @param {number} count - Número total de tareas
 * 
 * Funcionamiento:
 * 1. Verifica si hay una sola tarea o múltiples
 * 2. Usa la forma singular o plural según corresponda
 * 3. Actualiza el textContent del contador
 */
function updateTaskCounter(count) {
    // Usamos un operador ternario para manejar singular/plural
    // Si count === 1, usamos "tarea", si no, usamos "tareas"
    const text = count === 1 ? `${count} tarea` : `${count} tareas`;
    
    // Actualizamos el contenido del elemento contador
    tasksCount.textContent = text;
}

/**
 * Muestra el estado vacío de tareas
 * Se muestra cuando no hay tareas registradas
 * 
 * Funcionamiento:
 * 1. Remueve la clase 'hidden' del elemento de estado vacío
 */
function showEmptyState() {
    // Removemos la clase 'hidden' para mostrar el mensaje de estado vacío
    tasksEmptyState.classList.remove('hidden');
}

/**
 * Oculta el estado vacío de tareas
 * Se oculta cuando hay al menos una tarea
 * 
 * Funcionamiento:
 * 1. Agrega la clase 'hidden' para ocultar el estado vacío
 */
function hideEmptyState() {
    // Agregamos la clase 'hidden' para ocultar el estado vacío
    tasksEmptyState.classList.add('hidden');
}

/**
 * Formatea el estado de la tarea para mostrar en español
 * 
 * @param {string} status - Estado en formato de base de datos
 * @returns {string} - Estado formateado para mostrar
 * 
 * Funcionamiento:
 * 1. Usa un switch para convertir el valor técnico a texto legible
 * 2. Retorna el texto formateado en español
 */
function formatTaskStatus(status) {
    // Switch para convertir valores técnicos a texto legible
    switch(status) {
        case 'pendiente':
            return 'Pendiente';
        case 'en_progreso':
            return 'En Progreso';
        case 'completada':
            return 'Completada';
        default:
            return status; // Si no coincide, retorna el valor original
    }
}

/**
 * Crea una fila (TR) de tabla con los datos de una tarea
 * Esta es la función clave para la creación dinámica de elementos
 * 
 * @param {Object} task - Objeto con los datos de la tarea
 * @param {number} index - Índice de la tarea en el arreglo
 * 
 * Funcionamiento:
 * 1. Crea un nuevo elemento TR (fila de tabla)
 * 2. Crea elementos TD (celdas) para cada dato
 * 3. Inserta el contenido en cada celda
 * 4. Agrega todas las celdas a la fila
 * 5. Retorna la fila completa
 * 
 * Esta función demuestra la CREACIÓN DE ELEMENTOS con el DOM
 */
function createTaskRow(task, index) {
    // ----- PASO 1: CREAR EL ELEMENTO FILA -----
    // createElement() crea un nuevo elemento HTML del tipo especificado
    const row = document.createElement('tr');
    
    // ----- PASO 2: CREAR Y LLENAR LA CELDA DE NÚMERO -----
    // Creamos una celda TD para el número de tarea
    const numberCell = document.createElement('td');
    // Insertamos el número de tarea (index + 1 porque los índices empiezan en 0)
    numberCell.textContent = index + 1;
    
    // ----- PASO 3: CREAR Y LLENAR LA CELDA DE TÍTULO -----
    const titleCell = document.createElement('td');
    // Insertamos el título de la tarea
    titleCell.textContent = task.title;
    
    // ----- PASO 4: CREAR Y LLENAR LA CELDA DE DESCRIPCIÓN -----
    const descriptionCell = document.createElement('td');
    // Insertamos la descripción de la tarea
    descriptionCell.textContent = task.description;
    
    // ----- PASO 5: CREAR Y LLENAR LA CELDA DE ESTADO -----
    const statusCell = document.createElement('td');
    // Insertamos el estado formateado (convertido a texto legible)
    statusCell.textContent = formatTaskStatus(task.status);
    
    // ----- PASO 6: CREAR Y LLENAR LA CELDA DE USUARIO -----
    const userCell = document.createElement('td');
    // Insertamos el nombre del usuario asociado a la tarea
    userCell.textContent = task.userName;
    
    // ----- PASO 7: AGREGAR TODAS LAS CELDAS A LA FILA -----
    // appendChild() agrega un elemento hijo al elemento padre
    // Agregamos cada celda creada a la fila, en orden
    row.appendChild(numberCell);
    row.appendChild(titleCell);
    row.appendChild(descriptionCell);
    row.appendChild(statusCell);
    row.appendChild(userCell);
    
    // ----- PASO 8: RETORNAR LA FILA COMPLETA -----
    // Retornamos el elemento TR completo con todas sus celdas
    return row;
}

/**
 * Agrega una nueva tarea a la tabla en el DOM
 * Esta función demuestra cómo INSERTAR ELEMENTOS CREADOS en el DOM
 * 
 * @param {Object} task - Objeto con los datos de la tarea a agregar
 * 
 * Funcionamiento:
 * 1. Crea la fila usando createTaskRow()
 * 2. Inserta la fila en el tbody de la tabla
 * 3. Incrementa el contador de tareas
 * 4. Actualiza el contador visual
 * 5. Oculta el estado vacío
 * 6. Muestra la sección de tareas
 */
function addTaskToTable(task) {
    // ----- PASO 1: CREAR LA FILA -----
    // Llamamos a createTaskRow() para crear el elemento TR con todas sus celdas
    // Pasamos la tarea y el índice actual del contador
    const taskRow = createTaskRow(task, taskCounter);
    
    // ----- PASO 2: INSERTAR LA FILA EN LA TABLA -----
    // appendChild() inserta el nuevo elemento al final del tbody
    // Esto hace que la nueva tarea aparezca al final de la tabla
    tasksTableBody.appendChild(taskRow);
    
    // ----- PASO 3: INCREMENTAR EL CONTADOR -----
    // Aumentamos el contador de tareas en 1
    taskCounter++;
    
    // ----- PASO 4: ACTUALIZAR EL CONTADOR VISUAL -----
    // Actualizamos el texto que muestra cuántas tareas hay
    updateTaskCounter(taskCounter);
    
    // ----- PASO 5: OCULTAR EL ESTADO VACÍO -----
    // Como ya hay tareas, ocultamos el mensaje de "no hay tareas"
    hideEmptyState();
    
    // ----- PASO 6: MOSTRAR LA SECCIÓN DE TAREAS -----
    // Nos aseguramos de que la sección de tareas esté visible
    showTasksSection();
}

/**
 * Limpia todos los campos del formulario de tareas
 * 
 * Funcionamiento:
 * 1. Resetea cada campo a su valor inicial
 * 2. Limpia todos los mensajes de error
 */
function clearTaskForm() {
    // Limpiamos el campo de título
    taskTitleInput.value = '';
    
    // Limpiamos el campo de descripción
    taskDescriptionInput.value = '';
    
    // Reseteamos el select a su opción por defecto (vacía)
    taskStatusSelect.value = '';
    
    // Limpiamos todos los mensajes de error
    clearError(taskTitleError, taskTitleInput);
    clearError(taskDescriptionError, taskDescriptionInput);
    clearError(taskStatusError, taskStatusSelect);
}

/**
 * Reinicia el estado de la aplicación
 * Se ejecuta cuando se realiza una nueva búsqueda de usuario
 * 
 * Funcionamiento:
 * 1. Limpia el usuario actual
 * 2. Oculta todas las secciones relacionadas con el usuario anterior
 */
function resetApplicationState() {
    // Limpiamos el usuario actual
    currentUser = null;
    
    // Ocultamos los datos del usuario
    hideUserData();
    
    // Ocultamos el formulario de tareas
    hideTaskForm();
}

// ========================================
// 6. FUNCIONES DE COMUNICACIÓN CON EL SERVIDOR
// ========================================

/**
 * Busca un usuario en el servidor por su documento (ID)
 * Esta función usa fetch() para hacer una petición HTTP GET
 * 
 * @param {string} documentId - Documento del usuario a buscar
 * @returns {Promise<Object|null>} - Promesa que resuelve con el usuario o null
 * 
 * Funcionamiento:
 * 1. Construye la URL de búsqueda
 * 2. Realiza la petición GET al servidor
 * 3. Convierte la respuesta a JSON
 * 4. Busca el usuario en el arreglo de usuarios
 * 5. Retorna el usuario o null si no existe
 */
async function searchUserByDocument(documentId) {
    try {
        // ----- PASO 1: CONSTRUIR LA URL -----
        // Construimos la URL completa para buscar usuarios
        const url = `${API_BASE_URL}/users`;
        
        // ----- PASO 2: REALIZAR LA PETICIÓN -----
        // fetch() realiza una petición HTTP GET por defecto
        // await espera a que la promesa se resuelva antes de continuar
        const response = await fetch(url);
        
        // ----- PASO 3: VERIFICAR SI LA RESPUESTA ES EXITOSA -----
        // response.ok es true si el status está entre 200-299
        if (!response.ok) {
            // Si hay error en la respuesta, lanzamos un error
            throw new Error('Error al consultar el servidor');
        }
        
        // ----- PASO 4: CONVERTIR LA RESPUESTA A JSON -----
        // response.json() convierte el cuerpo de la respuesta a un objeto JavaScript
        const users = await response.json();
        
        // ----- PASO 5: BUSCAR EL USUARIO -----
        // find() busca el primer elemento que cumple la condición
        // Convertimos ambos a string para comparar, ya que el ID puede ser número
        const user = users.find(u => u.id.toString() === documentId.toString());
        
        // ----- PASO 6: RETORNAR EL RESULTADO -----
        // Retornamos el usuario si existe, o undefined si no se encontró
        return user || null;
        
    } catch (error) {
        // ----- MANEJO DE ERRORES -----
        // Si hay cualquier error (red, servidor, etc.), lo capturamos aquí
        console.error('Error al buscar usuario:', error);
        // Retornamos null para indicar que no se pudo obtener el usuario
        return null;
    }
}

/**
 * Registra una nueva tarea en el servidor
 * Esta función usa fetch() para hacer una petición HTTP POST
 * 
 * @param {Object} taskData - Objeto con los datos de la tarea a registrar
 * @returns {Promise<Object|null>} - Promesa que resuelve con la tarea creada o null
 * 
 * Funcionamiento:
 * 1. Construye la URL de registro
 * 2. Configura las opciones de la petición POST
 * 3. Realiza la petición al servidor
 * 4. Convierte la respuesta a JSON
 * 5. Retorna la tarea creada o null en caso de error
 */
async function registerTask(taskData) {
    try {
        // ----- PASO 1: CONSTRUIR LA URL -----
        // Construimos la URL para el endpoint de tareas
        const url = `${API_BASE_URL}/tasks`;
        
        // ----- PASO 2: CONFIGURAR LA PETICIÓN POST -----
        // Configuramos las opciones para la petición POST
        const options = {
            method: 'POST', // Método HTTP POST para crear recursos
            headers: {
                // Indicamos que enviamos JSON en el cuerpo
                'Content-Type': 'application/json'
            },
            // Convertimos el objeto JavaScript a string JSON
            body: JSON.stringify(taskData)
        };
        
        // ----- PASO 3: REALIZAR LA PETICIÓN -----
        // fetch() con opciones realiza la petición POST
        const response = await fetch(url, options);
        
        // ----- PASO 4: VERIFICAR SI LA RESPUESTA ES EXITOSA -----
        if (!response.ok) {
            throw new Error('Error al registrar la tarea');
        }
        
        // ----- PASO 5: CONVERTIR LA RESPUESTA A JSON -----
        // El servidor debería retornar la tarea creada con su ID
        const createdTask = await response.json();
        
        // ----- PASO 6: RETORNAR LA TAREA CREADA -----
        return createdTask;
        
    } catch (error) {
        // ----- MANEJO DE ERRORES -----
        console.error('Error al registrar tarea:', error);
        return null;
    }
}

// ========================================
// 7. MANEJADORES DE EVENTOS
// ========================================

/**
 * Maneja el evento submit del formulario de búsqueda de usuario
 * Esta función se ejecuta cuando el usuario envía el formulario de búsqueda
 * 
 * @param {Event} event - Evento del formulario
 * 
 * Flujo de ejecución:
 * 1. Previene el comportamiento por defecto (recarga de página)
 * 2. Valida el formulario
 * 3. Si es válido, busca el usuario en el servidor
 * 4. Muestra los datos del usuario si se encuentra
 * 5. Muestra error si no se encuentra
 * 6. Habilita el formulario de tareas si el usuario existe
 */
async function handleSearchFormSubmit(event) {
    // ----- PASO 1: PREVENIR COMPORTAMIENTO POR DEFECTO -----
    // preventDefault() evita que el formulario se envíe de forma tradicional
    // Sin esto, la página se recargaría
    event.preventDefault();
    
    // ----- PASO 2: VALIDAR EL FORMULARIO -----
    // Llamamos a la función de validación
    const isValid = validateSearchForm();
    
    // Si el formulario no es válido, detenemos la ejecución
    if (!isValid) {
        return; // Salimos de la función sin hacer nada más
    }
    
    // ----- PASO 3: OBTENER EL VALOR DEL DOCUMENTO -----
    // Obtenemos el valor del input y eliminamos espacios
    const documentValue = userDocumentInput.value.trim();
    
    // ----- PASO 4: REINICIAR EL ESTADO DE LA APLICACIÓN -----
    // Limpiamos cualquier usuario y formulario previo
    resetApplicationState();
    
    // ----- PASO 5: BUSCAR EL USUARIO EN EL SERVIDOR -----
    // Llamamos a la función asíncrona que consulta el servidor
    const user = await searchUserByDocument(documentValue);
    
    // ----- PASO 6: VERIFICAR SI SE ENCONTRÓ EL USUARIO -----
    if (user) {
        // ----- USUARIO ENCONTRADO -----
        // Guardamos el usuario en la variable de estado global
        currentUser = user;
        
        // Mostramos los datos del usuario en la interfaz
        displayUserData(user);
        
        // Habilitamos el formulario de tareas
        showTaskForm();
        
        // Limpiamos el formulario de búsqueda para una nueva consulta
        userDocumentInput.value = '';
        clearError(userDocumentError, userDocumentInput);
        
    } else {
        // ----- USUARIO NO ENCONTRADO -----
        // Mostramos un mensaje de error
        showError(
            userDocumentError,
            userDocumentInput,
            'No se encontró ningún usuario con ese documento'
        );
        
        // Limpiamos la variable de usuario actual
        currentUser = null;
    }
}

/**
 * Maneja el evento submit del formulario de registro de tareas
 * Esta función se ejecuta cuando el usuario envía el formulario de tareas
 * 
 * @param {Event} event - Evento del formulario
 * 
 * Flujo de ejecución:
 * 1. Previene el comportamiento por defecto
 * 2. Valida que haya un usuario seleccionado
 * 3. Valida todos los campos del formulario
 * 4. Construye el objeto de tarea
 * 5. Envía la tarea al servidor
 * 6. Agrega la tarea a la tabla si se registra exitosamente
 * 7. Limpia el formulario
 */
async function handleTaskFormSubmit(event) {
    // ----- PASO 1: PREVENIR COMPORTAMIENTO POR DEFECTO -----
    event.preventDefault();
    
    // ----- PASO 2: VERIFICAR QUE HAY UN USUARIO SELECCIONADO -----
    if (!currentUser) {
        // Si no hay usuario, mostramos una alerta
        alert('Primero debes buscar y seleccionar un usuario');
        return; // Salimos de la función
    }
    
    // ----- PASO 3: VALIDAR EL FORMULARIO -----
    const isValid = validateTaskForm();
    
    // Si el formulario no es válido, detenemos la ejecución
    if (!isValid) {
        return;
    }
    
    // ----- PASO 4: OBTENER LOS VALORES DE LOS CAMPOS -----
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const status = taskStatusSelect.value;
    
    // ----- PASO 5: CONSTRUIR EL OBJETO DE TAREA -----
    // Creamos un objeto con toda la información de la tarea
    const taskData = {
        title: title,
        description: description,
        status: status,
        userId: currentUser.id, // ID del usuario asociado
        userName: currentUser.name, // Nombre del usuario (para mostrar en la tabla)
        completed: status === 'completada' // Boolean para compatibilidad
    };
    
    // ----- PASO 6: REGISTRAR LA TAREA EN EL SERVIDOR -----
    // Enviamos la tarea al servidor
    const createdTask = await registerTask(taskData);
    
    // ----- PASO 7: VERIFICAR SI SE REGISTRÓ EXITOSAMENTE -----
    if (createdTask) {
        // ----- TAREA REGISTRADA EXITOSAMENTE -----
        
        // Agregamos la tarea al arreglo local
        registeredTasks.push(createdTask);
        
        // Agregamos la tarea a la tabla en el DOM
        addTaskToTable(createdTask);
        
        // Limpiamos el formulario para registrar otra tarea
        clearTaskForm();
        
        // Mostramos un mensaje de éxito (opcional)
        alert('Tarea registrada exitosamente');
        
    } else {
        // ----- ERROR AL REGISTRAR LA TAREA -----
        alert('Error al registrar la tarea. Por favor, intenta nuevamente.');
    }
}

/**
 * Maneja el evento input de los campos del formulario de búsqueda
 * Se ejecuta cada vez que el usuario escribe en el campo
 * 
 * Funcionamiento:
 * 1. Detecta cuándo el usuario empieza a escribir
 * 2. Limpia el mensaje de error mientras escribe
 */
function handleSearchInputChange() {
    // Limpiamos el error del campo de documento cuando el usuario escribe
    // Esto mejora la experiencia de usuario al dar feedback inmediato
    clearError(userDocumentError, userDocumentInput);
}

/**
 * Maneja el evento input de los campos del formulario de tareas
 * Se ejecuta cada vez que el usuario escribe en cualquier campo
 * 
 * @param {Event} event - Evento de input
 * 
 * Funcionamiento:
 * 1. Identifica qué campo generó el evento
 * 2. Limpia el error específico de ese campo
 */
function handleTaskInputChange(event) {
    // Obtenemos el elemento que generó el evento
    const target = event.target;
    
    // Usamos un switch para identificar qué campo cambió
    switch(target.id) {
        case 'taskTitle':
            // Si cambia el título, limpiamos su error
            clearError(taskTitleError, taskTitleInput);
            break;
        case 'taskDescription':
            // Si cambia la descripción, limpiamos su error
            clearError(taskDescriptionError, taskDescriptionInput);
            break;
        case 'taskStatus':
            // Si cambia el estado, limpiamos su error
            clearError(taskStatusError, taskStatusSelect);
            break;
    }
}

// ========================================
// 8. REGISTRO DE EVENTOS (EVENT LISTENERS)
// ========================================

/**
 * Función que registra todos los event listeners de la aplicación
 * Esta función se ejecuta cuando el DOM está completamente cargado
 * 
 * Funcionamiento:
 * 1. Registra el evento submit del formulario de búsqueda
 * 2. Registra el evento input del campo de documento
 * 3. Registra el evento submit del formulario de tareas
 * 4. Registra los eventos input de todos los campos de tareas
 */
function registerEventListeners() {
    // ----- EVENTOS DEL FORMULARIO DE BÚSQUEDA -----
    
    // Escuchamos el evento 'submit' del formulario de búsqueda
    // Cuando el usuario envía el formulario, se ejecuta handleSearchFormSubmit
    searchUserForm.addEventListener('submit', handleSearchFormSubmit);
    
    // Escuchamos el evento 'input' del campo de documento
    // Se ejecuta cada vez que el usuario escribe
    userDocumentInput.addEventListener('input', handleSearchInputChange);
    
    // ----- EVENTOS DEL FORMULARIO DE TAREAS -----
    
    // Escuchamos el evento 'submit' del formulario de tareas
    taskForm.addEventListener('submit', handleTaskFormSubmit);
    
    // Escuchamos el evento 'input' de cada campo del formulario de tareas
    taskTitleInput.addEventListener('input', handleTaskInputChange);
    taskDescriptionInput.addEventListener('input', handleTaskInputChange);
    taskStatusSelect.addEventListener('change', handleTaskInputChange);
}

// ========================================
// 9. INICIALIZACIÓN DE LA APLICACIÓN
// ========================================

/**
 * Función de inicialización que se ejecuta cuando el DOM está listo
 * Esta es la función principal que arranca toda la aplicación
 * 
 * Funcionamiento:
 * 1. Espera a que el DOM esté completamente cargado
 * 2. Registra todos los event listeners
 * 3. Inicializa el estado de la interfaz
 * 4. Muestra mensajes en consola para debugging
 */
document.addEventListener('DOMContentLoaded', function() {
    // ----- MENSAJE DE INICIO -----
    console.log('✅ DOM completamente cargado');
    console.log('🚀 Sistema de Gestión de Tareas iniciado');
    console.log('📡 Servidor esperado en:', API_BASE_URL);
    
    // ----- REGISTRAR TODOS LOS EVENT LISTENERS -----
    // Llamamos a la función que registra todos los eventos
    registerEventListeners();
    
    // ----- INICIALIZAR ESTADO VACÍO -----
    // Mostramos el estado vacío inicial (no hay tareas)
    showEmptyState();
    
    // Mensaje de confirmación
    console.log('✓ Event listeners registrados correctamente');
    console.log('✓ Aplicación lista para usar');
});

// ========================================
// 10. PREGUNTAS DE REFLEXIÓN (RESPUESTAS)
// ========================================

/**
 * PREGUNTAS DE REFLEXIÓN:
 * 
 * 1. ¿Qué elemento del DOM estás seleccionando?
 *    R: Estoy seleccionando múltiples elementos del DOM usando getElementById():
 *       - Formularios: searchUserForm, taskForm
 *       - Inputs: userDocumentInput, taskTitleInput, taskDescriptionInput
 *       - Selects: taskStatusSelect
 *       - Secciones: userDataSection, taskFormSection, tasksSection
 *       - Spans para errores y datos de usuario
 *       - Elementos de tabla: tasksTableBody
 * 
 * 2. ¿Qué evento provoca el cambio en la página?
 *    R: Los principales eventos son:
 *       - 'submit' en los formularios: cuando el usuario envía datos
 *       - 'input' en los campos: cuando el usuario escribe
 *       - 'change' en el select: cuando el usuario selecciona una opción
 * 
 * 3. ¿Qué nuevo elemento se crea?
 *    R: Se crean dinámicamente:
 *       - Elementos TR (filas de tabla) para cada tarea
 *       - Elementos TD (celdas) dentro de cada fila
 *       Estos elementos se crean con createElement() y se insertan con appendChild()
 * 
 * 4. ¿Dónde se inserta ese elemento dentro del DOM?
 *    R: Los elementos TR se insertan dentro del elemento TBODY de la tabla,
 *       que tiene el ID 'tasksTableBody'. Se insertan al final usando appendChild(),
 *       de manera que cada nueva tarea aparece debajo de la anterior.
 * 
 * 5. ¿Qué ocurre en la página cada vez que repites la acción?
 *    R: Cada vez que se registra una nueva tarea:
 *       - Se crea una nueva fila en la tabla
 *       - Se incrementa el contador de tareas
 *       - Se actualiza el texto del contador
 *       - La tabla se expande para mostrar la nueva tarea
 *       - El estado vacío permanece oculto
 *       - El formulario se limpia para permitir registrar otra tarea
 *       Todo esto ocurre sin recargar la página gracias al DOM
 */