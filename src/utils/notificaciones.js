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

// toastInterno — muestra un toast de error DENTRO de un modal DOM
// Se inserta al inicio del panel y se auto-elimina después de 3s
function toastInterno(panel, mensaje) {
    // Eliminar toast anterior si existe
    const anterior = panel.querySelector('.toast-interno');
    if (anterior) anterior.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-interno';
    toast.style.cssText = `
        display: flex; align-items: center; gap: 10px;
        background: #fff; border: 1px solid #fecaca;
        border-left: 4px solid #ef4444;
        border-radius: 10px;
        padding: 10px 14px;
        margin: 12px 1.5rem 0;
        font-size: 0.875rem; color: #dc2626; font-weight: 500;
        box-shadow: 0 4px 12px rgba(239,68,68,0.12);
        animation: slideIn 200ms ease;
    `;

    // Ícono X circular igual al de la imagen
    const icono = document.createElement('span');
    icono.style.cssText = `
        width: 22px; height: 22px; border-radius: 50%;
        border: 2px solid #ef4444;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.75rem; font-weight: 700; color: #ef4444;
        flex-shrink: 0;
    `;
    icono.textContent = '✕';

    const texto = document.createElement('span');
    texto.textContent = mensaje;

    toast.appendChild(icono);
    toast.appendChild(texto);

    // Insertar después del header (primer hijo del panel)
    const header = panel.querySelector('.modal-usuario__header');
    if (header && header.nextSibling) {
        panel.insertBefore(toast, header.nextSibling);
    } else {
        panel.appendChild(toast);
    }

    // Auto-eliminar después de 3s
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    }, 3000);
}


