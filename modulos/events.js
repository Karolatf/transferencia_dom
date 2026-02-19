// REGISTRO DE EVENT LISTENERS

// RF-01 READ   -> submit en searchUserForm
// RF-02 CREATE -> submit en taskForm
// RF-03 UPDATE -> clic delegado en tasksTableBody (botón Editar)
// RF-04 DELETE -> clic delegado en tasksTableBody (botón Eliminar)

// Este módulo tiene una única responsabilidad: conectar los elementos del DOM con sus respectivos manejadores de eventos (handlers)
// Al centralizarlo aquí, tenemos una vista clara de todos los eventos activos de la aplicación en un solo lugar

// Importamos los elementos del DOM que vamos a escuchar
// Solo los elementos que tienen eventos registrados necesitan importarse aquí
import {
    searchUserForm,       // Formulario de búsqueda (evento submit)
    userDocumentInput,    // Input de documento (evento input)
    taskForm,             // Formulario de tareas (evento submit)
    taskTitleInput,       // Input de título (evento input)
    taskDescriptionInput, // Input de descripción (evento input)
    taskStatusSelect,     // Select de estado (evento change)
    tasksTableBody        // Tbody de la tabla (evento clic delegado) ← NUEVO (RF-03 y RF-04)
} from './dom.js';

// Importamos todos los manejadores desde el módulo de handlers
// Cada handler corresponde a un evento específico de la aplicación
import {
    handleSearchFormSubmit,  // Handler del submit de búsqueda
    handleTaskFormSubmit,    // Handler del submit de tareas
    handleSearchInputChange, // Handler del input en el campo de documento
    handleTaskInputChange,   // Handler del input/change en los campos de tareas
    handleTableClick         // Handler delegado para editar y eliminar ← NUEVO (RF-03 y RF-04)
} from './handlers.js';

// Importamos el arreglo de tareas del estado para pasarlo al handler de la tabla
// El handler necesita buscar la tarea completa por ID cuando el usuario hace clic
import { registeredTasks } from './state.js';

// Registra todos los event listeners de la aplicación en sus respectivos elementos
// Esta función se llama una sola vez al inicializar la app (desde main.js)
// Centralizar el registro aquí facilita agregar o quitar eventos en el futuro
export function registerEventListeners() {
    // ----- EVENTOS DEL FORMULARIO DE BÚSQUEDA -----

    // Escuchamos el evento 'submit' del formulario de búsqueda
    // Se activa cuando el usuario hace clic en "Buscar" o presiona Enter en el campo
    // handleSearchFormSubmit se encargará de validar y consultar el servidor
    searchUserForm.addEventListener('submit', handleSearchFormSubmit);

    // Escuchamos el evento 'input' del campo de documento
    // Se activa con cada pulsación de tecla mientras el usuario escribe
    // handleSearchInputChange limpia el error del campo en tiempo real
    userDocumentInput.addEventListener('input', handleSearchInputChange);

    // ----- EVENTOS DEL FORMULARIO DE TAREAS -----

    // Escuchamos el evento 'submit' del formulario de tareas
    // Se activa cuando el usuario hace clic en "Registrar Tarea"
    // handleTaskFormSubmit validará y enviará la nueva tarea al servidor
    taskForm.addEventListener('submit', handleTaskFormSubmit);

    // Escuchamos el evento 'input' del campo de título de la tarea
    // Se activa con cada pulsación de tecla en ese campo
    // handleTaskInputChange limpiará solo el error del título
    taskTitleInput.addEventListener('input', handleTaskInputChange);

    // Escuchamos el evento 'input' del campo de descripción de la tarea
    // Se activa con cada pulsación de tecla en ese campo
    // handleTaskInputChange limpiará solo el error de la descripción
    taskDescriptionInput.addEventListener('input', handleTaskInputChange);

    // Escuchamos el evento 'change' del select de estado
    // 'change' (no 'input') es el evento correcto para elementos select:
    // se activa cuando el usuario elige una opción diferente a la actual
    // handleTaskInputChange limpiará el error del estado al detectar una selección
    taskStatusSelect.addEventListener('change', handleTaskInputChange);

    // ----- EVENTO DELEGADO DE LA TABLA (RF-03 y RF-04) -----
    // En lugar de agregar un listener a cada botón de Editar/Eliminar individualmente,
    // registramos UN SOLO listener en el tbody (contenedor padre de todas las filas)
    // Esto funciona porque los eventos "burbujean" (bubble) desde el hijo hasta el padre
    //
    // Ventajas de la delegación de eventos:
    //   1. Las filas se crean dinámicamente DESPUÉS de registrar este listener,
    //      por lo que sus botones aún no existen en el DOM al cargar la app.
    //      Con delegación, el tbody ya escucha cualquier clic que suceda dentro de él,
    //      sin importar si el elemento fue creado antes o después.
    //   2. Mejor rendimiento: un solo listener cubre todos los botones de todas las filas
    //      en lugar de registrar N listeners (uno por cada botón de editar y eliminar)
    tasksTableBody.addEventListener('click', function(event) {
        // Pasamos el evento y el arreglo actual de tareas registradas al handler
        // El handler usará registeredTasks para buscar el objeto completo de la tarea por su ID
        // Importante: pasamos registeredTasks por referencia, así el handler siempre
        // tendrá acceso a la versión más actualizada del arreglo en el momento del clic
        handleTableClick(event, registeredTasks);
    });
}