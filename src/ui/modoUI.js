// MÓDULO: ui/modoUI.js
// CAPA: UI — control de modos de navegación y modales de usuario
// Responsabilidad: gestionar qué vista está activa (inicio, usuario, admin),
// el modal dinámico de información de usuario en modo ADMIN,
// y los filtros y orden de la tabla admin.
// En modo USUARIO el resultado de búsqueda se muestra fijo en la vista,
// no en un modal flotante. Ese comportamiento es responsabilidad de tareasService.js.

// Importamos la URL base para construir las peticiones al servidor
import { API_BASE_URL } from '../utils/config.js';

// Se importa SweetAlert2 para reemplazar los confirm nativos del admin
// con diálogos visuales que respetan la paleta de colores del proyecto
import Swal from 'sweetalert2';

// Referencias a las tres vistas principales del HTML
// Se obtienen al cargar el módulo y se reutilizan en todas las funciones
const pantallaInicio = document.getElementById('pantallaInicio');
const vistaUsuario   = document.getElementById('vistaUsuario');
const vistaAdmin     = document.getElementById('vistaAdmin');

// Oculta todas las vistas antes de mostrar la activa
// Se llama siempre antes de activar cualquier modo para limpiar el estado visual
function ocultarTodo() {
    pantallaInicio.classList.add('hidden');
    vistaUsuario.classList.add('hidden');
    vistaAdmin.classList.add('hidden');
}

// Activa la pantalla de inicio y actualiza el data-modo del body
// El data-modo cambia el color de fondo según el modo activo (ver styles.css)
export function activarModoInicio() {
    ocultarTodo();
    pantallaInicio.classList.remove('hidden');
    // El body cambia su fondo a #f8edf5 cuando data-modo es 'inicio'
    document.body.dataset.modo = 'inicio';
}

// Activa la vista de usuario y actualiza el data-modo del body
// El fondo cambia a #f3e8ff cuando data-modo es 'usuario'
export function activarModoUsuario() {
    ocultarTodo();
    vistaUsuario.classList.remove('hidden');
    document.body.dataset.modo = 'usuario';
}

// Activa la vista del admin, actualiza el data-modo y carga los datos iniciales
// Al entrar al admin se cargan automáticamente usuarios y tareas para no mostrar tablas vacías
export function activarModoAdmin() {
    ocultarTodo();
    vistaAdmin.classList.remove('hidden');
    // El fondo cambia a #e0f2fe cuando data-modo es 'admin'
    document.body.dataset.modo = 'admin';
    // Se cargan los datos del panel admin al activar la vista
    cargarTablaUsuarios();
    cargarTodasLasTareas();
}

// Fuente de verdad del admin: todas las tareas sin filtrar
// Se guarda aquí para poder filtrar y ordenar sin hacer una nueva petición al servidor
let todasLasTareas = [];

