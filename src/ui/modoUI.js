// MÓDULO: ui/modoUI.js
// CAPA: UI — control de modos de navegación y modales de usuario
//
// Responsabilidad: gestionar qué vista está activa (inicio, usuario, admin),
// el modal dinámico de información de usuario en modo ADMIN,
// y los filtros y orden de la tabla admin.
// En modo USUARIO el resultado de búsqueda se muestra fijo en la vista,
// no en un modal flotante. Ese comportamiento es responsabilidad de tareasService.js.
//
// CORRECCIONES APLICADAS EN ESTA VERSIÓN:
//   1. Se elimina la importación de API_BASE_URL: ya no se hace fetch() directamente.
//   2. Se importan las funciones necesarias de tareasApi.js para respetar
//      la arquitectura de capas (ui/ no puede comunicarse con el servidor sin api/).
//   3. cargarTodasLasTareas() usa obtenerTodasLasTareas() de tareasApi.js
//      en lugar del fetch(`${API_BASE_URL}/api/tasks`) que tenía antes.
//   4. El botón eliminar de la tabla admin usa eliminarTarea() de tareasApi.js
//      en lugar del fetch(`${API_BASE_URL}/api/tasks/${id}`) que tenía antes.
//   5. abrirModalUsuario() usa obtenerTareasDeUsuario() de tareasApi.js
//      en lugar del fetch directo que tenía antes para cargar las tareas del modal.
//   6. formAsignar usa registrarTarea() de tareasApi.js para crear tareas
//      desde el modal del admin en lugar del fetch directo anterior.
//   7. Se elimina la importación de Swal: todo pasa por notificaciones.js.

// Se importan las funciones de la capa API de tareas.
// La capa ui/ no puede hacer fetch() directamente al servidor;
// toda petición HTTP debe ir por los módulos de api/.
import {
    obtenerTodasLasTareas,
    obtenerTareasDeUsuario,
    eliminarTarea,
    registrarTarea
} from '../api/tareasApi.js';

// Se importan las funciones de la capa API de usuarios.
// La capa ui/ no puede hacer fetch directamente al servidor;
// toda petición HTTP debe ir por los módulos de api/.
import {
    obtenerTodosLosUsuarios,
    crearUsuario,
    eliminarUsuario
} from '../api/usuariosApi.js';

// Se importan las funciones centralizadas de notificaciones.
// La guía 3 exige que notificaciones.js sea el único punto de contacto con SweetAlert2.
// modoUI.js NO importa Swal directamente — toda la lógica visual de alerts está en notificaciones.js.
import {
    mostrarNotificacion,
    mostrarConfirmacion
} from '../utils/notificaciones.js';

// Referencias a las tres vistas principales del HTML
// Se obtienen al cargar el módulo y se reutilizan en todas las funciones
const pantallaInicio = document.getElementById('pantallaInicio');
const vistaUsuario   = document.getElementById('vistaUsuario');
const vistaAdmin     = document.getElementById('vistaAdmin');

// Oculta todas las vistas antes de mostrar la activa.
// Se llama siempre antes de activar cualquier modo para limpiar el estado visual.
function ocultarTodo() {
    pantallaInicio.classList.add('hidden');
    vistaUsuario.classList.add('hidden');
    vistaAdmin.classList.add('hidden');
}

// Activa la pantalla de inicio y actualiza el data-modo del body.
// El data-modo cambia el color de fondo según el modo activo (ver styles.css).
export function activarModoInicio() {
    ocultarTodo();
    pantallaInicio.classList.remove('hidden');
    // El body cambia su fondo cuando data-modo es 'inicio'
    document.body.dataset.modo = 'inicio';
}

// Activa la vista de usuario y actualiza el data-modo del body.
export function activarModoUsuario() {
    ocultarTodo();
    vistaUsuario.classList.remove('hidden');
    document.body.dataset.modo = 'usuario';
}

