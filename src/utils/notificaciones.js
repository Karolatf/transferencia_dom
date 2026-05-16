// Archivo: utils/notificaciones.js
// Este archivo maneja todos los mensajes y ventanas emergentes de la aplicación.
// Usa la librería SweetAlert2 para los toasts y cuadros de confirmación.
// También incluye dos modales nativos del DOM: uno para activar/desactivar usuarios
// y otro para eliminar usuarios.

// Importamos la librería SweetAlert2 que nos permite mostrar ventanas emergentes estilizadas
import Swal from 'sweetalert2';

// Función privada que lee el modo activo del panel (inicio, usuario, admin, instructor)
// y retorna el color de acento y las clases CSS correspondientes para que los mensajes
// emergentes usen el mismo color que el rol del usuario
function obtenerPaletaSwal() {
    // Leemos el atributo data-modo del body — lo pone modoUI.js al activar cada panel
    const modo = document.body.dataset.modo || 'inicio';
    // Mapa de colores: cada modo tiene su color de acento principal
    const coloresPorModo = {
        inicio:      '#7c3aed', // morado (pantalla de login)
        usuario:     '#7c3aed', // morado (panel del estudiante)
        admin:       '#0284c7', // azul (panel del administrador)
        instructor:  '#059669', // verde (panel del instructor)
    };
    // Obtenemos el color del modo actual, o morado por defecto si el modo no está en el mapa
    const colorAcento = coloresPorModo[modo] || '#7c3aed';
    // Retornamos el color y el objeto de clases CSS personalizadas para SweetAlert2
    return {
        colorAcento,
        customClass: {
            popup:         'swal-popup',          // clase CSS del contenedor del mensaje
            confirmButton: 'swal-btn-confirmar',  // clase del botón Confirmar
            cancelButton:  'swal-btn-cancelar',   // clase del botón Cancelar
            actions:       'swal-acciones',       // clase del contenedor de botones
        },
    };
}

// Exportamos la función mostrarNotificacion que muestra un toast en la esquina superior derecha
// El toast desaparece automáticamente después de 3 segundos
// Recibe el mensaje a mostrar y el tipo: 'exito', 'error', 'advertencia' o 'info'
export async function mostrarNotificacion(mensaje, tipo = 'info') {
    // Obtenemos la paleta de colores del modo activo
    const paleta = obtenerPaletaSwal();
    // Convertimos nuestro tipo en español al tipo que entiende SweetAlert2 en inglés
    const tipoSwal = { exito: 'success', error: 'error', advertencia: 'warning', info: 'info' }[tipo] || 'info';

    // Si hay algún toast visible, lo cerramos antes de mostrar el nuevo para que no se superpongan
    if (Swal.isVisible()) {
        Swal.close();
        // Esperamos 80 milisegundos para que el DOM termine de limpiar el toast anterior
        await new Promise(r => setTimeout(r, 80));
    }

    // Mostramos el toast con SweetAlert2
    await Swal.fire({
        toast:             true,       // activa el modo toast (pequeño, en la esquina)
        position:          'top-end',  // posición: esquina superior derecha
        icon:              tipoSwal,   // ícono según el tipo: éxito, error, advertencia, info
        title:             mensaje,    // el mensaje de texto que ve el usuario
        showConfirmButton: false,      // ocultamos el botón de confirmar — el toast se cierra solo
        timer:             3000,       // el toast desaparece automáticamente en 3 segundos
        timerProgressBar:  true,       // muestra una barra de progreso del tiempo restante
        customClass:       paleta.customClass, // aplicamos las clases CSS personalizadas
    });
}