// Carga todos los usuarios del servidor y los pinta en la tabla del admin
// Se llama al entrar al admin y después de crear o eliminar un usuario
export async function cargarTablaUsuarios() {
    // Se obtiene el tbody de la tabla de usuarios del admin
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
        // Se pide la lista de usuarios al servidor usando el endpoint /users
        const res      = await fetch(`${API_BASE_URL}/users`);
        const usuarios = await res.json();

        // Se vacía el tbody antes de repintar para evitar duplicar filas
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

        // Si no hay usuarios se muestra una fila indicativa
        if (usuarios.length === 0) {
            const fila  = document.createElement('tr');
            const celda = document.createElement('td');
            celda.colSpan     = 5;
            celda.textContent = 'No hay usuarios registrados';
            // Se usa style directamente aquí porque es contenido dinámico puntual sin clase específica
            celda.style.textAlign = 'center';
            celda.style.color     = '#9ca3af';
            fila.appendChild(celda);
            tbody.appendChild(fila);
            return;
        }

        // Se recorre el arreglo de usuarios y se crea una fila por cada uno
        usuarios.forEach(function(usuario, indice) {
            const fila = document.createElement('tr');

            // Celda número correlativo para referencia visual
            const celdaNum = document.createElement('td');
            celdaNum.textContent = indice + 1;

            // Celda de documento: muestra el número de documento del usuario
            // Si el usuario no tiene campo documento se usa el id como fallback
            const celdaDoc = document.createElement('td');
            celdaDoc.textContent = usuario.documento || usuario.id;

            // Celda nombre del usuario
            const celdaNombre = document.createElement('td');
            celdaNombre.textContent = usuario.name;

            // Celda correo del usuario
            const celdaEmail = document.createElement('td');
            celdaEmail.textContent = usuario.email;

            // Celda de acciones: contiene los botones de ver/asignar y eliminar
            const celdaAcciones = document.createElement('td');
            const contenedor    = document.createElement('div');
            contenedor.classList.add('task-actions');

            // Botón que abre el modal dinámico con tareas del usuario y formulario de asignación
            // Solo aparece en el admin y abre el modal completo con dos columnas
            const btnVerTareas = document.createElement('button');
            btnVerTareas.textContent = 'Ver / Asignar';
            btnVerTareas.classList.add('btn-action', 'btn-action--edit');
            btnVerTareas.type = 'button';
            // Al hacer clic se abre el modal dinámico del admin para ese usuario
            btnVerTareas.addEventListener('click', function() {
                abrirModalUsuario(usuario);
            });

            // Botón para eliminar el usuario del sistema
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = '🗑️ Eliminar';
            btnEliminar.classList.add('btn-action', 'btn-action--delete');
            btnEliminar.type = 'button';
            btnEliminar.addEventListener('click', async function() {

                // Se reemplaza el confirm nativo por SweetAlert2 para mantener
                // la coherencia visual con el resto de los diálogos del proyecto
                const resultado = await Swal.fire({
                    icon:              'warning',
                    title:             '\u00bfEliminar usuario?',
                    text:              `"${usuario.name}" ser\u00e1 eliminado permanentemente.`,
                    showCancelButton:  true,
                    confirmButtonText: 'S\u00ed, eliminar',
                    cancelButtonText:  'Cancelar',
                    buttonsStyling:    false,
                    customClass: {
                        popup:         'swal-popup swal-eliminar',
                        title:         'swal-title',
                        confirmButton: 'swal-btn-confirmar',
                        cancelButton:  'swal-btn-cancelar'
                    }
                });

                // Si el usuario canceló el diálogo no se hace nada
                if (!resultado.isConfirmed) return;

                try {
                    // Se envía DELETE al servidor para eliminar el usuario por su id
                    await fetch(`${API_BASE_URL}/users/${usuario.id}`, { method: 'DELETE' });
                    // Se recargan ambas tablas del admin para reflejar el cambio
                    cargarTablaUsuarios();
                    cargarTodasLasTareas();
                } catch (err) {
                    console.error('Error eliminando usuario:', err);
                }
            });

            contenedor.appendChild(btnVerTareas);
            contenedor.appendChild(btnEliminar);
            celdaAcciones.appendChild(contenedor);

            fila.appendChild(celdaNum);
            fila.appendChild(celdaDoc);
            fila.appendChild(celdaNombre);
            fila.appendChild(celdaEmail);
            fila.appendChild(celdaAcciones);
            tbody.appendChild(fila);
        });

    } catch (err) {
        console.error('Error cargando usuarios:', err);
    }
}

// Carga todas las tareas del sistema y las guarda en todasLasTareas
// Luego llama a aplicarFiltrosAdmin() para pintar la tabla con los filtros activos
export async function cargarTodasLasTareas() {
    const tbody = document.getElementById('adminTasksTableBody');
    if (!tbody) return;

    try {
        // Se pide todas las tareas al servidor
        const res    = await fetch(`${API_BASE_URL}/tasks`);
        const tareas = await res.json();

        // Se guarda en la variable del módulo para filtrar sin nueva petición al servidor
        todasLasTareas = tareas;
        // Se aplican los filtros activos sobre las tareas recién cargadas
        aplicarFiltrosAdmin();

    } catch (err) {
        console.error('Error cargando tareas:', err);
    }
}

