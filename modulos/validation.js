// validation.js - FUNCIONES DE VALIDACIÓN

// Este módulo contiene todas las funciones encargadas de verificar que los datos ingresados por el usuario sean correctos antes de
// procesarlos o enviarlos al servidor
// Centralizar la validación aquí evita duplicar lógica y facilita agregar nuevas reglas en el futuro

// Importamos los elementos del DOM que necesitamos para mostrar errores
// y leer los valores de los inputs desde el módulo centralizado de DOM
import {
    userDocumentInput, userDocumentError,
    taskTitleInput, taskTitleError,
    taskDescriptionInput, taskDescriptionError,
    taskStatusSelect, taskStatusError
} from './dom.js';

// Valida que un campo no esté vacío ni contenga solo espacios en blanco
// Parámetro: value - El valor del campo a validar (string)
// Retorna: true si el campo tiene contenido válido, false si está vacío o solo tiene espacios
export function isValidInput(value) {
    // trim() elimina los espacios en blanco al inicio y al final del string
    // length > 0 verifica que después de limpiar espacios, aún queda contenido real
    return value.trim().length > 0;
}

// Muestra un mensaje de error en un elemento span del DOM
// También aplica la clase CSS 'error' al input para que cambie de apariencia (ej: borde rojo)
// Parámetros:
//   errorElement - El span donde se escribirá el mensaje de error
//   inputElement - El input o select que contiene el error
//   message      - El texto del mensaje de error a mostrar al usuario
export function showError(errorElement, inputElement, message) {
    // Asignamos el texto del error al span usando textContent (más seguro que innerHTML)
    errorElement.textContent = message;

    // Agregamos la clase 'error' al input para que el CSS aplique estilos visuales de error
    // classList.add() agrega una clase sin eliminar las que ya tiene el elemento
    inputElement.classList.add('error');
}

// Limpia el mensaje de error de un elemento span y restaura el estilo normal del input
// Se llama cuando el usuario corrige el campo o cuando la validación pasa exitosamente
// Parámetros:
//   errorElement - El span del cual se eliminará el mensaje de error
//   inputElement - El input o select del cual se removerá la clase de error
export function clearError(errorElement, inputElement) {
    // Asignamos un string vacío para borrar cualquier mensaje de error visible
    errorElement.textContent = '';

    // Removemos la clase 'error' del input para restaurar su apariencia normal
    // classList.remove() elimina solo esa clase sin afectar las demás
    inputElement.classList.remove('error');
}

// Valida el formulario de búsqueda de usuario antes de hacer la petición al servidor
// Verifica que el campo de documento no esté vacío
// Retorna: true si el formulario es válido y se puede procesar, false si hay errores
export function validateSearchForm() {
    // Leemos el valor actual del input de documento para validarlo
    const documentValue = userDocumentInput.value;

    // Variable de control que indica si el formulario es válido
    // Iniciamos en true (asumimos que es válido) y la cambiamos a false si encontramos errores
    let isValid = true;

    // ----- VALIDACIÓN DEL CAMPO DOCUMENTO -----
    if (!isValidInput(documentValue)) {
        // Si isValidInput retorna false, el campo está vacío o solo tiene espacios
        // Llamamos a showError para mostrar el mensaje y aplicar el estilo de error
        showError(
            userDocumentError,
            userDocumentInput,
            'El documento del usuario es obligatorio'
        );
        // Marcamos el formulario como inválido para que no se procese la búsqueda
        isValid = false;
    } else {
        // Si el campo tiene contenido válido, nos aseguramos de limpiar cualquier error previo
        // Esto permite que el mensaje desaparezca si el usuario corrije el campo
        clearError(userDocumentError, userDocumentInput);
    }

    // Retornamos el resultado final de la validación
    return isValid;
}

// Valida el formulario de registro de tareas antes de enviar los datos al servidor
// Verifica que todos los campos (título, descripción y estado) estén completos
// Retorna: true si todos los campos son válidos, false si al menos uno tiene error
export function validateTaskForm() {
    // Leemos los valores actuales de cada campo del formulario de tareas
    const titleValue       = taskTitleInput.value;
    const descriptionValue = taskDescriptionInput.value;
    const statusValue      = taskStatusSelect.value;

    // Variable de control para el estado global de validación del formulario
    // Iniciamos en true y la cambiamos a false ante cualquier error encontrado
    let isValid = true;

    // ----- VALIDACIÓN DEL TÍTULO -----
    if (!isValidInput(titleValue)) {
        // Si el título está vacío o solo tiene espacios, mostramos el error correspondiente
        showError(
            taskTitleError,
            taskTitleInput,
            'El título de la tarea es obligatorio'
        );
        // Marcamos como inválido pero continuamos para validar los demás campos
        // Así el usuario ve todos los errores a la vez en lugar de uno por uno
        isValid = false;
    } else {
        // Si el título es válido, limpiamos cualquier error previo de ese campo
        clearError(taskTitleError, taskTitleInput);
    }

    // ----- VALIDACIÓN DE LA DESCRIPCIÓN -----
    if (!isValidInput(descriptionValue)) {
        // Si la descripción está vacía, mostramos el mensaje de error correspondiente
        showError(
            taskDescriptionError,
            taskDescriptionInput,
            'La descripción de la tarea es obligatoria'
        );
        // Seguimos marcando como inválido
        isValid = false;
    } else {
        // Si la descripción tiene contenido, limpiamos su error
        clearError(taskDescriptionError, taskDescriptionInput);
    }

    // ----- VALIDACIÓN DEL ESTADO -----
    if (!isValidInput(statusValue)) {
        // Si no se seleccionó ningún estado del select, mostramos el error
        showError(
            taskStatusError,
            taskStatusSelect,
            'Debes seleccionar un estado para la tarea'
        );
        // Marcamos como inválido
        isValid = false;
    } else {
        // Si se eligió un estado válido, limpiamos su error
        clearError(taskStatusError, taskStatusSelect);
    }

    // Retornamos el estado final de validación
    // Si algún campo falló, isValid será false y el formulario no se procesará
    return isValid;
}