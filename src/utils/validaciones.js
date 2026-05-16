// Archivo: utils/validaciones.js
// Este archivo contiene las funciones que validan los formularios de la aplicación
// antes de enviar los datos al servidor.
// Si los datos no son válidos, se muestra un mensaje de error en el campo correspondiente
// y un toast de SweetAlert2 con el primer error encontrado.

// Importamos la función para mostrar toasts (mensajes emergentes) al usuario
import { mostrarNotificacion } from './notificaciones.js';

// Exportamos la función entradaEsValida que verifica si un campo de texto tiene contenido
// Retorna true si el campo tiene al menos un carácter que no sea espacio, o false si está vacío
export function entradaEsValida(value) {
    return value.trim().length > 0;
}

// Exportamos la función mostrarError que pone un mensaje de error debajo de un campo del formulario
// y le agrega la clase CSS 'error' al campo para resaltarlo en rojo
export function mostrarError(elementoError, elementoInput, mensaje) {
    // Escribimos el mensaje de error en el span de error debajo del campo
    if (elementoError) elementoError.textContent = mensaje;
    // Agregamos la clase 'error' al campo para que el CSS lo pinte de rojo
    if (elementoInput) elementoInput.classList.add('error');
}

// Exportamos la función limpiarError que borra el mensaje de error y quita el resaltado rojo del campo
export function limpiarError(elementoError, elementoInput) {
    // Vaciamos el texto del span de error
    if (elementoError) elementoError.textContent = '';
    // Quitamos la clase 'error' del campo para que vuelva a su estilo normal
    if (elementoInput) elementoInput.classList.remove('error');
}

// ── VALIDACIÓN DEL FORMULARIO DE BÚSQUEDA (modo estudiante) ──────────────────

// Exportamos la función validarFormularioBusqueda que verifica que el campo de documento
// no esté vacío antes de buscar en el servidor
// Retorna true si el campo es válido, o false si está vacío
export async function validarFormularioBusqueda(documentoInput, documentoError) {
    // Leemos el valor del campo de documento (o cadena vacía si el elemento no existe)
    const valorDocumento = documentoInput ? documentoInput.value : '';
    let esValido = true;

    // Verificamos que el campo no esté vacío
    if (!entradaEsValida(valorDocumento)) {
        const msg = 'El documento del usuario es obligatorio';
        // Marcamos el campo con error y mostramos el mensaje debajo de él
        mostrarError(documentoError, documentoInput, msg);
        // Mostramos también un toast con el error para que sea más visible
        await mostrarNotificacion(msg, 'error');
        esValido = false;
    } else {
        // Si el campo es válido, limpiamos cualquier error anterior que pudiera quedar
        limpiarError(documentoError, documentoInput);
    }

    return esValido;
}

// ── VALIDACIÓN DEL FORMULARIO DE USUARIO (crear o editar en panel admin) ──────