// Aplica los filtros (estado, usuario) y el orden activos sobre todasLasTareas
// Se llama al hacer clic en "Aplicar", al limpiar filtros y al recargar las tareas
export function aplicarFiltrosAdmin() {
    // Se obtienen los elementos de la tabla y los controles de filtro
    const tbody         = document.getElementById('adminTasksTableBody');
    const contadorEl    = document.getElementById('adminTasksCount');
    const filtroEstado  = document.getElementById('adminFiltroEstado');
    const filtroUsuario = document.getElementById('adminFiltroUsuario');
    const ordenSelect   = document.getElementById('adminOrdenSelect');

    if (!tbody) return;

    // Se parte de una copia del arreglo completo para no mutar la fuente de verdad
    let resultado = [...todasLasTareas];

    // Filtro por estado: si hay valor seleccionado se mantienen solo las tareas con ese estado
    const estado = filtroEstado ? filtroEstado.value : '';
    if (estado) {
        resultado = resultado.filter(t => t.status === estado);
    }

    // Filtro por usuario: busca coincidencias en el nombre o en el userId
    const termino = filtroUsuario ? filtroUsuario.value.trim().toLowerCase() : '';
    if (termino) {
        resultado = resultado.filter(t =>
            (t.userName && t.userName.toLowerCase().includes(termino)) ||
            (t.userId   && t.userId.toString().includes(termino))
        );
    }

    // Ordenamiento aplicado directamente aquí porque los criterios del select del admin
    // (titulo_asc, titulo_desc, estado, usuario) son distintos a los de utils/ordenamiento.js
    const orden = ordenSelect ? ordenSelect.value : '';
    if (orden === 'titulo_asc') {
        // Orden alfabético A-Z usando localeCompare para respetar tildes del español
        resultado.sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
    } else if (orden === 'titulo_desc') {
        // Orden alfabético Z-A, inverso al anterior
        resultado.sort((a, b) => b.title.localeCompare(a.title, 'es', { sensitivity: 'base' }));
    } else if (orden === 'estado') {
        // Orden por flujo de trabajo: pendiente → en progreso → completada
        const prioridad = { pendiente: 0, en_progreso: 1, completada: 2 };
        resultado.sort((a, b) => (prioridad[a.status] ?? 99) - (prioridad[b.status] ?? 99));
    } else if (orden === 'usuario') {
        // Orden alfabético por nombre del usuario asignado
        resultado.sort((a, b) => (a.userName || '').localeCompare(b.userName || '', 'es', { sensitivity: 'base' }));
    }

    // Se vacía la tabla antes de repintar para evitar duplicar filas
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    // Se actualiza el contador visual de tareas mostradas
    if (contadorEl) {
        contadorEl.textContent = `${resultado.length} ${resultado.length === 1 ? 'tarea' : 'tareas'}`;
    }

    // Si no hay resultados se muestra una fila indicativa
    if (resultado.length === 0) {
        const fila  = document.createElement('tr');
        const celda = document.createElement('td');
        celda.colSpan     = 6;
        celda.textContent = 'No hay tareas que coincidan con los filtros';
        celda.style.textAlign = 'center';
        celda.style.color     = '#9ca3af';
        fila.appendChild(celda);
        tbody.appendChild(fila);
        return;
    }

    // Se recorre el arreglo filtrado y ordenado y se crea una fila por cada tarea
    resultado.forEach(function(tarea, indice) {
        const fila = document.createElement('tr');

        // Celda número correlativo
        const celdaNum = document.createElement('td');
        celdaNum.textContent = indice + 1;

        // Celda título de la tarea
        const celdaTitulo = document.createElement('td');
        celdaTitulo.textContent = tarea.title;

        // Celda descripción de la tarea
        const celdaDesc = document.createElement('td');
        celdaDesc.textContent = tarea.description;

        // Celda de estado con badge visual coloreado según el estado
        const celdaEstado = document.createElement('td');
        const badge = document.createElement('span');
        badge.classList.add('status-badge', `status-${tarea.status}`);
        badge.textContent = formatearEstado(tarea.status);
        celdaEstado.appendChild(badge);

        // Celda de nombre del usuario asignado a la tarea
        // Si no tiene usuario asignado se muestra 'Sin asignar'
        const celdaUsuario = document.createElement('td');
        celdaUsuario.textContent = tarea.userName || 'Sin asignar';

        // Celda de acciones con botón eliminar para la tabla del admin
        const celdaAcciones = document.createElement('td');
        const contenedor    = document.createElement('div');
        contenedor.classList.add('task-actions');

        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = '🗑️ Eliminar';
        btnEliminar.classList.add('btn-action', 'btn-action--delete');
        btnEliminar.type = 'button';
        btnEliminar.addEventListener('click', async function() {

            // Se reemplaza el confirm nativo por SweetAlert2 para coherencia visual
            // con el resto de los diálogos de confirmación del proyecto
            const resultado = await Swal.fire({
                icon:              'warning',
                title:             '\u00bfEliminar tarea?',
                text:              `"${tarea.title}" ser\u00e1 eliminada permanentemente.`,
                showCancelButton:  true,
                confirmButtonText: 'S\u00ed, eliminar',
                cancelButtonText:  'Cancelar',
                // buttonsStyling false permite que customClass sobreescriba los estilos de los botones
                buttonsStyling:    false,
                customClass: {
                    popup:         'swal-popup swal-eliminar',
                    title:         'swal-title',
                    confirmButton: 'swal-btn-confirmar',
                    cancelButton:  'swal-btn-cancelar'
                }
            });

            // Si el usuario canceló el diálogo no se hace nada
            if (!resultado.isConfirmed) return;

            try {
                // Se envía DELETE al servidor para eliminar la tarea por su id
                await fetch(`${API_BASE_URL}/tasks/${tarea.id}`, { method: 'DELETE' });
                // Se recarga la tabla de tareas del admin para reflejar el cambio
                cargarTodasLasTareas();
            } catch (err) {
                console.error('Error eliminando tarea:', err);
            }
        });

        contenedor.appendChild(btnEliminar);
        celdaAcciones.appendChild(contenedor);

        fila.appendChild(celdaNum);
        fila.appendChild(celdaTitulo);
        fila.appendChild(celdaDesc);
        fila.appendChild(celdaEstado);
        fila.appendChild(celdaUsuario);
        fila.appendChild(celdaAcciones);
        tbody.appendChild(fila);
    });
}

