// ARCHIVO BARRIL del Sistema de Gestión de Tareas
// Re-exporta todos los módulos desde un único punto de entrada

// ----- RE-EXPORTACIONES DESDE config.js -----
// Exponemos la constante de configuración global de la aplicación
export { API_BASE_URL } from './config.js';

// ----- RE-EXPORTACIONES DESDE state.js -----
// Exponemos el estado global y todas sus funciones de lectura y modificación
export {
    currentUser,           // Variable con el usuario actualmente seleccionado
    registeredTasks,       // Arreglo con todas las tareas registradas en la sesión
    taskCounter,           // Contador total de tareas registradas
    setCurrentUser,        // Setter para actualizar el usuario activo
    incrementTaskCounter,  // Función para aumentar el contador de tareas en 1
    addTask,               // Función para agregar una tarea al arreglo local
    resetState,            // Función para reiniciar el estado de la aplicación
    updateTaskInState,     // Actualiza una tarea en el arreglo local (RF-03)
    removeTaskFromState    // Elimina una tarea del arreglo local (RF-04)
} from './state.js';

// ----- RE-EXPORTACIONES DESDE dom.js -----
// Exponemos todos los elementos del DOM que la aplicación manipula
export {
    // Formulario de búsqueda de usuario
    searchUserForm, userDocumentInput, userDocumentError, searchBtn,
    // Sección de datos del usuario encontrado
    userDataSection, userIdSpan, userNameSpan, userEmailSpan,
    // Formulario de registro de tareas y sus campos
    taskFormSection, taskForm, taskTitleInput, taskDescriptionInput,
    taskStatusSelect, taskTitleError, taskDescriptionError, taskStatusError,
    taskSubmitBtn,
    // Sección de la tabla de tareas registradas
    tasksSection, tasksCount, tasksTableBody, tasksEmptyState
} from './dom.js';

// ----- RE-EXPORTACIONES DESDE validation.js -----
// Exponemos las funciones de validación y manejo visual de errores
export {
    isValidInput,       // Verifica que un campo no esté vacío
    showError,          // Muestra un mensaje de error en un elemento del DOM
    clearError,         // Limpia el mensaje de error de un elemento del DOM
    validateSearchForm, // Valida el formulario de búsqueda completo
    validateTaskForm    // Valida el formulario de tareas completo
} from './validation.js';

// ----- RE-EXPORTACIONES DESDE ui.js -----
// Exponemos todas las funciones de manipulación visual de la interfaz
export {
    displayUserData,   // Muestra los datos del usuario en la sección correspondiente
    hideUserData,      // Oculta y limpia la sección de datos del usuario
    showTaskForm,      // Muestra el formulario de registro de tareas
    hideTaskForm,      // Oculta el formulario de registro de tareas
    showTasksSection,  // Muestra la sección de la tabla de tareas
    updateTaskCounter, // Actualiza el texto del contador de tareas
    showEmptyState,    // Muestra el mensaje de "no hay tareas"
    hideEmptyState,    // Oculta el mensaje de "no hay tareas"
    formatTaskStatus,  // Convierte el estado técnico a texto legible en español
    createTaskRow,     // Crea y retorna un elemento TR con los datos de una tarea
    addTaskToTable,    // Inserta una tarea en la tabla y actualiza contadores y estados
    clearTaskForm,     // Limpia todos los campos y errores del formulario de tareas
    updateTaskRow,     // Actualiza visualmente una fila existente en la tabla (RF-03)
    removeTaskRow,     // Elimina visualmente una fila de la tabla (RF-04)
    showEditModal,     // Muestra el modal de edición con datos precargados (RF-03)
    hideEditModal      // Oculta y limpia el modal de edición (RF-03)
} from './ui.js';

// ----- RE-EXPORTACIONES DESDE api.js -----
// Exponemos las funciones de comunicación con el servidor
export {
    searchUserByDocument, // Busca un usuario en el servidor por su documento (GET)
    registerTask,         // Registra una nueva tarea en el servidor (POST)
    updateTask,           // Actualiza una tarea existente en el servidor (PATCH) (RF-03)
    deleteTask            // Elimina una tarea del servidor (DELETE) (RF-04)
} from './api.js';

// ----- RE-EXPORTACIONES DESDE handlers.js -----
// Exponemos los manejadores de eventos de los formularios y la tabla
export {
    handleSearchFormSubmit,  // Maneja el submit del formulario de búsqueda
    handleTaskFormSubmit,    // Maneja el submit del formulario de tareas
    handleSearchInputChange, // Maneja el input en el campo de documento
    handleTaskInputChange,   // Maneja el input/change en los campos de tareas
    handleEditTask,          // Abre el modal de edición y guarda cambios (RF-03)
    handleDeleteTask,        // Confirma y elimina una tarea (RF-04)
    handleTableClick         // Delegador de clics en la tabla (RF-03 y RF-04)
} from './handlers.js';

// ----- RE-EXPORTACIONES DESDE events.js -----
// Exponemos la función que registra todos los event listeners de la app
export {
    registerEventListeners // Conecta todos los elementos del DOM con sus handlers
} from './events.js';