// ── MODAL DESACTIVAR / ACTIVAR USUARIO ───────────────────────────────────────
// Modal DOM nativo — mismo estilo que .modal-usuario del sistema.
// accion: 'desactivar' | 'activar'
// Retorna: { confirmado: true, motivo: string } | null si canceló
export function mostrarModalToggleEstado(nombreUsuario, accion) {
    return new Promise(function(resolve) {
        const esDesactivar = accion === 'desactivar';
        const colorAcento  = esDesactivar ? '#ef4444' : '#16a34a';
        const labelBoton   = esDesactivar ? 'Desactivar' : 'Activar';
        const emoji        = '';
        const descripcion  = esDesactivar
            ? 'El usuario <strong>no podrá iniciar sesión</strong> hasta que sea reactivado.'
            : 'El usuario <strong>podrá volver a iniciar sesión</strong> en el sistema.';

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-usuario-overlay';
        overlay.style.zIndex = '9999';

        // Panel
        const panel = document.createElement('div');
        panel.className = 'modal-usuario';
        panel.style.maxWidth = '440px';
        panel.style.padding = '0';
        panel.style.overflow = 'hidden';

        // Header — igual a .modal-usuario__header del sistema
        const header = document.createElement('div');
        header.className = 'modal-usuario__header';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.padding = '1rem 1.5rem';
        header.style.borderBottom = `2px solid ${colorAcento}`;

        const tituloEl = document.createElement('h3');
        tituloEl.className = 'modal-usuario__titulo';
        tituloEl.innerHTML = `${emoji} ${labelBoton} a <em style="color:var(--texto-medio);font-style:italic">${nombreUsuario}</em>`;
        tituloEl.style.fontSize = '1.15rem';
        tituloEl.style.fontWeight = '700';
        tituloEl.style.color = 'var(--texto-oscuro)';
        tituloEl.style.margin = '0';

        const btnX = document.createElement('button');
        btnX.className = 'modal-usuario__cerrar';
        btnX.innerHTML = '✕';
        btnX.style.fontSize = '1.1rem';
        btnX.addEventListener('click', function() { cerrar(null); });

        header.appendChild(tituloEl);
        header.appendChild(btnX);
        panel.appendChild(header);

        // Cuerpo
        const cuerpo = document.createElement('div');
        cuerpo.style.padding = '1.25rem 1.5rem';
        cuerpo.style.display = 'flex';
        cuerpo.style.flexDirection = 'column';
        cuerpo.style.gap = '1rem';

        // Descripción
        const desc = document.createElement('p');
        desc.innerHTML = descripcion;
        desc.style.fontSize = '0.9rem';
        desc.style.color = 'var(--texto-medio)';
        desc.style.lineHeight = '1.6';
        desc.style.margin = '0';
        cuerpo.appendChild(desc);

        // Label motivo
        const labelEl = document.createElement('label');
        labelEl.style.display = 'flex';
        labelEl.style.flexDirection = 'column';
        labelEl.style.gap = '0.4rem';

        const labelTexto = document.createElement('span');
        labelTexto.style.fontSize = '0.875rem';
        labelTexto.style.fontWeight = '600';
        labelTexto.style.color = 'var(--texto-oscuro)';
        labelTexto.innerHTML = `Motivo <span style="color:#ef4444">*</span>`;
        labelEl.appendChild(labelTexto);

        const textarea = document.createElement('textarea');
        textarea.rows = 3;
        textarea.placeholder = 'Describe brevemente el motivo (mín. 10 caracteres)...';
        textarea.style.cssText = `
            width: 100%; padding: 0.55rem 0.85rem;
            border: 1.5px solid var(--borde-suave);
            border-radius: var(--radio-md);
            font-size: 0.875rem; font-family: inherit;
            resize: vertical; outline: none;
            background: var(--fondo-gris); color: var(--texto-oscuro);
            box-sizing: border-box; line-height: 1.5;
            transition: border-color 0.15s, box-shadow 0.15s;
        `;
        textarea.addEventListener('focus', function() {
            this.style.borderColor = colorAcento;
            this.style.background = 'white';
            this.style.boxShadow = `0 0 0 3px ${esDesactivar ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)'}`;
        });
        textarea.addEventListener('blur', function() {
            this.style.borderColor = 'var(--borde-suave)';
            this.style.background = 'var(--fondo-gris)';
            this.style.boxShadow = 'none';
        });
        labelEl.appendChild(textarea);
        cuerpo.appendChild(labelEl);

        // Error
        const errorEl = document.createElement('p');
        errorEl.textContent = 'El motivo debe tener al menos 10 caracteres.';
        errorEl.style.cssText = 'font-size:0.8rem;color:#dc2626;margin:0;display:none;';
        cuerpo.appendChild(errorEl);

        panel.appendChild(cuerpo);

        // Footer con botones
        const footer = document.createElement('div');
        footer.style.cssText = `
            display: flex; gap: 0.75rem;
            padding: 1rem 1.5rem 1.5rem;
            border-top: 1px solid var(--borde-suave);
        `;

        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.style.cssText = `
            flex: 1; height: 42px; border: none; cursor: pointer;
            border-radius: var(--radio-full);
            background: var(--fondo-gris); color: var(--texto-medio);
            font-size: 0.875rem; font-weight: 600;
            transition: background 0.15s;
        `;
        btnCancelar.addEventListener('mouseenter', function() { this.style.background = 'var(--borde-suave)'; });
        btnCancelar.addEventListener('mouseleave', function() { this.style.background = 'var(--fondo-gris)'; });
        btnCancelar.addEventListener('click', function() { cerrar(null); });

        const btnConfirmar = document.createElement('button');
        btnConfirmar.textContent = labelBoton;
        btnConfirmar.style.cssText = `
            flex: 1; height: 42px; border: none; cursor: pointer;
            border-radius: var(--radio-full);
            background: ${colorAcento}; color: white;
            font-size: 0.875rem; font-weight: 600;
            transition: opacity 0.15s, transform 0.1s;
        `;
        btnConfirmar.addEventListener('mouseenter', function() { this.style.opacity = '0.88'; this.style.transform = 'translateY(-1px)'; });
        btnConfirmar.addEventListener('mouseleave', function() { this.style.opacity = '1'; this.style.transform = 'translateY(0)'; });
        btnConfirmar.addEventListener('click', function() {
            const motivo = textarea.value.trim();
            if (motivo.length < 10) {
                errorEl.style.display = 'block';
                textarea.style.borderColor = '#dc2626';
                toastInterno(panel, 'El motivo debe tener al menos 10 caracteres.');
                return;
            }
            cerrar({ confirmado: true, motivo });
        });

        footer.appendChild(btnCancelar);
        footer.appendChild(btnConfirmar);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function cerrar(resultado) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.15s';
            setTimeout(function() {
                if (overlay.parentNode) document.body.removeChild(overlay);
                resolve(resultado);
            }, 150);
        }

        overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrar(null); });
        setTimeout(function() { textarea.focus(); }, 100);
    });
}