// Abre el modal dinámico del ADMIN con los datos del usuario seleccionado
// Muestra sus tareas actuales y el formulario de asignar nueva tarea
// Esta función es EXCLUSIVA del modo admin: en modo usuario el resultado es fijo
// Parámetro: usuario — objeto del usuario cuyo panel se va a mostrar
export async function abrirModalUsuario(usuario) {
    // Se elimina cualquier modal anterior que pudiera haber quedado abierto
    cerrarModalUsuarioExistente();

    // Se crea el overlay que oscurece el fondo detrás del modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay';
    overlay.id = 'modalUsuarioOverlay';

    // Se crea la tarjeta del modal
    const modal = document.createElement('div');
    modal.className = 'modal-usuario';

    // Cabecera del modal con el nombre del usuario y botón de cerrar
    const header = document.createElement('div');
    header.className = 'modal-usuario__header';

    // Contenedor de la información textual del usuario
    const infoTexto = document.createElement('div');

    // Nombre del usuario como título principal del modal
    const titulo = document.createElement('h2');
    titulo.className = 'modal-usuario__titulo';
    titulo.textContent = usuario.name;

    // Documento del usuario como subtítulo
    const subtitulo = document.createElement('p');
    subtitulo.className = 'modal-usuario__subtitulo';
    subtitulo.textContent = `Documento: ${usuario.documento || usuario.id}`;

    infoTexto.appendChild(titulo);
    infoTexto.appendChild(subtitulo);

    // Botón X para cerrar el modal manualmente
    const btnCerrar = document.createElement('button');
    btnCerrar.className = 'modal-usuario__cerrar';
    btnCerrar.type = 'button';
    btnCerrar.textContent = '✕';
    btnCerrar.addEventListener('click', cerrarModalUsuarioExistente);

    header.appendChild(infoTexto);
    header.appendChild(btnCerrar);
    modal.appendChild(header);

    // Cuerpo del modal: lista de tareas a la izquierda + formulario de asignar a la derecha
    const cuerpo = document.createElement('div');
    cuerpo.className = 'modal-usuario__cuerpo';

    // Sección izquierda: tareas actuales asignadas al usuario
    const seccionTareas = document.createElement('div');
    seccionTareas.className = 'modal-usuario__tareas';

    const tituloTareas = document.createElement('h3');
    tituloTareas.className = 'modal-usuario__seccion-titulo';
    tituloTareas.textContent = 'Tareas asignadas';
    seccionTareas.appendChild(tituloTareas);

    // Se cargan las tareas del usuario desde el servidor filtrando por su id
    let tareas = [];
    try {
        const res = await fetch(`${API_BASE_URL}/tasks?userId=${usuario.id}`);
        tareas    = await res.json();
    } catch (err) {
        console.error('Error cargando tareas del usuario en modal:', err);
    }

    // Si no tiene tareas se muestra un mensaje indicativo
    if (tareas.length === 0) {
        const p = document.createElement('p');
        p.className   = 'modal-vacio';
        p.textContent = 'Este usuario no tiene tareas asignadas.';
        seccionTareas.appendChild(p);
    } else {
        // Se crea un ítem visual por cada tarea del usuario
        tareas.forEach(function(tarea) {
            const item = document.createElement('div');
            item.className = 'modal-tarea-item';

            // Texto con el título de la tarea
            const textoTarea = document.createElement('span');
            textoTarea.textContent = tarea.title;

            // Badge coloreado con el estado actual de la tarea
            const badge = document.createElement('span');
            badge.classList.add('status-badge', `status-${tarea.status}`);
            badge.textContent = formatearEstado(tarea.status);

            item.appendChild(textoTarea);
            item.appendChild(badge);
            seccionTareas.appendChild(item);
        });
    }

    cuerpo.appendChild(seccionTareas);

    // Sección derecha: formulario de asignar nueva tarea al usuario (exclusivo del admin)
    const seccionAsignar = document.createElement('div');
    seccionAsignar.className = 'modal-usuario__asignar';

    const tituloAsignar = document.createElement('h3');
    tituloAsignar.className = 'modal-usuario__seccion-titulo';
    tituloAsignar.textContent = 'Asignar nueva tarea';
    seccionAsignar.appendChild(tituloAsignar);

    const formAsignar = document.createElement('form');
    formAsignar.className = 'form';

    // Campo título de la tarea que se va a asignar
    // Se construye con createElement para respetar la separación estricta: sin HTML en JS
    const grupoTitulo = document.createElement('div');
    grupoTitulo.className = 'form__group';

    // Etiqueta del campo título
    const labelTitulo = document.createElement('label');
    labelTitulo.setAttribute('for', 'modal-tarea-titulo');
    labelTitulo.className   = 'form__label';
    labelTitulo.textContent = 'Titulo';

    // Input de texto para el título de la tarea
    const inputTitulo = document.createElement('input');
    inputTitulo.type        = 'text';
    inputTitulo.id          = 'modal-tarea-titulo';
    inputTitulo.className   = 'form__input';
    inputTitulo.placeholder = 'Titulo de la tarea';

    grupoTitulo.appendChild(labelTitulo);
    grupoTitulo.appendChild(inputTitulo);

    // Campo descripción de la tarea (opcional)
    // Se construye con createElement para evitar HTML en JS
    const grupoDesc = document.createElement('div');
    grupoDesc.className = 'form__group';

    // Etiqueta del campo descripción con texto "(opcional)" como span aparte
    const labelDesc = document.createElement('label');
    labelDesc.setAttribute('for', 'modal-tarea-desc');
    labelDesc.className = 'form__label';
    // Texto principal de la etiqueta
    labelDesc.textContent = 'Descripcion ';
    // Span con la indicación de campo opcional
    const spanOpcional = document.createElement('span');
    spanOpcional.className   = 'form__label--opcional';
    spanOpcional.textContent = '(opcional)';
    labelDesc.appendChild(spanOpcional);

    // Textarea para la descripción de la tarea
    const textareaDesc = document.createElement('textarea');
    textareaDesc.id          = 'modal-tarea-desc';
    textareaDesc.className   = 'form__input form__textarea';
    textareaDesc.rows        = 2;
    textareaDesc.placeholder = 'Descripcion...';

    grupoDesc.appendChild(labelDesc);
    grupoDesc.appendChild(textareaDesc);

    // Selector de estado inicial de la tarea
    // Se construye con createElement para evitar HTML en JS
    const grupoEstado = document.createElement('div');
    grupoEstado.className = 'form__group';

    // Etiqueta del selector de estado
    const labelEstado = document.createElement('label');
    labelEstado.setAttribute('for', 'modal-tarea-estado');
    labelEstado.className   = 'form__label';
    labelEstado.textContent = 'Estado';

    // Select con las tres opciones de estado del proyecto
    const selectEstadoModal = document.createElement('select');
    selectEstadoModal.id        = 'modal-tarea-estado';
    selectEstadoModal.className = 'form__input';

    // Opción por defecto deshabilitada que fuerza al usuario a elegir una opción real
    const optDefault = document.createElement('option');
    optDefault.value    = '';
    optDefault.disabled = true;
    optDefault.selected = true;
    optDefault.textContent = 'Selecciona un estado';

    // Opción pendiente
    const optPendiente = document.createElement('option');
    optPendiente.value       = 'pendiente';
    optPendiente.textContent = 'Pendiente';

    // Opción en progreso
    const optProgreso = document.createElement('option');
    optProgreso.value       = 'en_progreso';
    optProgreso.textContent = 'En Progreso';

    // Opción completada
    const optCompletada = document.createElement('option');
    optCompletada.value       = 'completada';
    optCompletada.textContent = 'Completada';

    selectEstadoModal.appendChild(optDefault);
    selectEstadoModal.appendChild(optPendiente);
    selectEstadoModal.appendChild(optProgreso);
    selectEstadoModal.appendChild(optCompletada);

    grupoEstado.appendChild(labelEstado);
    grupoEstado.appendChild(selectEstadoModal);

    // Botón submit para enviar el formulario de asignación
    // El span interior es requerido por la clase btn del proyecto (ver styles.css)
    const btnAsignar = document.createElement('button');
    btnAsignar.type      = 'submit';
    btnAsignar.className = 'btn btn--admin-primary';
    // Se crea el span del texto del botón con createElement en lugar de innerHTML
    const spanBtnAsignar = document.createElement('span');
    spanBtnAsignar.className   = 'btn__text';
    spanBtnAsignar.textContent = 'Asignar Tarea';
    btnAsignar.appendChild(spanBtnAsignar);

    formAsignar.appendChild(grupoTitulo);
    formAsignar.appendChild(grupoDesc);
    formAsignar.appendChild(grupoEstado);
    formAsignar.appendChild(btnAsignar);

    // Al enviar el formulario se crea la tarea asignada al usuario y se recarga el modal
    formAsignar.addEventListener('submit', async function(event) {
        event.preventDefault();

        const titulo = document.getElementById('modal-tarea-titulo').value.trim();
        const desc   = document.getElementById('modal-tarea-desc').value.trim();
        const estado = document.getElementById('modal-tarea-estado').value;

        // Se valida que los campos obligatorios estén completos antes de enviar
        if (!titulo || !estado) {
            await Swal.fire({
                icon:  'warning',
                title: 'Campos incompletos',
                // Se especifica cuáles campos son requeridos para orientar al admin
                text:  'El título y el estado de la tarea son obligatorios',
                buttonsStyling: false,
                customClass: {
                    popup:         'swal-popup',
                    title:         'swal-title',
                    confirmButton: 'swal-btn-confirmar'
                }
            });
            return;
        }

        // Se construye el objeto de la nueva tarea con el id y nombre del usuario
        const tarea = {
            title:       titulo,
            description: desc,
            status:      estado,
            // Se convierte el id a número si es posible para consistencia con el servidor
            userId:      parseInt(usuario.id, 10) || usuario.id,
            userName:    usuario.name,
            completed:   estado === 'completada'
        };

        try {
            // Se envía POST al servidor para crear la tarea
            const res = await fetch(`${API_BASE_URL}/tasks`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(tarea)
            });
            if (!res.ok) throw new Error('Error al asignar tarea');

            // Se cierra el modal y se vuelve a abrir con los datos actualizados
            // Esto simula un reload del modal sin recargar la página completa
            cerrarModalUsuarioExistente();
            await abrirModalUsuario(usuario);
            // Se recarga también la tabla de tareas del admin
            cargarTodasLasTareas();

        } catch (err) {
            console.error('Error asignando tarea desde modal:', err);
        }
    });

    seccionAsignar.appendChild(formAsignar);
    cuerpo.appendChild(seccionAsignar);
    modal.appendChild(cuerpo);

    // Se ensambla el overlay con el modal dentro y se inserta en el body
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Clic fuera del modal (en el overlay) cierra el modal sin perder los datos del admin
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            cerrarModalUsuarioExistente();
        }
    });
}