// Exportamos la función mostrarConfirmacion que muestra un cuadro de diálogo bloqueante
// que espera la decisión del usuario (confirmar o cancelar) antes de continuar
// Retorna true si el usuario confirmó, o false si canceló
export async function mostrarConfirmacion(mensaje, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', subtexto = '') {
    // Obtenemos la paleta de colores del modo activo
    const paleta = obtenerPaletaSwal();
    // Mostramos el cuadro de diálogo y esperamos la respuesta del usuario
    const resultado = await Swal.fire({
        title:              mensaje,                    // título principal del cuadro de diálogo
        text:               subtexto || undefined,      // subtexto opcional con más información
        icon:               'question',                 // ícono de pregunta
        showCancelButton:   true,                       // mostramos el botón de cancelar
        confirmButtonText:  textoConfirmar,             // texto del botón de confirmar
        cancelButtonText:   textoCancelar,              // texto del botón de cancelar
        customClass: {
            popup:         'swal-popup-v2',
            confirmButton: 'swal-btn-confirmar',
            cancelButton:  'swal-btn-cancelar',
            actions:       'swal-acciones',
        },
        confirmButtonColor: paleta.colorAcento, // el botón confirmar usa el color del rol activo
        cancelButtonColor:  '#6b7280',          // el botón cancelar siempre es gris
        reverseButtons:     true,               // ponemos el botón cancelar a la izquierda
        buttonsStyling:     true,               // permitimos que SweetAlert2 aplique sus estilos
    });
    // isConfirmed es true solo si el usuario hizo clic en el botón de confirmar
    return resultado.isConfirmed;
}

// Función privada que muestra un mensaje de error temporal DENTRO de un modal del DOM
// (no usa SweetAlert2 — es para los modales nativos de esta aplicación)
// Se inserta al inicio del panel del modal y desaparece automáticamente en 3 segundos
function toastInterno(panel, mensaje) {
    // Eliminamos el toast anterior si ya había uno en el modal para no acumularlos
    const anterior = panel.querySelector('.toast-interno');
    if (anterior) anterior.remove();

    // Creamos el elemento del toast interno con sus estilos en línea
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

    // Creamos el ícono de error circular (X dentro de un círculo rojo)
    const icono = document.createElement('span');
    icono.style.cssText = `
        width: 22px; height: 22px; border-radius: 50%;
        border: 2px solid #ef4444;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.75rem; font-weight: 700; color: #ef4444;
        flex-shrink: 0;
    `;
    icono.textContent = '✕';

    // Creamos el texto del mensaje de error
    const texto = document.createElement('span');
    texto.textContent = mensaje;

    // Ensamblamos el toast con el ícono y el texto
    toast.appendChild(icono);
    toast.appendChild(texto);

    // Insertamos el toast después del encabezado del modal (o al final si no hay encabezado)
    const header = panel.querySelector('.modal-usuario__header');
    if (header && header.nextSibling) {
        panel.insertBefore(toast, header.nextSibling);
    } else {
        panel.appendChild(toast);
    }

    // Después de 3 segundos, hacemos que el toast se desvanezca y lo eliminamos del DOM
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        // Esperamos la animación de desvanecimiento antes de eliminarlo del HTML
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    }, 3000);
}


// ── MODAL PARA DESACTIVAR O ACTIVAR UN USUARIO ────────────────────────────────