// ── MODAL ELIMINAR USUARIO ────────────────────────────────────────────────────
// Modal DOM nativo — mismo estilo que .modal-usuario del sistema.
// Retorna: { confirmado: true, forzoso: boolean, motivo: string } | null si canceló
export function mostrarModalEliminarUsuario(nombreUsuario, estaActivo) {
    return new Promise(function(resolve) {

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-usuario-overlay';
        overlay.style.zIndex = '9999';

        // Panel
        const panel = document.createElement('div');
        panel.className = 'modal-usuario';
        panel.style.maxWidth = '460px';
        panel.style.padding = '0';
        panel.style.overflow = 'hidden';

        // Header rojo
        const header = document.createElement('div');
        header.className = 'modal-usuario__header';
        header.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            padding: 1rem 1.5rem; border-bottom: 2px solid #ef4444;
        `;

        const tituloEl = document.createElement('h3');
        tituloEl.innerHTML = `Eliminar a <em style="color:var(--texto-medio);font-style:italic">${nombreUsuario}</em>`;
        tituloEl.style.cssText = 'font-size:1.15rem;font-weight:700;color:var(--texto-oscuro);margin:0;';

        const btnX = document.createElement('button');
        btnX.className = 'modal-usuario__cerrar';
        btnX.innerHTML = '✕';
        btnX.addEventListener('click', function() { cerrar(null); });

        header.appendChild(tituloEl);
        header.appendChild(btnX);
        panel.appendChild(header);

        // Cuerpo
        const cuerpo = document.createElement('div');
        cuerpo.style.cssText = 'padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem;';

        // Descripción
        const desc = document.createElement('p');
        desc.innerHTML = 'Esta acción <strong style="color:#dc2626">es permanente e irreversible</strong>. Elige el modo de eliminación:';
        desc.style.cssText = 'font-size:0.88rem;color:var(--texto-medio);line-height:1.6;margin:0;';
        cuerpo.appendChild(desc);

        // Tarjetas de modo
        const tarjetas = document.createElement('div');
        tarjetas.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;';

        function crearTarjeta(id, valor, activa, titulo, subdesc, deshabilitada) {
            const label = document.createElement('label');
            label.style.cssText = `
                border: 2px solid ${activa ? '#ef4444' : 'var(--borde-suave)'};
                border-radius: var(--radio-md);
                padding: 0.85rem;
                cursor: ${deshabilitada ? 'not-allowed' : 'pointer'};
                display: flex; flex-direction: column; gap: 0.35rem;
                background: ${activa ? '#fff5f5' : 'var(--fondo-gris)'};
                opacity: ${deshabilitada ? '0.5' : '1'};
                transition: border-color 0.15s, background 0.15s;
            `;
            const radio = document.createElement('input');
            radio.type = 'radio'; radio.name = 'modoElim'; radio.value = valor;
            if (activa) radio.checked = true;
            if (deshabilitada) radio.disabled = true;
            radio.style.display = 'none';

            const tituloEl2 = document.createElement('strong');
            tituloEl2.innerHTML = titulo;
            tituloEl2.style.cssText = 'font-size:0.88rem;color:var(--texto-oscuro);';

            const subEl = document.createElement('span');
            subEl.innerHTML = subdesc;
            subEl.style.cssText = 'font-size:0.78rem;color:var(--texto-claro);line-height:1.4;';

            label.appendChild(radio);
            label.appendChild(tituloEl2);
            label.appendChild(subEl);

            if (!deshabilitada) {
                label.addEventListener('click', function() {
                    tarjetas.querySelectorAll('label').forEach(function(l) {
                        l.style.borderColor = 'var(--borde-suave)';
                        l.style.background  = 'var(--fondo-gris)';
                        l.querySelector('input').checked = false;
                    });
                    label.style.borderColor = '#ef4444';
                    label.style.background  = '#fff5f5';
                    radio.checked = true;
                });
            }
            return label;
        }

        const tarjetaNormal  = crearTarjeta('normal', 'normal', !estaActivo, 'Eliminación estándar',
            estaActivo ? 'Requiere que el usuario esté <strong>inactivo</strong> primero.' : 'El usuario está inactivo.', estaActivo);
        const tarjetaForzoso = crearTarjeta('forzoso', 'forzoso', estaActivo, 'Cierre forzoso',
            'Elimina sin importar estado ni tareas pendientes.', false);

        tarjetas.appendChild(tarjetaNormal);
        tarjetas.appendChild(tarjetaForzoso);
        cuerpo.appendChild(tarjetas);

        // Motivo
        const labelEl = document.createElement('label');
        labelEl.style.cssText = 'display:flex;flex-direction:column;gap:0.4rem;';
        const labelTexto = document.createElement('span');
        labelTexto.innerHTML = 'Motivo de eliminación <span style="color:#ef4444">*</span>';
        labelTexto.style.cssText = 'font-size:0.875rem;font-weight:600;color:var(--texto-oscuro);';
        labelEl.appendChild(labelTexto);

        const textarea = document.createElement('textarea');
        textarea.rows = 3;
        textarea.placeholder = 'Explica el motivo de la eliminación (mín. 10 caracteres)...';
        textarea.style.cssText = `
            width: 100%; padding: 0.55rem 0.85rem;
            border: 1.5px solid var(--borde-suave);
            border-radius: var(--radio-md);
            font-size: 0.875rem; font-family: inherit;
            resize: vertical; outline: none;
            background: var(--fondo-gris); color: var(--texto-oscuro);
            box-sizing: border-box; line-height: 1.5;
            transition: border-color 0.15s, box-shadow 0.15s;
        `;
        textarea.addEventListener('focus', function() {
            this.style.borderColor = '#ef4444';
            this.style.background = 'white';
            this.style.boxShadow = 'rgba(239,68,68,0.1) 0 0 0 3px';
        });
        textarea.addEventListener('blur', function() {
            this.style.borderColor = 'var(--borde-suave)';
            this.style.background = 'var(--fondo-gris)';
            this.style.boxShadow = 'none';
        });
        labelEl.appendChild(textarea);
        cuerpo.appendChild(labelEl);

        // Error
        const errorEl = document.createElement('p');
        errorEl.style.cssText = 'font-size:0.8rem;color:#dc2626;margin:0;display:none;';
        cuerpo.appendChild(errorEl);

        panel.appendChild(cuerpo);

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            display:flex;gap:0.75rem;
            padding:1rem 1.5rem 1.5rem;
            border-top:1px solid var(--borde-suave);
        `;

        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.style.cssText = `
            flex:1;height:42px;border:none;cursor:pointer;
            border-radius:var(--radio-full);
            background:var(--fondo-gris);color:var(--texto-medio);
            font-size:0.875rem;font-weight:600;transition:background 0.15s;
        `;
        btnCancelar.addEventListener('mouseenter', function() { this.style.background = 'var(--borde-suave)'; });
        btnCancelar.addEventListener('mouseleave', function() { this.style.background = 'var(--fondo-gris)'; });
        btnCancelar.addEventListener('click', function() { cerrar(null); });

        const btnConfirmar = document.createElement('button');
        btnConfirmar.textContent = 'Sí, eliminar';
        btnConfirmar.style.cssText = `
            flex:1;height:42px;border:none;cursor:pointer;
            border-radius:var(--radio-full);
            background:linear-gradient(135deg,#ef4444,#dc2626);color:white;
            font-size:0.875rem;font-weight:600;
            transition:opacity 0.15s,transform 0.1s;
        `;
        btnConfirmar.addEventListener('mouseenter', function() { this.style.opacity='0.88';this.style.transform='translateY(-1px)'; });
        btnConfirmar.addEventListener('mouseleave', function() { this.style.opacity='1';this.style.transform='translateY(0)'; });
        btnConfirmar.addEventListener('click', function() {
            const radioSel = tarjetas.querySelector('input[name="modoElim"]:checked:not(:disabled)');
            const motivo   = textarea.value.trim();
            const errores  = [];
            if (!radioSel)          errores.push('Selecciona un modo de eliminación.');
            if (motivo.length < 10) errores.push('El motivo debe tener al menos 10 caracteres.');
            if (errores.length > 0) {
                errorEl.innerHTML = errores.join(' — ');
                errorEl.style.display = 'block';
                if (motivo.length < 10) textarea.style.borderColor = '#dc2626';
                toastInterno(panel, errores[0]);
                return;
            }
            cerrar({ confirmado: true, forzoso: radioSel.value === 'forzoso', motivo });
        });

        footer.appendChild(btnCancelar);
        footer.appendChild(btnConfirmar);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function cerrar(resultado) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.15s';
            setTimeout(function() {
                if (overlay.parentNode) document.body.removeChild(overlay);
                resolve(resultado);
            }, 150);
        }

        overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrar(null); });
        setTimeout(function() { textarea.focus(); }, 100);
    });
}