// Exportamos la función validarFormularioUsuario que verifica los tres campos del formulario
// de usuario del administrador: documento, nombre y correo electrónico
// Retorna true si todos los campos son válidos
export async function validarFormularioUsuario({ docInput, nameInput, emailInput, docError, nameError, emailError }) {
    let esValido = true;
    // Guardamos el primer error encontrado para mostrarlo como toast al final
    let primerMensaje = null;

    // Limpiamos todos los errores anteriores antes de validar desde cero
    [docError, nameError, emailError].forEach(el => { if (el) el.textContent = ''; });
    [docInput, nameInput, emailInput].forEach(el => { if (el) el.classList.remove('error'); });

    // ── Validar el campo de documento de identidad ────────────────────────────
    const valorDoc = docInput ? docInput.value.trim() : '';

    // El documento no puede estar vacío
    if (!entradaEsValida(valorDoc)) {
        const msg = 'El número de documento es obligatorio';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El documento debe tener al menos 5 caracteres
    } else if (valorDoc.length < 5) {
        const msg = 'El documento debe tener al menos 5 caracteres';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El documento no puede tener más de 20 caracteres
    } else if (valorDoc.length > 20) {
        const msg = 'El documento no puede exceder los 20 caracteres';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El documento solo puede contener dígitos numéricos (sin letras ni símbolos)
    } else if (!/^\d+$/.test(valorDoc)) {
        const msg = 'El documento solo puede contener números';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar el campo de nombre completo ───────────────────────────────────
    const valorName = nameInput ? nameInput.value.trim() : '';

    // El nombre no puede estar vacío
    if (!entradaEsValida(valorName)) {
        const msg = 'El nombre es obligatorio';
        mostrarError(nameError, nameInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El nombre debe tener al menos 3 caracteres
    } else if (valorName.length < 3) {
        const msg = 'El nombre debe tener al menos 3 caracteres';
        mostrarError(nameError, nameInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El nombre no puede tener más de 100 caracteres
    } else if (valorName.length > 100) {
        const msg = 'El nombre no puede exceder los 100 caracteres';
        mostrarError(nameError, nameInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El nombre solo puede contener letras (incluyendo tildes y ñ) y espacios
    } else if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(valorName)) {
        const msg = 'El nombre solo puede contener letras y espacios';
        mostrarError(nameError, nameInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar el campo de correo electrónico ────────────────────────────────
    // El input usa type="text" en lugar de type="email" para controlar el mensaje de error manualmente
    const valorEmail = emailInput ? emailInput.value.trim() : '';

    // El correo no puede estar vacío
    if (!entradaEsValida(valorEmail)) {
        const msg = 'El correo electrónico es obligatorio';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El correo debe tener el formato correcto: texto@texto.texto
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorEmail)) {
        const msg = 'El correo electrónico no tiene un formato válido';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El correo no puede tener más de 100 caracteres
    } else if (valorEmail.length > 100) {
        const msg = 'El correo no puede exceder los 100 caracteres';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Mostramos el primer error encontrado como toast de SweetAlert2
    if (primerMensaje) {
        await mostrarNotificacion(primerMensaje, 'error');
    }

    return esValido;
}

// ── VALIDACIÓN DEL FORMULARIO DE TAREA (crear o editar en panel admin) ────────

// Exportamos la función validarFormularioTarea que verifica los campos obligatorios
// del formulario de creación y edición de tareas
// Retorna true si todos los campos son válidos
export async function validarFormularioTarea({ titleInput, statusInput, titleError, statusError }) {
    let esValido = true;
    let primerMensaje = null;

    // Limpiamos todos los errores anteriores
    [titleError, statusError].forEach(el => { if (el) el.textContent = ''; });
    [titleInput, statusInput].forEach(el => { if (el) el.classList.remove('error'); });

    // ── Validar el campo de título ────────────────────────────────────────────
    const valorTitulo = titleInput ? titleInput.value.trim() : '';

    // El título no puede estar vacío
    if (!entradaEsValida(valorTitulo)) {
        const msg = 'El título de la tarea es obligatorio';
        mostrarError(titleError, titleInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El título debe tener al menos 3 caracteres
    } else if (valorTitulo.length < 3) {
        const msg = 'El título debe tener al menos 3 caracteres';
        mostrarError(titleError, titleInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El título no puede tener más de 200 caracteres
    } else if (valorTitulo.length > 200) {
        const msg = 'El título no puede exceder los 200 caracteres';
        mostrarError(titleError, titleInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar el campo de estado ────────────────────────────────────────────
    const valorEstado = statusInput ? statusInput.value : '';

    // Debe haberse seleccionado un estado para la tarea
    if (!valorEstado) {
        const msg = 'El estado de la tarea es obligatorio';
        mostrarError(statusError, statusInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Mostramos el primer error como toast
    if (primerMensaje) {
        await mostrarNotificacion(primerMensaje, 'error');
    }

    return esValido;
}

// ── VALIDACIÓN DEL FORMULARIO DE LOGIN ────────────────────────────────────────

// Exportamos la función validarFormularioLogin que verifica el correo y la contraseña
// del formulario de inicio de sesión
// Retorna true si ambos campos son válidos
export async function validarFormularioLogin({ emailInput, passwordInput, emailError, passwordError }) {
    let esValido      = true;
    let primerMensaje = null;

    // Limpiamos los errores anteriores de los dos campos
    [emailError, passwordError].forEach(el => { if (el) el.textContent = ''; });
    [emailInput, passwordInput].forEach(el => { if (el) el.classList.remove('error'); });

    // ── Validar el campo de correo electrónico ────────────────────────────────
    // El input usa type="text" para que podamos controlar el mensaje de error manualmente
    const valorEmail = emailInput ? emailInput.value.trim() : '';

    // El correo no puede estar vacío
    if (!entradaEsValida(valorEmail)) {
        const msg = 'El correo electrónico es obligatorio';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El correo debe tener el formato correcto (texto antes del @, @ en el medio, texto con punto al final)
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorEmail)) {
        const msg = 'El correo electrónico no tiene un formato válido';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // El correo no puede tener más de 100 caracteres
    } else if (valorEmail.length > 100) {
        const msg = 'El correo no puede exceder los 100 caracteres';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar el campo de contraseña ────────────────────────────────────────
    const valorPassword = passwordInput ? passwordInput.value : '';

    // La contraseña no puede estar vacía
    if (!valorPassword) {
        const msg = 'La contraseña es obligatoria';
        mostrarError(passwordError, passwordInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // La contraseña debe tener al menos 6 caracteres
    } else if (valorPassword.length < 6) {
        const msg = 'La contraseña debe tener al menos 6 caracteres';
        mostrarError(passwordError, passwordInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Mostramos el primer error como toast de SweetAlert2
    if (primerMensaje) await mostrarNotificacion(primerMensaje, 'error');

    return esValido;
}

// ── VALIDACIÓN DEL FORMULARIO DE REGISTRO ────────────────────────────────────

// Exportamos la función validarFormularioRegistro que verifica los 5 campos del modal de registro:
// nombre completo, documento, correo electrónico, contraseña y confirmación de contraseña
// Retorna true si todos los campos son válidos
export async function validarFormularioRegistro({
    nombreInput, nombreError,
    docInput, docError,
    emailInput, emailError,
    passInput, passError,
    confirmarInput, confirmarError
}) {
    let esValido = true;
    let primerMensaje = null;

    // Limpiamos todos los errores anteriores de los 5 campos
    [nombreError, docError, emailError, passError, confirmarError]
        .forEach(el => { if (el) el.textContent = ''; });
    [nombreInput, docInput, emailInput, passInput, confirmarInput]
        .forEach(el => { if (el) el.classList.remove('error'); });

    // ── Validar el campo de nombre completo ───────────────────────────────────
    const valorNombre = nombreInput ? nombreInput.value.trim() : '';

    if (!entradaEsValida(valorNombre)) {
        const msg = 'El nombre completo es obligatorio';
        mostrarError(nombreError, nombreInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorNombre.length < 3) {
        const msg = 'El nombre debe tener al menos 3 caracteres';
        mostrarError(nombreError, nombreInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorNombre.length > 100) {
        const msg = 'El nombre no puede exceder los 100 caracteres';
        mostrarError(nombreError, nombreInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // Solo puede contener letras (incluyendo tildes y ñ) y espacios
    } else if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(valorNombre)) {
        const msg = 'El nombre solo puede contener letras y espacios';
        mostrarError(nombreError, nombreInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar el campo de documento de identidad ────────────────────────────
    const valorDoc = docInput ? docInput.value.trim() : '';

    if (!entradaEsValida(valorDoc)) {
        const msg = 'El número de documento es obligatorio';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorDoc.length < 5) {
        const msg = 'El documento debe tener al menos 5 dígitos';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorDoc.length > 20) {
        const msg = 'El documento no puede exceder los 20 dígitos';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^\d+$/.test(valorDoc)) {
        const msg = 'El documento solo puede contener números';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar el campo de correo electrónico ────────────────────────────────
    const valorEmail = emailInput ? emailInput.value.trim() : '';

    if (!entradaEsValida(valorEmail)) {
        const msg = 'El correo electrónico es obligatorio';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorEmail)) {
        const msg = 'El correo electrónico no tiene un formato válido';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorEmail.length > 100) {
        const msg = 'El correo no puede exceder los 100 caracteres';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar el campo de contraseña ────────────────────────────────────────
    const valorPass = passInput ? passInput.value : '';

    if (!valorPass) {
        const msg = 'La contraseña es obligatoria';
        mostrarError(passError, passInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorPass.length < 6) {
        const msg = 'La contraseña debe tener al menos 6 caracteres';
        mostrarError(passError, passInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar el campo de confirmar contraseña ──────────────────────────────
    const valorConfirmar = confirmarInput ? confirmarInput.value : '';

    // El campo de confirmación no puede estar vacío
    if (!valorConfirmar) {
        const msg = 'Debes confirmar tu contraseña';
        mostrarError(confirmarError, confirmarInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    // Las dos contraseñas deben ser idénticas
    } else if (valorPass && valorConfirmar !== valorPass) {
        const msg = 'Las contraseñas no coinciden';
        mostrarError(confirmarError, confirmarInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Mostramos el primer error encontrado como toast de SweetAlert2
    if (primerMensaje) {
        await mostrarNotificacion(primerMensaje, 'error');
    }

    return esValido;
}