// Exportamos la función mostrarModalToggleEstado que construye y muestra un modal nativo del DOM
// para confirmar la desactivación o reactivación de una cuenta de usuario
// Recibe el nombre del usuario y la acción ('desactivar' o 'activar')
// Retorna una promesa que resuelve con { confirmado: true, motivo } si el usuario confirma,
// o con null si cancela
export function mostrarModalToggleEstado(nombreUsuario, accion) {
    return new Promise(function(resolve) {
        // Determinamos si la acción es desactivar (rojo) o activar (verde)
        const esDesactivar = accion === 'desactivar';
        // Color del encabezado y botón: rojo para desactivar, verde para activar
        const colorAcento  = esDesactivar ? '#ef4444' : '#16a34a';
        // Texto del botón de confirmación
        const labelBoton   = esDesactivar ? 'Desactivar' : 'Activar';
        const emoji        = '';
        // Descripción del efecto de la acción
        const descripcion  = esDesactivar
            ? 'El usuario <strong>no podrá iniciar sesión</strong> hasta que sea reactivado.'
            : 'El usuario <strong>podrá volver a iniciar sesión</strong> en el sistema.';

        // Creamos el overlay semitransparente que cubre toda la pantalla detrás del modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-usuario-overlay';
        overlay.style.zIndex = '9999';

        // Creamos el panel principal del modal
        const panel = document.createElement('div');
        panel.className = 'modal-usuario';
        panel.style.maxWidth = '440px';
        panel.style.padding = '0';
        panel.style.overflow = 'hidden';

        // Creamos el encabezado del modal con el título y el botón de cerrar
        const header = document.createElement('div');
        header.className = 'modal-usuario__header';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.padding = '1rem 1.5rem';
        // El borde inferior usa el color de la acción (rojo o verde)
        header.style.borderBottom = `2px solid ${colorAcento}`;

        // Creamos el título del modal con el nombre del usuario en cursiva
        const tituloEl = document.createElement('h3');
        tituloEl.className = 'modal-usuario__titulo';
        tituloEl.innerHTML = `${emoji} ${labelBoton} a <em style="color:var(--texto-medio);font-style:italic">${nombreUsuario}</em>`;
        tituloEl.style.fontSize = '1.15rem';
        tituloEl.style.fontWeight = '700';
        tituloEl.style.color = 'var(--texto-oscuro)';
        tituloEl.style.margin = '0';

        // Creamos el botón X para cerrar el modal sin confirmar
        const btnX = document.createElement('button');
        btnX.className = 'modal-usuario__cerrar';
        btnX.innerHTML = '✕';
        btnX.style.fontSize = '1.1rem';
        // Al hacer clic en X, cerramos el modal retornando null (cancelación)
        btnX.addEventListener('click', function() { cerrar(null); });

        header.appendChild(tituloEl);
        header.appendChild(btnX);
        panel.appendChild(header);

        // Creamos el cuerpo del modal con la descripción y el campo de motivo
        const cuerpo = document.createElement('div');
        cuerpo.style.padding = '1.25rem 1.5rem';
        cuerpo.style.display = 'flex';
        cuerpo.style.flexDirection = 'column';
        cuerpo.style.gap = '1rem';

        // Creamos el párrafo de descripción que explica el efecto de la acción
        const desc = document.createElement('p');
        desc.innerHTML = descripcion;
        desc.style.fontSize = '0.9rem';
        desc.style.color = 'var(--texto-medio)';
        desc.style.lineHeight = '1.6';
        desc.style.margin = '0';
        cuerpo.appendChild(desc);

        // Creamos la etiqueta y el área de texto para el motivo (campo obligatorio)
        const labelEl = document.createElement('label');
        labelEl.style.display = 'flex';
        labelEl.style.flexDirection = 'column';
        labelEl.style.gap = '0.4rem';

        const labelTexto = document.createElement('span');
        labelTexto.style.fontSize = '0.875rem';
        labelTexto.style.fontWeight = '600';
        labelTexto.style.color = 'var(--texto-oscuro)';
        // El asterisco rojo indica que el campo es obligatorio
        labelTexto.innerHTML = `Motivo <span style="color:#ef4444">*</span>`;
        labelEl.appendChild(labelTexto);

        // Creamos el área de texto donde el admin escribe el motivo de la acción
        const textarea = document.createElement('textarea');
        textarea.rows = 3;
        textarea.placeholder = 'Describe brevemente el motivo (mín. 10 caracteres)...';
        textarea.style.cssText = `
            width: 100%; padding: 0.55rem 0.85rem;
            border: 1.5px solid var(--borde-suave);
            border-radius: var(--radio-md);
            font-size: 0.875rem; font-family: inherit;
            resize: none; outline: none;
            background: var(--fondo-gris); color: var(--texto-oscuro);
            box-sizing: border-box; line-height: 1.5;
            transition: border-color 0.15s, box-shadow 0.15s;
        `;
        // Aplicamos el color de acento al borde cuando el textarea está enfocado
        textarea.addEventListener('focus', function() {
            this.style.borderColor = colorAcento;
            this.style.background = 'white';
            this.style.boxShadow = `0 0 0 3px ${esDesactivar ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)'}`;
        });
        // Volvemos al estilo normal cuando el textarea pierde el foco
        textarea.addEventListener('blur', function() {
            this.style.borderColor = 'var(--borde-suave)';
            this.style.background = 'var(--fondo-gris)';
            this.style.boxShadow = 'none';
        });
        labelEl.appendChild(textarea);
        cuerpo.appendChild(labelEl);

        // Creamos el párrafo de error que se muestra si el motivo no cumple los requisitos
        const errorEl = document.createElement('p');
        errorEl.textContent = 'El motivo debe tener al menos 10 caracteres.';
        errorEl.style.cssText = 'font-size:0.8rem;color:#dc2626;margin:0;display:none;';
        cuerpo.appendChild(errorEl);

        panel.appendChild(cuerpo);

        // Creamos el pie del modal con los botones de cancelar y confirmar
        const footer = document.createElement('div');
        footer.style.cssText = `
            display: flex; gap: 0.75rem;
            padding: 1rem 1.5rem 1.5rem;
            border-top: 1px solid var(--borde-suave);
        `;

        // Creamos el botón "Cancelar" que cierra el modal sin hacer nada
        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.style.cssText = `
            flex: 1; height: 42px; border: none; cursor: pointer;
            border-radius: var(--radio-full);
            background: var(--fondo-gris); color: var(--texto-medio);
            font-size: 0.875rem; font-weight: 600;
            transition: background 0.15s;
        `;
        // Efecto hover del botón cancelar: se oscurece un poco
        btnCancelar.addEventListener('mouseenter', function() { this.style.background = 'var(--borde-suave)'; });
        btnCancelar.addEventListener('mouseleave', function() { this.style.background = 'var(--fondo-gris)'; });
        btnCancelar.addEventListener('click', function() { cerrar(null); });

        // Creamos el botón de confirmación con el color de la acción (rojo o verde)
        const btnConfirmar = document.createElement('button');
        btnConfirmar.textContent = labelBoton;
        btnConfirmar.style.cssText = `
            flex: 1; height: 42px; border: none; cursor: pointer;
            border-radius: var(--radio-full);
            background: ${colorAcento}; color: white;
            font-size: 0.875rem; font-weight: 600;
            transition: opacity 0.15s, transform 0.1s;
        `;
        // Efecto hover: el botón sube ligeramente y se aclara al pasar el mouse
        btnConfirmar.addEventListener('mouseenter', function() { this.style.opacity = '0.88'; this.style.transform = 'translateY(-1px)'; });
        btnConfirmar.addEventListener('mouseleave', function() { this.style.opacity = '1'; this.style.transform = 'translateY(0)'; });
        // Al confirmar, validamos el motivo y cerramos el modal con el resultado
        btnConfirmar.addEventListener('click', function() {
            const motivo = textarea.value.trim();
            // El motivo debe tener al menos 10 caracteres para ser aceptado
            if (motivo.length < 10) {
                errorEl.style.display = 'block';
                textarea.style.borderColor = '#dc2626';
                toastInterno(panel, 'El motivo debe tener al menos 10 caracteres.');
                return;
            }
            // El motivo debe contener al menos una letra (no solo números o símbolos)
            if (!/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(motivo)) {
                errorEl.style.display = 'block';
                textarea.style.borderColor = '#dc2626';
                toastInterno(panel, 'El motivo debe contener al menos una letra.');
                return;
            }
            // Cerramos el modal retornando el resultado con el motivo escrito
            cerrar({ confirmado: true, motivo });
        });

        footer.appendChild(btnCancelar);
        footer.appendChild(btnConfirmar);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        // Insertamos el modal completo en la página
        document.body.appendChild(overlay);

        // Función interna que cierra el modal con una animación de desvanecimiento
        // y resuelve la promesa con el resultado (confirmado o null)
        function cerrar(resultado) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.15s';
            // Esperamos la animación antes de eliminar el modal del DOM
            setTimeout(function() {
                if (overlay.parentNode) document.body.removeChild(overlay);
                resolve(resultado);
            }, 150);
        }

        // Si el usuario hace clic fuera del panel (en el overlay oscuro), cancelamos
        overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrar(null); });
        // Ponemos el cursor en el área de texto automáticamente para que el admin empiece a escribir
        setTimeout(function() { textarea.focus(); }, 100);
    });
}