// Activa la vista del admin, actualiza el data-modo y carga los datos iniciales.
// Al entrar al admin se cargan automáticamente usuarios y tareas
// para no mostrar tablas vacías al primer ingreso.
export function activarModoAdmin() {
    ocultarTodo();
    vistaAdmin.classList.remove('hidden');
    document.body.dataset.modo = 'admin';
    // Se cargan ambas tablas en paralelo sin bloquear la UI
    cargarTablaUsuarios();
    cargarTodasLasTareas();
}

// Fuente de verdad del admin: todas las tareas sin filtrar.
// Se guarda aquí para poder filtrar y ordenar sin hacer una nueva petición al servidor.
let todasLasTareas = [];

// ── CARGAR TABLA DE USUARIOS ─────────────────────────────────────────────────

// Carga todos los usuarios del servidor y los pinta en la tabla del admin.
// Se llama al entrar al admin y después de crear o eliminar un usuario.
export async function cargarTablaUsuarios() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
        // CORRECCIÓN: se usa obtenerTodosLosUsuarios() de usuariosApi.js
        // en lugar de fetch directo. Esto respeta la arquitectura de capas.
        const usuarios = await obtenerTodosLosUsuarios();

        // Si la función retornó null hubo un error en la petición
        if (!usuarios) {
            await mostrarNotificacion('Error al cargar los usuarios', 'error');
            return;
        }

        // Se vacía el tbody antes de repintar para evitar duplicar filas
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

        // Si no hay usuarios se muestra una fila indicativa
        if (usuarios.length === 0) {
            const fila  = document.createElement('tr');
            const celda = document.createElement('td');
            celda.colSpan        = 5;
            celda.textContent    = 'No hay usuarios registrados';
            celda.style.textAlign = 'center';
            celda.style.color    = '#9ca3af';
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

            // Celda de documento del usuario (no el id interno de MySQL)
            const celdaDoc = document.createElement('td');
            celdaDoc.textContent = usuario.documento || usuario.id;

            // Celda nombre completo del usuario
            const celdaNombre = document.createElement('td');
            celdaNombre.textContent = usuario.name;

            // Celda correo electrónico del usuario
            const celdaEmail = document.createElement('td');
            celdaEmail.textContent = usuario.email;

            // Celda de acciones: botones Ver/Asignar y Eliminar
            const celdaAcciones = document.createElement('td');
            const contenedor    = document.createElement('div');
            contenedor.classList.add('task-actions');

            // Botón que abre el modal dinámico con las tareas del usuario
            const btnVerTareas = document.createElement('button');
            btnVerTareas.textContent = 'Ver / Asignar';
            btnVerTareas.classList.add('btn-action', 'btn-action--edit');
            btnVerTareas.type = 'button';
            btnVerTareas.addEventListener('click', function() {
                abrirModalUsuario(usuario);
            });

            // Botón para eliminar el usuario del sistema
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = '🗑️ Eliminar';
            btnEliminar.classList.add('btn-action', 'btn-action--delete');
            btnEliminar.type = 'button';
            btnEliminar.addEventListener('click', async function() {

                // Se usa mostrarConfirmacion centralizado en lugar de Swal directo.
                // notificaciones.js es el único módulo que puede usar SweetAlert2.
                const confirmado = await mostrarConfirmacion(
                    '¿Eliminar usuario?',
                    `"${usuario.name}" será eliminado permanentemente.`,
                    'Sí, eliminar'
                );

                if (!confirmado) return;

                // CORRECCIÓN: se usa eliminarUsuario() de usuariosApi.js
                const eliminado = await eliminarUsuario(usuario.id);
                if (eliminado) {
                    await mostrarNotificacion('Usuario eliminado correctamente', 'exito');
                    // Se recargan ambas tablas porque eliminar un usuario puede
                    // afectar el campo assignedUsersDisplay de las tareas existentes
                    cargarTablaUsuarios();
                    cargarTodasLasTareas();
                } else {
                    await mostrarNotificacion('Error al eliminar el usuario', 'error');
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

// ── CARGAR TODAS LAS TAREAS ──────────────────────────────────────────────────

// Carga todas las tareas del sistema y las guarda en todasLasTareas.
// Luego llama a aplicarFiltrosAdmin() para pintar la tabla con los filtros activos.
export async function cargarTodasLasTareas() {
    const tbody = document.getElementById('adminTasksTableBody');
    if (!tbody) return;

    try {
        // CORRECCIÓN: se usa obtenerTodasLasTareas() de tareasApi.js
        // en lugar del fetch(`${API_BASE_URL}/api/tasks`) que había antes.
        // Esto respeta la regla de que ui/ no puede hacer fetch() directamente.
        const tareas = await obtenerTodasLasTareas();

        // Se guarda en la variable del módulo para filtrar sin nueva petición al servidor
        todasLasTareas = tareas;
        // Se aplican los filtros activos sobre las tareas recién cargadas
        aplicarFiltrosAdmin();

    } catch (err) {
        console.error('Error cargando tareas:', err);
    }
}

// ── FILTROS Y ORDENAMIENTO DEL PANEL ADMIN ───────────────────────────────────

// Aplica los filtros (estado, usuario) y el orden activos sobre todasLasTareas.
// Se llama al hacer clic en "Aplicar", al limpiar filtros y al recargar las tareas.
export function aplicarFiltrosAdmin() {
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

    // Filtro por usuario: busca coincidencias en el nombre resuelto o en el id
    const termino = filtroUsuario ? filtroUsuario.value.trim().toLowerCase() : '';
    if (termino) {
        resultado = resultado.filter(t =>
            (t.assignedUsersDisplay && t.assignedUsersDisplay.toLowerCase().includes(termino)) ||
            (t.assignedUsers && t.assignedUsers.some(id => id.toString().includes(termino)))
        );
    }

    // Ordenamiento: los criterios del admin son distintos a los de utils/ordenamiento.js
    const orden = ordenSelect ? ordenSelect.value : '';
    if (orden === 'titulo_asc') {
        // A-Z usando localeCompare para respetar tildes del español
        resultado.sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
    } else if (orden === 'titulo_desc') {
        // Z-A, inverso al anterior
        resultado.sort((a, b) => b.title.localeCompare(a.title, 'es', { sensitivity: 'base' }));
    } else if (orden === 'estado') {
        // Orden por flujo de trabajo: pendiente → en_progreso → completada
        const prioridad = { pendiente: 0, en_progreso: 1, completada: 2 };
        resultado.sort((a, b) => (prioridad[a.status] ?? 99) - (prioridad[b.status] ?? 99));
    } else if (orden === 'usuario') {
        // Orden alfabético por nombre del usuario asignado
        resultado.sort((a, b) =>
            (a.assignedUsersDisplay || '').localeCompare(
                b.assignedUsersDisplay || '', 'es', { sensitivity: 'base' }
            )
        );
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
        celda.colSpan        = 6;
        celda.textContent    = 'No hay tareas que coincidan con los filtros';
        celda.style.textAlign = 'center';
        celda.style.color    = '#9ca3af';
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

        // Celda de estado con badge visual coloreado
        const celdaEstado = document.createElement('td');
        const badge = document.createElement('span');
        badge.classList.add('status-badge', `status-${tarea.status}`);
        badge.textContent = formatearEstado(tarea.status);
        celdaEstado.appendChild(badge);

        // Celda del nombre del usuario asignado
        // assignedUsersDisplay ya viene resuelto desde getAllTasks() del modelo
        const celdaUsuario = document.createElement('td');
        celdaUsuario.textContent = tarea.assignedUsersDisplay || 'Sin asignar';

        // Celda de acciones con botón eliminar
        const celdaAcciones = document.createElement('td');
        const contenedor    = document.createElement('div');
        contenedor.classList.add('task-actions');

        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = '🗑️ Eliminar';
        btnEliminar.classList.add('btn-action', 'btn-action--delete');
        btnEliminar.type = 'button';
        btnEliminar.addEventListener('click', async function() {

            // Se usa mostrarConfirmacion centralizado en lugar de Swal directo
            const confirmado = await mostrarConfirmacion(
                '¿Eliminar tarea?',
                `"${tarea.title}" será eliminada permanentemente.`,
                'Sí, eliminar'
            );

            if (!confirmado) return;

            // CORRECCIÓN: se usa eliminarTarea() de tareasApi.js
            // en lugar del fetch(`${API_BASE_URL}/api/tasks/${id}`) anterior.
            const eliminada = await eliminarTarea(tarea.id);
            if (eliminada) {
                await mostrarNotificacion('Tarea eliminada correctamente', 'exito');
                cargarTodasLasTareas();
            } else {
                await mostrarNotificacion('Error al eliminar la tarea', 'error');
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

// ── MODAL DINÁMICO DE USUARIO (exclusivo del modo admin) ─────────────────────

// Abre el modal dinámico del ADMIN con los datos del usuario seleccionado.
// Muestra sus tareas actuales en la columna izquierda y el formulario de
// asignar nueva tarea en la columna derecha.
// Esta función es EXCLUSIVA del modo admin: en modo usuario el resultado es fijo.
// Parámetro: usuario — objeto del usuario cuyo panel se va a mostrar.
export async function abrirModalUsuario(usuario) {
    // Se elimina cualquier modal anterior que pudiera haber quedado abierto
    cerrarModalUsuarioExistente();

    // Se crea el overlay que oscurece el fondo detrás del modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay';
    overlay.id        = 'modalUsuarioOverlay';

    // Se crea la tarjeta principal del modal
    const modal = document.createElement('div');
    modal.className = 'modal-usuario';

    // Cabecera del modal con el nombre del usuario y botón de cerrar
    const header = document.createElement('div');
    header.className = 'modal-usuario__header';

    const infoTexto = document.createElement('div');

    // Nombre del usuario como título principal del modal
    const titulo = document.createElement('h2');
    titulo.className   = 'modal-usuario__titulo';
    titulo.textContent = usuario.name;

    // Documento del usuario como subtítulo informativo
    const subtitulo = document.createElement('p');
    subtitulo.className   = 'modal-usuario__subtitulo';
    subtitulo.textContent = `Documento: ${usuario.documento || usuario.id}`;

    infoTexto.appendChild(titulo);
    infoTexto.appendChild(subtitulo);

    // Botón X para cerrar el modal manualmente sin guardar cambios
    const btnCerrar = document.createElement('button');
    btnCerrar.className   = 'modal-usuario__cerrar';
    btnCerrar.type        = 'button';
    btnCerrar.textContent = '✕';
    btnCerrar.addEventListener('click', cerrarModalUsuarioExistente);

    header.appendChild(infoTexto);
    header.appendChild(btnCerrar);
    modal.appendChild(header);

    // Cuerpo del modal: columna izquierda (tareas actuales) + columna derecha (formulario)
    const cuerpo = document.createElement('div');
    cuerpo.className = 'modal-usuario__cuerpo';

    // ── COLUMNA IZQUIERDA: tareas actuales del usuario ────────────────────────
    const seccionTareas = document.createElement('div');
    seccionTareas.className = 'modal-usuario__tareas';

    const tituloTareas = document.createElement('h3');
    tituloTareas.className   = 'modal-usuario__seccion-titulo';
    tituloTareas.textContent = 'Tareas asignadas';
    seccionTareas.appendChild(tituloTareas);

    // CORRECCIÓN: se usa obtenerTareasDeUsuario() de tareasApi.js
    // en lugar del fetch(`${API_BASE_URL}/api/tasks/filter?userId=`) anterior.
    let tareas = [];
    try {
        tareas = await obtenerTareasDeUsuario(usuario.id);
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

            // Span con el título de la tarea
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

    // ── COLUMNA DERECHA: formulario de asignar nueva tarea ────────────────────
    const seccionAsignar = document.createElement('div');
    seccionAsignar.className = 'modal-usuario__asignar';

    const tituloAsignar = document.createElement('h3');
    tituloAsignar.className   = 'modal-usuario__seccion-titulo';
    tituloAsignar.textContent = 'Asignar nueva tarea';
    seccionAsignar.appendChild(tituloAsignar);

    const formAsignar = document.createElement('form');
    formAsignar.className = 'form';

    // Campo título de la tarea (obligatorio)
    const grupoTitulo = document.createElement('div');
    grupoTitulo.className = 'form__group';

    const labelTitulo = document.createElement('label');
    labelTitulo.setAttribute('for', 'modal-tarea-titulo');
    labelTitulo.className   = 'form__label';
    labelTitulo.textContent = 'Titulo';

    const inputTitulo = document.createElement('input');
    inputTitulo.type        = 'text';
    inputTitulo.id          = 'modal-tarea-titulo';
    inputTitulo.className   = 'form__input';
    inputTitulo.placeholder = 'Titulo de la tarea';

    grupoTitulo.appendChild(labelTitulo);
    grupoTitulo.appendChild(inputTitulo);

    // Campo descripción (opcional)
    const grupoDesc = document.createElement('div');
    grupoDesc.className = 'form__group';

    const labelDesc = document.createElement('label');
    labelDesc.setAttribute('for', 'modal-tarea-desc');
    labelDesc.className   = 'form__label';
    labelDesc.textContent = 'Descripcion ';

    const spanOpcional = document.createElement('span');
    spanOpcional.className   = 'form__label--opcional';
    spanOpcional.textContent = '(opcional)';
    labelDesc.appendChild(spanOpcional);

    const textareaDesc = document.createElement('textarea');
    textareaDesc.id          = 'modal-tarea-desc';
    textareaDesc.className   = 'form__input form__textarea';
    textareaDesc.rows        = 2;
    textareaDesc.placeholder = 'Descripcion...';

    grupoDesc.appendChild(labelDesc);
    grupoDesc.appendChild(textareaDesc);

    // Selector de estado inicial de la tarea (obligatorio)
    const grupoEstado = document.createElement('div');
    grupoEstado.className = 'form__group';

    const labelEstado = document.createElement('label');
    labelEstado.setAttribute('for', 'modal-tarea-estado');
    labelEstado.className   = 'form__label';
    labelEstado.textContent = 'Estado';

    const selectEstadoModal = document.createElement('select');
    selectEstadoModal.id        = 'modal-tarea-estado';
    selectEstadoModal.className = 'form__input';

    // Opción por defecto deshabilitada que fuerza al admin a elegir explícitamente
    const optDefault = document.createElement('option');
    optDefault.value       = '';
    optDefault.disabled    = true;
    optDefault.selected    = true;
    optDefault.textContent = 'Selecciona un estado';

    const optPendiente = document.createElement('option');
    optPendiente.value       = 'pendiente';
    optPendiente.textContent = 'Pendiente';

    const optProgreso = document.createElement('option');
    optProgreso.value       = 'en_progreso';
    optProgreso.textContent = 'En Progreso';

    const optCompletada = document.createElement('option');
    optCompletada.value       = 'completada';
    optCompletada.textContent = 'Completada';

    selectEstadoModal.appendChild(optDefault);
    selectEstadoModal.appendChild(optPendiente);
    selectEstadoModal.appendChild(optProgreso);
    selectEstadoModal.appendChild(optCompletada);

    grupoEstado.appendChild(labelEstado);
    grupoEstado.appendChild(selectEstadoModal);

    // Botón submit del formulario de asignación
    const btnAsignar = document.createElement('button');
    btnAsignar.type      = 'submit';
    btnAsignar.className = 'btn btn--admin-primary';

    const spanBtnAsignar = document.createElement('span');
    spanBtnAsignar.className   = 'btn__text';
    spanBtnAsignar.textContent = 'Asignar Tarea';
    btnAsignar.appendChild(spanBtnAsignar);

    formAsignar.appendChild(grupoTitulo);
    formAsignar.appendChild(grupoDesc);
    formAsignar.appendChild(grupoEstado);
    formAsignar.appendChild(btnAsignar);

    // Handler del submit del formulario de asignación de tarea
    formAsignar.addEventListener('submit', async function(event) {
        event.preventDefault();

        const titulo = document.getElementById('modal-tarea-titulo').value.trim();
        const desc   = document.getElementById('modal-tarea-desc').value.trim();
        const estado = document.getElementById('modal-tarea-estado').value;

        // Se valida que los campos obligatorios estén completos
        if (!titulo || !estado) {
            await mostrarNotificacion('El título y el estado son obligatorios', 'advertencia');
            return;
        }

        // Se construye el objeto de la tarea con la estructura correcta para MySQL.
        // assignedUsers DEBE ser un array porque así lo espera el modelo MySQL.
        // El modelo task.model.js lo serializa a JSON string para guardar en la BD.
        // Si se enviara userId como campo suelto, MySQL lo ignoraría completamente
        // y la tarea quedaría con assigned_users = [] → nunca aparece al buscar.
        const datosTarea = {
            title:         titulo,
            description:   desc,
            status:        estado,
            // parseInt convierte el id a número para consistencia con los IDs de MySQL
            assignedUsers: [parseInt(usuario.id, 10) || usuario.id]
        };

        // CORRECCIÓN: se usa registrarTarea() de tareasApi.js
        // en lugar del fetch(`${API_BASE_URL}/api/tasks`) anterior.
        const tareaCreada = await registrarTarea(datosTarea);

        if (tareaCreada) {
            // Se cierra el modal y se vuelve a abrir con los datos actualizados
            // Esto simula un reload del modal sin recargar la página completa
            cerrarModalUsuarioExistente();
            await abrirModalUsuario(usuario);
            // Se recarga también la tabla de tareas del admin
            cargarTodasLasTareas();
        } else {
            await mostrarNotificacion('Error al asignar la tarea', 'error');
        }
    });

    seccionAsignar.appendChild(formAsignar);
    cuerpo.appendChild(seccionAsignar);
    modal.appendChild(cuerpo);

    // Se ensambla el overlay con el modal dentro y se inserta en el body
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Clic fuera del modal (en el overlay) cierra el modal
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            cerrarModalUsuarioExistente();
        }
    });
}

// Elimina el modal de usuario del DOM si existe.
// Se llama al cerrar el modal manualmente o antes de abrir uno nuevo.
function cerrarModalUsuarioExistente() {
    const overlayExistente = document.getElementById('modalUsuarioOverlay');
    if (overlayExistente) overlayExistente.remove();
}

// Convierte el valor técnico del estado a texto legible en español.
// Se usa tanto en la tabla del admin como en los modales para mantener consistencia.
function formatearEstado(estado) {
    const mapa = { pendiente: 'Pendiente', en_progreso: 'En Progreso', completada: 'Completada' };
    return mapa[estado] || estado;
}

// ── REGISTRO DE EVENTOS DE NAVEGACIÓN ────────────────────────────────────────

// Registra todos los eventos de navegación y de los controles del panel admin.
// Se llama desde main.js al inicializar la aplicación, una sola vez.
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

    // Botón actualizar tabla de usuarios del admin
    const btnRefrescar = document.getElementById('btnRefrescarUsuarios');
    if (btnRefrescar) btnRefrescar.addEventListener('click', cargarTablaUsuarios);

    // Botón "Aplicar" para aplicar los filtros activos en la tabla de tareas
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
            aplicarFiltrosAdmin();
        });
    }

    // Botón "Exportar JSON": descarga el arreglo actual de tareas como archivo JSON
    const btnExportar = document.getElementById('adminBtnExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', function() {
            if (todasLasTareas.length === 0) {
                mostrarNotificacion('No hay tareas para exportar', 'advertencia');
                return;
            }
            // Se convierte el arreglo a texto JSON con indentación de 2 espacios para legibilidad
            const json = JSON.stringify(todasLasTareas, null, 2);
            // Blob representa el contenido del archivo en memoria del navegador
            const blob = new Blob([json], { type: 'application/json' });
            // createObjectURL genera una URL temporal que apunta al Blob
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
    const formBusqueda = document.getElementById('adminSearchUserForm');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', async function(event) {
            event.preventDefault();
            const input = document.getElementById('adminUserDocument');
            if (!input || !input.value.trim()) return;

            const termino = input.value.trim().toLowerCase();

            try {
                // Se usa obtenerTodosLosUsuarios() de usuariosApi.js
                const usuarios = await obtenerTodosLosUsuarios();
                if (!usuarios) {
                    await mostrarNotificacion('Error al buscar usuarios', 'error');
                    return;
                }

                // Busca coincidencia exacta por id o documento, o parcial por nombre
                const encontrado = usuarios.find(u =>
                    u.id.toString()                      === termino ||
                    (u.documento && u.documento.toString() === termino) ||
                    u.name.toLowerCase().includes(termino)
                );

                if (!encontrado) {
                    await mostrarNotificacion(
                        `No se encontró ningún usuario con: "${input.value.trim()}"`,
                        'advertencia'
                    );
                    return;
                }

                // Se limpia el campo y se abre el modal del usuario encontrado
                input.value = '';
                abrirModalUsuario(encontrado);

            } catch (err) {
                console.error('Error buscando usuario en admin:', err);
            }
        });
    }

    // Formulario de crear usuario en el admin
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

            let valido = true;

            // Validación campo documento: obligatorio y solo dígitos
            if (!inputDoc.value.trim()) {
                if (errorDoc) errorDoc.textContent = 'El documento es obligatorio';
                inputDoc.classList.add('error');
                valido = false;
            } else if (!/^\d+$/.test(inputDoc.value.trim())) {
                if (errorDoc) errorDoc.textContent = 'El documento solo puede contener números';
                inputDoc.classList.add('error');
                valido = false;
            }

            // Validación campo nombre: obligatorio y solo letras/espacios/tildes
            if (!inputNombre.value.trim()) {
                if (errorNombre) errorNombre.textContent = 'El nombre es obligatorio';
                inputNombre.classList.add('error');
                valido = false;
            } else if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(inputNombre.value.trim())) {
                if (errorNombre) errorNombre.textContent = 'El nombre solo puede contener letras y espacios';
                inputNombre.classList.add('error');
                valido = false;
            }

            // Validación campo email: obligatorio
            if (!inputEmail.value.trim()) {
                if (errorEmail) errorEmail.textContent = 'El correo es obligatorio';
                inputEmail.classList.add('error');
                valido = false;
            }

            if (!valido) return;

            const nuevoUsuario = {
                documento: inputDoc.value.trim(),
                name:      inputNombre.value.trim(),
                email:     inputEmail.value.trim()
            };

            try {
                // CORRECCIÓN: se usa crearUsuario() de usuariosApi.js
                const usuarioCreado = await crearUsuario(nuevoUsuario);
                if (!usuarioCreado) throw new Error('Error al crear usuario');

                // Se limpian los campos del formulario tras la creación exitosa
                inputDoc.value    = '';
                inputNombre.value = '';
                inputEmail.value  = '';

                // Se recarga la tabla y se abre el modal del usuario recién creado
                cargarTablaUsuarios();
                abrirModalUsuario(usuarioCreado);

            } catch (err) {
                console.error('Error creando usuario:', err);
                await mostrarNotificacion(
                    'No se pudo crear el usuario. Verifica que el servidor esté activo.',
                    'error'
                );
            }
        });
    }
}