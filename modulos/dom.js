// SELECCIÓN DE ELEMENTOS DEL DOM

// Este módulo es responsable de localizar y exportar todos los elementos HTML con los que la aplicación interactúa
// Al centralizar las selecciones aquí, evitamos repetir getElementById()
// en cada módulo y tenemos un único lugar donde actualizar los IDs si el HTML cambia

// ----- FORMULARIO DE BÚSQUEDA DE USUARIO -----

// Seleccionamos el formulario completo de búsqueda usando su ID único
// Este formulario contiene el campo de documento y el botón de búsqueda
export const searchUserForm = document.getElementById('searchUserForm');

// Seleccionamos el campo de entrada donde el usuario digita el número de documento
// Es un input de tipo texto que captura el ID del usuario a buscar
export const userDocumentInput = document.getElementById('userDocument');

// Seleccionamos el elemento span donde mostraremos mensajes de error del documento
// Este span aparece debajo del input cuando la validación falla
export const userDocumentError = document.getElementById('userDocumentError');

// Seleccionamos el botón de búsqueda para posibles manipulaciones futuras
// Por ejemplo, podríamos deshabilitarlo mientras se espera la respuesta del servidor
export const searchBtn = document.getElementById('searchBtn');

// ----- SECCIÓN DE DATOS DEL USUARIO -----

// Seleccionamos la sección completa que muestra los datos del usuario encontrado
// Esta sección está oculta por defecto (clase 'hidden') y se muestra al encontrar un usuario
export const userDataSection = document.getElementById('userDataSection');

// Seleccionamos los spans individuales donde mostraremos cada dato del usuario
// Cada span corresponde a un campo específico del objeto usuario

// Span que muestra el ID (documento) del usuario encontrado
export const userIdSpan = document.getElementById('userId');

// Span que muestra el nombre completo del usuario encontrado
export const userNameSpan = document.getElementById('userName');

// Span que muestra el correo electrónico del usuario encontrado
export const userEmailSpan = document.getElementById('userEmail');

// ----- FORMULARIO DE REGISTRO DE TAREAS -----

// Seleccionamos la sección que contiene el formulario de tareas
// También está oculta por defecto hasta que se encuentre un usuario válido
export const taskFormSection = document.getElementById('taskFormSection');

// Seleccionamos el formulario completo de registro de tareas
// Este formulario tiene los campos: título, descripción y estado
export const taskForm = document.getElementById('taskForm');

// Seleccionamos cada campo del formulario de tareas individualmente
// para poder leer sus valores y controlarlos desde otros módulos

// Input de texto para el título de la tarea
export const taskTitleInput = document.getElementById('taskTitle');

// Textarea para la descripción detallada de la tarea
export const taskDescriptionInput = document.getElementById('taskDescription');

// Select (lista desplegable) para elegir el estado de la tarea
export const taskStatusSelect = document.getElementById('taskStatus');

// Seleccionamos los elementos de error para cada campo del formulario de tareas
// Cada campo tiene su propio span de error que se activa si la validación falla

// Span de error para el campo de título de la tarea
export const taskTitleError = document.getElementById('taskTitleError');

// Span de error para el campo de descripción de la tarea
export const taskDescriptionError = document.getElementById('taskDescriptionError');

// Span de error para el select de estado de la tarea
export const taskStatusError = document.getElementById('taskStatusError');

// Seleccionamos el botón de envío del formulario de tareas
// Podría usarse para deshabilitar el botón mientras se procesa el registro
export const taskSubmitBtn = document.getElementById('taskSubmitBtn');

// ----- SECCIÓN DE TAREAS REGISTRADAS -----

// Seleccionamos la sección completa que muestra la tabla con todas las tareas
// Está oculta inicialmente y se revela cuando se registra la primera tarea
export const tasksSection = document.getElementById('tasksSection');

// Seleccionamos el elemento que muestra el contador total de tareas
// Se actualiza dinámicamente cada vez que se agrega una nueva tarea
export const tasksCount = document.getElementById('tasksCount');

// Seleccionamos el tbody de la tabla donde insertaremos dinámicamente las filas de tareas
// Aquí se añaden los TR creados con createElement() al registrar cada tarea
export const tasksTableBody = document.getElementById('tasksTableBody');

// Seleccionamos el mensaje de estado vacío que se muestra cuando no hay tareas
// Se oculta automáticamente cuando se registra al menos una tarea
export const tasksEmptyState = document.getElementById('tasksEmptyState');