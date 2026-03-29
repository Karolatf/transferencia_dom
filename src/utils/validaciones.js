// MÓDULO: utils/validaciones.js
// CAPA:   Utils

export function entradaEsValida(value) {
    return value.trim().length > 0;
}

export function mostrarError(elementoError, elementoInput, mensaje) {
    elementoError.textContent = mensaje;
    elementoInput.classList.add('error');
}

export function limpiarError(elementoError, elementoInput) {
    elementoError.textContent = '';
    elementoInput.classList.remove('error');
}

export function validarFormularioBusqueda(documentoInput, documentoError) {
    const valorDocumento = documentoInput.value;
    let esValido = true;

    if (!entradaEsValida(valorDocumento)) {
        mostrarError(documentoError, documentoInput, 'El documento del usuario es obligatorio');
        esValido = false;
    } else {
        limpiarError(documentoError, documentoInput);
    }

    return esValido;
}

// Valida el formulario de crear/editar usuario en el panel admin
export function validarFormularioUsuario({ docInput, nameInput, emailInput, docError, nameError, emailError }) {
    let esValido = true;

    [docError, nameError, emailError].forEach(el => { if (el) el.textContent = ''; });
    [docInput, nameInput, emailInput].forEach(el => { if (el) el.classList.remove('error'); });

    if (!entradaEsValida(docInput.value)) {
        mostrarError(docError, docInput, 'El documento es obligatorio');
        esValido = false;
    } else if (!/^\d+$/.test(docInput.value.trim())) {
        mostrarError(docError, docInput, 'El documento solo puede contener números');
        esValido = false;
    }

    if (!entradaEsValida(nameInput.value)) {
        mostrarError(nameError, nameInput, 'El nombre es obligatorio');
        esValido = false;
    } else if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(nameInput.value.trim())) {
        mostrarError(nameError, nameInput, 'El nombre solo puede contener letras y espacios');
        esValido = false;
    }

    if (!entradaEsValida(emailInput.value)) {
        mostrarError(emailError, emailInput, 'El correo es obligatorio');
        esValido = false;
    }

    return esValido;
}
