// MÓDULO: utils/notificaciones.js
// CAPA: Utils — notificaciones globales del sistema
// Los nombres de las funciones exportadas NO cambian — el resto del proyecto las llama igual.

import Swal from 'sweetalert2';

// obtenerPaletaSwal — lee el modo activo del body y retorna colores para SweetAlert2
function obtenerPaletaSwal() {
    const modo = document.body.dataset.modo || 'inicio';
    const coloresPorModo = {
        inicio:      '#7c3aed',
        usuario:     '#7c3aed',
        admin:       '#0284c7',
        instructor:  '#059669',
    };
    const colorAcento = coloresPorModo[modo] || '#7c3aed';
    return {
        colorAcento,
        customClass: {
            popup:         'swal-popup',
            confirmButton: 'swal-btn-confirmar',
            cancelButton:  'swal-btn-cancelar',
            actions:       'swal-acciones',
        },
    };
}

// mostrarNotificacion — toast no intrusivo en la esquina de la pantalla
// tipo: 'exito' | 'error' | 'advertencia' | 'info'
export async function mostrarNotificacion(mensaje, tipo = 'info') {
    const paleta = obtenerPaletaSwal();
    const tipoSwal = { exito: 'success', error: 'error', advertencia: 'warning', info: 'info' }[tipo] || 'info';
    await Swal.fire({
        toast:             true,
        position:          'top-end',
        icon:              tipoSwal,
        title:             mensaje,
        showConfirmButton: false,
        timer:             3000,
        timerProgressBar:  true,
        customClass:       paleta.customClass,
    });
}

// mostrarConfirmacion — diálogo bloqueante que espera la decisión del usuario
// Retorna: true si confirma, false si cancela
export async function mostrarConfirmacion(mensaje, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', subtexto = '') {
    const paleta = obtenerPaletaSwal();
    const resultado = await Swal.fire({
        title:              mensaje,
        text:               subtexto || undefined,
        icon:               'question',
        showCancelButton:   true,
        confirmButtonText:  textoConfirmar,
        cancelButtonText:   textoCancelar,
        customClass:        paleta.customClass,
        confirmButtonColor: paleta.colorAcento,
        cancelButtonColor:  '#6b7280',
        reverseButtons:     true,
    });
    return resultado.isConfirmed;
}