// Elimina el modal de usuario del DOM si existe
// Se llama al cerrar el modal manualmente o antes de abrir uno nuevo
function cerrarModalUsuarioExistente() {
    const overlayExistente = document.getElementById('modalUsuarioOverlay');
    if (overlayExistente) overlayExistente.remove();
}

// Convierte el valor técnico del estado a texto legible en español
// Se usa tanto en la tabla del admin como en los modales para mantener consistencia
function formatearEstado(estado) {
    const mapa = { pendiente: 'Pendiente', en_progreso: 'En Progreso', completada: 'Completada' };
    return mapa[estado] || estado;
}

// Registra todos los eventos de navegación y de los controles del panel admin
// Se llama desde main.js al inicializar la aplicación
export function registrarEventosNavegacion() {
    // Botones de la pantalla de inicio: dirigen a cada modo
    document.getElementById('btnAccesoUsuario')
        .addEventListener('click', activarModoUsuario);
    document.getElementById('btnAccesoAdmin')
        .addEventListener('click', activarModoAdmin);

    // Botones de volver: regresan a la pantalla de inicio desde cada modo
    document.getElementById('btnVolverUsuario')
        .addEventListener('click', activarModoInicio);
    document.getElementById('btnVolverAdmin')
        .addEventListener('click', activarModoInicio);

    // Botón de actualizar la tabla de usuarios del admin
    const btnRefrescar = document.getElementById('btnRefrescarUsuarios');
    if (btnRefrescar) btnRefrescar.addEventListener('click', cargarTablaUsuarios);

    // Botón "Aplicar" para aplicar los filtros activos en la tabla de tareas del admin
    const btnAplicar = document.getElementById('adminBtnAplicarFiltros');
    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltrosAdmin);

    // Botón "Limpiar" para resetear todos los controles y repintar sin filtros
    const btnLimpiar = document.getElementById('adminBtnLimpiarFiltros');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', function() {
            const fe = document.getElementById('adminFiltroEstado');
            const fu = document.getElementById('adminFiltroUsuario');
            const fo = document.getElementById('adminOrdenSelect');
            if (fe) fe.value = '';
            if (fu) fu.value = '';
            if (fo) fo.value = '';
            // Se repinta la tabla sin ningún filtro activo
            aplicarFiltrosAdmin();
        });
    }

    // Botón "Exportar JSON": descarga el arreglo actual de tareas como archivo JSON
    const btnExportar = document.getElementById('adminBtnExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', function() {
            if (todasLasTareas.length === 0) {
                alert('No hay tareas para exportar');
                return;
            }
            // Se convierte el arreglo a texto JSON con indentación de 2 espacios
            const json = JSON.stringify(todasLasTareas, null, 2);
            // Se crea un Blob con el texto JSON para generar el archivo descargable
            const blob = new Blob([json], { type: 'application/json' });
            // Se crea una URL temporal que apunta al Blob en memoria
            const url  = URL.createObjectURL(blob);
            // Se simula un clic en un enlace oculto para disparar la descarga
            const a    = document.createElement('a');
            a.href     = url;
            a.download = 'tareas_sistema.json';
            a.click();
            // Se libera la URL temporal de la memoria del navegador
            URL.revokeObjectURL(url);
        });
    }

    // Formulario de búsqueda en el header del admin
    // Al buscar, abre el modal dinámico del admin con el usuario encontrado
    const formBusqueda = document.getElementById('adminSearchUserForm');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', async function(event) {
            event.preventDefault();
            const input = document.getElementById('adminUserDocument');
            if (!input || !input.value.trim()) return;

            const termino = input.value.trim().toLowerCase();

            try {
                // Se pide la lista completa de usuarios para buscar por término
                const res      = await fetch(`${API_BASE_URL}/users`);
                const usuarios = await res.json();

                // Busca coincidencia exacta por id o documento, o parcial por nombre
                const encontrado = usuarios.find(u =>
                    u.id.toString() === termino ||
                    (u.documento && u.documento.toString() === termino) ||
                    u.name.toLowerCase().includes(termino)
                );

                if (!encontrado) {
                    await Swal.fire({
                        icon:  'warning',
                        title: 'Usuario no encontrado',
                        // Se muestra el término buscado para que el admin sepa qué ingresó
                        text:  `No se encontró ningún usuario con: "${input.value.trim()}"`,
                        // buttonsStyling false permite que customClass aplique los estilos del proyecto
                        buttonsStyling: false,
                        customClass: {
                            popup:         'swal-popup',
                            title:         'swal-title',
                            confirmButton: 'swal-btn-confirmar'
                        }
                    });
                    return;
                }

                // Se limpia el campo de búsqueda y se abre el modal del usuario encontrado
                input.value = '';
                abrirModalUsuario(encontrado);

            } catch (err) {
                console.error('Error buscando usuario en admin:', err);
            }
        });
    }

    // Formulario de crear usuario en el admin
    // El campo documento se envía como campo 'documento', no como 'id'
    // El servidor asigna el id numérico automáticamente
    const formCrear = document.getElementById('createUserForm');
    if (formCrear) {
        formCrear.addEventListener('submit', async function(event) {
            event.preventDefault();
            const inputDoc    = document.getElementById('newUserId');
            const inputNombre = document.getElementById('newUserName');
            const inputEmail  = document.getElementById('newUserEmail');

            const errorDoc    = document.getElementById('newUserIdError');
            const errorNombre = document.getElementById('newUserNameError');
            const errorEmail  = document.getElementById('newUserEmailError');

            // Se limpian los errores anteriores antes de validar de nuevo
            if (errorDoc)    { errorDoc.textContent    = ''; inputDoc.classList.remove('error'); }
            if (errorNombre) { errorNombre.textContent = ''; inputNombre.classList.remove('error'); }
            if (errorEmail)  { errorEmail.textContent  = ''; inputEmail.classList.remove('error'); }

            // Se valida que los tres campos estén completos antes de enviar
            let valido = true;
            if (!inputDoc.value.trim()) {
                if (errorDoc) errorDoc.textContent = 'El documento es obligatorio';
                inputDoc.classList.add('error');
                valido = false;
            }
            // Se valida que el documento contenga solo dígitos
           // Esto rechaza letras, guiones, espacios y cualquier símbolo
            // Solo se ejecuta si el campo tiene contenido (el if de vacío ya lo cubrió)
           if (inputDoc.value.trim() && !/^\d+$/.test(inputDoc.value.trim())) {
         // Se asigna el mensaje de error de formato en el span correspondiente del HTML
         if (errorDoc) errorDoc.textContent = 'El documento solo puede contener números';
             // Se agrega la clase error para que el input muestre borde rojo (styles.css)
               inputDoc.classList.add('error');
             // Se bloquea el envío del formulario al servidor
               valido = false;
            }
            if (!inputNombre.value.trim()) {
                if (errorNombre) errorNombre.textContent = 'El nombre es obligatorio';
                inputNombre.classList.add('error');
                valido = false;
            }
            // Se valida que el nombre contenga solo letras, tildes, ñ y espacios
// La expresión regular cubre el español completo:
//   a-zA-Z       → letras sin tilde
//   áéíóúÁÉÍÓÚ   → vocales con tilde
//   üÜ            → diéresis para nombres como "Güeris"
//   \s            → espacios (para nombres compuestos como "María José")
// El + exige al menos un carácter del conjunto
if (inputNombre.value.trim() && !/^[a-zA-ZáéíóúüñÜ\s]+$/.test(inputNombre.value.trim())) {
    // Se asigna el mensaje de error de formato en el span correspondiente del HTML
    if (errorNombre) errorNombre.textContent = 'El nombre solo puede contener letras y espacios';
    // Se aplica la clase error para mostrar el borde rojo del input (styles.css)
    inputNombre.classList.add('error');
    // Se bloquea el envío del formulario al servidor
    valido = false;
}
            if (!inputEmail.value.trim()) {
                if (errorEmail) errorEmail.textContent = 'El correo es obligatorio';
                inputEmail.classList.add('error');
                valido = false;
            }
            if (!valido) return;

            // Se construye el objeto del nuevo usuario con los valores del formulario
            const nuevoUsuario = {
                documento: inputDoc.value.trim(),
                name:      inputNombre.value.trim(),
                email:     inputEmail.value.trim()
            };

            try {
                // Se envía POST al servidor para crear el usuario
                const res = await fetch(`${API_BASE_URL}/users`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(nuevoUsuario)
                });
                if (!res.ok) throw new Error('Error al crear usuario');

                const usuarioCreado = await res.json();

                // Se limpian los campos del formulario tras la creación exitosa
                inputDoc.value    = '';
                inputNombre.value = '';
                inputEmail.value  = '';

                // Se recarga la tabla de usuarios y se abre el modal del usuario recién creado
                cargarTablaUsuarios();
                abrirModalUsuario(usuarioCreado);

            } catch (err) {
                // Se registra el error técnico en consola para diagnóstico del desarrollador
                console.error('Error creando usuario:', err);
                // Se notifica al admin con SweetAlert2 en lugar del alert() nativo
                // Se usa icon error porque el servidor no respondió correctamente
                await Swal.fire({
                    icon:  'error',
                    title: 'Error al crear usuario',
                    // Se orienta al admin sobre la causa más común del problema
                    text:  'No se pudo crear el usuario. Verifica que el servidor esté activo en localhost:3000',
                    buttonsStyling: false,
                    customClass: {
                        popup:         'swal-popup',
                        title:         'swal-title',
                        confirmButton: 'swal-btn-confirmar'
                    }
                });
            }
        });
    }
}