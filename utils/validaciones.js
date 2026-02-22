// MÓDULO: utils/validaciones.js
// CAPA:   Utils (Funciones reutilizables e independientes)

// Responsabilidad ÚNICA: verificar que los datos ingresados por
// el usuario sean correctos antes de procesarlos o enviarlos.
//
// Al centralizar la validación aquí, evitamos duplicar lógica
// y facilitamos agregar nuevas reglas en el futuro sin tocar
// otros módulos. Además, este módulo puede reutilizarse en
// otros proyectos institucionales sin ninguna modificación.
//
// Dependencias de este módulo: NINGUNA
// (las referencias al DOM se reciben como parámetros, no se importan)

// Valida que un campo no esté vacío ni contenga solo espacios en blanco
// Parámetro: value - El valor del campo a validar (string)
// Retorna: true si el campo tiene contenido válido, false si está vacío
export function entradaEsValida(value) {
    // trim() elimina espacios al inicio y al final del string
    // length > 0 verifica que, después de limpiar espacios, queda contenido real
    return value.trim().length > 0;
}

// Muestra un mensaje de error en un elemento span del DOM
// También aplica la clase CSS 'error' al input para cambiar su apariencia (borde rojo)
// Parámetros:
//   elementoError  - El span donde se escribirá el mensaje de error
//   elementoInput  - El input o select que contiene el error
//   mensaje        - El texto del mensaje de error a mostrar al usuario
export function mostrarError(elementoError, elementoInput, mensaje) {
    // Asignamos el texto del error usando textContent (más seguro que innerHTML)
    // porque así evitamos inyección de HTML malicioso en la interfaz
    elementoError.textContent = mensaje;

    // Agregamos la clase 'error' para que el CSS aplique estilos visuales de error
    // classList.add() agrega la clase sin eliminar las que ya tiene el elemento
    elementoInput.classList.add('error');
}

// Limpia el mensaje de error y restaura el estilo normal del campo
// Se llama cuando el usuario corrige el campo o cuando la validación pasa
// Parámetros:
//   elementoError  - El span del cual se eliminará el mensaje de error
//   elementoInput  - El input o select del cual se removerá la clase de error
export function limpiarError(elementoError, elementoInput) {
    // Asignamos un string vacío para borrar cualquier mensaje de error visible
    elementoError.textContent = '';

    // Removemos la clase 'error' para restaurar la apariencia normal del campo
    // classList.remove() elimina solo esa clase sin afectar las demás
    elementoInput.classList.remove('error');
}

// Valida el formulario de búsqueda de usuario antes de hacer la petición al servidor
// Verifica que el campo de documento no esté vacío
// Parámetros:
//   documentoInput  - El input donde el usuario escribió el documento
//   documentoError  - El span donde se mostrará el error si lo hay
// Retorna: true si el formulario es válido y se puede procesar, false si hay errores
export function validarFormularioBusqueda(documentoInput, documentoError) {
    // Leemos el valor actual del input para validarlo
    const valorDocumento = documentoInput.value;

    // Variable de control: iniciamos asumiendo que el formulario es válido
    let esValido = true;

    // ----- VALIDACIÓN DEL CAMPO DOCUMENTO -----
    if (!entradaEsValida(valorDocumento)) {
        // El campo está vacío o solo tiene espacios: mostramos el mensaje de error
        mostrarError(
            documentoError,
            documentoInput,
            'El documento del usuario es obligatorio'
        );
        // Marcamos como inválido para que no se procese la búsqueda
        esValido = false;
    } else {
        // El campo tiene contenido: limpiamos cualquier error previo que pudiera haber
        limpiarError(documentoError, documentoInput);
    }

    // Retornamos el resultado final de la validación
    return esValido;
}

// Valida el formulario de registro de tareas antes de enviar los datos al servidor
// Verifica que todos los campos (título, descripción y estado) estén completos
// Parámetros: objeto con todos los elementos del formulario de tareas
//   tituloInput       - Input del título
//   descripcionInput  - Textarea de la descripción
//   estadoSelect      - Select del estado
//   tituloError       - Span de error del título
//   descripcionError  - Span de error de la descripción
//   estadoError       - Span de error del estado
// Retorna: true si todos los campos son válidos, false si alguno tiene error
export function validarFormularioTareas(
    tituloInput, descripcionInput, estadoSelect,
    tituloError, descripcionError, estadoError
) {
    // Leemos los valores actuales de cada campo
    const valorTitulo      = tituloInput.value;
    const valorDescripcion = descripcionInput.value;
    const valorEstado      = estadoSelect.value;

    // Variable de control: iniciamos asumiendo que todo es válido
    let esValido = true;

    // ----- VALIDACIÓN DEL TÍTULO -----
    if (!entradaEsValida(valorTitulo)) {
        // El título está vacío: mostramos el mensaje de error
        mostrarError(tituloError, tituloInput, 'El título de la tarea es obligatorio');
        // Marcamos como inválido pero continuamos para mostrar todos los errores a la vez
        esValido = false;
    } else {
        // El título tiene contenido: limpiamos su error previo si lo hubiera
        limpiarError(tituloError, tituloInput);
    }

    // ----- VALIDACIÓN DE LA DESCRIPCIÓN -----
    if (!entradaEsValida(valorDescripcion)) {
        // La descripción está vacía: mostramos el mensaje de error
        mostrarError(descripcionError, descripcionInput, 'La descripción de la tarea es obligatoria');
        esValido = false;
    } else {
        // La descripción tiene contenido: limpiamos su error previo
        limpiarError(descripcionError, descripcionInput);
    }

    // ----- VALIDACIÓN DEL ESTADO -----
    if (!entradaEsValida(valorEstado)) {
        // No se seleccionó ningún estado: mostramos el mensaje de error
        mostrarError(estadoError, estadoSelect, 'Debes seleccionar un estado para la tarea');
        esValido = false;
    } else {
        // Se eligió un estado válido: limpiamos su error previo
        limpiarError(estadoError, estadoSelect);
    }

    // Retornamos el estado final: false si algún campo falló, true si todos pasaron
    return esValido;
}