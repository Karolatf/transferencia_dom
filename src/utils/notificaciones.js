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

    // Si hay algún Swal activo (por ej. un toast anterior todavía visible),
    // lo cerramos sin animación para que el nuevo aparezca limpio.
    if (Swal.isVisible()) {
        Swal.close();
        // Pequeña pausa para que el DOM termine de limpiar el popup anterior
        await new Promise(r => setTimeout(r, 80));
    }

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
        customClass: {
            popup:         'swal-popup-v2',
            confirmButton: 'swal-btn-confirmar',
            cancelButton:  'swal-btn-cancelar',
            actions:       'swal-acciones',
        },
        confirmButtonColor: paleta.colorAcento,
        cancelButtonColor:  '#6b7280',
        reverseButtons:     true,
        buttonsStyling:     true,
    });
    return resultado.isConfirmed;
}

// ── MODAL DESACTIVAR / ACTIVAR USUARIO ───────────────────────────────────────
// Muestra un modal mejorado con campo de motivo obligatorio.
// La validación usa Swal.showValidationMessage() — nativo de SweetAlert2,
// muestra un banner de error dentro del modal sin cerrarlo.
// accion: 'desactivar' | 'activar'
// Retorna: { confirmado: true, motivo: string } | null si canceló
export async function mostrarModalToggleEstado(nombreUsuario, accion) {
    const paleta       = obtenerPaletaSwal();
    const esDesactivar = accion === 'desactivar';
    const colorBtn     = esDesactivar ? '#ef4444' : '#16a34a';
    const labelBtn     = esDesactivar ? 'Desactivar' : 'Activar';
    const icono        = esDesactivar ? '🔒' : '🔓';
    const descripcion  = esDesactivar
        ? 'El usuario <strong>no podrá iniciar sesión</strong> hasta que sea reactivado.'
        : 'El usuario <strong>podrá iniciar sesión</strong> nuevamente en el sistema.';

    const { value: motivo, isConfirmed } = await Swal.fire({
        title:              `${icono} ${labelBtn} a <em>${nombreUsuario}</em>`,
        html: `
            <p style="color:#6b7280;font-size:0.95rem;margin-bottom:1rem">${descripcion}</p>
            <div style="text-align:left">
                <label for="swal-motivo"
                    style="display:block;font-size:0.875rem;font-weight:600;color:#374151;margin-bottom:0.4rem">
                    Motivo <span style="color:#ef4444">*</span>
                </label>
                <textarea
                    id="swal-motivo"
                    placeholder="Describe brevemente el motivo (mín. 10 caracteres)..."
                    rows="3"
                    style="width:100%;padding:0.5rem 0.75rem;border:1.5px solid #d1d5db;
                           border-radius:0.5rem;font-size:0.9rem;resize:vertical;
                           font-family:inherit;outline:none;transition:border-color 200ms"
                    onfocus="this.style.borderColor='${colorBtn}'"
                    onblur="this.style.borderColor='#d1d5db'"
                ></textarea>
            </div>
        `,
        icon:               esDesactivar ? 'warning' : 'question',
        showCancelButton:   true,
        confirmButtonText:  labelBtn,
        cancelButtonText:   'Cancelar',
        confirmButtonColor: colorBtn,
        cancelButtonColor:  '#6b7280',
        reverseButtons:     true,
        focusConfirm:       false,
        customClass:        paleta.customClass,
        preConfirm: () => {
            const valor = document.getElementById('swal-motivo')?.value.trim() ?? '';
            if (valor.length < 10) {
                // Banner rojo nativo de Swal — bloquea el cierre sin efectos secundarios
                Swal.showValidationMessage('El motivo es obligatorio y debe tener al menos 10 caracteres.');
                return false;
            }
            return valor;
        },
    });

    if (!isConfirmed) return null;
    return { confirmado: true, motivo };
}