// ── MODAL PARA ELIMINAR UN USUARIO ───────────────────────────────────────────

// Exportamos la función mostrarModalEliminarUsuario que construye y muestra un modal nativo
// con dos modos de eliminación: estándar (solo si no tiene tareas activas) y forzosa (siempre)
// Recibe el nombre del usuario y si está activo actualmente
// Retorna una promesa con { confirmado: true, forzoso: boolean, motivo } o null si cancela
export function mostrarModalEliminarUsuario(nombreUsuario, estaActivo) {
    return new Promise(function(resolve) {

        // Creamos el overlay semitransparente que cubre la pantalla
        const overlay = document.createElement('div');
        overlay.className = 'modal-usuario-overlay';
        overlay.style.zIndex = '9999';

        // Creamos el panel principal del modal de eliminación
        const panel = document.createElement('div');
        panel.className = 'modal-usuario';
        panel.style.maxWidth = '460px';
        panel.style.padding = '0';
        panel.style.overflow = 'hidden';

        // Creamos el encabezado rojo del modal con el nombre del usuario a eliminar
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

        // Creamos el cuerpo del modal con la descripción, las tarjetas de modo y el campo de motivo
        const cuerpo = document.createElement('div');
        cuerpo.style.cssText = 'padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem;';

        // Advertencia de que la eliminación es permanente e irreversible
        const desc = document.createElement('p');
        desc.innerHTML = 'Esta acción <strong style="color:#dc2626">es permanente e irreversible</strong>. Elige el modo de eliminación:';
        desc.style.cssText = 'font-size:0.88rem;color:var(--texto-medio);line-height:1.6;margin:0;';
        cuerpo.appendChild(desc);

        // Creamos el contenedor de las dos tarjetas de modo de eliminación (en cuadrícula de 2 columnas)
        const tarjetas = document.createElement('div');
        tarjetas.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;';

        // Función interna para crear cada tarjeta de modo de eliminación
        function crearTarjeta(id, valor, activa, titulo, subdesc, deshabilitada) {
            const label = document.createElement('label');
            // Si la tarjeta está seleccionada (activa) tiene borde rojo; si no, borde gris
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
            // El input radio es invisible — la tarjeta misma actúa como selector
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

            // Al hacer clic en una tarjeta, deseleccionamos todas las demás y seleccionamos esta
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

        // Creamos la tarjeta de eliminación estándar (solo si no tiene tareas pendientes)
        const tarjetaNormal  = crearTarjeta('normal', 'normal', true, 'Eliminación estándar',
            'Elimina solo si el usuario no tiene tareas pendientes.', false);
        // Creamos la tarjeta de eliminación forzosa (sin importar el estado ni las tareas)
        const tarjetaForzoso = crearTarjeta('forzoso', 'forzoso', false, 'Cierre forzoso',
            'Elimina sin importar estado ni tareas pendientes.', false);

        tarjetas.appendChild(tarjetaNormal);
        tarjetas.appendChild(tarjetaForzoso);
        cuerpo.appendChild(tarjetas);

        // Creamos el grupo etiqueta + textarea para el motivo de eliminación (campo obligatorio)
        const labelEl = document.createElement('label');
        labelEl.style.cssText = 'display:flex;flex-direction:column;gap:0.4rem;'; // apilamos etiqueta y textarea

        // Texto de la etiqueta con asterisco rojo indicando que el campo es obligatorio
        const labelTexto = document.createElement('span');
        labelTexto.innerHTML = 'Motivo de eliminación <span style="color:#ef4444">*</span>'; // innerHTML para insertar el <span> del asterisco
        labelTexto.style.cssText = 'font-size:0.875rem;font-weight:600;color:var(--texto-oscuro);';
        labelEl.appendChild(labelTexto); // pegamos el texto de la etiqueta en el grupo

        // Área de texto donde el admin escribe el motivo (mínimo 10 caracteres para ser válido)
        const textarea = document.createElement('textarea');
        textarea.rows = 3; // altura inicial: 3 líneas de texto visibles
        textarea.placeholder = 'Explica el motivo de la eliminación (mín. 10 caracteres)...';
        textarea.style.cssText = `
            width: 100%; padding: 0.55rem 0.85rem;
            border: 1.5px solid var(--borde-suave); /* borde gris por defecto */
            border-radius: var(--radio-md);
            font-size: 0.875rem; font-family: inherit; /* hereda la fuente del proyecto */
            resize: none; outline: none;              /* desactivamos el resize manual y el outline del browser */
            background: var(--fondo-gris); color: var(--texto-oscuro);
            box-sizing: border-box; line-height: 1.5;
            transition: border-color 0.15s, box-shadow 0.15s; /* animación suave al enfocar */
        `;
        // Al hacer clic en el textarea (focus), lo resaltamos en rojo para indicar que está activo
        textarea.addEventListener('focus', function() {
            this.style.borderColor = '#ef4444';                       // borde rojo al enfocar
            this.style.background = 'white';                          // fondo blanco al enfocar
            this.style.boxShadow = 'rgba(239,68,68,0.1) 0 0 0 3px'; // halo rojo difuso alrededor
        });
        // Al salir del textarea (blur), restauramos el estilo original
        textarea.addEventListener('blur', function() {
            this.style.borderColor = 'var(--borde-suave)'; // volvemos al borde gris
            this.style.background = 'var(--fondo-gris)';   // volvemos al fondo gris
            this.style.boxShadow = 'none';                  // eliminamos el halo rojo
        });
        labelEl.appendChild(textarea);  // pegamos el textarea dentro del grupo de etiqueta
        cuerpo.appendChild(labelEl);    // pegamos el grupo completo en el cuerpo del modal

        // Párrafo de error rojo — empieza oculto y JS lo muestra si el motivo no cumple los requisitos
        const errorEl = document.createElement('p');
        errorEl.style.cssText = 'font-size:0.8rem;color:#dc2626;margin:0;display:none;'; // display:none = invisible al inicio
        cuerpo.appendChild(errorEl); // lo agregamos al DOM aunque esté oculto para poder mostrarlo con JS después

        panel.appendChild(cuerpo);

        // Creamos el pie del modal con los botones cancelar y confirmar
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

        // Botón de confirmación con gradiente rojo para indicar peligro
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
        // Al confirmar, validamos que el modo y el motivo sean correctos antes de cerrar
        btnConfirmar.addEventListener('click', function() {
            const radioSel = tarjetas.querySelector('input[name="modoElim"]:checked:not(:disabled)');
            const motivo   = textarea.value.trim();
            const errores  = [];
            // Verificamos que se haya seleccionado un modo de eliminación
            if (!radioSel)          errores.push('Selecciona un modo de eliminación.');
            // Verificamos que el motivo tenga al menos 10 caracteres
            if (motivo.length < 10) errores.push('El motivo debe tener al menos 10 caracteres.');
            // Si hay errores, los mostramos y cancelamos la confirmación
            if (errores.length > 0) {
                errorEl.innerHTML = errores.join(' — ');
                errorEl.style.display = 'block';
                if (motivo.length < 10) textarea.style.borderColor = '#dc2626';
                toastInterno(panel, errores[0]);
                return;
            }
            // Todo válido: cerramos el modal con el modo seleccionado y el motivo
            cerrar({ confirmado: true, forzoso: radioSel.value === 'forzoso', motivo });
        });

        footer.appendChild(btnCancelar);
        footer.appendChild(btnConfirmar);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        // Insertamos el modal completo en la página
        document.body.appendChild(overlay);

        // Función interna que cierra el modal con animación y resuelve la promesa
        function cerrar(resultado) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.15s';
            setTimeout(function() {
                if (overlay.parentNode) document.body.removeChild(overlay);
                resolve(resultado);
            }, 150);
        }

        // Si el usuario hace clic en el overlay oscuro fuera del panel, cancelamos
        overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrar(null); });
        // Ponemos el foco en el área de texto automáticamente
        setTimeout(function() { textarea.focus(); }, 100);
    });
}