// ── MODAL ELIMINAR USUARIO ────────────────────────────────────────────────────
// Modal con dos modos: normal (requiere inactivo) y forzoso (sin restricciones).
// La validación usa Swal.showValidationMessage() — nativo de SweetAlert2.
// Retorna: { confirmado: true, forzoso: boolean, motivo: string } | null si canceló
export async function mostrarModalEliminarUsuario(nombreUsuario, estaActivo) {
    const paleta = obtenerPaletaSwal();

    const { value: resultado, isConfirmed } = await Swal.fire({
        title: `🗑 Eliminar a <em>${nombreUsuario}</em>`,
        html: `
            <p style="color:#6b7280;font-size:0.92rem;margin-bottom:1rem">
                Esta acción <strong style="color:#dc2626">es permanente e irreversible</strong>.
                Elige el modo de eliminación:
            </p>

            <div id="swal-modo-container" style="display:flex;gap:0.75rem;margin-bottom:1.1rem">

                <label id="label-normal" for="modo-normal" style="
                    flex:1;padding:0.75rem;border:2px solid #d1d5db;border-radius:0.6rem;
                    cursor:${estaActivo ? 'not-allowed' : 'pointer'};text-align:left;
                    transition:border-color 200ms,background 200ms;background:#fff;
                    opacity:${estaActivo ? '0.55' : '1'};
                ">
                    <input type="radio" id="modo-normal" name="swal-modo" value="normal"
                        style="margin-right:0.4rem" ${estaActivo ? 'disabled' : 'checked'}>
                    <strong style="color:#374151">Eliminación estándar</strong><br>
                    <small style="color:#6b7280">
                        ${estaActivo
                            ? '⛔ Requiere que el usuario esté <strong>inactivo</strong> primero.'
                            : '✅ El usuario está inactivo. Puede eliminarse.'}
                    </small>
                </label>

                <label id="label-forzoso" for="modo-forzoso" style="
                    flex:1;padding:0.75rem;border:2px solid #d1d5db;border-radius:0.6rem;
                    cursor:pointer;text-align:left;
                    transition:border-color 200ms,background 200ms;background:#fff;
                ">
                    <input type="radio" id="modo-forzoso" name="swal-modo" value="forzoso"
                        style="margin-right:0.4rem" ${estaActivo ? 'checked' : ''}>
                    <strong style="color:#dc2626">⚡ Cierre forzoso</strong><br>
                    <small style="color:#6b7280">Elimina sin importar estado ni tareas pendientes.</small>
                </label>

            </div>

            <div style="text-align:left">
                <label for="swal-motivo-eliminar"
                    style="display:block;font-size:0.875rem;font-weight:600;color:#374151;margin-bottom:0.4rem">
                    Motivo de eliminación <span style="color:#ef4444">*</span>
                </label>
                <textarea
                    id="swal-motivo-eliminar"
                    placeholder="Explica el motivo de la eliminación (mín. 10 caracteres)..."
                    rows="3"
                    style="width:100%;padding:0.5rem 0.75rem;border:1.5px solid #d1d5db;
                           border-radius:0.5rem;font-size:0.9rem;resize:vertical;
                           font-family:inherit;outline:none;transition:border-color 200ms"
                    onfocus="this.style.borderColor='#dc2626'"
                    onblur="this.style.borderColor='#d1d5db'"
                ></textarea>
            </div>
        `,
        icon:               'error',
        showCancelButton:   true,
        confirmButtonText:  'Sí, eliminar',
        cancelButtonText:   'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor:  '#6b7280',
        reverseButtons:     true,
        customClass:        paleta.customClass,
        didOpen: () => {
            // Resaltar visualmente la tarjeta del radio seleccionado
            const actualizarEstilos = () => {
                const normal   = document.getElementById('modo-normal');
                const forzoso  = document.getElementById('modo-forzoso');
                const lNormal  = document.getElementById('label-normal');
                const lForzoso = document.getElementById('label-forzoso');
                if (!normal || !forzoso) return;
                lNormal.style.borderColor  = (!normal.disabled && normal.checked)  ? '#2563eb' : '#d1d5db';
                lNormal.style.background   = (!normal.disabled && normal.checked)  ? '#eff6ff' : '#fff';
                lForzoso.style.borderColor = forzoso.checked ? '#dc2626' : '#d1d5db';
                lForzoso.style.background  = forzoso.checked ? '#fef2f2' : '#fff';
            };
            actualizarEstilos();
            document.querySelectorAll('input[name="swal-modo"]').forEach(r =>
                r.addEventListener('change', actualizarEstilos)
            );
        },
        preConfirm: () => {
            const radios  = document.querySelectorAll('input[name="swal-modo"]');
            const checked = [...radios].find(r => r.checked && !r.disabled);
            const motivo  = document.getElementById('swal-motivo-eliminar')?.value.trim() ?? '';
            const errores = [];

            if (!checked)           errores.push('Selecciona un modo de eliminación.');
            if (motivo.length < 10) errores.push('El motivo debe tener al menos 10 caracteres.');

            if (errores.length > 0) {
                // Banner rojo nativo de Swal — bloquea el cierre sin efectos secundarios
                Swal.showValidationMessage(errores.join(' — '));
                return false;
            }

            return { forzoso: checked.value === 'forzoso', motivo };
        },
    });

    if (!isConfirmed) return null;
    return { confirmado: true, ...resultado };
}