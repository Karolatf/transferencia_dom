// Este archivo es el corazón de la interfaz: decide qué pantalla se muestra
// (inicio/login, panel de usuario, panel de admin o panel de instructor),
// construye todas las tablas, modales y formularios dinámicamente,
// y conecta los eventos del usuario (clics, envíos de formulario) con el backend.

// Importamos las funciones que se comunican con el servidor para manejar tareas
import {
    obtenerTodasLasTareas,
    obtenerTareasDeUsuario,
    obtenerTareaPorId,
    eliminarTarea,
    registrarTarea,
    obtenerDashboard,
    actualizarTarea,
} from '../api/tareasApi.js';

// Importamos las funciones que se comunican con el servidor para manejar usuarios
import {
    obtenerTodosLosUsuarios,
    eliminarUsuario,
    forceEliminarUsuario,
    actualizarUsuario,
    cambiarRolUsuario,
    cambiarPassword,
    desactivarUsuario,
    reactivarUsuario,
} from '../api/usuariosApi.js';

// Importamos las funciones para mostrar mensajes emergentes y modales de confirmación
import {
    mostrarNotificacion,
    mostrarConfirmacion,
    mostrarModalToggleEstado,
    mostrarModalEliminarUsuario,
} from '../utils/notificaciones.js';

// Importamos la función que filtra tareas por estado y por nombre de usuario
import { filtrarTareas }  from '../utils/filtros.js';

// Importamos las funciones que crean y ocultan el modal de edición de tareas
import { mostrarModalEdicion, ocultarModalEdicion, agregarTareaATabla } from './tareasUI.js';

// Importamos la función que ordena tareas según el criterio seleccionado
import { ordenarTareas }  from '../utils/ordenamiento.js';

// Importamos las dos funciones de exportación: una específica para tareas y otra genérica
import { exportarTareasJSON, exportarListaJSON } from '../utils/exportacion.js';

// Importamos las funciones de validación de formularios de todo el sistema
import { validarFormularioUsuario, validarFormularioTarea, validarFormularioLogin, validarFormularioRegistro } from '../utils/validaciones.js';

// Importamos las funciones que se comunican con el servidor para manejar autenticación
import { loginUsuario, registrarUsuario, forgotPassword, verifyResetCode, resetPassword } from '../api/authApi.js';

// Importamos las funciones que guardan y leen los tokens del almacenamiento local del navegador
import { guardarSesion, cerrarSesion, obtenerUsuarioSesion } from '../utils/sesion.js';

// Importamos las funciones del registro de auditoría (log de acciones importantes)
import { registrarEvento, renderizarAuditoria } from '../utils/auditoria.js';

// Importamos el diccionario de permisos y metadatos de cada rol del sistema
import { PERMISOS_POR_ROL, METADATOS_ROL } from '../utils/rolesPermisos.js';

// Importamos la función que monta el calendario interactivo con eventos y tareas
import { crearCalendario } from '../utils/eventosCalendario.js';
// Importamos las funciones para leer, crear y eliminar notas personales (post-its)
import { obtenerNotas, crearNota as crearNotaApi, eliminarNota as eliminarNotaApi } from '../api/notesApi.js';
// Importamos las funciones del router SPA que maneja la navegación por hash en la URL
import { registrarRuta, registrarRutas, iniciarRouter, ir, navegarA, irAModal, volverDeModal, limpiarHashActual, resetearEstadoRouter, rutaAnterior } from '../router.js';
// Importamos los diccionarios de rutas y secciones definidos en rutas.js
import { RUTAS, SECCIONES_USUARIO, SECCIONES_ADMIN, SECCIONES_INSTRUCTOR } from '../rutas.js';

// Variables que guardan temporalmente los datos del elemento que se va a ver o editar
// Se asignan justo antes de navegar al modal, y se leen cuando el modal se abre
let _pendingVerTarea        = null; // tarea que se va a ver en el modal de solo lectura
let _pendingEditarTarea     = null; // tarea que se va a editar en el modal de edición
let _pendingVerUsuario      = null; // usuario que se va a ver en el modal de usuario
let _pendingEditarUsuario   = null; // usuario que se va a editar en el modal de edición
let _pendingCambiarRol      = null; // usuario al que se le va a cambiar el rol
let _pendingDesactivar      = null; // usuario que se va a desactivar
let _pendingActivar         = null; // usuario que se va a reactivar
let _pendingEliminarUsuario = null; // usuario que se va a eliminar permanentemente
let _pendingEliminarTarea   = null; // tarea que se va a eliminar permanentemente

// Variable que guarda el listener del formulario de edición activo actualmente
// Se elimina antes de agregar uno nuevo para evitar que se acumulen múltiples listeners
let _activeEditHandler      = null;

// Crea un elemento de ícono de la librería Lucide con el nombre y clase indicados
// Parámetro: nombreIcono — nombre del ícono según la librería (ej: "trash-2", "eye")
// Parámetro: claseExtra — clase CSS adicional opcional para el ícono
function crearIconoLucide(nombreIcono, claseExtra) {
    // Creamos un elemento <i> que Lucide convertirá en un SVG del ícono indicado
    const icono = document.createElement('i');
    icono.setAttribute('data-lucide', nombreIcono);
    icono.classList.add('icono-accion');
    // Si se indicó una clase extra, la agregamos al elemento
    if (claseExtra) icono.classList.add(claseExtra);
    return icono;
}


// ── SIDEBAR ───────────────────────────────────────────────────────────────────

// Abre el menú lateral del panel indicado por sufijo (ej: "Admin", "Usuario", "Instructor")
function abrirSidebar(sufijo) {
    // Buscamos los tres elementos del sidebar: el panel, el fondo oscuro y el botón hamburguesa
    const sidebar = document.getElementById('sidebar' + sufijo);
    const overlay = document.getElementById('overlay' + sufijo);
    const btn     = document.getElementById('btnHamburguesa' + sufijo);
    // Agregamos las clases que hacen visible el sidebar deslizándolo desde la izquierda
    if (sidebar) sidebar.classList.add('sidebar--abierto');
    // Hacemos visible el fondo oscuro semitransparente que cubre el contenido detrás del sidebar
    if (overlay) overlay.classList.add('sidebar-overlay--visible');
    // Animamos el botón hamburguesa para indicar que el menú está abierto
    if (btn)     btn.classList.add('btn-hamburguesa--abierto');
    // Actualizamos el atributo de accesibilidad para lectores de pantalla
    if (btn)     btn.setAttribute('aria-expanded', 'true');
}

// Cierra el menú lateral del panel indicado por sufijo
function cerrarSidebar(sufijo) {
    const sidebar = document.getElementById('sidebar' + sufijo);
    const overlay = document.getElementById('overlay' + sufijo);
    const btn     = document.getElementById('btnHamburguesa' + sufijo);
    // Quitamos las clases que hacen visible el sidebar
    if (sidebar) sidebar.classList.remove('sidebar--abierto');
    // Ocultamos el fondo oscuro semitransparente
    if (overlay) overlay.classList.remove('sidebar-overlay--visible');
    // Regresamos el botón hamburguesa a su estado original
    if (btn)     btn.classList.remove('btn-hamburguesa--abierto');
    // Actualizamos el atributo de accesibilidad indicando que el menú está cerrado
    if (btn)     btn.setAttribute('aria-expanded', 'false');
}

// Expande (abre) una card con el ID del cuerpo indicado, mostrando su contenido
function _expandirCard(cuerpoId) {
    // Buscamos el elemento contenedor del contenido de la card
    const cuerpo = document.getElementById(cuerpoId);
    if (!cuerpo) return;
    // Quitamos la clase 'oculto' para que el cuerpo de la card sea visible
    cuerpo.classList.remove('oculto');
    // Buscamos el encabezado de la card (el elemento justo antes del cuerpo)
    const cabecera = cuerpo.previousElementSibling;
    if (cabecera) {
        // Rotamos la flecha para que apunte hacia abajo indicando que la card está abierta
        const btnFlecha = cabecera.querySelector('.btn-toggle-card');
        if (btnFlecha) btnFlecha.classList.remove('contraido');
        // Restauramos el borde inferior del encabezado que separa título de contenido
        cabecera.classList.remove('sin-borde');
    }
}

// Muestra la sección indicada dentro de una vista SPA (usuario, admin o instructor)
// Parámetro vistaId: ID del contenedor de la vista (ej: 'vistaAdmin')
// Parámetro sidebarId: ID del sidebar correspondiente (ej: 'sidebarAdmin')
// Parámetro sufijo: sufijo del sidebar para abrirlo/cerrarlo (ej: 'Admin')
// Parámetro nombre: nombre de la sección a mostrar (ej: 'tareas', 'usuarios')
// Parámetro mapaExpandir: mapa de nombre → ID del cuerpo de la card a expandir
function _mostrarSeccion(vistaId, sidebarId, sufijo, nombre, mapaExpandir) {
    // Buscamos el contenedor principal de la vista
    const vista = document.getElementById(vistaId);
    if (!vista) return;

    // Ocultamos todas las secciones de la vista antes de mostrar la seleccionada
    vista.querySelectorAll('.spa-seccion').forEach(function(s) {
        s.classList.add('spa-seccion--oculta');
    });

    // Mostramos únicamente la sección que el usuario eligió
    const target = vista.querySelector('.spa-seccion[data-seccion="' + nombre + '"]');
    if (target) target.classList.remove('spa-seccion--oculta');

    // Actualizamos el link activo en el sidebar para reflejar la sección actual
    const sidebar = document.getElementById(sidebarId);
    if (sidebar) {
        // Desactivamos todos los links del sidebar primero
        sidebar.querySelectorAll('.sidebar__link[data-seccion]').forEach(function(l) {
            l.classList.remove('sidebar__link--activo');
        });
        // Activamos el link que corresponde a la sección actual
        const link = sidebar.querySelector('.sidebar__link[data-seccion="' + nombre + '"]');
        if (link) link.classList.add('sidebar__link--activo');
    }

    // Si la sección tiene una card que debe estar expandida, la abrimos
    const cuerpoId = mapaExpandir[nombre];
    if (cuerpoId) _expandirCard(cuerpoId);

    // Cerramos el sidebar solo si el usuario navegó desde un link del sidebar
    // Si venía de un modal, no cerramos el sidebar para no interrumpir la experiencia
    const anterior = rutaAnterior();
    const vieneDeMModal = anterior && anterior.startsWith('modal/');
    if (!vieneDeMModal) cerrarSidebar(sufijo);

    // Si el usuario navegó a la sección de crear tarea, limpiamos el formulario anterior
    if (nombre === 'crear-tarea') {
        // Limpiamos ambos formularios de crear tarea: el del admin y el del instructor
        ['createTaskForm', 'instrCreateTaskForm'].forEach(function(id) {
            const f = document.getElementById(id);
            if (f) {
                // Borramos todos los valores de los campos del formulario
                f.reset();
                // Quitamos los mensajes de error visibles del intento anterior
                f.querySelectorAll('.form__error').forEach(function(e) { e.textContent = ''; });
                // Quitamos el estilo rojo de los campos que tenían error
                f.querySelectorAll('.form__input, .form__textarea, .form__select').forEach(function(el) {
                    el.classList.remove('error');
                });
            }
        });
        // Desmarcamos todos los checkboxes del dropdown de usuarios seleccionados
        ['usuariosDropdownPanel', 'instrUsuariosDropdownPanel'].forEach(function(panelId) {
            const p = document.getElementById(panelId);
            if (!p) return;
            p.querySelectorAll('input[type="checkbox"]').forEach(function(cb) { cb.checked = false; });
        });
        // Restauramos el texto del botón del dropdown al placeholder original
        ['usuariosDropdownTexto', 'instrUsuariosDropdownTexto'].forEach(function(textoId) {
            const t = document.getElementById(textoId);
            if (t) t.textContent = 'Seleccionar usuarios...';
        });
    }
    // Si el usuario navegó a la sección de tareas, limpiamos los filtros activos
    if (nombre === 'tareas') {
        [
            ['adminFiltroEstado', 'adminFiltroUsuario'],
            ['instrFiltroEstado', 'instrFiltroUsuario'],
        ].forEach(function(pair) {
            const sel = document.getElementById(pair[0]);
            const inp = document.getElementById(pair[1]);
            // Reseteamos el select al primer elemento (sin filtro)
            if (sel) sel.selectedIndex = 0;
            // Borramos el texto del campo de búsqueda por usuario
            if (inp) inp.value = '';
        });
        // Recargamos la tabla de tareas según el panel activo en este momento
        if (vistaId === 'vistaAdmin') cargarTodasLasTareas();
        else if (vistaId === 'vistaInstructor') cargarTareasInstructor();
    }
}

// Muestra la sección indicada dentro del panel de usuario
function mostrarSeccionUsuario(nombre) {
    _mostrarSeccion('vistaUsuario', 'sidebarUsuario', 'Usuario', nombre, {
        'tareas': 'cuerpoTareasUsuario', // al ir a "tareas", expandir la card de tareas
    });
}

// Muestra la sección indicada dentro del panel de administrador
function mostrarSeccionAdmin(nombre) {
    _mostrarSeccion('vistaAdmin', 'sidebarAdmin', 'Admin', nombre, {
        'crear-tarea': 'cuerpoCrearTareas', // al ir a "crear-tarea", expandir esa card
        'usuarios':    'cuerpoUsuarios',    // al ir a "usuarios", expandir la card de usuarios
        'tareas':      'cuerpoTareas',      // al ir a "tareas", expandir la card de tareas
    });
}

// Muestra la sección indicada dentro del panel de instructor
function mostrarSeccionInstructor(nombre) {
    _mostrarSeccion('vistaInstructor', 'sidebarInstructor', 'Instructor', nombre, {
        'crear-tarea': 'instrCuerpoCrearTareas', // al ir a "crear-tarea", expandir esa card
        'estudiantes': 'instrCuerpoUsuarios',    // al ir a "estudiantes", expandir la card
        'tareas':      'instrCuerpoTareas',      // al ir a "tareas", expandir la card
    });
}

// Configura todos los eventos del sidebar: abrir con hamburguesa, cerrar con X y con overlay
// Parámetro sufijo: texto que identifica el panel (ej: "Admin", "Usuario", "Instructor")
// Parámetro manejadorNavegacion: función que recibe el nombre de la sección y navega a ella
function _configurarSidebar(sufijo, manejadorNavegacion) {
    // Buscamos los cuatro elementos del sidebar en el DOM
    const hamburguesa = document.getElementById('btnHamburguesa' + sufijo);
    const cerrar      = document.getElementById('sidebarCerrar'  + sufijo);
    const overlay     = document.getElementById('overlay'        + sufijo);
    const sidebar     = document.getElementById('sidebar'        + sufijo);

    // El botón de tres líneas (hamburguesa) abre el sidebar
    if (hamburguesa) hamburguesa.addEventListener('click', function() { abrirSidebar(sufijo); });
    // El botón X dentro del sidebar lo cierra
    if (cerrar)      cerrar.addEventListener('click',      function() { cerrarSidebar(sufijo); });
    // Hacer clic en el fondo oscuro también cierra el sidebar
    if (overlay)     overlay.addEventListener('click',     function() { cerrarSidebar(sufijo); });

    // Registramos el evento de clic en cada link del sidebar para navegar a su sección
    if (sidebar) {
        sidebar.querySelectorAll('.sidebar__link[data-seccion]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                // Prevenimos que el navegador recargue la página al hacer clic en el enlace
                e.preventDefault();
                // Llamamos al manejador con el nombre de la sección del atributo data-seccion
                manejadorNavegacion(link.dataset.seccion);
            });
        });
    }
}

// ── REFERENCIAS A VISTAS ──────────────────────────────────────────────────────

// Guardamos referencias a las cuatro pantallas principales del sistema
const pantallaInicio  = document.getElementById('pantallaInicio');  // formulario de login
const vistaUsuario    = document.getElementById('vistaUsuario');     // panel del estudiante
const vistaAdmin      = document.getElementById('vistaAdmin');       // panel del administrador
const vistaInstructor = document.getElementById('vistaInstructor');  // panel del instructor

// Oculta todas las vistas del sistema antes de mostrar la que corresponde al rol activo
function ocultarTodo() {
    // Ocultamos la pantalla de inicio (el formulario de login/registro)
    pantallaInicio.classList.add('hidden');
    // Ocultamos el panel del estudiante
    vistaUsuario.classList.add('hidden');
    // Ocultamos el panel del administrador
    vistaAdmin.classList.add('hidden');
    // Ocultamos el panel del instructor (importante para que no quede visible al cerrar sesión)
    if (vistaInstructor) vistaInstructor.classList.add('hidden');
}

// ── CONTRAER TODAS LAS CARDS ─────────────────────────────────────────────────
// Garantiza que todas las cards arranquen contraídas al activar cualquier vista,
// incluso en el segundo inicio de sesión cuando no se re-ejecuta registrarCardsContraibles.
function contraerTodasLasCards() {
    // Lista de pares [ID del encabezado, ID del cuerpo] de cada card del sistema
    const pares = [
        ['toggleUsuarios',          'cuerpoUsuarios'],        // card Usuarios del admin
        ['toggleTareas',            'cuerpoTareas'],          // card Tareas del admin
        ['toggleCrearTareas',       'cuerpoCrearTareas'],     // card Crear Tarea del admin
        ['instrToggleCrearTareas',  'instrCuerpoCrearTareas'],// card Crear Tarea del instructor
        ['instrToggleUsuarios',     'instrCuerpoUsuarios'],   // card Estudiantes del instructor
        ['instrToggleTareas',       'instrCuerpoTareas'],     // card Tareas del instructor
        ['toggleTareasUsuario',     'cuerpoTareasUsuario'],   // card Tareas del usuario
    ];
    // Recorremos cada par y ocultamos el cuerpo de la card
    pares.forEach(function(par) {
        const encabezado = document.getElementById(par[0]);
        const cuerpo     = document.getElementById(par[1]);
        // Si alguno de los dos no existe en el DOM, saltamos este par
        if (!encabezado || !cuerpo) return;
        // Ocultamos el contenido de la card agregando la clase 'oculto'
        cuerpo.classList.add('oculto');
        // Rotamos la flecha para que apunte hacia arriba (estado contraído)
        const botonFlecha = encabezado.querySelector('.btn-toggle-card');
        if (botonFlecha) botonFlecha.classList.add('contraido');
        // Quitamos el borde inferior del encabezado cuando la card está contraída
        encabezado.classList.add('sin-borde');
    });
}

// Activa la pantalla de inicio de sesión: oculta todos los paneles y muestra el login
export function activarModoInicio() {
    // Ocultamos todas las vistas (usuario, admin, instructor)
    ocultarTodo();
    // Mostramos la pantalla de inicio quitando la clase 'hidden'
    pantallaInicio.classList.remove('hidden');
    // Marcamos el modo actual en el body para que los estilos CSS del rol se apliquen
    document.body.dataset.modo = 'inicio';
    // Limpiamos los campos del formulario para que no queden datos del usuario anterior
    limpiarFormularioLogin();
    // Limpiamos el hash de la URL para que no quede una ruta del panel anterior
    limpiarHashActual();
}

// ── ACTIVAR MODO USUARIO ──────────────────────────────────────────────────────
// Al entrar al panel de usuario se leen los datos del token JWT guardado en localStorage
// y se cargan automáticamente sus tareas, calendario y post-its.
// El usuario solo ve sus propias tareas — no puede buscar las de otra persona.

// Carga y muestra las notas personales (post-its) del usuario desde el servidor.
// Parámetro userId: el identificador numérico del usuario logueado
async function cargarPostits(userId) {
    const seccion = document.getElementById('postitsSeccion');
    if (!seccion) return;

    const MAXIMO_POSTITS = 12;

    // Cargar notas desde el servidor
    let notas = await obtenerNotas();

    // Función interna que reconstruye visualmente todos los post-its desde el arreglo 'notas'.
    // Se llama al cargar el panel, al agregar una nota y al eliminar una nota.
    function renderizarPostits() {
        // Vaciamos la sección antes de volver a pintarla (anti-duplicación)
        while (seccion.firstChild) seccion.removeChild(seccion.firstChild);

        // ── Cabecera: título + contador de notas ──────────────────────────────
        const header = document.createElement('div');
        header.className = 'postits__header'; // flex row con título y contador separados
        const titulo = document.createElement('h3');
        titulo.className   = 'postits__titulo';
        titulo.textContent = 'Mis notas personales';
        header.appendChild(titulo);
        const contador = document.createElement('span');
        contador.className   = 'postits__contador'; // muestra "X / 12" para que el usuario sepa cuántas le quedan
        contador.textContent = notas.length + ' / ' + MAXIMO_POSTITS;
        header.appendChild(contador);
        seccion.appendChild(header); // pegamos el encabezado al inicio de la sección

        // ── Grid de post-its: un card por cada nota guardada ──────────────────
        const grid = document.createElement('div');
        grid.className = 'postits__grid'; // CSS grid de 3-4 columnas responsivas

        notas.forEach(function(nota) {
            // Tarjeta de la nota — fondo de color pastel definido al crear la nota
            const card = document.createElement('div');
            card.className = 'postit__card'; // estilo de post-it con sombra y esquinas redondeadas
            card.style.backgroundColor = nota.color; // color guardado en la base de datos (ej: '#fef3c7')

            // Botón X en la esquina para eliminar la nota
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'postit__btn-eliminar'; // posición absoluta en la esquina superior derecha
            btnEliminar.title     = 'Eliminar nota';
            btnEliminar.type      = 'button'; // evita que active un submit si está dentro de un form
            const iconoX = document.createElement('i');
            iconoX.setAttribute('data-lucide', 'x'); // ícono X de Lucide
            iconoX.classList.add('icono-accion');
            btnEliminar.appendChild(iconoX); // pegamos el ícono dentro del botón
            btnEliminar.addEventListener('click', async function() {
                // Llamamos al API para eliminar la nota del servidor (DELETE /api/notes/:id)
                const ok = await eliminarNotaApi(nota.id);
                if (ok) {
                    // Si el servidor confirmó la eliminación, la sacamos del arreglo local
                    notas = notas.filter(function(n) { return n.id !== nota.id; });
                    // Re-renderizamos para que desaparezca visualmente sin recargar la página
                    renderizarPostits();
                }
            });
            card.appendChild(btnEliminar); // pegamos el botón X en la tarjeta

            // Texto de la nota
            const texto = document.createElement('p');
            texto.className   = 'postit__texto'; // fuente y padding del texto del post-it
            texto.textContent = nota.texto; // contenido de texto guardado en la base de datos
            card.appendChild(texto); // pegamos el texto en la tarjeta

            grid.appendChild(card); // añadimos la tarjeta al grid
        });

        seccion.appendChild(grid); // pegamos el grid completo en la sección

        // ── Botón "Nueva nota" — siempre al final del grid ────────────────────
        const btnAgregar = document.createElement('button');
        btnAgregar.className = 'postit__btn-agregar'; // botón con ícono + y texto
        btnAgregar.title     = 'Agregar nota';
        btnAgregar.type      = 'button';
        const iconoPlus = document.createElement('i');
        iconoPlus.setAttribute('data-lucide', 'plus'); // ícono + de Lucide
        iconoPlus.classList.add('icono-accion');
        btnAgregar.appendChild(iconoPlus); // ícono dentro del botón
        btnAgregar.appendChild(document.createTextNode(' Nueva nota')); // texto al lado del ícono
        btnAgregar.addEventListener('click', function() {
            if (notas.length >= MAXIMO_POSTITS) {
                // Si ya hay 12 notas, mostramos advertencia en lugar de abrir el formulario
                mostrarNotificacion('Máximo de notas alcanzado (12)', 'advertencia');
                return;
            }
            mostrarFormularioPostit(); // abrimos el formulario inline para crear una nota nueva
        });
        seccion.appendChild(btnAgregar); // pegamos el botón al final de la sección

        // Convertimos los <i data-lucide="x"> y <i data-lucide="plus"> en SVG reales
        if (window.lucide) window.lucide.createIcons();
    }

    // Función interna que muestra el formulario inline para crear una nota nueva.
    // Solo puede haber un formulario abierto a la vez — si ya existe, no hacemos nada.
    function mostrarFormularioPostit() {
        // Si ya hay un formulario visible en la sección, no abrimos uno segundo
        if (seccion.querySelector('.postit__formulario')) return;

        // Contenedor principal del formulario
        const formulario = document.createElement('div');
        formulario.className = 'postit__formulario'; // flex row con área izquierda y botón guardar

        // Textarea donde el usuario escribe el texto de la nota
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Escribe tu nota aquí...';
        textarea.className   = 'postit__textarea';
        textarea.rows        = 3; // altura inicial de 3 líneas — el usuario puede escribir más

        // Paleta de 4 colores pastel para elegir el color de fondo de la nota
        const coloresPastel = ['#fef3c7', '#fce7f3', '#d1fae5', '#dbeafe']; // amarillo, rosado, verde, azul
        let colorSeleccionado = coloresPastel[0]; // por defecto se selecciona el amarillo

        // Contenedor de los 4 botones circulares de color
        const selectoresColor = document.createElement('div');
        selectoresColor.className = 'postit__selectores-color'; // flex row de círculos de color
        coloresPastel.forEach(function(color) {
            const selector = document.createElement('button');
            selector.type  = 'button'; // evita submit accidental
            selector.className = 'postit__selector-color'; // botón circular con el color de fondo
            selector.style.backgroundColor = color; // el propio color como fondo del círculo
            // El primer color arranca con la clase --activo que le da el borde de selección
            if (color === colorSeleccionado) selector.classList.add('postit__selector-color--activo');
            selector.addEventListener('click', function() {
                // Desactivamos el borde de todos los selectores antes de activar el nuevo
                selectoresColor.querySelectorAll('.postit__selector-color').forEach(function(s) {
                    s.classList.remove('postit__selector-color--activo');
                });
                selector.classList.add('postit__selector-color--activo'); // marcamos el seleccionado
                colorSeleccionado = color; // guardamos el color elegido para usarlo al guardar
            });
            selectoresColor.appendChild(selector); // pegamos el círculo en el contenedor
        });

        // Botón "Guardar nota" que envía la nota al servidor
        const btnGuardar = document.createElement('button');
        btnGuardar.type      = 'button';
        btnGuardar.className = 'postit__btn-guardar'; // botón con color del rol (morado)
        btnGuardar.textContent = 'Guardar nota';
        btnGuardar.addEventListener('click', async function() {
            const textoVal = textarea.value.trim(); // quitamos espacios en blanco del inicio y final
            // Si el textarea está vacío, pintamos el borde rojo y no guardamos
            if (!textoVal) { textarea.style.borderColor = '#ef4444'; return; }

            // Desactivamos el botón para evitar doble envío mientras espera la respuesta
            btnGuardar.disabled    = true;
            btnGuardar.textContent = 'Guardando...'; // feedback visual de que se está procesando

            // Llamamos al API para guardar la nota (POST /api/notes)
            const nuevaNota = await crearNotaApi(textoVal, colorSeleccionado);
            if (nuevaNota) {
                // Añadimos la nota al arreglo local y volvemos a renderizar el panel completo
                notas.push(nuevaNota);
                renderizarPostits(); // re-renderizamos — esto también cierra el formulario
            } else {
                // Si el servidor falló, rehabilitamos el botón y marcamos el textarea en rojo
                btnGuardar.disabled    = false;
                btnGuardar.textContent = 'Guardar nota';
                textarea.style.borderColor = '#ef4444'; // indicamos que algo salió mal
            }
        });

        // Columna izquierda del formulario: textarea + selectores de color apilados
        const formularioLeft = document.createElement('div');
        formularioLeft.className = 'postit__formulario-left'; // flex column
        formularioLeft.appendChild(textarea);       // textarea arriba
        formularioLeft.appendChild(selectoresColor); // colores debajo del textarea
        formulario.appendChild(formularioLeft); // columna izquierda dentro del formulario
        formulario.appendChild(btnGuardar);     // botón guardar a la derecha
        seccion.appendChild(formulario);        // formulario al final de la sección de post-its
    }

    renderizarPostits();
}

// Activa el panel de usuario: muestra las tareas del estudiante logueado, su calendario y sus notas
export async function activarModoUsuario() {
    // Ocultamos todas las pantallas antes de mostrar la del usuario
    ocultarTodo();
    // Contraemos todas las cards para que el panel empiece ordenado
    contraerTodasLasCards();
    // Mostramos el panel de usuario quitando la clase 'hidden'
    vistaUsuario.classList.remove('hidden');
    // Marcamos el modo actual para que los estilos de color morado del usuario se apliquen
    document.body.dataset.modo = 'usuario';

    // Leer los datos del usuario desde el token guardado en localStorage
    // obtenerUsuarioSesion() viene de src/utils/sesion.js y parsea el JSON del localStorage
    const usuarioSesion = obtenerUsuarioSesion();

    // Mostrar saludo personalizado en el header
    const vistaU      = document.getElementById('vistaUsuario');
    const headerTitle = vistaU ? vistaU.querySelector('.header__title') : null;
    const headerSub   = vistaU ? vistaU.querySelector('.header__subtitle') : null;
    const rolesLeibles = { user: 'ESTUDIANTE', instructor: 'DOCENTE', admin: 'ADMINISTRADOR' };
    if (headerTitle) headerTitle.textContent = usuarioSesion.name;
    if (headerSub)   headerSub.textContent   = rolesLeibles[usuarioSesion.role] || usuarioSesion.role;

    // Si no hay sesión activa (el token expiró o fue borrado) redirigir al login
    if (!usuarioSesion) {
        activarModoInicio();
        return;
    }

    // Mostrar los datos del usuario en la sección de datos
    // Estos datos vienen del payload del token, no de una petición al servidor
    const seccionDatos = document.getElementById('userDataSection');
    if (seccionDatos) seccionDatos.classList.remove('hidden');

    const spanId     = document.getElementById('userId');
    const spanNombre = document.getElementById('userName');
    const spanEmail  = document.getElementById('userEmail');

    // usuarioSesion.documento es el número de cédula guardado en el token JWT
    if (spanId)     spanId.textContent     = usuarioSesion.documento || usuarioSesion.id;
    if (spanNombre) spanNombre.textContent = usuarioSesion.name;
    // El email viene de obtenerUsuarioSesion pero el campo depende de qué guardó guardarSesion
    // Si el email no está en el token, se muestra el documento
    if (spanEmail)  spanEmail.textContent  = usuarioSesion.email || '—';

    // Cargar automáticamente las tareas del usuario usando su id del token
    // obtenerTareasDeUsuario hace GET /api/tasks/filter?userId={id}
    const tareas = await obtenerTareasDeUsuario(usuarioSesion.id);

    // Calcular y mostrar promedio de calificación en la card de datos
    if (tareas && tareas.length > 0) {
        const notasValidas = tareas
            .filter(function(t) { return t.grade !== null && t.grade !== undefined; })
            .map(function(t) { return parseFloat(t.grade); })
            .filter(function(n) { return !isNaN(n) && n >= 0 && n <= 100; });

        const userInfoEl = document.getElementById('userDataSection');
        // Remover promedio previo si existe
        const prevPromedio = userInfoEl ? userInfoEl.querySelector('.user-info__promedio-wrap') : null;
        if (prevPromedio) prevPromedio.remove();

        if (notasValidas.length > 0 && userInfoEl) {
            const promedio = (notasValidas.reduce(function(a, b) { return a + b; }, 0) / notasValidas.length).toFixed(1);
            // Determinar color según rendimiento
            const pNum  = parseFloat(promedio);
            const bg    = pNum >= 86 ? '#dbeafe' : pNum >= 70 ? '#d1fae5' : '#fee2e2';
            const color = pNum >= 86 ? '#1e3a8a' : pNum >= 70 ? '#065f46' : '#991b1b';
            const label = pNum >= 86 ? 'Rendimiento Superior' : pNum >= 70 ? 'Rendimiento Alto' : 'Rendimiento Bajo';

            const wrap = document.createElement('div');
            wrap.className = 'user-info__item user-info__promedio-wrap';

            const lbl = document.createElement('span');
            lbl.className   = 'user-info__label';
            lbl.textContent = 'Promedio';

            const val = document.createElement('div');
            val.className = 'user-info__promedio';

            const badge = document.createElement('span');
            badge.className = 'status-badge';
            badge.style.cssText = `background:${bg};color:${color};font-weight:700;font-size:0.9rem;`;
            badge.textContent = promedio + ' / 100';

            const badgeLabel = document.createElement('span');
            badgeLabel.style.cssText = `font-size:0.72rem;color:${color};font-weight:600;`;
            badgeLabel.textContent = label;

            val.appendChild(badge);
            val.appendChild(badgeLabel);
            wrap.appendChild(lbl);
            wrap.appendChild(val);

            const userInfoDiv = userInfoEl.querySelector('.user-info');
            if (userInfoDiv) userInfoDiv.appendChild(wrap);
        }
    }

    // Mostrar la sección de tareas
    const seccionTareas = document.getElementById('tasksSection');
    if (seccionTareas) seccionTareas.classList.remove('hidden');

    // Actualizar el contador de tareas
    const contadorEl = document.getElementById('tasksCount');
    if (contadorEl) {
        const cantidad = tareas ? tareas.length : 0;
        contadorEl.textContent = `${cantidad} ${cantidad === 1 ? 'tarea' : 'tareas'}`;
    }

    // Pintar las tareas en la tabla
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

        if (!tareas || tareas.length === 0) {
        // Mostrar estado vacío solo en la tabla — el calendario y las notas siguen activos
        const estadoVacio = document.getElementById('tasksEmptyState');
        if (estadoVacio) estadoVacio.classList.remove('hidden');
    } else {
        // Ocultar el estado vacío y pintar cada tarea
        const estadoVacio = document.getElementById('tasksEmptyState');
        if (estadoVacio) estadoVacio.classList.add('hidden');

        tareas.forEach(function(tarea, indice) {
            // agregarTareaATabla viene de tareasUI.js y construye la fila con createElement
            agregarTareaATabla(tarea, indice);
        });
    }

    // Cargar el dashboard de estadísticas del panel usuario.
    // Se llama siempre — cargarDashboardUsuario maneja el caso de arreglo vacío
    cargarDashboardUsuario(tareas || []);

    // Montar el calendario del usuario SIEMPRE — se muestra aunque no haya tareas.
    // crearCalendario acepta tareas=[] y renderiza el calendario completo sin puntos.
    await crearCalendario({
        contenedorId: 'usuarioCalendario',
        paleta:       'usuario',
        soloLectura:  false,
        tareas:       tareas || [],
        userId:       usuarioSesion.id,   // para restringir borrado a eventos propios
    });

    // Cargar los post-its personales SIEMPRE — no dependen de las tareas asignadas
    cargarPostits(usuarioSesion.id);

    // ── SPA: hero + router + sidebar ─────────────────────────────────────────
    const heroNombre = document.getElementById('heroNombreUsuario');
    if (heroNombre) heroNombre.textContent = usuarioSesion.name;

    registrarRutas({
        [RUTAS.USUARIO.INICIO]: function() { mostrarSeccionUsuario('inicio'); },
        [RUTAS.USUARIO.TAREAS]: function() { mostrarSeccionUsuario('tareas'); },
        [RUTAS.USUARIO.NOTAS]:  function() { mostrarSeccionUsuario('notas');  },
    });

    _configurarSidebar('Usuario', function(seccion) {
        const ruta = SECCIONES_USUARIO[seccion];
        if (ruta) ir(ruta);
    });

    iniciarRouter();
    ir(RUTAS.USUARIO.INICIO);
    if (window.lucide) window.lucide.createIcons();
}

// Construye y muestra las tarjetas del diccionario de roles en el panel de administrador.
// Cada tarjeta muestra el nombre, descripción y un botón para ver los permisos del rol.
function renderizarDiccionarioRoles(contenedorEl) {
    // Limpiamos el contenedor eliminando cualquier tarjeta que hubiera de antes
    while (contenedorEl.firstChild) contenedorEl.removeChild(contenedorEl.firstChild);
    // Iteramos sobre las claves del objeto METADATOS_ROL: 'admin', 'instructor', 'user'
    Object.keys(METADATOS_ROL).forEach(function(rol) {
        const meta = METADATOS_ROL[rol]; // obtenemos los metadatos del rol actual: nombre, icono, color, descripción

        // Creamos la tarjeta principal que envuelve todo el contenido del rol
        const card = document.createElement('div');
        card.className = 'rol-card'; // clase CSS que le da el estilo de tarjeta con borde y sombra

        // Creamos el encabezado de la tarjeta que contiene el ícono y el nombre del rol
        const headerCard = document.createElement('div');
        headerCard.className = 'rol-card__header'; // flex row con gap entre ícono y texto

        // Creamos el elemento <i> que Lucide convertirá en un SVG con el ícono del rol
        const icono = document.createElement('i');
        icono.setAttribute('data-lucide', meta.icono); // el nombre del ícono (ej: 'shield', 'graduation-cap', 'user')
        icono.classList.add('icono-accion'); // clase CSS que define el tamaño del ícono
        icono.style.color = meta.color; // coloreamos el ícono con el color del rol (azul/verde/morado)
        headerCard.appendChild(icono); // pegamos el ícono en el encabezado

        // Creamos el texto con el nombre del rol (ej: 'Administrador')
        const nombre = document.createElement('span');
        nombre.className   = 'rol-card__nombre'; // clase CSS que le da el peso y tamaño al nombre
        nombre.textContent = meta.nombre; // texto del nombre del rol
        headerCard.appendChild(nombre); // pegamos el nombre junto al ícono
        card.appendChild(headerCard); // pegamos el encabezado completo en la tarjeta

        // Creamos el párrafo con la descripción de los permisos del rol
        const desc = document.createElement('p');
        desc.className   = 'rol-card__descripcion'; // clase CSS que le da el estilo de texto pequeño y gris
        desc.textContent = meta.descripcion; // texto descriptivo (ej: 'Acceso total: usuarios, tareas y sistema')
        card.appendChild(desc); // pegamos la descripción en la tarjeta

        // Creamos el botón "Ver permisos" que abre el modal con la lista de permisos del rol
        const btn = document.createElement('button');
        btn.className = 'rol-card__btn-permisos'; // clase CSS del botón (borde de color, texto de color)
        btn.type      = 'button'; // evitamos que el botón envíe un formulario si está dentro de un form
        btn.style.borderColor = meta.color; // el borde del botón usa el color del rol
        btn.style.color       = meta.color; // el texto del botón también usa el color del rol

        // Creamos el ícono de lista dentro del botón
        const btnIcono = document.createElement('i');
        btnIcono.setAttribute('data-lucide', 'list'); // ícono de lista de Lucide
        btnIcono.classList.add('icono-accion'); // tamaño estándar del ícono
        btn.appendChild(btnIcono); // pegamos el ícono dentro del botón
        btn.appendChild(document.createTextNode(' Ver permisos')); // agregamos el texto del botón

        // Al pasar el mouse encima, el botón se rellena con el color del rol (efecto hover)
        btn.addEventListener('mouseenter', function() {
            btn.style.background = meta.color; // fondo del color del rol
            btn.style.color      = '#ffffff';   // texto blanco para contrastar con el fondo
        });
        // Al sacar el mouse, restauramos el estilo original del botón
        btn.addEventListener('mouseleave', function() {
            btn.style.background  = ''; // eliminamos el fondo — regresa al CSS original
            btn.style.color       = meta.color; // restauramos el color del texto
        });
        // Al hacer clic, abrimos el modal con todos los permisos del rol seleccionado
        btn.addEventListener('click', function() { abrirModalPermisos(rol, meta); });

        card.appendChild(btn); // pegamos el botón al final de la tarjeta
        contenedorEl.appendChild(card); // agregamos la tarjeta completa al contenedor del DOM
    });
    // Después de insertar todos los <i data-lucide>, le decimos a Lucide que los convierta en SVG
    if (window.lucide) window.lucide.createIcons();
}

// Abre un modal que muestra todos los permisos del rol indicado, agrupados por categoría.
// Parámetro rol: el nombre interno del rol (ej: "admin", "instructor", "user")
// Parámetro meta: el objeto de metadatos del rol con nombre, color, ícono y descripción
function abrirModalPermisos(rol, meta) {
    // Función interna que cierra el modal eliminándolo del DOM si todavía está visible
    const cerrar = () => { if (document.body.contains(overlay)) document.body.removeChild(overlay); };

    // ── Overlay — fondo semitransparente que cubre la pantalla detrás del modal ──
    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay'; // clase CSS del fondo oscuro
    overlay.style.cssText = 'display:flex;align-items:center;justify-content:center;'; // centra el panel en la pantalla
    // Si el usuario hace clic en el fondo oscuro (fuera del panel), cerramos el modal
    overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrar(); });

    // ── Panel — contenedor principal del modal ────────────────────────────────
    const panel = document.createElement('div');
    panel.style.cssText = `
        background:#fff;                            /* fondo blanco del panel */
        border-radius:1.25rem;                      /* esquinas redondeadas */
        box-shadow:0 20px 60px rgba(0,0,0,0.18);   /* sombra profunda para que "flote" */
        width:min(520px,92vw);                      /* 520px en desktop, 92% del ancho en móvil */
        max-height:85vh;                            /* máximo 85% de la altura de la pantalla */
        overflow:hidden;                            /* oculta el scroll extra — el cuerpo interno lo maneja */
        display:flex;
        flex-direction:column;                      /* apilamos header, body y pie verticalmente */
        font-family:inherit;                        /* hereda la fuente del resto del proyecto */
    `;

    // ── Header del modal — banda de color con ícono, nombre y botón de cerrar ──
    const header = document.createElement('div');
    header.style.cssText = `
        background:${meta.color};           /* fondo del color del rol (azul/verde/morado) */
        padding:1.5rem 1.75rem 1.25rem;
        display:flex;
        align-items:flex-start;
        justify-content:space-between;      /* título a la izquierda, botón X a la derecha */
        gap:1rem;
    `;

    // Contenedor izquierdo del header: ícono circular + texto del rol
    const headerLeft = document.createElement('div');
    headerLeft.style.cssText = 'display:flex;align-items:center;gap:0.875rem;';

    // Círculo blanco semitransparente que envuelve el ícono del rol
    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = `
        width:48px;height:48px;
        background:rgba(255,255,255,0.25); /* blanco al 25% de opacidad sobre el color del rol */
        border-radius:50%;                 /* forma circular */
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;                     /* evita que el círculo se encoja en pantallas pequeñas */
    `;
    const icono = document.createElement('i'); // elemento que Lucide convertirá en SVG
    icono.setAttribute('data-lucide', meta.icono); // nombre del ícono según el rol
    icono.style.cssText = 'width:22px;height:22px;color:#fff;'; // ícono blanco
    iconWrap.appendChild(icono); // pegamos el ícono dentro del círculo
    headerLeft.appendChild(iconWrap); // pegamos el círculo a la izquierda del header

    // Texto del header: título (nombre del rol) y subtítulo (descripción)
    const headerTexto = document.createElement('div');
    const titulo = document.createElement('h2');
    titulo.textContent = meta.nombre; // nombre del rol (ej: 'Administrador')
    titulo.style.cssText = 'color:#fff;font-size:1.2rem;font-weight:700;margin:0 0 0.2rem;';
    const subtitulo = document.createElement('p');
    subtitulo.textContent = meta.descripcion; // descripción corta del rol
    subtitulo.style.cssText = 'color:rgba(255,255,255,0.82);font-size:0.82rem;margin:0;'; // blanco semitransparente
    headerTexto.appendChild(titulo);    // apilamos título encima
    headerTexto.appendChild(subtitulo); // y descripción debajo
    headerLeft.appendChild(headerTexto);
    header.appendChild(headerLeft); // pegamos el lado izquierdo en el header

    // Botón X para cerrar el modal — círculo blanco en la esquina superior derecha
    const btnCerrar = document.createElement('button');
    btnCerrar.type = 'button'; // evitamos que envíe formularios
    btnCerrar.style.cssText = `
        width:32px;height:32px;
        background:rgba(255,255,255,0.2); /* blanco semitransparente */
        border:none;border-radius:50%;    /* forma circular */
        cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;
        transition:background 150ms;      /* transición suave al pasar el mouse */
    `;
    // Efecto hover: el botón se aclara al pasar el mouse encima
    btnCerrar.addEventListener('mouseenter', () => { btnCerrar.style.background='rgba(255,255,255,0.35)'; });
    btnCerrar.addEventListener('mouseleave', () => { btnCerrar.style.background='rgba(255,255,255,0.2)'; });
    const icoX = document.createElement('i'); // ícono X de Lucide
    icoX.setAttribute('data-lucide', 'x');
    icoX.style.cssText = 'width:16px;height:16px;color:#fff;'; // ícono blanco pequeño
    btnCerrar.appendChild(icoX); // pegamos el ícono X dentro del botón circular
    btnCerrar.addEventListener('click', cerrar); // al hacer clic, cerramos el modal
    header.appendChild(btnCerrar); // pegamos el botón X a la derecha del header
    panel.appendChild(header); // pegamos el header completo en la parte superior del panel

    // ── Badge contador — barra gris con el número de permisos del rol ────────
    const permisos = PERMISOS_POR_ROL[rol] || []; // obtenemos el arreglo de permisos del rol
    const badgeBar = document.createElement('div'); // barra horizontal debajo del header
    badgeBar.style.cssText = `
        padding:0.75rem 1.75rem;
        background:#f8fafc;              /* fondo gris muy claro */
        border-bottom:1px solid #e2e8f0; /* línea divisora entre la barra y el cuerpo */
        display:flex;align-items:center;gap:0.5rem;
    `;
    // Badge con el conteo de permisos (ej: '6 permisos activos')
    const badgeCount = document.createElement('span');
    badgeCount.textContent = `${permisos.length} permisos activos`; // calculamos la cantidad con .length
    badgeCount.style.cssText = `
        background:${meta.color}; /* fondo del color del rol */
        color:#fff;
        font-size:0.72rem;
        font-weight:700;
        letter-spacing:0.03em;
        padding:0.25rem 0.65rem;
        border-radius:9999px;      /* forma de píldora — radio muy grande */
    `;
    // Texto secundario con el nombre del rol (ej: 'Rol: Administrador')
    const badgeRol = document.createElement('span');
    badgeRol.textContent = `Rol: ${meta.nombre}`; // usamos template literal para insertar el nombre
    badgeRol.style.cssText = 'font-size:0.78rem;color:#64748b;font-weight:500;'; // gris medio
    badgeBar.appendChild(badgeCount); // primero el badge de color
    badgeBar.appendChild(badgeRol);   // luego el texto gris del rol
    panel.appendChild(badgeBar);      // pegamos la barra en el panel

    // ── Cuerpo del modal — lista de permisos agrupados por categoría ─────────
    const cuerpo = document.createElement('div');
    cuerpo.style.cssText = 'padding:1.25rem 1.75rem 1.5rem;overflow-y:auto;flex:1;';
    // overflow-y:auto permite hacer scroll solo dentro del cuerpo si los permisos son muchos
    // flex:1 hace que el cuerpo ocupe todo el espacio disponible entre el header y el pie

    // Agrupamos los permisos por su prefijo — 'tasks.create' → grupo 'tasks'
    const grupos = {};
    permisos.forEach(function(p) {
        const prefijo = p.split('.')[0]; // dividimos el permiso por '.' y tomamos la primera parte
        if (!grupos[prefijo]) grupos[prefijo] = []; // creamos el grupo si no existe
        grupos[prefijo].push(p); // añadimos el permiso al grupo correspondiente
    });

    // Mapa de etiquetas visuales para cada grupo de permisos
    const etiquetasGrupo = {
        tasks:    { label: 'Tareas',      icon: 'clipboard-list', color: '#0ea5e9' }, // azul celeste
        users:    { label: 'Usuarios',    icon: 'users',          color: '#8b5cf6' }, // morado
        calendar: { label: 'Calendario',  icon: 'calendar',       color: '#f59e0b' }, // amarillo
        notes:    { label: 'Notas',       icon: 'file-text',      color: '#10b981' }, // verde
        roles:    { label: 'Roles',       icon: 'shield',         color: '#6366f1' }, // índigo
    };

    // Iteramos sobre cada grupo (tasks, users, calendar, etc.)
    Object.keys(grupos).forEach(function(grupo) {
        // Si el grupo no está en el mapa, usamos valores genéricos con candado gris
        const meta_g = etiquetasGrupo[grupo] || { label: grupo, icon: 'lock', color: '#64748b' };

        // Encabezado de cada grupo: ícono de color + nombre del grupo en mayúsculas
        const grupoHeader = document.createElement('div');
        grupoHeader.style.cssText = `
            display:flex;align-items:center;gap:0.5rem;
            margin:0.75rem 0 0.5rem;
            padding-bottom:0.4rem;
            border-bottom:1.5px solid #f1f5f9; /* línea divisora debajo del nombre del grupo */
        `;
        const icoGrupo = document.createElement('i'); // ícono del grupo
        icoGrupo.setAttribute('data-lucide', meta_g.icon); // nombre del ícono del grupo
        icoGrupo.style.cssText = `width:15px;height:15px;color:${meta_g.color};`; // pequeño y del color del grupo
        const labelGrupo = document.createElement('span');
        labelGrupo.textContent = meta_g.label; // nombre legible del grupo (ej: 'Tareas')
        labelGrupo.style.cssText = `font-size:0.75rem;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.06em;`;
        grupoHeader.appendChild(icoGrupo);  // ícono del grupo
        grupoHeader.appendChild(labelGrupo); // nombre del grupo
        cuerpo.appendChild(grupoHeader); // agregamos el encabezado al cuerpo

        // Contenedor de los ítems de permisos del grupo actual
        const grid = document.createElement('div');
        grid.style.cssText = 'display:flex;flex-direction:column;gap:0.35rem;margin-bottom:0.5rem;';

        // Iteramos sobre cada permiso dentro del grupo (ej: 'tasks.create', 'tasks.delete.all')
        grupos[grupo].forEach(function(permiso) {
            const item = document.createElement('div'); // fila del permiso
            item.style.cssText = `
                display:flex;align-items:center;gap:0.6rem;
                padding:0.45rem 0.75rem;
                border-radius:0.5rem;
                background:#f8fafc;        /* fondo gris muy claro */
                border:1px solid #e2e8f0;  /* borde sutil */
                transition:background 150ms;
            `;
            // Efecto hover: el ítem se ilumina con el color del grupo al pasar el mouse
            item.addEventListener('mouseenter', () => { item.style.background='#f0f9ff'; item.style.borderColor=meta_g.color; });
            item.addEventListener('mouseleave', () => { item.style.background='#f8fafc'; item.style.borderColor='#e2e8f0'; });

            // Círculo con check verde — indica que el permiso está activo para este rol
            const checkWrap = document.createElement('div');
            checkWrap.style.cssText = `
                width:20px;height:20px;
                background:${meta_g.color}18; /* color del grupo al 9% de opacidad (sufijo '18' en hex) */
                border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                flex-shrink:0;
            `;
            const icoCheck = document.createElement('i'); // ícono de check de Lucide
            icoCheck.setAttribute('data-lucide', 'check');
            icoCheck.style.cssText = `width:11px;height:11px;color:${meta_g.color};font-weight:700;`;
            checkWrap.appendChild(icoCheck); // pegamos el check dentro del círculo
            item.appendChild(checkWrap); // pegamos el círculo en la fila

            // Texto del permiso en formato monoespaciado (ej: tasks.create)
            const texto = document.createElement('code'); // <code> usa fuente monoespaciada
            texto.textContent = permiso; // texto del permiso (ej: 'tasks.create')
            texto.style.cssText = 'font-size:0.82rem;color:#1e293b;font-family:ui-monospace,monospace;flex:1;';
            item.appendChild(texto); // pegamos el texto en la fila

            grid.appendChild(item); // agregamos la fila al grid del grupo
        });
        cuerpo.appendChild(grid); // pegamos el grid completo del grupo en el cuerpo
    });

    panel.appendChild(cuerpo); // pegamos el cuerpo completo en el panel

    // ── Pie del modal — barra con botón Cerrar ───────────────────────────────
    const pie = document.createElement('div');
    pie.style.cssText = `
        padding:0.875rem 1.75rem;
        background:#f8fafc;              /* mismo gris que la barra de badge */
        border-top:1px solid #e2e8f0;    /* línea divisora sobre el pie */
        display:flex;justify-content:flex-end; /* botón alineado a la derecha */
    `;
    const btnOk = document.createElement('button');
    btnOk.type = 'button'; // evitamos que envíe formularios
    btnOk.textContent = 'Cerrar'; // texto del botón
    btnOk.style.cssText = `
        background:${meta.color}; /* fondo del color del rol */
        color:#fff;               /* texto blanco */
        border:none;
        border-radius:0.6rem;
        padding:0.5rem 1.5rem;
        font-size:0.875rem;
        font-weight:600;
        cursor:pointer;
        transition:opacity 150ms; /* transición suave al pasar el mouse */
    `;
    // Efecto hover: el botón se aclara ligeramente
    btnOk.addEventListener('mouseenter', () => { btnOk.style.opacity='0.85'; });
    btnOk.addEventListener('mouseleave', () => { btnOk.style.opacity='1'; });
    btnOk.addEventListener('click', cerrar); // al hacer clic, cerramos el modal
    pie.appendChild(btnOk);   // pegamos el botón en el pie
    panel.appendChild(pie);   // pegamos el pie en la parte inferior del panel

    overlay.appendChild(panel);      // pegamos el panel dentro del overlay oscuro
    document.body.appendChild(overlay); // insertamos todo el modal en el body de la página
    // Activamos los íconos de Lucide que acabamos de insertar con data-lucide
    if (window.lucide) window.lucide.createIcons();
}

// Activa el panel de administrador: muestra usuarios, tareas, dashboard y auditoría
export async function activarModoAdmin() {
    // Ocultamos todas las pantallas antes de mostrar la del administrador
    ocultarTodo();
    // Contraemos todas las cards para que el panel empiece ordenado
    contraerTodasLasCards();
    // Mostramos el panel de admin quitando la clase 'hidden'
    vistaAdmin.classList.remove('hidden');
    // Marcamos el modo actual para que los estilos de color azul del admin se apliquen
    document.body.dataset.modo = 'admin';

    cargarDashboard();           // llena las 6 tarjetas de contadores (total, pendientes, en progreso...)
    cargarTablaUsuarios();       // llena la tabla de usuarios con todos los registros del sistema
    cargarTodasLasTareas();      // llena la tabla de tareas con todas las tareas del sistema
    await inicializarDropdownUsuarios(); // espera porque necesita la lista de usuarios para el dropdown

    const contenedorAuditoria = document.getElementById('auditoriaContenedor');
    // renderizarAuditoria lee el log guardado en localStorage y lo muestra como lista cronológica
    if (contenedorAuditoria) renderizarAuditoria(contenedorAuditoria);

    const contenedorRoles = document.getElementById('rolesContenedor');
    // renderizarDiccionarioRoles construye las 3 tarjetas de roles (Admin, Instructor, Estudiante)
    if (contenedorRoles) renderizarDiccionarioRoles(contenedorRoles);

    // ── SPA: hero + router + sidebar ─────────────────────────────────────────
    const usuarioSesion = obtenerUsuarioSesion();
    const heroNombre = document.getElementById('heroNombreAdmin');
    if (heroNombre && usuarioSesion) heroNombre.textContent = usuarioSesion.name;

    registrarRutas({
        [RUTAS.ADMIN.INICIO]:      function() { mostrarSeccionAdmin('inicio');      },
        [RUTAS.ADMIN.CREAR_TAREA]: function() { mostrarSeccionAdmin('crear-tarea'); },
        [RUTAS.ADMIN.USUARIOS]:    function() { mostrarSeccionAdmin('usuarios');    },
        [RUTAS.ADMIN.TAREAS]:      function() { mostrarSeccionAdmin('tareas');      },
    });

    _configurarSidebar('Admin', function(seccion) {
        const ruta = SECCIONES_ADMIN[seccion];
        if (ruta) ir(ruta);
    });

    iniciarRouter();
    ir(RUTAS.ADMIN.INICIO);
    if (window.lucide) window.lucide.createIcons();
}

// ── ACTIVAR MODO INSTRUCTOR ───────────────────────────────────────────────────
// Activa el panel del instructor con paleta de color verde.
// El instructor puede gestionar tareas y calificar estudiantes, pero no administrar usuarios.
// Se llama desde main.js cuando el rol del usuario logueado es 'instructor'.
export async function activarModoInstructor() {
    // Ocultamos todas las pantallas antes de mostrar la del instructor
    ocultarTodo();
    // Contraemos todas las cards para que el panel empiece ordenado
    contraerTodasLasCards();
    // Mostramos el panel de instructor quitando la clase 'hidden'
    vistaInstructor.classList.remove('hidden');
    // Marcamos el modo actual para que los estilos de color verde del instructor se apliquen
    document.body.dataset.modo = 'instructor';

    // Cargamos los datos del panel en paralelo para no hacer esperar al instructor
    cargarDashboardInstructor();
    cargarTablaUsuariosInstructor();
    cargarTareasInstructor();
    // Inicializamos el dropdown de selección de usuarios para crear tareas
    await inicializarDropdownInstructor();

    // Montar el calendario del instructor (puede agregar eventos, soloLectura = false)
    // Obtener todas las tareas para mostrarlas en el calendario
    let todasLasTareasCalendario = [];
    try { todasLasTareasCalendario = await obtenerTodasLasTareas(); } catch { todasLasTareasCalendario = []; }

    await crearCalendario({
        contenedorId: 'instrCalendario',
        paleta:       'instructor',
        soloLectura:  false,
        tareas:       todasLasTareasCalendario,
        onVerTarea:   function(taskId) {
            const fila = document.querySelector(`tr[data-task-id="${taskId}"]`);
            if (fila) fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
    });

    // Cargar el panel de calificación de tareas pendientes
    await cargarPanelCalificacion();

    // Cancelamos cualquier intervalo de actualización automática anterior antes de crear uno nuevo
    // Esto evita que se acumulen múltiples intervalos que causen recargas visuales inesperadas
    if (window._panelCalificacionInterval) {
        clearInterval(window._panelCalificacionInterval);
        window._panelCalificacionInterval = null;
    }
    // Actualizamos el panel de calificación cada 10 segundos para mostrar entregas nuevas
    window._panelCalificacionInterval = setInterval(async function() {
        const vistaInstr = document.getElementById('vistaInstructor');
        // Solo actualizamos si el panel del instructor está visible en pantalla
        const estaVisible = vistaInstr && !vistaInstr.classList.contains('hidden');
        if (estaVisible) {
            // No recargamos el panel si el instructor está escribiendo la nota en ese momento
            // para evitar que el campo se limpie mientras el instructor teclea
            const focoEnNota = document.activeElement &&
                document.activeElement.classList.contains('panel-cal__input-nota');
            if (!focoEnNota) {
                await cargarPanelCalificacion();
            }
            // Actualizamos también el dashboard y la tabla de estudiantes
            cargarDashboardInstructor();
            cargarTablaUsuariosInstructor();
        } else {
            // Si el panel ya no está visible, cancelamos el intervalo para no gastar recursos
            clearInterval(window._panelCalificacionInterval);
            window._panelCalificacionInterval = null;
        }
    }, 10000);

    // ── SPA: hero + router + sidebar ─────────────────────────────────────────
    const usuarioSesionInstr = obtenerUsuarioSesion();
    const heroNombreInstr = document.getElementById('heroNombreInstructor');
    if (heroNombreInstr && usuarioSesionInstr) heroNombreInstr.textContent = usuarioSesionInstr.name;

    registrarRutas({
        [RUTAS.INSTRUCTOR.INICIO]:      function() { mostrarSeccionInstructor('inicio');      },
        [RUTAS.INSTRUCTOR.CREAR_TAREA]: function() { mostrarSeccionInstructor('crear-tarea'); },
        [RUTAS.INSTRUCTOR.ESTUDIANTES]: function() { mostrarSeccionInstructor('estudiantes'); },
        [RUTAS.INSTRUCTOR.TAREAS]:      function() { mostrarSeccionInstructor('tareas');      },
    });

    _configurarSidebar('Instructor', function(seccion) {
        const ruta = SECCIONES_INSTRUCTOR[seccion];
        if (ruta) ir(ruta);
    });

    iniciarRouter();
    ir(RUTAS.INSTRUCTOR.INICIO);
    if (window.lucide) window.lucide.createIcons();
}

// Determina el nivel de rendimiento de un estudiante según la nota asignada
// Retorna un objeto con el estado (completada/reprobada), el nivel de rendimiento,
// y los colores de fondo y texto para mostrar visualmente en el sistema
function calcularRendimiento(nota) {
    if (nota < 70) {
        return {
            estado:      'reprobada',
            rendimiento: 'Rendimiento Bajo',
            label:       'Reprobada',
            color:       '#991b1b',
            bg:          '#fee2e2',
            icono:       '',
        };
    } else if (nota <= 85) {
        return {
            estado:      'completada',
            rendimiento: 'Rendimiento Alto',
            label:       'Aprobada',
            color:       '#065f46',
            bg:          '#d1fae5',
            icono:       '',
        };
    } else {
        return {
            estado:      'completada',
            rendimiento: 'Rendimiento Superior',
            label:       'Aprobada',
            color:       '#1e3a8a',
            bg:          '#dbeafe',
            icono:       '',
        };
    }
}

// Número de la página actualmente visible en el panel de calificación (se mantiene entre actualizaciones)
let _paginaCalificacion = 1;

// Muestra las tareas con estado "pendiente_aprobacion" para que el instructor las califique.
// Cada tarjeta tiene un campo para ingresar la nota (0-100) y un preview del resultado en tiempo real.
async function cargarPanelCalificacion() {
    const panel = document.getElementById('instrPanelCalificacion');
    if (!panel) return;
    // Anti-parpadeo: cargar datos ANTES de limpiar el panel
    try {
        const todasLasTareas   = await obtenerTodasLasTareas();
        // Limpiar AHORA que los datos están listos — sin parpadeo
        while (panel.firstChild) panel.removeChild(panel.firstChild);
        const tareasPendientes = todasLasTareas
            ? todasLasTareas.filter(function(t) { return t.status === 'pendiente_aprobacion'; })
            : [];

        if (tareasPendientes.length === 0) {
            const vacioWrap = document.createElement('div');
            vacioWrap.className = 'panel-cal__vacio';
            const icVacio = document.createElement('div');
            icVacio.textContent = '📋';
            icVacio.style.cssText = 'font-size:2.5rem;margin-bottom:0.5rem;';
            const txVacio = document.createElement('p');
            txVacio.textContent = 'No hay entregas pendientes de revisión';
            txVacio.style.cssText = 'color:#6b7280;font-size:0.9rem;margin:0;';
            vacioWrap.appendChild(icVacio);
            vacioWrap.appendChild(txVacio);
            panel.appendChild(vacioWrap);
            return;
        }

        const CARDS_POR_PAGINA = 3;

        // Construir todos los elementos card
        const todasLasCards = [];

        tareasPendientes.forEach(function(tarea) {
            const card = document.createElement('div');
            card.className       = 'panel-cal__card';
            card.dataset.tareaId = tarea.id;

            // ── Cabecera de la card ──────────────────────────────────────────
            const cabecera = document.createElement('div');
            cabecera.className = 'panel-cal__cabecera';

            const badgeEstado = document.createElement('span');
            badgeEstado.className = 'status-badge status-pendiente_aprobacion';
            badgeEstado.textContent = 'Por aprobar';
            cabecera.appendChild(badgeEstado);

            if (tarea.assignedUsersDisplay) {
                const alumno = document.createElement('span');
                alumno.className = 'panel-cal__alumno';
                alumno.textContent = '👤 ' + tarea.assignedUsersDisplay;
                cabecera.appendChild(alumno);
            }

            card.appendChild(cabecera);

            // ── Título de la tarea ───────────────────────────────────────────
            const tituloEl = document.createElement('h4');
            tituloEl.className   = 'panel-cal__titulo';
            tituloEl.textContent = tarea.title;
            card.appendChild(tituloEl);

            if (tarea.description) {
                const descEl = document.createElement('p');
                descEl.className   = 'panel-cal__desc';
                descEl.textContent = tarea.description;
                card.appendChild(descEl);
            }

            // ── Sección de calificación ──────────────────────────────────────
            const secCalif = document.createElement('div');
            secCalif.className = 'panel-cal__sec-calif';

            const labelNota = document.createElement('label');
            labelNota.className   = 'panel-cal__label-nota';
            labelNota.textContent = 'Calificación (0 – 100)';

            const wrapNota = document.createElement('div');
            wrapNota.className = 'panel-cal__wrap-nota';

            const inputNota       = document.createElement('input');
            inputNota.type        = 'number';
            inputNota.min         = '0';
            inputNota.max         = '100';
            inputNota.value       = '100';
            inputNota.className   = 'panel-cal__input-nota';
            inputNota.placeholder = '0-100';

            // Preview de rendimiento en tiempo real
            const preview = document.createElement('div');
            preview.className = 'panel-cal__preview';

            function actualizarPreview() {
                const val = parseFloat(inputNota.value);
                while (preview.firstChild) preview.removeChild(preview.firstChild);
                if (isNaN(val) || val < 0 || val > 100) return;
                const r = calcularRendimiento(val);
                preview.style.cssText = `background:${r.bg};color:${r.color};padding:0.35rem 0.75rem;border-radius:9999px;font-size:0.8rem;font-weight:700;display:inline-flex;align-items:center;gap:0.35rem;transition:all 0.2s;`;
                preview.textContent = `${r.icono} ${r.rendimiento} · ${r.label}`;
            }

            inputNota.addEventListener('input', actualizarPreview);
            actualizarPreview(); // inicializar con valor 100

            wrapNota.appendChild(inputNota);
            secCalif.appendChild(labelNota);
            secCalif.appendChild(wrapNota);
            secCalif.appendChild(preview);
            card.appendChild(secCalif);

            // ── Botón Aprobar ────────────────────────────────────────────────
            const btnAprobar   = document.createElement('button');
            btnAprobar.className = 'panel-cal__btn-aprobar';
            btnAprobar.type      = 'button';
            btnAprobar.textContent = 'Calificar y finalizar';

            btnAprobar.addEventListener('click', async function() {
                const nota = parseFloat(inputNota.value);
                if (isNaN(nota) || nota < 0 || nota > 100) {
                    await mostrarNotificacion('La nota debe ser entre 0 y 100', 'error');
                    return;
                }

                const rendimiento = calcularRendimiento(nota);

                // ── OPTIMISTIC UPDATE: ocultar la card de inmediato ──────────
                card.style.cssText = 'opacity:0.4;pointer-events:none;transition:opacity 0.2s;';

                try {
                    await actualizarTarea(tarea.id, {
                        status: rendimiento.estado,
                        grade:  nota,
                    });

                    // Eliminar de la lista de cards y re-renderizar
                    const idx = todasLasCards.indexOf(card);
                    if (idx !== -1) todasLasCards.splice(idx, 1);
                    _renderPagina();

                    // Actualizar fila en tabla de tareas (estado cambia a completada/reprobada)
                    obtenerTareaPorId(tarea.id).then(function(tareaFresca) {
                        if (tareaFresca) actualizarFilaTareaInstructor(tareaFresca);
                    }).catch(function() {});
                    cargarDashboardInstructor();
                    cargarTablaUsuariosInstructor();
                    obtenerTodasLasTareas().then(function(t) {
                        if (t) crearCalendario({ contenedorId: 'instrCalendario', paleta: 'instructor', soloLectura: false, tareas: t });
                    }).catch(function() {});

                    registrarEvento('tarea_creada', `Tarea calificada ${nota}/100: "${tarea.title}" · ${rendimiento.rendimiento}`);
                    const audEl = document.getElementById('auditoriaContenedor');
                    if (audEl) renderizarAuditoria(audEl);

                    const msgNota = `${rendimiento.rendimiento} — Nota: ${nota}/100 · ${rendimiento.label}`;
                    mostrarNotificacion(msgNota, 'exito'); // sin await — no bloquear

                } catch (error) {
                    // Revertir optimistic update si el servidor falló
                    card.style.cssText = '';
                    await mostrarNotificacion('Error al calificar la tarea', 'error');
                }
            });

            card.appendChild(btnAprobar);
            todasLasCards.push(card);
        });

        // Renderiza la página actual de cards (3 por página) con controles de paginación.
        // Se llama al cargar el panel y al calificar una tarea (para actualizar la vista).
        function _renderPagina() {
            // Eliminamos la lista y la paginación anteriores antes de redibujar
            const viejaLista = panel.querySelector('.panel-cal__lista');
            const viejaPag   = panel.querySelector('.panel-cal__paginacion');
            if (viejaLista) panel.removeChild(viejaLista); // quitamos la lista de cards
            if (viejaPag)   panel.removeChild(viejaPag);   // quitamos los controles de paginación

            // Si ya no quedan cards (todas fueron calificadas), mostramos el mensaje de celebración
            if (todasLasCards.length === 0) {
                const vacioWrap = document.createElement('div');
                vacioWrap.className = 'panel-cal__vacio'; // centrado con padding
                const icVacio = document.createElement('div');
                icVacio.textContent = '🎉'; // emoji de celebración — todas las entregas revisadas
                icVacio.style.cssText = 'font-size:2.5rem;margin-bottom:0.5rem;';
                const txVacio = document.createElement('p');
                txVacio.textContent = 'Todas las entregas han sido revisadas';
                txVacio.style.cssText = 'color:#6b7280;font-size:0.9rem;margin:0;';
                vacioWrap.appendChild(icVacio);
                vacioWrap.appendChild(txVacio);
                panel.appendChild(vacioWrap);
                return; // salimos — no hay más que mostrar
            }

            // Calculamos el total de páginas necesarias
            const totalPaginas = Math.ceil(todasLasCards.length / CARDS_POR_PAGINA); // ej: 7 cards → 3 páginas
            // Si la página actual supera el total (por calificar tareas), retrocedemos a la última
            if (_paginaCalificacion > totalPaginas) _paginaCalificacion = totalPaginas;

            // Índice del primer elemento de la página actual (página 1 → índice 0)
            const inicio = (_paginaCalificacion - 1) * CARDS_POR_PAGINA;
            // Contenedor que agrupa las cards de la página actual
            const lista = document.createElement('div');
            lista.className = 'panel-cal__lista'; // flex column con gap entre cards
            // Cortamos el arreglo para mostrar solo las cards de esta página
            todasLasCards.slice(inicio, inicio + CARDS_POR_PAGINA).forEach(function(c) {
                lista.appendChild(c); // pegamos cada card en la lista
            });
            panel.appendChild(lista); // pegamos la lista en el panel

            // Solo mostramos los controles de paginación si hay más de una página
            if (totalPaginas > 1) {
                const paginacion = document.createElement('div');
                paginacion.className = 'panel-cal__paginacion'; // flex row centrado con los 3 controles

                // Botón ← para ir a la página anterior
                const btnPrev = document.createElement('button');
                btnPrev.className = 'panel-cal__pag-btn';
                btnPrev.textContent = '←';
                btnPrev.disabled = _paginaCalificacion === 1; // desactivado si estamos en la primera página
                btnPrev.addEventListener('click', function() { _paginaCalificacion--; _renderPagina(); });

                // Indicador de página actual (ej: "2 / 3")
                const indicador = document.createElement('span');
                indicador.className = 'panel-cal__pag-indicador';
                indicador.textContent = _paginaCalificacion + ' / ' + totalPaginas;

                // Botón → para ir a la página siguiente
                const btnNext = document.createElement('button');
                btnNext.className = 'panel-cal__pag-btn';
                btnNext.textContent = '→';
                btnNext.disabled = _paginaCalificacion === totalPaginas; // desactivado en la última página
                btnNext.addEventListener('click', function() { _paginaCalificacion++; _renderPagina(); });

                paginacion.appendChild(btnPrev);     // ← a la izquierda
                paginacion.appendChild(indicador);   // "X / Y" en el centro
                paginacion.appendChild(btnNext);     // → a la derecha
                panel.appendChild(paginacion);       // pegamos la barra de paginación en el panel
            }
        }

        _renderPagina();

    } catch (error) {
        const err = document.createElement('p');
        err.className   = 'texto-vacio';
        err.textContent = 'Error al cargar las entregas pendientes';
        panel.appendChild(err);
    }
}

// Actualiza las tarjetas de estadísticas del panel del instructor con datos frescos del servidor.
// Solo cuenta las tareas asignadas a estudiantes (rol=user), no las de admins ni otros instructores.
async function cargarDashboardInstructor() {
    // Pedimos tareas y usuarios al mismo tiempo con Promise.all para no hacer dos esperas seguidas
    const [todasTareas, todosUsuarios] = await Promise.all([
        obtenerTodasLasTareas(),    // GET /api/tasks — todas las tareas del sistema
        obtenerTodosLosUsuarios(),  // GET /api/users — todos los usuarios del sistema
    ]);
    if (!todasTareas || !todosUsuarios) return; // si alguna petición falló, no actualizamos nada

    // Construimos un Set de IDs solo de estudiantes (role='user'), excluyendo admins e instructores
    const idsEstudiantes = new Set(
        todosUsuarios.filter(u => u.role === 'user').map(u => u.id)
    );

    // Filtramos solo las tareas que tienen asignado al menos un estudiante
    // assignedUsers es un arreglo de IDs (números) — buscamos intersección con el Set de estudiantes
    const tareas = todasTareas.filter(t =>
        Array.isArray(t.assignedUsers) && t.assignedUsers.some(id => idsEstudiantes.has(Number(id)))
    );

    // Referencias a los elementos del DOM donde se escriben los contadores de las tarjetas
    const el = {
        total:      document.getElementById('instrDashTotal'),      // tarjeta gris: total
        pendiente:  document.getElementById('instrDashPendiente'),  // tarjeta amarilla: pendientes
        progreso:   document.getElementById('instrDashProgreso'),   // tarjeta azul: en progreso
        aprobacion: document.getElementById('instrDashAprobacion'), // tarjeta naranja: por aprobar
        completada: document.getElementById('instrDashCompletada'), // tarjeta verde: completadas
        reprobada:  document.getElementById('instrDashReprobada'),  // tarjeta roja: reprobadas
    };

    // Escribimos el conteo en cada tarjeta usando .filter para contar por estado
    if (el.total)      el.total.textContent      = tareas.length; // total sin filtrar por estado
    if (el.pendiente)  el.pendiente.textContent   = tareas.filter(t => t.status === 'pendiente').length;
    if (el.progreso)   el.progreso.textContent    = tareas.filter(t => t.status === 'en_progreso').length;
    if (el.aprobacion) el.aprobacion.textContent  = tareas.filter(t => t.status === 'pendiente_aprobacion').length;
    if (el.completada) el.completada.textContent  = tareas.filter(t => t.status === 'completada').length;
    if (el.reprobada)  el.reprobada.textContent   = tareas.filter(t => t.status === 'reprobada').length;
}

// Llena la tabla de estudiantes del panel del instructor con datos actualizados.
// A diferencia del admin, aquí solo se muestra el botón "Ver" — sin editar, cambiar rol ni eliminar.
async function cargarTablaUsuariosInstructor() {
    const tbody = document.getElementById('instrUsersTableBody');
    if (!tbody) return;

    // Anti-parpadeo: cargar datos ANTES de limpiar el DOM.
    // Si limpiamos primero y los datos tardan, la tabla parpadea en blanco.
    const [usuarios, todasTareas] = await Promise.all([
        obtenerTodosLosUsuarios(),
        obtenerTodasLasTareas(),
    ]);
    if (!usuarios) return;

    // Limpiar AHORA que tenemos datos — sin parpadeo visible
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    // Filtrar: solo mostrar estudiantes (role === 'user') y excluir al instructor logueado
    const usuarioLogueado = obtenerUsuarioSesion();
    const estudiantes = usuarios.filter(function(u) {
        return u.role === 'user' && (!usuarioLogueado || u.id !== usuarioLogueado.id);
    });

    // Actualizar el contador de usuarios en el header de la card
    const contador = document.getElementById('instrUsersCount');
    if (contador) {
        const cantidad = estudiantes.length;
        contador.textContent = `${cantidad} ${cantidad === 1 ? 'usuario' : 'usuarios'}`;
    }

    // Calcular calificación promedio por estudiante a partir de tareas completadas con comment numérico
    function calcularCalificacion(userId) {
        if (!todasTareas) return null;
        // Usar t.grade (nota numérica del instructor) en lugar de t.comment
        const calificadas = todasTareas.filter(t =>
            Array.isArray(t.assignedUsers) &&
            t.assignedUsers.includes(Number(userId)) &&
            t.grade !== null && t.grade !== undefined
        );
        if (calificadas.length === 0) return null;
        const notas = calificadas
            .map(t => parseFloat(t.grade))
            .filter(n => !isNaN(n) && n >= 0 && n <= 100);
        if (notas.length === 0) return null;
        return (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1);
    }

    estudiantes.forEach(function(usuario, indice) {
        const fila = document.createElement('tr');

        const celdaNum = document.createElement('td');
        celdaNum.textContent = usuario.id;

        const celdaDoc = document.createElement('td');
        celdaDoc.textContent = usuario.documento;

        const celdaNombre = document.createElement('td');
        celdaNombre.textContent = usuario.name;

        const celdaEmail = document.createElement('td');
        celdaEmail.textContent = usuario.email;

        // Columna Estado (activo / inactivo)
        const celdaEstado = document.createElement('td');
        celdaEstado.appendChild(crearBadgeEstado(usuario.is_active));

        // Columna Calificación total (promedio de tareas completadas)
        const celdaCalif = document.createElement('td');
        const calif = calcularCalificacion(usuario.id);
        if (calif !== null) {
            // Usar calcularRendimiento para obtener el color correcto según el promedio
            const r = calcularRendimiento(parseFloat(calif));
            const badgeCalif = document.createElement('span');
            badgeCalif.className = 'status-badge';
            badgeCalif.style.cssText = `background:${r.bg};color:${r.color};font-weight:700;`;
            badgeCalif.textContent = `${calif} / 100`;
            celdaCalif.appendChild(badgeCalif);
            // Sub-label de rendimiento
            const labelRend = document.createElement('span');
            labelRend.style.cssText = `display:block;font-size:0.65rem;color:${r.color};margin-top:2px;font-weight:600;`;
            labelRend.textContent = r.rendimiento;
            celdaCalif.appendChild(labelRend);
        } else {
            celdaCalif.style.color = '#9ca3af';
            celdaCalif.style.fontSize = '0.8rem';
            celdaCalif.textContent = 'Sin calificación';
        }

        const celdaAcciones = document.createElement('td');
        const contenedor    = document.createElement('div');
        contenedor.classList.add('task-actions');

        // ÚNICO botón del instructor: "Ver / Asignar"
        // Botón Ver — pill con ícono y texto, igual que los botones del admin
        const btnVer = document.createElement('button');
        btnVer.type      = 'button';
        btnVer.className = 'btn-ver-estudiante';
        btnVer.title     = 'Ver estudiante';
        const icoVer = document.createElement('i');
        icoVer.setAttribute('data-lucide', 'eye');
        icoVer.className = 'icono-accion';
        btnVer.appendChild(icoVer);
        btnVer.appendChild(document.createTextNode(' Ver'));
        btnVer.addEventListener('click', function() {
            _pendingVerUsuario = usuario;
            ir(RUTAS.INSTRUCTOR.VER_ESTUDIANTE + '/' + usuario.id);
        });

        contenedor.appendChild(btnVer);
        celdaAcciones.appendChild(contenedor);

        fila.appendChild(celdaNum);
        fila.appendChild(celdaDoc);
        fila.appendChild(celdaNombre);
        fila.appendChild(celdaEmail);
        fila.appendChild(celdaEstado);
        fila.appendChild(celdaCalif);
        fila.appendChild(celdaAcciones);

        tbody.appendChild(fila);
    });

    // Inicializar íconos Lucide para los botones "Ver" recién insertados en el DOM.
    // Sin esta llamada los <i data-lucide="eye"> quedan como elementos vacíos.
    if (window.lucide) window.lucide.createIcons();
}

// Filtra y reordena la tabla de tareas del instructor según los selectores de estado, usuario y orden.
// Solo muestra tareas que tienen al menos un estudiante (role=user) asignado.
async function aplicarFiltrosInstructor() {
    const tbody = document.getElementById('instrTasksTableBody');
    if (!tbody) return;

    const estado  = (document.getElementById('instrFiltroEstado')?.value  || '').trim();
    const termino = (document.getElementById('instrFiltroUsuario')?.value || '').toLowerCase().trim();
    const orden   = (document.getElementById('instrOrdenSelect')?.value   || '').trim();

    const [todasTareas, todosUsuarios] = await Promise.all([
        obtenerTodasLasTareas(),
        obtenerTodosLosUsuarios(),
    ]);
    if (!todasTareas || !todosUsuarios) return;

    // Solo IDs de estudiantes (role=user)
    const idsEstudiantes = new Set(todosUsuarios.filter(u => u.role === 'user').map(u => u.id));

    // Partir de las tareas que tienen al menos un estudiante asignado
    const tareasDeEstudiantes = todasTareas.filter(t =>
        Array.isArray(t.assignedUsers) && t.assignedUsers.some(id => idsEstudiantes.has(Number(id)))
    );

    let resultado = filtrarTareas(tareasDeEstudiantes, estado, termino);
    resultado     = ordenarTareas(resultado, orden);

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    const contador = document.getElementById('instrTasksCount');
    if (contador) {
        const cantidad = resultado.length;
        contador.textContent = `${cantidad} ${cantidad === 1 ? 'tarea' : 'tareas'}`;
    }

    if (resultado.length === 0) {
        const fila = document.createElement('tr');
        const td   = document.createElement('td');
        td.colSpan        = 6;
        td.textContent    = 'No hay tareas que coincidan con el filtro seleccionado';
        td.style.textAlign = 'center';
        td.style.color    = '#9ca3af';
        fila.appendChild(td);
        tbody.appendChild(fila);
        return;
    }

    resultado.forEach(function(tarea, indice) {
        const fila = crearFilaTareaInstructor(tarea, indice);
        tbody.appendChild(fila);
    });
    // Inicializar íconos Lucide de los botones recién insertados
    if (window.lucide) window.lucide.createIcons();
}

// Llena la tabla de tareas del panel instructor con todas las tareas de estudiantes.
// Es el equivalente de cargarTodasLasTareas del admin, pero filtrado solo para estudiantes.
async function cargarTareasInstructor() {
    const tbody = document.getElementById('instrTasksTableBody');
    if (!tbody) return;

    // Anti-parpadeo: fetch primero, limpiar DOM después
    const [todasTareas, todosUsuarios] = await Promise.all([
        obtenerTodasLasTareas(),
        obtenerTodosLosUsuarios(),
    ]);
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    if (!todasTareas || !todosUsuarios) return;

    // Solo IDs de estudiantes (role=user)
    const idsEstudiantes = new Set(todosUsuarios.filter(u => u.role === 'user').map(u => u.id));

    // Solo tareas que tienen al menos un estudiante asignado
    const tareas = todasTareas.filter(t =>
        Array.isArray(t.assignedUsers) && t.assignedUsers.some(id => idsEstudiantes.has(Number(id)))
    );

    const contador = document.getElementById('instrTasksCount');
    if (contador) {
        const cantidad = tareas.length;
        contador.textContent = `${cantidad} ${cantidad === 1 ? 'tarea' : 'tareas'}`;
    }

    tareas.forEach(function(tarea, indice) {
        const fila = crearFilaTareaInstructor(tarea, indice);
        tbody.appendChild(fila);
    });
    // Renderizar íconos Lucide después de insertar todas las filas al DOM
    if (window.lucide) window.lucide.createIcons();
}

// Formatea la cadena de usuarios asignados para mostrar solo el primero y "+N" si hay más
// Parámetro displayStr: texto con los nombres separados por coma (ej: "Ana, Luis, María")
function formatearUsuariosDisplay(displayStr) {
    if (!displayStr) return '—';
    const nombres = displayStr.split(', ');
    if (nombres.length === 1) return nombres[0];
    return `${nombres[0]} +${nombres.length - 1}`;
}

// ── CELDA DE DESCRIPCIÓN CON TRUNCADO ─────────────────────────────────────────
// Crea la celda de descripción con el texto truncado y un botón "Ver tarea" siempre visible.
function crearCeldaDescripcion(tarea) {
    const celda = document.createElement('td');
    celda.style.maxWidth = '0'; // necesario para que el ellipsis funcione en table-layout
    const desc = tarea.description || '—';

    // Texto truncado con CSS (siempre, independiente del largo)
    const span = document.createElement('span');
    span.className   = 'celda-desc__texto';
    span.textContent = desc;
    celda.appendChild(span);

    // Botón "Ver tarea" — siempre visible
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'celda-desc__btn-ver';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver tarea';
    btn.addEventListener('click', function() {
        _pendingVerTarea = tarea;
        const modo = document.body.dataset.modo;
        if (modo === 'admin') ir(RUTAS.ADMIN.VER_TAREA + '/' + tarea.id);
        else if (modo === 'instructor') ir(RUTAS.INSTRUCTOR.VER_TAREA + '/' + tarea.id);
        else ir(RUTAS.USUARIO.VER_TAREA + '/' + tarea.id);
    });
    celda.appendChild(btn);

    return celda;
}

// Abre el modal de solo lectura con toda la información de una tarea.
// Muestra título, descripción, estado, nota del instructor y usuarios asignados.
// Si la tarea ya fue calificada muestra la nota con su nivel de rendimiento; si no, "Sin calificar".
async function abrirModalVerTarea(tareaInicial) {
    const modal = document.getElementById('verTareaModal');
    if (!modal) return;

    // Re-fetch para obtener datos frescos (evita mostrar estado stale del closure)
    let tarea = tareaInicial;
    try {
        const fresca = await obtenerTareaPorId(tareaInicial.id);
        if (fresca) tarea = fresca;
    } catch { /* usar datos del closure si falla el fetch */ }

    document.getElementById('verTareaTitulo').textContent      = tarea.title || '—';
    document.getElementById('verTareaDescripcion').textContent = tarea.description || '—';
    document.getElementById('verTareaUsuario').textContent     = tarea.assignedUsersDisplay || 'Sin asignar';

    // Badge de estado
    const contenedorEstado = document.getElementById('verTareaEstado');
    contenedorEstado.innerHTML = '';
    const badge = document.createElement('span');
    badge.className = `status-badge status-${tarea.status}`;
    badge.textContent = formatearEstado ? formatearEstado(tarea.status) : tarea.status;
    contenedorEstado.appendChild(badge);

    // Grupos del modal
    const grupoCalif      = document.getElementById('verTareaCalifGrupo');
    const califEl         = document.getElementById('verTareaCalif');
    const grupoSinCalif   = document.getElementById('verTareaSinCalifGrupo');
    const grupoComentario = document.getElementById('verTareaComentarioGrupo');
    const comentarioEl    = document.getElementById('verTareaComentario');

    // Limpiar estado anterior
    if (grupoCalif)      grupoCalif.style.display      = 'none';
    if (grupoSinCalif)   grupoSinCalif.style.display   = 'none';
    if (grupoComentario) grupoComentario.style.display = '';
    if (comentarioEl)    comentarioEl.textContent      = tarea.comment || '—';

    // Calificación con sistema de rendimiento
    if (tarea.grade !== null && tarea.grade !== undefined) {
        const nota = Number(tarea.grade);
        const r    = calcularRendimiento(nota);

        califEl.innerHTML = '';

        // Badge de nota
        const badgeNota = document.createElement('span');
        badgeNota.className = 'status-badge';
        badgeNota.style.cssText = `background:${r.bg};color:${r.color};font-weight:700;`;
        badgeNota.textContent = `${nota} / 100`;
        califEl.appendChild(badgeNota);

        // Texto de rendimiento (sin óvalo, solo color)
        const badgeRend = document.createElement('span');
        badgeRend.style.cssText = `color:${r.color};font-weight:600;font-size:0.8rem;display:block;margin-top:2px;`;
        badgeRend.textContent = `${r.icono} ${r.rendimiento} · ${r.label}`;
        califEl.appendChild(badgeRend);

        if (grupoCalif) grupoCalif.style.display = '';
    } else {
        if (grupoSinCalif) grupoSinCalif.style.display = '';
    }

    modal.classList.remove('hidden');
}

// Construye y retorna un elemento <tr> con los datos de una tarea para el panel del instructor.
// El instructor puede editar y eliminar tareas — tiene CRUD completo sobre tareas.
function crearFilaTareaInstructor(tarea, indice) {
    const fila = document.createElement('tr');
    fila.dataset.id = tarea.id;

    const celdaNum = document.createElement('td');
    celdaNum.textContent = tarea.id;

    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    const celdaDesc = crearCeldaDescripcion(tarea);

    const celdaEstado = document.createElement('td');
    // Creamos el badge de estado visual con las dos clases necesarias para que tenga color
    const badgeEstado = document.createElement('span');
    // La clase 'status-badge' da la forma base del badge y 'status-X' le da el color según el estado
    badgeEstado.classList.add('status-badge', `status-${tarea.status}`);
    // Convertimos el valor técnico (ej: "en_progreso") al texto legible (ej: "En Progreso")
    badgeEstado.textContent = formatearEstado(tarea.status);
    celdaEstado.appendChild(badgeEstado);

    const celdaUsuario = document.createElement('td');
    celdaUsuario.textContent = formatearUsuariosDisplay(tarea.assignedUsersDisplay);

    const celdaAcciones = document.createElement('td');
    const contenedor    = document.createElement('div');
    contenedor.classList.add('task-actions');

    // Botón Editar — circular con ícono, igual que en la tabla de usuarios
    const btnEditar = crearBotonIcono('pencil', 'Editar tarea', 'btn-accion--amarillo', function() {
        _pendingEditarTarea = tarea;
        ir(RUTAS.INSTRUCTOR.EDITAR_TAREA + '/' + tarea.id);
    });

    // Botón Eliminar — circular con ícono rojo
    const btnEliminar = crearBotonIcono('trash-2', 'Eliminar tarea', 'btn-accion--rojo', function() {
        _pendingEliminarTarea = { tarea };
        ir(RUTAS.INSTRUCTOR.ELIMINAR_TAREA + '/' + tarea.id);
    });

    contenedor.appendChild(btnEditar);
    contenedor.appendChild(btnEliminar);
    celdaAcciones.appendChild(contenedor);

    const celdaFecha = document.createElement('td');
    celdaFecha.className = 'col-fecha';
    if (tarea.createdAt) {
        const fecha = new Date(tarea.createdAt);
        const dia   = fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const hora  = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const spanFecha = document.createElement('span');
        spanFecha.className   = 'fecha-celda__fecha';
        spanFecha.textContent = dia;
        const spanHora = document.createElement('span');
        spanHora.className   = 'fecha-celda__hora';
        spanHora.textContent = hora;
        celdaFecha.appendChild(spanFecha);
        celdaFecha.appendChild(spanHora);
    } else {
        celdaFecha.textContent = '—';
    }

    fila.appendChild(celdaNum);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDesc);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaUsuario);
    fila.appendChild(celdaFecha);
    fila.appendChild(celdaAcciones);

    return fila;
}

// Actualiza los datos de una fila existente en la tabla del instructor sin reconstruirla completa.
// Esto evita el parpadeo visual que ocurre cuando se vacía y vuelve a llenar toda la tabla.
function actualizarFilaTareaInstructor(tarea) {
    const tbody = document.getElementById('instrTasksTableBody');
    if (!tbody) return false;
    const fila = tbody.querySelector(`tr[data-id="${tarea.id}"]`);
    if (!fila) return false;  // fila no encontrada, caller debe hacer full reload

    // Celda 1 — título
    if (fila.cells[1]) fila.cells[1].textContent = tarea.title || '—';

    // Celda 2 — descripción (puede tener span interno + botón ver)
    if (fila.cells[2]) {
        const span = fila.cells[2].querySelector('span');
        if (span) span.textContent = tarea.description || '—';
        else fila.cells[2].firstChild && (fila.cells[2].firstChild.textContent = tarea.description || '—');
    }

    // Celda 3 — badge estado
    if (fila.cells[3]) {
        const badge = fila.cells[3].querySelector('.status-badge');
        if (badge) {
            badge.className = `status-badge status-${tarea.status}`;
            badge.textContent = formatearEstado(tarea.status);
        }
    }
    return true;
}

// Carga la lista de estudiantes en el dropdown de selección de la card "Crear Tarea" del instructor.
// Usa IDs propios (instrUsuariosDropdown*) distintos a los del admin para coexistir sin conflictos.
async function inicializarDropdownInstructor() {
    const panel = document.getElementById('instrUsuariosDropdownPanel');
    const btn   = document.getElementById('instrUsuariosDropdownBtn');
    const texto = document.getElementById('instrUsuariosDropdownTexto');
    if (!panel || !btn) return;

    const usuarios = await obtenerTodosLosUsuarios();

    // Limpiar el panel
    while (panel.firstChild) panel.removeChild(panel.firstChild);

    // Solo mostrar estudiantes (role=user) — no admins ni otros instructores
    const soloEstudiantes = (usuarios || []).filter(u => u.role === 'user');

    if (!soloEstudiantes || soloEstudiantes.length === 0) {
        const vacio = document.createElement('p');
        vacio.className   = 'usuarios-dropdown__vacio-texto';
        vacio.textContent = 'No hay estudiantes disponibles';
        panel.appendChild(vacio);
    } else {
        // Usar la misma estructura con avatares que el dropdown del admin
        soloEstudiantes.forEach(function(usuario) {
            const opcion   = document.createElement('label');
            opcion.className = 'usuarios-dropdown__opcion';

            const checkbox = document.createElement('input');
            checkbox.type      = 'checkbox';
            checkbox.value     = String(usuario.id);
            checkbox.className = 'usuarios-dropdown__checkbox';
            checkbox.addEventListener('change', function() {
                if (texto) {
                    const seleccionados = Array.from(
                        panel.querySelectorAll('input:checked')
                    );
                    texto.textContent = seleccionados.length === 0
                        ? 'Seleccionar usuarios...'
                        : seleccionados.map(function(cb) {
                            return cb.closest('label')
                                .querySelector('.usuarios-dropdown__nombre')
                                .textContent;
                          }).join(', ');
                }
            });

            // Avatar circular con iniciales — igual que el admin
            const avatar = document.createElement('span');
            avatar.className   = 'usuarios-dropdown__avatar';
            avatar.textContent = usuario.name
                .trim().split(' ').slice(0, 2)
                .map(function(p) { return p[0]; })
                .join('').toUpperCase();

            const info = document.createElement('div');
            info.className = 'usuarios-dropdown__info';

            const nombre = document.createElement('span');
            nombre.className   = 'usuarios-dropdown__nombre';
            nombre.textContent = usuario.name;

            const doc = document.createElement('span');
            doc.className   = 'usuarios-dropdown__doc';
            doc.textContent = `Doc: ${usuario.documento}`;

            info.appendChild(nombre);
            info.appendChild(doc);

            opcion.appendChild(checkbox);
            opcion.appendChild(avatar);
            opcion.appendChild(info);
            panel.appendChild(opcion);
        });
    }

    // Abrir/cerrar el panel al hacer clic en el botón
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const abierto = !panel.classList.contains('hidden');
        if (abierto) {
            panel.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
        } else {
            const rect = btn.getBoundingClientRect();
            const espacioAbajo = window.innerHeight - rect.bottom - 8;
            panel.style.maxHeight = Math.min(380, Math.max(120, espacioAbajo)) + 'px';
            panel.classList.remove('hidden');
            btn.setAttribute('aria-expanded', 'true');
        }
    });

    // Cerrar al hacer click fuera del dropdown
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('instrUsuariosDropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            panel.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

// Carga las estadísticas del dashboard del administrador desde el servidor.
// Llama a GET /api/tasks/dashboard que retorna los conteos por estado de todas las tareas.
async function cargarDashboard() {
    const data = await obtenerDashboard();
    if (!data) return;

    const el = {
        total:      document.getElementById('dashboardTotal'),
        pendiente:  document.getElementById('dashboardPendiente'),
        progreso:   document.getElementById('dashboardProgreso'),
        aprobacion: document.getElementById('dashboardAprobacion'),
        completada: document.getElementById('dashboardCompletada'),
        reprobada:  document.getElementById('dashboardReprobada'),
    };

    if (el.total)      el.total.textContent      = data.total;
    if (el.pendiente)  el.pendiente.textContent   = data.pendientes;
    if (el.progreso)   el.progreso.textContent    = data.enProgreso;
    if (el.aprobacion) el.aprobacion.textContent  = data.aprobacion ?? 0;
    if (el.completada) el.completada.textContent  = data.completadas;
    if (el.reprobada)  el.reprobada.textContent   = data.reprobadas ?? 0;
}

// ── TABLA USUARIOS ────────────────────────────────────────────────────────────

// Carga todos los usuarios del sistema desde el servidor y los muestra en la tabla del admin
export async function cargarTablaUsuarios() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const usuarios = await obtenerTodosLosUsuarios();

    if (!usuarios) {
        await mostrarNotificacion('Error al cargar los usuarios', 'error');
        return;
    }
    // Dentro de cargarTablaUsuarios, después de obtener los usuarios y antes de vaciar el tbody
    // Se actualiza el contador de usuarios con el mismo formato que el contador de tareas
    const contadorUsuariosEl = document.getElementById('adminUsersCount');
    if (contadorUsuariosEl) {
        const cantidad = usuarios ? usuarios.length : 0;
        // Texto con singular o plural según la cantidad
        contadorUsuariosEl.textContent = `${cantidad} ${cantidad === 1 ? 'usuario' : 'usuarios'}`;
    }

    // Vaciar tbody con removeChild para respetar la regla del proyecto
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (usuarios.length === 0) {
        const fila = document.createElement('tr');
        const td   = document.createElement('td');
        td.colSpan        = 5;
        td.textContent    = 'No hay usuarios registrados';
        td.style.textAlign = 'center';
        td.style.color    = '#9ca3af';
        fila.appendChild(td);
        tbody.appendChild(fila);
        return;
    }

    usuarios.forEach(function(usuario, indice) {
        tbody.appendChild(crearFilaUsuario(usuario, indice));
    });
    // Inicializar íconos Lucide DESPUÉS de insertar todas las filas al DOM
    if (window.lucide) window.lucide.createIcons();
}


// Muestra un modal de confirmación antes de eliminar una tarea de forma permanente.
// Parámetro tituloTarea: el nombre de la tarea para mostrar en el mensaje de confirmación.
// Retorna una promesa que resuelve en true (confirmar) o false (cancelar).
// Esta función retorna una Promesa — el caller usa `await` para esperar la decisión del usuario.
// La promesa resuelve en `true` (el usuario confirmó) o `false` (el usuario canceló).
function confirmarEliminarTarea(tituloTarea) {
    return new Promise(function(resolve) {
        // ── Overlay — fondo oscuro que cubre todo el panel mientras el modal está abierto ──
        const overlay = document.createElement('div');
        overlay.className = 'modal-usuario-overlay'; // fondo semitransparente
        overlay.style.zIndex = '9999'; // encima de cualquier otro elemento de la página

        // ── Panel — caja blanca del modal de confirmación ────────────────────
        const panel = document.createElement('div');
        panel.className = 'modal-usuario'; // clase CSS del modal estándar del sistema
        panel.style.cssText = 'max-width:420px;padding:0;overflow:hidden;';

        // ── Header: título “Eliminar tarea” + borde rojo ──────────────────────
        const header = document.createElement('div');
        header.className = 'modal-usuario__header';
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:1rem 1.5rem;border-bottom:2px solid #ef4444;'; // borde rojo = acción destructiva
        const tituloEl = document.createElement('h3');
        tituloEl.textContent = 'Eliminar tarea'; // título del modal
        tituloEl.style.cssText = 'font-size:1.1rem;font-weight:700;color:var(--texto-oscuro);margin:0;';
        const btnX = document.createElement('button');
        btnX.className = 'modal-usuario__cerrar'; // botón X en la esquina superior derecha
        btnX.innerHTML = '✕';
        btnX.addEventListener('click', function() { cerrar(false); }); // X cancela la operación
        header.appendChild(tituloEl);
        header.appendChild(btnX);
        panel.appendChild(header); // pegamos el header en el panel

        // ── Cuerpo: ícono de papelera + mensaje de advertencia ──────────────
        const cuerpo = document.createElement('div');
        cuerpo.style.cssText = 'padding:1.5rem;display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center;';
        // Círculo rojo semitransparente que envuelve el ícono de papelera
        const iconoWrap = document.createElement('div');
        iconoWrap.style.cssText = 'width:56px;height:56px;border-radius:50%;background:rgba(239,68,68,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;';
        const icono = document.createElement('i');
        icono.setAttribute('data-lucide', 'trash-2'); // ícono de papelera de Lucide
        icono.style.cssText = 'width:26px;height:26px;stroke:#ef4444;fill:none;'; // trazo rojo, sin relleno
        iconoWrap.appendChild(icono); // papelera dentro del círculo
        cuerpo.appendChild(iconoWrap);
        // Párrafo con el título de la tarea en negrita y el aviso de acción irreversible
        const desc = document.createElement('p');
        desc.innerHTML = '<strong style=”color:var(--texto-oscuro)”>”' + tituloTarea + '”</strong><br><span style=”color:var(--texto-medio);font-size:0.875rem;”>será eliminada permanentemente. Esta acción no se puede deshacer.</span>';
        desc.style.cssText = 'margin:0;line-height:1.6;';
        cuerpo.appendChild(desc);
        panel.appendChild(cuerpo); // pegamos el cuerpo en el panel

        // ── Footer: botones Cancelar y Confirmar ────────────────────────────
        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;gap:0.75rem;padding:1rem 1.5rem 1.5rem;border-top:1px solid var(--borde-suave);'; // flex row con los dos botones

        // Botón Cancelar — gris, no elimina nada
        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.type = 'button';
        btnCancelar.style.cssText = 'flex:1;height:42px;border:none;cursor:pointer;border-radius:var(--radio-full);background:var(--fondo-gris);color:var(--texto-medio);font-size:0.875rem;font-weight:600;transition:background 0.15s,transform 0.1s;';
        // Efectos hover: el botón sube ligeramente al pasar el mouse
        btnCancelar.addEventListener('mouseenter', function() { this.style.background='var(--borde-suave)'; this.style.transform='translateY(-1px)'; });
        btnCancelar.addEventListener('mouseleave', function() { this.style.background='var(--fondo-gris)'; this.style.transform='translateY(0)'; });
        btnCancelar.addEventListener('click', function() { cerrar(false); }); // resuelve la promesa con false

        // Botón Confirmar — gradiente rojo, confirma la eliminación
        const btnConfirmar = document.createElement('button');
        btnConfirmar.textContent = 'Sí, eliminar';
        btnConfirmar.type = 'button';
        btnConfirmar.style.cssText = 'flex:1;height:42px;border:none;cursor:pointer;border-radius:var(--radio-full);background:linear-gradient(135deg,#ef4444,#dc2626);color:white;font-size:0.875rem;font-weight:600;transition:opacity 0.15s,transform 0.1s;';
        // Efectos hover: el botón se aclara y sube ligeramente
        btnConfirmar.addEventListener('mouseenter', function() { this.style.opacity='0.88'; this.style.transform='translateY(-1px)'; });
        btnConfirmar.addEventListener('mouseleave', function() { this.style.opacity='1'; this.style.transform='translateY(0)'; });
        btnConfirmar.addEventListener('click', function() { cerrar(true); }); // resuelve la promesa con true

        footer.appendChild(btnCancelar);  // Cancelar a la izquierda
        footer.appendChild(btnConfirmar); // Sí, eliminar a la derecha
        panel.appendChild(footer);        // pegamos el footer en el panel
        overlay.appendChild(panel);       // pegamos el panel dentro del overlay
        document.body.appendChild(overlay); // insertamos todo el modal en el body

        // Activamos el ícono de papelera que acabamos de insertar con data-lucide
        if (window.lucide) window.lucide.createIcons();

        // Función interna que cierra el modal y resuelve la promesa con el resultado
        function cerrar(resultado) {
            if (overlay.parentNode) document.body.removeChild(overlay); // eliminamos el modal del DOM
            resolve(resultado); // resultado=true → confirmó eliminar; resultado=false → canceló
        }
        // Hacer clic en el fondo oscuro (fuera del panel) también cancela
        overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrar(false); });
    });
}

// Crea y retorna un badge visual con el nombre del rol del usuario (Admin, Instructor, Estudiante)
function crearBadgeRol(rol) {
    const badge = document.createElement('span');
    badge.className = 'status-badge';
    const config = {
        admin:      { texto: 'Admin',      clase: 'badge-rol--admin'      },
        instructor: { texto: 'Instructor', clase: 'badge-rol--instructor' },
        user:       { texto: 'Estudiante', clase: 'badge-rol--user'       },
    }[rol] || { texto: rol, clase: 'badge-rol--user' };
    badge.textContent = config.texto;
    badge.classList.add(config.clase);
    return badge;
}

// Crea y retorna un badge verde con "Activo" o rojo con "Inactivo" según el estado del usuario
function crearBadgeEstado(isActive) {
    const badge = document.createElement('span');
    badge.className = 'status-badge';
    if (isActive === 1 || isActive === true) {
        badge.textContent = 'Activo';
        badge.classList.add('badge-estado--activo');
    } else {
        badge.textContent = 'Inactivo';
        badge.classList.add('badge-estado--inactivo');
    }
    return badge;
}

// Crea y retorna un botón circular con ícono Lucide para las tablas de usuarios y tareas
// Parámetro nombreIcono: nombre del ícono Lucide (ej: "pencil", "trash-2", "eye")
// Parámetro tooltip: texto que aparece al pasar el cursor sobre el botón
// Parámetro claseColor: clase CSS que define el color del botón (ej: "btn-accion--rojo")
// Parámetro handler: función que se ejecuta al hacer clic en el botón
function crearBotonIcono(nombreIcono, tooltip, claseColor, handler) {
    const btn = document.createElement('button');
    btn.className = `btn-accion-icono ${claseColor}`;
    btn.title     = tooltip;
    btn.type      = 'button';
    const icono   = document.createElement('i');
    icono.setAttribute('data-lucide', nombreIcono);
    icono.classList.add('icono-accion');
    btn.appendChild(icono);
    btn.addEventListener('click', handler);
    return btn;
}

// Construye y retorna una fila <tr> completa con los datos de un usuario para el panel admin.
// Columnas: ID | Nombre | Documento | Correo | Rol | Estado | Acciones (Ver, Editar, Cambiar rol, Activar/Desactivar, Eliminar)
function crearFilaUsuario(usuario, indice) {
    const fila = document.createElement('tr');

    // Columna #
    const tdNum = document.createElement('td');
    tdNum.textContent = usuario.id;
    fila.appendChild(tdNum);

    // Columna Nombre
    const tdNombre = document.createElement('td');
    tdNombre.textContent = usuario.name;
    fila.appendChild(tdNombre);

    // Columna Documento
    const tdDoc = document.createElement('td');
    tdDoc.textContent = usuario.documento || usuario.id;
    fila.appendChild(tdDoc);

    // Columna Correo
    const tdEmail = document.createElement('td');
    tdEmail.textContent = usuario.email;
    fila.appendChild(tdEmail);

    // Columna Rol (badge visual)
    const tdRol = document.createElement('td');
    tdRol.className = 'col-rol';
    tdRol.appendChild(crearBadgeRol(usuario.role));
    fila.appendChild(tdRol);

    // Columna Estado (badge activo/inactivo)
    const tdEstado = document.createElement('td');
    tdEstado.className = 'col-estado';
    tdEstado.appendChild(crearBadgeEstado(usuario.is_active));
    fila.appendChild(tdEstado);

    // Columna Acciones
    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'acciones-columna';

    // Botón Ver / Asignar
    tdAcciones.appendChild(crearBotonIcono('eye', 'Ver y asignar tareas', 'btn-accion--azul',
        function() { _pendingVerUsuario = usuario; ir(RUTAS.ADMIN.VER_USUARIO + '/' + usuario.id); }
    ));

    // Botón Editar datos
    tdAcciones.appendChild(crearBotonIcono('pencil', 'Editar usuario', 'btn-accion--amarillo',
        function() { _pendingEditarUsuario = usuario; ir(RUTAS.ADMIN.EDITAR_USUARIO + '/' + usuario.id); }
    ));

    // Botón Cambiar rol (mini-dropdown)
    tdAcciones.appendChild(crearBotonIcono('user-check', 'Cambiar rol', 'btn-accion--azul',
        function() { _pendingCambiarRol = { usuario, fila }; ir(RUTAS.ADMIN.CAMBIAR_ROL + '/' + usuario.id); }
    ));

    // Botón Desactivar o Activar según estado actual — modal mejorado con motivo obligatorio
    if (usuario.is_active === 1 || usuario.is_active === true) {
        tdAcciones.appendChild(crearBotonIcono('user-x', 'Desactivar usuario', 'btn-accion--gris',
            function() { _pendingDesactivar = { usuario, tdEstado }; ir(RUTAS.ADMIN.DESACTIVAR + '/' + usuario.id); }
        ));
    } else {
        tdAcciones.appendChild(crearBotonIcono('user-check', 'Activar usuario', 'btn-accion--verde',
            function() { _pendingActivar = { usuario, tdEstado }; ir(RUTAS.ADMIN.ACTIVAR + '/' + usuario.id); }
        ));
    }

    // Botón Eliminar — modal mejorado con modo normal/forzoso y motivo obligatorio
    tdAcciones.appendChild(crearBotonIcono('trash-2', 'Eliminar permanentemente', 'btn-accion--rojo',
        function() {
            const estaActivo = usuario.is_active === 1 || usuario.is_active === true;
            _pendingEliminarUsuario = { usuario, fila, estaActivo };
            ir(RUTAS.ADMIN.ELIMINAR_USUARIO + '/' + usuario.id);
        }
    ));

    fila.appendChild(tdAcciones);
    return fila;
}

// Abre un modal con las opciones de rol disponibles para cambiar el rol del usuario.
// Muestra tres tarjetas: Estudiante, Instructor y Administrador; la actual está desactivada.
function abrirDropdownRol(usuario, filaEl) {
    // Cerrar modal de rol si ya existe
    const anteriorOverlay = document.getElementById('modalCambiarRolOverlay');
    if (anteriorOverlay) anteriorOverlay.remove();

    const rolActualTexto = { admin: 'Administrador', instructor: 'Instructor', user: 'Estudiante' };

    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay';
    overlay.id        = 'modalCambiarRolOverlay';

    const modal = document.createElement('div');
    modal.className = 'modal-usuario modal-rol--v2';

    // ── HEADER ────────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'modal-editar__header';

    const iconoBadge = document.createElement('div');
    iconoBadge.className = 'modal-editar__icono-badge modal-editar__icono-badge--rol';
    iconoBadge.appendChild(crearIconoLucide('shield-check'));

    const infoBloque = document.createElement('div');
    infoBloque.className = 'modal-editar__info';

    const titulo = document.createElement('h2');
    titulo.className   = 'modal-editar__titulo';
    titulo.textContent = 'Cambiar rol';

    const subtitulo = document.createElement('p');
    subtitulo.className   = 'modal-editar__subtitulo';
    subtitulo.textContent = `${usuario.name} · Rol actual: ${rolActualTexto[usuario.role] || usuario.role}`;

    infoBloque.appendChild(titulo);
    infoBloque.appendChild(subtitulo);

    const btnCerrar = document.createElement('button');
    btnCerrar.className = 'modal-v2__cerrar';
    btnCerrar.type      = 'button';
    btnCerrar.title     = 'Cerrar';
    btnCerrar.appendChild(crearIconoLucide('x'));
    btnCerrar.addEventListener('click', function() {
        overlay.remove();
        if (window.location.hash.slice(1).startsWith(RUTAS.ADMIN.CAMBIAR_ROL)) volverDeModal();
    });

    header.appendChild(iconoBadge);
    header.appendChild(infoBloque);
    header.appendChild(btnCerrar);
    modal.appendChild(header);

    // ── CUERPO: opciones de rol ───────────────────────────────────────────────
    const cuerpo = document.createElement('div');
    cuerpo.className = 'modal-rol__cuerpo';

    const descripcion = document.createElement('p');
    descripcion.className   = 'modal-rol__descripcion';
    descripcion.textContent = 'Selecciona el nuevo rol que tendrá este usuario en el sistema:';
    cuerpo.appendChild(descripcion);

    const rolesInfo = [
        {
            valor: 'user',
            texto: 'Estudiante',
            desc:  'Puede ver y completar las tareas que le asignen.',
            icono: 'graduation-cap',
            clase: 'modal-rol__opcion--estudiante',
        },
        {
            valor: 'instructor',
            texto: 'Instructor',
            desc:  'Puede gestionar tareas y supervisar a los estudiantes.',
            icono: 'book-open',
            clase: 'modal-rol__opcion--instructor',
        },
        {
            valor: 'admin',
            texto: 'Administrador',
            desc:  'Acceso completo: usuarios, tareas y configuración.',
            icono: 'shield',
            clase: 'modal-rol__opcion--admin',
        },
    ];

    const listaRoles = document.createElement('div');
    listaRoles.className = 'modal-rol__lista';

    rolesInfo.forEach(function(rol) {
        const esActual = rol.valor === usuario.role;

        const card = document.createElement('button');
        card.type      = 'button';
        card.className = `modal-rol__opcion ${rol.clase}${esActual ? ' modal-rol__opcion--activo' : ''}`;
        card.disabled  = esActual;

        const iconoWrap = document.createElement('div');
        iconoWrap.className = 'modal-rol__opcion-icono';
        iconoWrap.appendChild(crearIconoLucide(rol.icono));

        const textoWrap = document.createElement('div');
        textoWrap.className = 'modal-rol__opcion-texto';

        const nombreRol = document.createElement('span');
        nombreRol.className   = 'modal-rol__opcion-nombre';
        nombreRol.textContent = rol.texto;

        const descRol = document.createElement('span');
        descRol.className   = 'modal-rol__opcion-desc';
        descRol.textContent = esActual ? `${rol.desc} (rol actual)` : rol.desc;

        textoWrap.appendChild(nombreRol);
        textoWrap.appendChild(descRol);

        if (esActual) {
            const chipActual = document.createElement('span');
            chipActual.className   = 'modal-rol__chip-actual';
            chipActual.textContent = 'Actual';
            card.appendChild(iconoWrap);
            card.appendChild(textoWrap);
            card.appendChild(chipActual);
        } else {
            card.appendChild(iconoWrap);
            card.appendChild(textoWrap);
            card.addEventListener('click', async function() {
                overlay.remove();
                if (window.location.hash.slice(1).startsWith(RUTAS.ADMIN.CAMBIAR_ROL)) volverDeModal();
                try {
                    await cambiarRolUsuario(usuario.id, rol.valor);
                    await mostrarNotificacion(`Rol de ${usuario.name} → ${rol.texto}`, 'exito');
                    registrarEvento('rol_cambiado', `Rol de ${usuario.name} cambiado a ${rol.texto}`);
                    renderizarAuditoria(document.getElementById('auditoriaContenedor'));
                    cargarTablaUsuarios();
                } catch (error) {
                    await mostrarNotificacion('No se pudo cambiar el rol', 'error');
                }
            });
        }

        listaRoles.appendChild(card);
    });

    cuerpo.appendChild(listaRoles);
    modal.appendChild(cuerpo);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (window.lucide) window.lucide.createIcons();

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            overlay.remove();
            if (window.location.hash.slice(1).startsWith(RUTAS.ADMIN.CAMBIAR_ROL)) volverDeModal();
        }
    });
}

// ── MODAL EDITAR USUARIO ──────────────────────────────────────────────────────

// Abre el modal para editar los datos básicos de un usuario: documento, nombre y correo.
// Solo el administrador puede editar usuarios. El instructor solo puede verlos.
async function abrirModalEditarUsuario(usuario) {
    cerrarModalEditarUsuarioExistente();

    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay';
    overlay.id        = 'modalEditarUsuarioOverlay';

    const modal = document.createElement('div');
    modal.className = 'modal-usuario modal-editar--v2';

    // ── HEADER ────────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'modal-editar__header';

    // Ícono de edición en lugar de avatar
    const iconoBadge = document.createElement('div');
    iconoBadge.className = 'modal-editar__icono-badge';
    iconoBadge.appendChild(crearIconoLucide('user-pen'));

    // Info
    const infoBloque = document.createElement('div');
    infoBloque.className = 'modal-editar__info';

    const titulo = document.createElement('h2');
    titulo.className   = 'modal-editar__titulo';
    titulo.textContent = `Editando usuario`;

    const subtitulo = document.createElement('p');
    subtitulo.className   = 'modal-editar__subtitulo';
    subtitulo.textContent = usuario.name;

    infoBloque.appendChild(titulo);
    infoBloque.appendChild(subtitulo);

    // Botón cerrar X
    const btnCerrar = document.createElement('button');
    btnCerrar.className = 'modal-v2__cerrar';
    btnCerrar.type      = 'button';
    btnCerrar.title     = 'Cerrar';
    btnCerrar.appendChild(crearIconoLucide('x'));
    btnCerrar.addEventListener('click', cerrarModalEditarUsuarioExistente);

    header.appendChild(iconoBadge);
    header.appendChild(infoBloque);
    header.appendChild(btnCerrar);
    modal.appendChild(header);

    // ── CUERPO: formulario ────────────────────────────────────────────────────
    const cuerpo = document.createElement('div');
    cuerpo.className = 'modal-editar__cuerpo';

    const formEditar = document.createElement('form');
    formEditar.className = 'modal-editar__form';

    // Helper para crear campos del form
    function crearCampo(id, labelText, value, placeholder) {
        const grupo = document.createElement('div');
        grupo.className = 'modal-v2__campo';

        const label = document.createElement('label');
        label.setAttribute('for', id);
        label.className   = 'modal-v2__label';
        label.textContent = labelText;

        const input = document.createElement('input');
        input.type        = 'text';
        input.id          = id;
        input.className   = 'form__input';
        input.placeholder = placeholder;
        input.value       = value || '';

        grupo.appendChild(label);
        grupo.appendChild(input);
        return { grupo, input };
    }

    const { grupo: grupoDoc,    input: inputDoc    } = crearCampo('editar-usuario-documento', 'Número de documento', usuario.documento, 'Ej: 1097497124');
    const { grupo: grupoNombre, input: inputNombre } = crearCampo('editar-usuario-nombre',    'Nombre completo',     usuario.name,      'Ej: Karol Torres');
    const { grupo: grupoEmail,  input: inputEmail  } = crearCampo('editar-usuario-email',     'Correo electrónico',  usuario.email,     'Ej: usuario@correo.com');

    // Botón guardar
    const btnGuardar = document.createElement('button');
    btnGuardar.type      = 'submit';
    btnGuardar.className = 'modal-v2__btn-submit modal-v2__btn-submit--admin';

    const iconoGuardar = crearIconoLucide('save');
    const spanGuardar  = document.createElement('span');
    spanGuardar.textContent = 'Guardar Cambios';

    btnGuardar.appendChild(iconoGuardar);
    btnGuardar.appendChild(spanGuardar);

    formEditar.appendChild(grupoDoc);
    formEditar.appendChild(grupoNombre);
    formEditar.appendChild(grupoEmail);
    formEditar.appendChild(btnGuardar);

    formEditar.addEventListener('submit', async function(event) {
        event.preventDefault();

        const valido = await validarFormularioUsuario({
            docInput:   inputDoc,
            nameInput:  inputNombre,
            emailInput: inputEmail,
            docError:   null,
            nameError:  null,
            emailError: null,
        });
        if (!valido) return;

        const documento = inputDoc.value.trim();
        const nombre    = inputNombre.value.trim();
        const email     = inputEmail.value.trim();

        const usuarioActualizado = await actualizarUsuario(usuario.id, { documento, name: nombre, email });

        if (usuarioActualizado) {
            cerrarModalEditarUsuarioExistente();
            await mostrarNotificacion(`${nombre} fue actualizado correctamente`, 'exito');
            registrarEvento('rol_cambiado', `Datos actualizados: ${nombre}`);
            renderizarAuditoria(document.getElementById('auditoriaContenedor'));
            cargarTablaUsuarios();
        } else {
            await mostrarNotificacion('Error al actualizar el usuario', 'error');
        }
    });

    cuerpo.appendChild(formEditar);
    modal.appendChild(cuerpo);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (window.lucide) window.lucide.createIcons();

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) cerrarModalEditarUsuarioExistente();
    });
}

// Cierra el modal de edición de usuario si está abierto y vuelve a la ruta anterior
function cerrarModalEditarUsuarioExistente() {
    // Buscamos el overlay del modal de edición por su ID único
    const existing = document.getElementById('modalEditarUsuarioOverlay');
    if (existing) {
        // Eliminamos el modal del DOM completamente
        existing.remove();
        // Si la URL actual apunta a la ruta de editar usuario, volvemos a la ruta anterior
        if (window.location.hash.slice(1).startsWith(RUTAS.ADMIN.EDITAR_USUARIO)) volverDeModal();
    }
}

// ── DASHBOARD LOCAL ──────────────────────────────────────────────────────────
// Recalcula y actualiza los contadores del dashboard usando las tareas en memoria,
// sin hacer ninguna petición al servidor. Se usa tras editar o eliminar una tarea
// para que el cambio se refleje de inmediato sin esperar al backend.
function actualizarDashboardLocal() {
    const el = {
        total:      document.getElementById('dashboardTotal'),
        pendiente:  document.getElementById('dashboardPendiente'),
        progreso:   document.getElementById('dashboardProgreso'),
        aprobacion: document.getElementById('dashboardAprobacion'),
        completada: document.getElementById('dashboardCompletada'),
        reprobada:  document.getElementById('dashboardReprobada'),
    };
    if (!el.total) return;

    const pendientes  = todasLasTareas.filter(t => t.status === 'pendiente').length;
    const enProgreso  = todasLasTareas.filter(t => t.status === 'en_progreso').length;
    const aprobacion  = todasLasTareas.filter(t => t.status === 'pendiente_aprobacion').length;
    const completadas = todasLasTareas.filter(t => t.status === 'completada').length;
    const reprobadas  = todasLasTareas.filter(t => t.status === 'reprobada').length;

    el.total.textContent      = todasLasTareas.length;
    el.pendiente.textContent  = pendientes;
    el.progreso.textContent   = enProgreso;
    if (el.aprobacion) el.aprobacion.textContent = aprobacion;
    el.completada.textContent = completadas;
    if (el.reprobada)  el.reprobada.textContent  = reprobadas;
}

// ── TABLA TAREAS ADMIN ────────────────────────────────────────────────────────

// Arreglo en memoria que guarda todas las tareas del sistema sin ningún filtro aplicado.
// Se actualiza con cargarTodasLasTareas y se filtra con aplicarFiltrosAdmin.
let todasLasTareas = [];

// Carga todas las tareas del servidor y las muestra en la tabla del admin aplicando filtros
export async function cargarTodasLasTareas() {
    // Obtenemos todas las tareas del backend y las guardamos en la variable local
    const tareas = await obtenerTodasLasTareas();
    todasLasTareas = tareas || [];
    // Aplicamos los filtros activos para actualizar la vista de la tabla
    aplicarFiltrosAdmin();
}

// Filtra y muestra las tareas del admin según el estado, el usuario y el orden seleccionados
export function aplicarFiltrosAdmin() {
    const tbody         = document.getElementById('adminTasksTableBody');
    const contadorEl    = document.getElementById('adminTasksCount');
    const filtroEstado  = document.getElementById('adminFiltroEstado');
    const filtroUsuario = document.getElementById('adminFiltroUsuario');
    const ordenSelect   = document.getElementById('adminOrdenSelect');

    if (!tbody) return;

    const estado  = filtroEstado  ? filtroEstado.value  : '';
    const termino = filtroUsuario ? filtroUsuario.value  : '';
    const orden   = ordenSelect   ? ordenSelect.value    : '';

    let resultado = filtrarTareas(todasLasTareas, estado, termino);
    resultado     = ordenarTareas(resultado, orden);

    // Vaciar tbody con removeChild para respetar la regla del proyecto
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (contadorEl) {
        contadorEl.textContent = `${resultado.length} ${resultado.length === 1 ? 'tarea' : 'tareas'}`;
    }

    if (resultado.length === 0) {
        const fila = document.createElement('tr');
        const td   = document.createElement('td');
        td.colSpan        = 7;
        td.textContent    = 'No hay tareas que coincidan con los filtros';
        td.style.textAlign = 'center';
        td.style.color    = '#9ca3af';
        fila.appendChild(td);
        tbody.appendChild(fila);
        return;
    }

    resultado.forEach(function(tarea, indice) {
        tbody.appendChild(crearFilaTareaAdmin(tarea, indice));
    });
    // Inicializar íconos Lucide después de insertar TODAS las filas al DOM
    if (window.lucide) window.lucide.createIcons();
}

// Convierte el valor técnico del estado de una tarea al texto legible en español.
// Parámetro estado: valor interno como "en_progreso" o "pendiente_aprobacion"
// Retorna el texto que se muestra en los badges de estado de la interfaz
function formatearEstado(estado) {
    const mapa = {
        pendiente:            'Pendiente',
        en_progreso:          'En Progreso',
        // Estado que pone el usuario cuando considera que terminó su trabajo
        pendiente_aprobacion: 'Por aprobar',
        completada:           'Completada',
        // Estado asignado automáticamente cuando la nota es < 70
        reprobada:            'Reprobada',
    };
    return mapa[estado] || estado;
}

// Abre el modal de edición de tareas para el administrador.
// El admin puede editar título, descripción, estado y comentario, pero no puede calificar.
// Al guardar con éxito, actualiza la tabla y el dashboard sin recargar toda la página.
function manejarEdicionTareaAdmin(tarea) {
    mostrarModalEdicion(tarea, false, 'admin');

    // Admin no puede calificar — ocultar campos exclusivos del instructor
    const _gradeGrupoA       = document.getElementById('editGradeGrupo');
    const _gradeReasonGrupoA = document.getElementById('editGradeReasonGrupo');
    const _chkCalifGrupoA    = document.getElementById('editChkCalifGrupo');
    if (_gradeGrupoA)       _gradeGrupoA.style.display       = 'none';
    if (_gradeReasonGrupoA) _gradeReasonGrupoA.style.display = 'none';
    if (_chkCalifGrupoA)    _chkCalifGrupoA.style.display    = 'none';

    // Resetear select de estado siempre primero, luego bloquear solo si ya está calificada
    const selectEstadoA = document.getElementById('editTaskStatus');
    if (selectEstadoA) {
        selectEstadoA.disabled      = false;
        selectEstadoA.style.opacity = '';
        selectEstadoA.style.cursor  = '';
        if (tarea.status === 'completada' || tarea.status === 'reprobada') {
            selectEstadoA.disabled      = true;
            selectEstadoA.style.opacity = '0.6';
            selectEstadoA.style.cursor  = 'not-allowed';
        }
    }

    const formulario = document.getElementById('editTaskForm');

    async function guardarCambiosAdmin(event) {
        event.preventDefault();

        const tareaId     = document.getElementById('editTaskId').value;
        const descripcion = document.getElementById('editTaskDescription').value.trim();
        const comentEl    = document.getElementById('editTaskComment');
        const comentario  = comentEl ? comentEl.value.trim() : '';

        // ── Validación frontend centralizada — usa validarFormularioTarea
        // para que los errores aparezcan tanto en el campo como en el toast
        const inputTitulo = document.getElementById('editTaskTitle');
        const inputEstado = document.getElementById('editTaskStatus');

        const errorTitulo = inputTitulo.parentElement.querySelector('.modal-admin__error')
            || (() => {
                const el = document.createElement('span');
                el.className = 'modal-admin__error';
                inputTitulo.insertAdjacentElement('afterend', el);
                return el;
            })();
        const errorEstado = inputEstado
            ? inputEstado.parentElement.querySelector('.modal-admin__error')
            : null;

        const valido = await validarFormularioTarea({
            titleInput:  inputTitulo,
            statusInput: inputEstado,
            titleError:  errorTitulo,
            statusError: errorEstado,
        });
        if (!valido) return;

        const titulo = inputTitulo.value.trim();
        const estado = inputEstado ? inputEstado.value : '';

        const datosActualizados = {
            title:       titulo,
            description: descripcion !== '' ? descripcion : undefined,
            status:      estado,
            comment:     comentario !== '' ? comentario : undefined,
        };

        try {
            const tareaActualizada = await actualizarTarea(tareaId, datosActualizados);

            // Actualización local: modifica la tarea en memoria y repinta sin fetch
            const idx = todasLasTareas.findIndex(t => t.id.toString() === tareaId.toString());
            if (idx !== -1) {
                todasLasTareas[idx] = {
                    ...todasLasTareas[idx],
                    ...tareaActualizada,
                    // Se garantiza que el comment quede actualizado (backend + local)
                    comment: tareaActualizada.comment !== undefined
                        ? tareaActualizada.comment
                        : comentario || null,
                };
            }
            // Cerrar el modal ANTES del toast para que Swal no tenga conflicto
            ocultarModalEdicion();
            actualizarDashboardLocal();
            aplicarFiltrosAdmin();
            registrarEvento('tarea_creada', `Tarea actualizada correctamente`);
            renderizarAuditoria(document.getElementById('auditoriaContenedor'));
            await mostrarNotificacion('Tarea actualizada exitosamente', 'exito');

        } catch (err) {
            // Si el backend devolvió errores de validación, mostrarlos campo por campo
            if (err.validationErrors && err.validationErrors.length > 0) {
                err.validationErrors.forEach(({ field, message }) => {
                    const inputEl = document.getElementById(
                        field === 'title'       ? 'editTaskTitle'       :
                        field === 'description' ? 'editTaskDescription' :
                        field === 'status'      ? 'editTaskStatus'      :
                        field === 'comment'     ? 'editTaskComment'     : null
                    );
                    if (inputEl) {
                        const errEl = inputEl.parentElement.querySelector('.modal-admin__error')
                            || (() => {
                                const e = document.createElement('span');
                                e.className = 'modal-admin__error';
                                inputEl.insertAdjacentElement('afterend', e);
                                return e;
                            })();
                        errEl.textContent = message;
                        inputEl.style.borderColor = 'var(--color-error, #ef4444)';
                    }
                });
            }
            // Pequeño delay para asegurar que el DOM haya procesado el estado antes del toast
            await new Promise(r => setTimeout(r, 50));
            await mostrarNotificacion(
                err.validationErrors?.length > 0
                    ? 'Corrige los errores del formulario'
                    : 'Error al actualizar la tarea',
                'error'
            );
        } finally {
            formulario.removeEventListener('submit', guardarCambiosAdmin);
            _activeEditHandler = null;
        }
    }

    if (_activeEditHandler) formulario.removeEventListener('submit', _activeEditHandler);
    _activeEditHandler = guardarCambiosAdmin;
    formulario.addEventListener('submit', guardarCambiosAdmin);
}
// Abre el modal de edición de tareas para el instructor.
// A diferencia del admin, el instructor puede también editar la nota (grade) y el motivo.
// Al guardar, recarga las tablas del instructor y el panel de calificación.
function manejarEdicionTareaInstructor(tarea) {
    mostrarModalEdicion(tarea, false, 'instructor');

    // Campos de calificación exclusivos del instructor
    const gradeGrupo       = document.getElementById('editGradeGrupo');
    const gradeReasonGrupo = document.getElementById('editGradeReasonGrupo');
    const gradeInput       = document.getElementById('editTaskGrade');
    const gradeReasonInput = document.getElementById('editTaskGradeReason');
    const gradeError       = document.getElementById('editGradeError');
    const gradeReasonError = document.getElementById('editGradeReasonError');
    const comentarioGrupo  = document.getElementById('editCommentGrupo');

    // Limpiar errores previos
    if (gradeError)       gradeError.textContent = '';
    if (gradeReasonError) gradeReasonError.textContent = '';

    // Construir o reusar el grupo del checkbox de calificación
    let chkGrupo = document.getElementById('editChkCalifGrupo');
    if (!chkGrupo) {
        chkGrupo = document.createElement('div');
        chkGrupo.id        = 'editChkCalifGrupo';
        chkGrupo.className = 'modal-admin__group modal-admin__group--checkbox';
        const chkLabel = document.createElement('label');
        chkLabel.className = 'modal-admin__checkbox-label';
        const chkInput = document.createElement('input');
        chkInput.type      = 'checkbox';
        chkInput.id        = 'editChkCalificar';
        chkInput.className = 'modal-admin__checkbox';
        const chkTexto = document.createTextNode(' Editar calificación de tarea');
        chkLabel.appendChild(chkInput);
        chkLabel.appendChild(chkTexto);
        chkGrupo.appendChild(chkLabel);
        // Insertar antes del grupo de nota
        if (gradeGrupo && gradeGrupo.parentNode) {
            gradeGrupo.parentNode.insertBefore(chkGrupo, gradeGrupo);
        }
    }

    const chkCalificar = document.getElementById('editChkCalificar');

    // Estado inicial: el checkbox solo se muestra si la tarea YA tiene calificación
    // Si no está calificada, el grupo entero se oculta — el instructor no puede editar
    // una calificación que no existe todavía (para eso está el panel de calificación)
    const yaCalificada = tarea.grade !== null && tarea.grade !== undefined;
    if (chkGrupo) chkGrupo.style.display = yaCalificada ? '' : 'none';
    if (chkCalificar) chkCalificar.checked = yaCalificada;

    function actualizarVisibilidadCalif() {
        const activo = chkCalificar && chkCalificar.checked;
        if (gradeGrupo)       gradeGrupo.style.display       = activo ? '' : 'none';
        if (gradeReasonGrupo) gradeReasonGrupo.style.display = activo ? '' : 'none';
        if (comentarioGrupo)  comentarioGrupo.style.display  = activo ? '' : 'none';
        // Limpiar errores al cambiar estado
        if (!activo) {
            if (gradeError)       gradeError.textContent = '';
            if (gradeReasonError) gradeReasonError.textContent = '';
        }
    }

    if (chkCalificar) chkCalificar.addEventListener('change', actualizarVisibilidadCalif);
    actualizarVisibilidadCalif();

    // Pre-rellenar la nota actual si existe
    if (gradeInput) gradeInput.value = yaCalificada ? tarea.grade : '';
    if (gradeReasonInput) gradeReasonInput.value = '';

    const formulario = document.getElementById('editTaskForm');
    if (!formulario) return;

    async function guardarCambiosInstructor(event) {
        event.preventDefault();

        const tareaId     = document.getElementById('editTaskId').value;
        const titulo      = document.getElementById('editTaskTitle').value.trim();
        const descripcion = document.getElementById('editTaskDescription').value.trim();
        const estado      = document.getElementById('editTaskStatus').value;

        // Leer nota y motivo SOLO si el checkbox de calificación está activo
        const chkActivo    = document.getElementById('editChkCalificar');
        const calificando  = chkActivo && chkActivo.checked;
        const gradeValStr  = calificando && gradeInput ? gradeInput.value.trim() : '';
        const gradeReason  = calificando && gradeReasonInput ? gradeReasonInput.value.trim() : '';
        const comentEl     = document.getElementById('editTaskComment');
        const comentario   = calificando && comentEl ? comentEl.value.trim() || undefined : undefined;

        let gradeVal   = undefined;
        let hayErrores = false;

        if (calificando) {
            // Validar nota — obligatoria cuando el checkbox está activo
            if (gradeValStr === '') {
                if (gradeError) gradeError.textContent = 'La nota es obligatoria para calificar.';
                hayErrores = true;
            } else {
                const n = parseFloat(gradeValStr);
                if (isNaN(n) || n < 0 || n > 100) {
                    if (gradeError) gradeError.textContent = 'La nota debe ser un número entre 0 y 100.';
                    hayErrores = true;
                } else {
                    gradeVal = n;
                    if (gradeError) gradeError.textContent = '';
                }
            }
            // Motivo obligatorio (mín 10 caracteres y al menos una letra)
            if (gradeReason.length < 10) {
                if (gradeReasonError) gradeReasonError.textContent = 'El motivo es obligatorio (mín. 10 caracteres).';
                hayErrores = true;
            } else if (!/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(gradeReason)) {
                if (gradeReasonError) gradeReasonError.textContent = 'El motivo debe contener al menos una letra.';
                hayErrores = true;
            } else {
                if (gradeReasonError) gradeReasonError.textContent = '';
            }
        }

        if (hayErrores) {
            await mostrarNotificacion('Corrige los errores antes de guardar', 'error');
            return;
        }

        const datosActualizados = {
            title:       titulo,
            description: descripcion !== '' ? descripcion : undefined,
            status:      estado,
            comment:     comentario,
        };

        // Solo enviar grade si el checkbox estaba activo y se ingresó valor válido
        if (calificando && gradeVal !== undefined) {
            // Determinar el estado según la nota: < 70 = reprobada, >= 70 = completada
            const rendimiento = calcularRendimiento(gradeVal);
            datosActualizados.grade       = gradeVal;
            datosActualizados.gradeReason = gradeReason;
            // Sobreescribir el estado con el resultado de la calificación
            datosActualizados.status = rendimiento.estado;
        }

        const tareaActualizada = await actualizarTarea(tareaId, datosActualizados);

        if (tareaActualizada) {
            if (gradeGrupo)       gradeGrupo.style.display       = 'none';
            if (gradeReasonGrupo) gradeReasonGrupo.style.display = 'none';
            if (comentarioGrupo)  comentarioGrupo.style.display  = 'none';
            const chkEl = document.getElementById('editChkCalificar');
            if (chkEl) chkEl.checked = false;
            ocultarModalEdicion();
            // Recargar tabla completa para que los closures tengan datos frescos
            // (incluyendo el grade recién guardado, visible en editar y en Ver tarea)
            cargarTareasInstructor();
            cargarDashboardInstructor();
            cargarTablaUsuariosInstructor();
            // Refrescar panel de calificación INMEDIATAMENTE (sin await)
            // para que si la tarea pasó a pendiente_aprobacion aparezca de una vez
            cargarPanelCalificacion();
            // Refrescar calendario sin bloquear la UI
            obtenerTodasLasTareas().then(function(t) {
                if (t) crearCalendario({ contenedorId: 'instrCalendario', paleta: 'instructor', soloLectura: false, tareas: t });
            }).catch(function() {});
            mostrarNotificacion('Tarea actualizada exitosamente', 'exito'); // sin await
        } else {
            await mostrarNotificacion('Error al actualizar la tarea', 'error');
        }

        formulario.removeEventListener('submit', guardarCambiosInstructor);
        _activeEditHandler = null;
    }

    if (_activeEditHandler) formulario.removeEventListener('submit', _activeEditHandler);
    _activeEditHandler = guardarCambiosInstructor;
    formulario.addEventListener('submit', guardarCambiosInstructor);
}

// Construye y retorna un elemento <tr> con los datos de una tarea para el panel del admin.
// Columnas: ID | Título | Descripción | Estado | Usuario asignado | Fecha | Acciones (Editar, Eliminar)
function crearFilaTareaAdmin(tarea, indice) {
    const fila = document.createElement('tr');

    // Celda del número identificador de la tarea en la base de datos
    const celdaNum = document.createElement('td');
    celdaNum.textContent = tarea.id;

    // Celda del título de la tarea
    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    // Celda de descripción con texto truncado y botón "Ver tarea"
    const celdaDesc = crearCeldaDescripcion(tarea);

    const celdaEstado = document.createElement('td');
    // Badge de color que muestra el estado actual de la tarea
    const badge = document.createElement('span');
    badge.classList.add('status-badge', `status-${tarea.status}`);
    badge.textContent = formatearEstado(tarea.status);
    celdaEstado.appendChild(badge);

    const celdaUsuario = document.createElement('td');
    celdaUsuario.textContent = formatearUsuariosDisplay(tarea.assignedUsersDisplay);

    // Celda de fecha y hora de creación
    const celdaFecha = document.createElement('td');
    celdaFecha.className = 'col-fecha';
    if (tarea.createdAt) {
        const fecha = new Date(tarea.createdAt);
        const dia   = fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const hora  = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const spanFecha = document.createElement('span');
        spanFecha.className   = 'fecha-celda__fecha';
        spanFecha.textContent = dia;
        const spanHora = document.createElement('span');
        spanHora.className   = 'fecha-celda__hora';
        spanHora.textContent = hora;
        celdaFecha.appendChild(spanFecha);
        celdaFecha.appendChild(spanHora);
    } else {
        celdaFecha.textContent = '—';
    }

    const celdaAcciones = document.createElement('td');
    const contenedor    = document.createElement('div');
    contenedor.classList.add('task-actions');

    // Botón Editar — circular con ícono, igual que en la tabla de usuarios
    const btnEditar = crearBotonIcono('pencil', 'Editar tarea', 'btn-accion--amarillo', function() {
        _pendingEditarTarea = tarea;
        ir(RUTAS.ADMIN.EDITAR_TAREA + '/' + tarea.id);
    });

    // Botón Eliminar — circular con ícono rojo
    const btnEliminar = crearBotonIcono('trash-2', 'Eliminar tarea', 'btn-accion--rojo', function() {
        _pendingEliminarTarea = { tarea };
        ir(RUTAS.ADMIN.ELIMINAR_TAREA + '/' + tarea.id);
    });

    contenedor.appendChild(btnEditar);
    contenedor.appendChild(btnEliminar);
    celdaAcciones.appendChild(contenedor);

    fila.appendChild(celdaNum);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDesc);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaUsuario);
    fila.appendChild(celdaFecha);
    fila.appendChild(celdaAcciones);

    return fila;
}

// ── MODAL USUARIO (admin e instructor) ───────────────────────────────────────
// Muestra un modal con el perfil del usuario seleccionado y sus tareas asignadas.
// En la columna izquierda aparecen las tareas; en la derecha, el formulario para asignar nuevas.
// Es compartido por admin e instructor, adaptando el color del botón según el rol activo.

// Abre el modal de perfil de usuario con sus tareas y el formulario de asignación
export async function abrirModalUsuario(usuario) {
    cerrarModalUsuarioExistente();

    // Determinar si el modo activo es instructor para usar los colores correctos
    const esInstructor = document.body.dataset.modo === 'instructor';

    // ── Overlay ───────────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay';
    overlay.id        = 'modalUsuarioOverlay';

    // ── Panel principal ───────────────────────────────────────────────────────
    const modal = document.createElement('div');
    modal.className = 'modal-usuario modal-usuario--v2';

    // ── HEADER ────────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'modal-v2__header';

    // Avatar con inicial del nombre
    const avatar = document.createElement('div');
    avatar.className = esInstructor ? 'modal-v2__avatar modal-v2__avatar--instructor' : 'modal-v2__avatar modal-v2__avatar--admin';
    avatar.textContent = usuario.name.charAt(0).toUpperCase();

    // Info del usuario
    const infoBloque = document.createElement('div');
    infoBloque.className = 'modal-v2__info';

    const titulo = document.createElement('h2');
    titulo.className   = 'modal-v2__titulo';
    titulo.textContent = usuario.name;

    const metaFila = document.createElement('div');
    metaFila.className = 'modal-v2__meta';

    const rolMap = { admin: 'Administrador', instructor: 'Instructor', user: 'Estudiante' };
    const chipRol = document.createElement('span');
    chipRol.className   = 'modal-v2__chip';
    chipRol.textContent = rolMap[usuario.role] || usuario.role;

    const chipDoc = document.createElement('span');
    chipDoc.className   = 'modal-v2__chip modal-v2__chip--gris';
    chipDoc.textContent = `Doc: ${usuario.documento || usuario.id}`;

    const chipEmail = document.createElement('span');
    chipEmail.className   = 'modal-v2__chip modal-v2__chip--gris';
    chipEmail.textContent = usuario.email || '';

    metaFila.appendChild(chipRol);
    metaFila.appendChild(chipDoc);
    if (usuario.email) metaFila.appendChild(chipEmail);

    // Chip de calificación promedio — visible para admin e instructor cuando el usuario es estudiante
    // Usa el campo grade (nota real) en lugar del comment para calcular el promedio
    if ((esInstructor || document.body.dataset.modo === 'admin') && usuario.role === 'user') {
        const tareasUsuario = await obtenerTareasDeUsuario(usuario.id);
        if (tareasUsuario) {
            const notas = tareasUsuario
                .filter(t => t.grade !== null && t.grade !== undefined)
                .map(t => Number(t.grade))
                .filter(n => !isNaN(n) && n >= 0 && n <= 100);
            if (notas.length > 0) {
                const promedio = (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1);
                const r = calcularRendimiento(parseFloat(promedio));
                const chipCalif = document.createElement('span');
                chipCalif.className = 'modal-v2__chip';
                chipCalif.style.cssText = `background:${r.bg};color:${r.color};font-weight:700;display:inline-flex;align-items:center;gap:4px;`;
                const iconoStar = crearIconoLucide('star');
                iconoStar.style.cssText = 'width:12px;height:12px;flex-shrink:0;';
                chipCalif.appendChild(iconoStar);
                chipCalif.appendChild(document.createTextNode(`Promedio: ${promedio}/100`));
                metaFila.appendChild(chipCalif);
                const chipRend = document.createElement('span');
                chipRend.className = 'modal-v2__chip';
                chipRend.style.cssText = `background:transparent;color:${r.color};font-weight:600;font-size:0.75rem;`;
                chipRend.textContent = r.rendimiento;
                metaFila.appendChild(chipRend);
            } else {
                // Tiene tareas completadas pero ninguna calificada aún
                const chipSC = document.createElement('span');
                chipSC.className = 'modal-v2__chip';
                chipSC.style.cssText = 'background:#f3f4f6;color:#6b7280;font-style:italic;';
                chipSC.textContent = 'Sin calificaciones';
                metaFila.appendChild(chipSC);
            }
        }
    }

    infoBloque.appendChild(titulo);
    infoBloque.appendChild(metaFila);

    // Botón cerrar
    const btnCerrar = document.createElement('button');
    btnCerrar.className   = 'modal-v2__cerrar';
    btnCerrar.type        = 'button';
    btnCerrar.title       = 'Cerrar';
    btnCerrar.appendChild(crearIconoLucide('x'));
    btnCerrar.addEventListener('click', cerrarModalUsuarioExistente);

    header.appendChild(avatar);
    header.appendChild(infoBloque);
    header.appendChild(btnCerrar);
    modal.appendChild(header);

    // ── CUERPO: dos columnas ──────────────────────────────────────────────────
    const cuerpo = document.createElement('div');
    cuerpo.className = 'modal-v2__cuerpo';

    // ── Columna izquierda: tareas asignadas ───────────────────────────────────
    const colTareas = document.createElement('div');
    colTareas.className = 'modal-v2__col modal-v2__col--tareas';

    const encabezadoTareas = document.createElement('div');
    encabezadoTareas.className = 'modal-v2__col-header';

    const iconoTareas = crearIconoLucide('clipboard-list');
    const tituloTareas = document.createElement('h3');
    tituloTareas.className   = 'modal-v2__col-titulo';
    tituloTareas.textContent = 'Tareas asignadas';

    encabezadoTareas.appendChild(iconoTareas);
    encabezadoTareas.appendChild(tituloTareas);
    colTareas.appendChild(encabezadoTareas);

    // Cargar tareas
    const tareas = await obtenerTareasDeUsuario(usuario.id);

    // Contador de tareas
    const contador = document.createElement('span');
    contador.className   = 'modal-v2__contador';
    const cantidad       = tareas ? tareas.length : 0;
    contador.textContent = `${cantidad} ${cantidad === 1 ? 'tarea' : 'tareas'}`;
    encabezadoTareas.appendChild(contador);

    // Lista de tareas con scroll propio
    const listaTareas = document.createElement('div');
    listaTareas.className = 'modal-v2__lista-tareas';

    if (!tareas || tareas.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'modal-v2__vacio';
        const iconoVacio = crearIconoLucide('inbox');
        const textoVacio = document.createElement('span');
        textoVacio.textContent = 'Sin tareas asignadas';
        vacio.appendChild(iconoVacio);
        vacio.appendChild(textoVacio);
        listaTareas.appendChild(vacio);
    } else {
        tareas.forEach(function(tarea) {
            const item = document.createElement('div');
            item.className = 'modal-v2__tarea-item';

            // Título de la tarea — siempre visible arriba
            const nombre = document.createElement('span');
            nombre.className   = 'modal-v2__tarea-nombre';
            nombre.textContent = tarea.title;
            item.appendChild(nombre);

            // Fila de badges: estado + calificación (siempre visible)
            const filaBadges = document.createElement('div');
            filaBadges.className = 'modal-v2__tarea-badges';

            const badge = document.createElement('span');
            badge.classList.add('status-badge', `status-${tarea.status}`);
            badge.textContent = formatearEstado(tarea.status);
            filaBadges.appendChild(badge);

            // Nota o "Sin calificar" — siempre se muestra
            if (tarea.grade !== null && tarea.grade !== undefined) {
                const n = Number(tarea.grade);
                const r = calcularRendimiento(n);
                const chipNota = document.createElement('span');
                chipNota.className = 'status-badge modal-v2__badge-nota';
                chipNota.style.cssText = `background:${r.bg};color:${r.color};font-weight:700;`;
                chipNota.textContent = `${n}/100`;
                filaBadges.appendChild(chipNota);
                const chipRend = document.createElement('span');
                chipRend.className = 'modal-v2__rend-label';
                chipRend.style.cssText = `color:${r.color};font-weight:600;font-size:0.72rem;`;
                chipRend.textContent = r.rendimiento;
                filaBadges.appendChild(chipRend);
            } else {
                const chipSC = document.createElement('span');
                chipSC.className = 'status-badge';
                chipSC.style.cssText = 'background:#f3f4f6;color:#6b7280;font-style:italic;';
                chipSC.textContent = 'Sin calificar';
                filaBadges.appendChild(chipSC);
            }

            item.appendChild(filaBadges);
            listaTareas.appendChild(item);
        });
    }

    colTareas.appendChild(listaTareas);
    cuerpo.appendChild(colTareas);

    // ── Divisor visual ────────────────────────────────────────────────────────
    const divisor = document.createElement('div');
    divisor.className = 'modal-v2__divisor';
    cuerpo.appendChild(divisor);

    // ── Columna derecha: formulario de asignación ─────────────────────────────
    const colForm = document.createElement('div');
    colForm.className = 'modal-v2__col modal-v2__col--form';

    const encabezadoForm = document.createElement('div');
    encabezadoForm.className = 'modal-v2__col-header';

    const iconoForm = crearIconoLucide('plus-circle');
    const tituloForm = document.createElement('h3');
    tituloForm.className   = 'modal-v2__col-titulo';
    tituloForm.textContent = 'Asignar nueva tarea';

    encabezadoForm.appendChild(iconoForm);
    encabezadoForm.appendChild(tituloForm);
    colForm.appendChild(encabezadoForm);

    const formAsignar = document.createElement('form');
    formAsignar.className = 'modal-v2__form';

    // ── Campo Título ──────────────────────────────────────────────────────────
    const grupoTitulo = document.createElement('div');
    grupoTitulo.className = 'modal-v2__campo';

    const labelTitulo = document.createElement('label');
    labelTitulo.setAttribute('for', 'modal-tarea-titulo');
    labelTitulo.className   = 'modal-v2__label';
    labelTitulo.textContent = 'Título';

    const inputTitulo = document.createElement('input');
    inputTitulo.type        = 'text';
    inputTitulo.id          = 'modal-tarea-titulo';
    inputTitulo.className   = 'form__input';
    inputTitulo.placeholder = 'Ej: Revisar documentación del proyecto';

    grupoTitulo.appendChild(labelTitulo);
    grupoTitulo.appendChild(inputTitulo);

    // ── Campo Descripción ─────────────────────────────────────────────────────
    const grupoDesc = document.createElement('div');
    grupoDesc.className = 'modal-v2__campo';

    const labelDesc = document.createElement('label');
    labelDesc.setAttribute('for', 'modal-tarea-desc');
    labelDesc.className = 'modal-v2__label';
    labelDesc.textContent = 'Descripción ';
    const spanOpc = document.createElement('span');
    spanOpc.className   = 'form__label--opcional';
    spanOpc.textContent = '(opcional)';
    labelDesc.appendChild(spanOpc);

    const textareaDesc = document.createElement('textarea');
    textareaDesc.id          = 'modal-tarea-desc';
    textareaDesc.className   = 'form__input form__textarea';
    textareaDesc.rows        = 2;
    textareaDesc.placeholder = 'Descripción detallada de la tarea...';

    grupoDesc.appendChild(labelDesc);
    grupoDesc.appendChild(textareaDesc);

    // ── Campo Estado ──────────────────────────────────────────────────────────
    const grupoEstado = document.createElement('div');
    grupoEstado.className = 'modal-v2__campo';

    const labelEstado = document.createElement('label');
    labelEstado.setAttribute('for', 'modal-tarea-estado');
    labelEstado.className   = 'modal-v2__label';
    labelEstado.textContent = 'Estado inicial';

    const selectEstado = document.createElement('select');
    selectEstado.id        = 'modal-tarea-estado';
    selectEstado.className = 'form__input';

    const optDefault = document.createElement('option');
    optDefault.value = ''; optDefault.disabled = true; optDefault.selected = true;
    optDefault.textContent = 'Selecciona un estado';
    selectEstado.appendChild(optDefault);

    // Solo se permiten estados iniciales al crear — el usuario gestiona los demás
    [
        ['pendiente',   'Pendiente'],
        ['en_progreso', 'En Progreso'],
    ].forEach(([v, t]) => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = t;
        selectEstado.appendChild(opt);
    });

    grupoEstado.appendChild(labelEstado);
    grupoEstado.appendChild(selectEstado);

    // ── Campo Comentario ──────────────────────────────────────────────────────
    const grupoComentario = document.createElement('div');
    grupoComentario.className = 'modal-v2__campo';

    const labelComentario = document.createElement('label');
    labelComentario.setAttribute('for', 'modal-tarea-comentario');
    labelComentario.className = 'modal-v2__label';
    labelComentario.textContent = 'Comentario ';
    const spanOpcComentario = document.createElement('span');
    spanOpcComentario.className   = 'form__label--opcional';
    spanOpcComentario.textContent = '(opcional)';
    labelComentario.appendChild(spanOpcComentario);

    const textareaComentario = document.createElement('textarea');
    textareaComentario.id          = 'modal-tarea-comentario';
    textareaComentario.className   = 'form__input form__textarea';
    textareaComentario.rows        = 2;
    textareaComentario.placeholder = 'Agrega un comentario inicial...';

    grupoComentario.appendChild(labelComentario);
    grupoComentario.appendChild(textareaComentario);

    // ── Botón submit ──────────────────────────────────────────────────────────
    const btnAsignar = document.createElement('button');
    btnAsignar.type      = 'submit';
    btnAsignar.className = esInstructor
        ? 'btn modal-v2__btn-submit modal-v2__btn-submit--instructor'
        : 'btn modal-v2__btn-submit modal-v2__btn-submit--admin';

    const iconoSubmit = crearIconoLucide('send');
    const spanBtn = document.createElement('span');
    spanBtn.textContent = 'Asignar Tarea';

    btnAsignar.appendChild(iconoSubmit);
    btnAsignar.appendChild(spanBtn);

    formAsignar.appendChild(grupoTitulo);
    formAsignar.appendChild(grupoDesc);
    formAsignar.appendChild(grupoEstado);
    formAsignar.appendChild(grupoComentario);
    formAsignar.appendChild(btnAsignar);

    // ── Submit handler ────────────────────────────────────────────────────────
    formAsignar.addEventListener('submit', async function(event) {
        event.preventDefault();

        const tituloVal    = inputTitulo.value.trim();
        const descVal      = textareaDesc.value.trim();
        const estadoVal    = selectEstado.value;
        const comentarioVal = textareaComentario.value.trim();

        const validoTarea = await validarFormularioTarea({
            titleInput:  inputTitulo,
            statusInput: selectEstado,
            titleError:  null,
            statusError: null,
        });
        if (!validoTarea) return;

        const datosTarea = {
            title:         tituloVal,
            description:   descVal      !== '' ? descVal      : undefined,
            status:        estadoVal,
            comment:       comentarioVal !== '' ? comentarioVal : undefined,
            assignedUsers: [Number(usuario.id)],
        };

        let tareaCreada;
        try {
            tareaCreada = await registrarTarea(datosTarea);
        } catch (errorAsignar) {
            await mostrarNotificacion(
                errorAsignar.message || 'No se pudo asignar la tarea',
                'error'
            );
            return;
        }

        if (tareaCreada) {
            cerrarModalUsuarioExistente();
            // Recargar datos según el panel activo
            if (esInstructor) {
                cargarTareasInstructor();
            } else {
                cargarTodasLasTareas();
                cargarDashboard();
            }
            await mostrarNotificacion(`Tarea "${tituloVal}" asignada correctamente`, 'exito');
            registrarEvento('tarea_creada', `Tarea asignada: "${tituloVal}"`);
            renderizarAuditoria(document.getElementById('auditoriaContenedor'));
        }
    });

    colForm.appendChild(formAsignar);
    cuerpo.appendChild(colForm);
    modal.appendChild(cuerpo);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Inicializar íconos Lucide recién creados
    if (window.lucide) window.lucide.createIcons();

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) cerrarModalUsuarioExistente();
    });
}

// Cierra el modal de perfil de usuario si está abierto y vuelve a la ruta anterior
function cerrarModalUsuarioExistente() {
    // Buscamos el overlay del modal de usuario por su ID único
    const existing = document.getElementById('modalUsuarioOverlay');
    if (existing) {
        // Eliminamos el modal del DOM completamente
        existing.remove();
        // Si la URL actual apunta a ver usuario o ver estudiante, volvemos a la ruta anterior
        const h = window.location.hash.slice(1);
        if (h.startsWith(RUTAS.ADMIN.VER_USUARIO) || h.startsWith(RUTAS.INSTRUCTOR.VER_ESTUDIANTE)) volverDeModal();
    }
}

// ── CARDS CONTRAÍBLES ─────────────────────────────────────────────────────────
// Registra el comportamiento de abrir y cerrar (toggle) en las cards de los paneles.
// Al hacer clic en el encabezado de una card: el cuerpo se muestra u oculta,
// la flecha se rota para indicar el estado, y el borde del encabezado se ajusta.
function registrarCardsContraibles() {
    // Pares de [ID del encabezado, ID del cuerpo] de cada card contraíble del sistema
    const pares = [
        // Cards del panel de administrador
        ['toggleUsuarios',          'cuerpoUsuarios'],
        ['toggleTareas',            'cuerpoTareas'],
        ['toggleCrearTareas',       'cuerpoCrearTareas'],
        // Cards del panel de instructor (misma función, distintos IDs con prefijo "instr")
        ['instrToggleCrearTareas',  'instrCuerpoCrearTareas'],
        ['instrToggleUsuarios',     'instrCuerpoUsuarios'],
        ['instrToggleTareas',       'instrCuerpoTareas'],
        // Card del panel de usuario (estudiante)
        ['toggleTareasUsuario',     'cuerpoTareasUsuario'],
    ];

    pares.forEach(function(par) {
        const encabezadoId = par[0];
        const cuerpoId     = par[1];

        const encabezado = document.getElementById(encabezadoId);
        const cuerpo     = document.getElementById(cuerpoId);

        // Si alguno de los dos no existe en el DOM se salta este par
        if (!encabezado || !cuerpo) return;

        const botonFlecha = encabezado.querySelector('.btn-toggle-card');

        // Estado inicial: todas las cards arrancan contraídas
        cuerpo.classList.add('oculto');
        if (botonFlecha) botonFlecha.classList.add('contraido');
        encabezado.classList.add('sin-borde');

        // Listener en el encabezado completo para que el clic en cualquier parte lo active
        encabezado.addEventListener('click', function() {
            // Se alterna la visibilidad del cuerpo de la card
            const estaOculto = cuerpo.classList.toggle('oculto');

            // Si está oculto la flecha apunta hacia arriba (clase contraido)
            // Si está visible la flecha apunta hacia abajo (sin clase)
            if (botonFlecha) botonFlecha.classList.toggle('contraido', estaOculto);

            // Se quita el borde inferior del encabezado cuando la card está contraída
            encabezado.classList.toggle('sin-borde', estaOculto);
        });
    });
}

// ── CARD CREAR TAREAS — DROPDOWN DE USUARIOS ──────────────────────────────────
// Bandera que indica si los listeners del dropdown ya fueron registrados.
// Evita que al llamar esta función varias veces se dupliquen los listeners.
let _dropdownListenersRegistrados = false;

// Actualiza la lista de checkboxes del dropdown sin volver a registrar los listeners del botón.
// Se llama cuando se crea un nuevo usuario y hay que reflejar el cambio en el dropdown.
async function recargarCheckboxesDropdown() {
    const btn   = document.getElementById('usuariosDropdownBtn');
    const panel = document.getElementById('usuariosDropdownPanel');
    const texto = document.getElementById('usuariosDropdownTexto');

    if (!btn || !panel || !texto) return;

    // Mensaje de carga mientras llega la respuesta del backend
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    const msgCarga = document.createElement('p');
    msgCarga.className   = 'usuarios-dropdown__cargando';
    msgCarga.textContent = 'Cargando usuarios...';
    panel.appendChild(msgCarga);

    const usuarios = await obtenerTodosLosUsuarios();

    // Limpiar mensaje de carga
    while (panel.firstChild) panel.removeChild(panel.firstChild);

    if (!usuarios || usuarios.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'usuarios-dropdown__vacio';

        const icono = document.createElement('span');
        icono.className   = 'usuarios-dropdown__vacio-icono';
        icono.appendChild(crearIconoLucide('users'));
        if (window.lucide) window.lucide.createIcons();

        const msg = document.createElement('p');
        msg.className   = 'usuarios-dropdown__vacio-texto';
        msg.textContent = 'No hay usuarios registrados';

        vacio.appendChild(icono);
        vacio.appendChild(msg);
        panel.appendChild(vacio);
        return;
    }

    // Encabezado con contador de usuarios disponibles
    const encabezado = document.createElement('div');
    encabezado.className = 'usuarios-dropdown__encabezado';
    const contador = document.createElement('span');
    contador.className   = 'usuarios-dropdown__contador';
    contador.textContent = `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''} disponible${usuarios.length !== 1 ? 's' : ''}`;
    encabezado.appendChild(contador);
    panel.appendChild(encabezado);

    // Una fila por cada usuario con avatar de iniciales
    usuarios.forEach(function(usuario) {
        const opcion = document.createElement('label');
        opcion.className = 'usuarios-dropdown__opcion';

        const checkbox = document.createElement('input');
        checkbox.type      = 'checkbox';
        checkbox.value     = usuario.id;
        checkbox.className = 'usuarios-dropdown__checkbox';
        checkbox.addEventListener('change', function() {
            actualizarTextoDropdown(btn, texto, panel);
            opcion.classList.toggle('seleccionada', checkbox.checked);
        });

        // Avatar circular con las dos primeras iniciales del nombre
        const avatar = document.createElement('span');
        avatar.className   = 'usuarios-dropdown__avatar';
        avatar.textContent = usuario.name
            .split(' ')
            .slice(0, 2)
            .map(function(p) { return p[0]; })
            .join('')
            .toUpperCase();

        // Info: nombre en negrita y documento en gris
        const info = document.createElement('div');
        info.className = 'usuarios-dropdown__info';

        const nombre = document.createElement('span');
        nombre.className   = 'usuarios-dropdown__nombre';
        nombre.textContent = usuario.name;

        const doc = document.createElement('span');
        doc.className   = 'usuarios-dropdown__doc';
        doc.textContent = `Doc: ${usuario.documento}`;

        info.appendChild(nombre);
        info.appendChild(doc);

        opcion.appendChild(checkbox);
        opcion.appendChild(avatar);
        opcion.appendChild(info);
        panel.appendChild(opcion);
    });
}

// Inicializa el dropdown de usuarios de la card "Crear Tarea" del panel admin.
// La primera vez registra los eventos del botón; las veces siguientes solo actualiza los checkboxes.
async function inicializarDropdownUsuarios() {
    const btn   = document.getElementById('usuariosDropdownBtn');
    const panel = document.getElementById('usuariosDropdownPanel');
    const texto = document.getElementById('usuariosDropdownTexto');

    if (!btn || !panel || !texto) return;

    // Carga los checkboxes (siempre, para reflejar usuarios recién creados)
    await recargarCheckboxesDropdown();

    // Los listeners del botón y del documento se registran solo una vez
    if (_dropdownListenersRegistrados) return;
    _dropdownListenersRegistrados = true;

    // Listener del botón: abre o cierra el panel al hacer clic
    btn.addEventListener('click', function(event) {
        event.stopPropagation();

        const estaAbierto = !panel.classList.contains('hidden');

        if (estaAbierto) {
            panel.classList.add('hidden');
            btn.classList.remove('abierto');
            btn.setAttribute('aria-expanded', 'false');
        } else {
            const rect = btn.getBoundingClientRect();
            const espacioAbajo = window.innerHeight - rect.bottom - 8;
            panel.style.maxHeight = Math.min(380, Math.max(120, espacioAbajo)) + 'px';
            panel.classList.remove('hidden');
            btn.classList.add('abierto');
            btn.setAttribute('aria-expanded', 'true');
        }
    });

    // Clic fuera del dropdown lo cierra
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('usuariosDropdown');
        if (dropdown && !dropdown.contains(event.target)) {
            panel.classList.add('hidden');
            btn.classList.remove('abierto');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

// Actualiza el texto del botón del dropdown según los usuarios seleccionados.
// Sin selección muestra "Seleccionar usuarios..."; con selección muestra los primeros 2 nombres
// y "+N más" si hay más de dos, para que el botón no se haga muy largo.
// Parámetros: btn (el botón), texto (el span con el texto), panel (el contenedor con los checkboxes)
function actualizarTextoDropdown(btn, texto, panel) {
    // Se buscan todos los checkboxes marcados dentro del panel
    const seleccionados = panel.querySelectorAll('input[type="checkbox"]:checked');

    if (seleccionados.length === 0) {
        // Sin selección se muestra el placeholder original
        texto.textContent = 'Seleccionar usuarios...';
        return;
    }

    // Se recogen los nombres de los labels de los checkboxes seleccionados
    const nombres = Array.from(seleccionados).map(function(cb) {
        // El span con el nombre es el siguiente hermano del checkbox dentro del label
        const label = cb.closest('.usuarios-dropdown__opcion');
        const span  = label ? label.querySelector('span') : null;
        // Solo se toma el nombre (antes del paréntesis del documento)
        return span ? span.textContent.split(' (')[0] : '';
    }).filter(Boolean);

    // Si hay 2 o menos nombres se muestran todos
    // Si hay más se muestran los primeros 2 y "y N más"
    if (nombres.length <= 2) {
        texto.textContent = nombres.join(', ');
    } else {
        texto.textContent = `${nombres.slice(0, 2).join(', ')} y ${nombres.length - 2} más`;
    }
}

// Retorna un arreglo con los IDs numéricos de los usuarios que tienen el checkbox marcado.
// Se usa al enviar el formulario de crear tarea para saber a quiénes asignarla.
function obtenerIdsSeleccionados() {
    const panel = document.getElementById('usuariosDropdownPanel');
    if (!panel) return [];

    // Se buscan todos los checkboxes marcados y se mapean a número entero
    const checkboxes = panel.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(function(cb) {
        return parseInt(cb.value, 10);
    });
}

// ── LIMPIAR FORMULARIO DE LOGIN ───────────────────────────────────────────────
// Limpia todos los campos del formulario de login y oculta los mensajes de error.
// Se llama al activar la pantalla de inicio y al cerrar sesión para que ningún dato
// del usuario anterior quede visible, especialmente en computadores compartidos.
function limpiarFormularioLogin() {
    // Limpiar el campo de email
    const inputEmail = document.getElementById('loginEmail');
    if (inputEmail) inputEmail.value = '';

    // Limpiar el campo de contraseña
    const inputPassword = document.getElementById('loginPassword');
    if (inputPassword) inputPassword.value = '';

    // Resetear el botón del ojo (mostrar/ocultar contraseña) a su estado inicial
    if (inputPassword) inputPassword.type = 'password';
    const btnToggle = document.getElementById('btnTogglePassword');
    const iconoToggle = document.getElementById('iconoTogglePassword');
    if (iconoToggle) {
        iconoToggle.setAttribute('data-lucide', 'eye');
        if (window.lucide) window.lucide.createIcons();
    }

    // Ocultar el mensaje de bienvenida post-login si está visible
    // El mensaje dice "Sesión iniciada · [nombre]" y debe desaparecer al volver
    const bienvenidaDiv = document.getElementById('loginBienvenida');
    if (bienvenidaDiv) bienvenidaDiv.classList.add('hidden');

    // Limpiar los spans de error para que no queden mensajes visibles
    const errorEmail = document.getElementById('loginEmailError');
    if (errorEmail) errorEmail.textContent = '';

    const errorPassword = document.getElementById('loginPasswordError');
    if (errorPassword) errorPassword.textContent = '';

    // Quitar la clase 'error' de los inputs si quedaron marcados en rojo
    if (inputEmail)    inputEmail.classList.remove('error');
    if (inputPassword) inputPassword.classList.remove('error');
}

// ── CERRAR SESIÓN CON CONFIRMACIÓN ────────────────────────────────────────────
// Se llama al hacer clic en el botón de logout de cualquier panel.
// Muestra un modal de confirmación antes de cerrar sesión para evitar cierres accidentales.
// Al confirmar: borra los tokens del localStorage, limpia el formulario y vuelve al login.
async function manejarCerrarSesion() {
    // Modal DOM nativo de confirmación de logout
    // Reemplaza SweetAlert2 para evitar que el modal quede encima de la pantalla de inicio
    const confirmado = await new Promise(function(resolve) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-usuario-overlay';
        overlay.style.zIndex = '9999';

        const panel = document.createElement('div');
        panel.className = 'modal-usuario';
        panel.style.cssText = 'max-width:400px;padding:0;overflow:hidden;text-align:center;';

        // Header con acento azul del sistema
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 1.5rem 1.5rem 0;
            display: flex; flex-direction: column;
            align-items: center; gap: 0.75rem;
        `;

        // Ícono circular
        const iconoWrap = document.createElement('div');
        iconoWrap.style.cssText = `
            width: 60px; height: 60px; border-radius: 50%;
            border: 3px solid var(--color-modal-acento);
            display: flex; align-items: center; justify-content: center;
            color: var(--color-modal-acento); font-size: 1.6rem; font-weight: 700;
        `;
        iconoWrap.textContent = '?';
        header.appendChild(iconoWrap);

        const titulo = document.createElement('h3');
        titulo.textContent = '¿Cerrar sesión?';
        titulo.style.cssText = 'font-size:1.15rem;font-weight:700;color:var(--texto-oscuro);margin:0;';
        header.appendChild(titulo);

        const desc = document.createElement('p');
        desc.textContent = 'Se cerrará tu sesión actual y volverás a la pantalla de inicio.';
        desc.style.cssText = 'font-size:0.875rem;color:var(--texto-medio);line-height:1.5;margin:0;';
        header.appendChild(desc);

        panel.appendChild(header);

        // Footer con botones
        const footer = document.createElement('div');
        footer.style.cssText = `
            display:flex; gap:0.75rem;
            padding: 1.25rem 1.5rem 1.5rem;
            margin-top: 1.25rem;
            border-top: 1px solid var(--borde-suave);
        `;

        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.style.cssText = `
            flex:1; height:42px; border:none; cursor:pointer;
            border-radius:var(--radio-full);
            background:var(--fondo-gris); color:var(--texto-medio);
            font-size:0.875rem; font-weight:600;
            transition: background 0.15s;
        `;
        btnCancelar.addEventListener('mouseenter', function() { this.style.background='var(--borde-suave)'; });
        btnCancelar.addEventListener('mouseleave', function() { this.style.background='var(--fondo-gris)'; });
        btnCancelar.addEventListener('click', function() { cerrar(false); });

        const btnConfirmar = document.createElement('button');
        btnConfirmar.textContent = 'Sí, cerrar sesión';
        btnConfirmar.style.cssText = `
            flex:1; height:42px; border:none; cursor:pointer;
            border-radius:var(--radio-full);
            background: var(--color-modal-acento); color:white;
            font-size:0.875rem; font-weight:600;
            transition: opacity 0.15s, transform 0.1s;
        `;
        btnConfirmar.addEventListener('mouseenter', function() { this.style.opacity='0.88'; this.style.transform='translateY(-1px)'; });
        btnConfirmar.addEventListener('mouseleave', function() { this.style.opacity='1'; this.style.transform='translateY(0)'; });
        btnConfirmar.addEventListener('click', function() { cerrar(true); });

        footer.appendChild(btnCancelar);
        footer.appendChild(btnConfirmar);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function cerrar(resultado) {
            // Eliminar el overlay ANTES de resolver la promesa
            // Así la pantalla de inicio no aparece detrás del modal
            if (overlay.parentNode) document.body.removeChild(overlay);
            resolve(resultado);
        }

        overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrar(false); });
    });

    if (!confirmado) { volverDeModal(); return; }

    // Limpiar intervalos activos
    if (window._panelCalificacionInterval) {
        clearInterval(window._panelCalificacionInterval);
        window._panelCalificacionInterval = null;
    }
    registrarEvento('logout', 'Sesión cerrada');
    cerrarSesion();
    limpiarFormularioLogin();
    activarModoInicio();
    resetearEstadoRouter();
}

// ── ABRIR MODAL DE REGISTRO ───────────────────────────────────────────────────
// Muestra el modal de registro de cuenta nueva encima de la pantalla de login
function abrirModalRegistro() {
    const modal = document.getElementById('registroModal');
    // Mostramos el modal quitando la clase 'hidden'
    if (modal) modal.classList.remove('hidden');
    // Limpiamos el formulario para que empiece vacío aunque el usuario lo haya cerrado antes
    limpiarFormularioRegistro();
}

// ── CERRAR MODAL DE REGISTRO ──────────────────────────────────────────────────
// Oculta el modal de registro y limpia los campos al cerrar con X o al registrarse con éxito
function cerrarModalRegistro() {
    const modal = document.getElementById('registroModal');
    // Ocultamos el modal agregando la clase 'hidden'
    if (modal) modal.classList.add('hidden');
    // Limpiamos los campos del formulario para el próximo uso
    limpiarFormularioRegistro();
    // Si la URL tiene la ruta del modal de registro, volvemos a la ruta anterior
    if (window.location.hash === '#' + RUTAS.MODAL.REGISTRO) volverDeModal();
}

// ── LIMPIAR FORMULARIO DE REGISTRO ───────────────────────────────────────────
// Limpia todos los campos del formulario de registro y sus mensajes de error.
// Se llama al abrir y al cerrar el modal para que siempre empiece sin datos previos.
function limpiarFormularioRegistro() {
    // Agregar 'registroConfirmar' al array de campos
    const campos = ['registroNombre', 'registroDocumento', 'registroEmail', 'registroPassword', 'registroConfirmar'];
    campos.forEach(function(id) {
        const input = document.getElementById(id);
        if (input) {
            input.value = '';
            input.classList.remove('error');
        }
    });
    // Agregar 'registroConfirmarError' al array de errores
    const errores = ['registroNombreError', 'registroDocumentoError', 'registroEmailError', 'registroPasswordError', 'registroConfirmarError'];
    errores.forEach(function(id) {
        const span = document.getElementById(id);
        if (span) span.textContent = '';
    });
}

// ── VALIDAR FORMULARIO DE REGISTRO ───────────────────────────────────────────
// Valida los 5 campos del formulario de registro antes de enviarlos al servidor.
// Muestra los errores en los spans de cada campo y también como notificación toast.
// Retorna true si todos los campos son válidos, false si alguno tiene error.
async function validarFormularioRegistroLocal() {
    let esValido      = true;
    let primerMensaje = null;

    const nombreInput    = document.getElementById('registroNombre');
    const documentoInput = document.getElementById('registroDocumento');
    const emailInput     = document.getElementById('registroEmail');
    const passwordInput  = document.getElementById('registroPassword');
    const confirmarInput  = document.getElementById('registroConfirmar');

    const nombreError    = document.getElementById('registroNombreError');
    const documentoError = document.getElementById('registroDocumentoError');
    const emailError     = document.getElementById('registroEmailError');
    const passwordError  = document.getElementById('registroPasswordError');
    const confirmarError  = document.getElementById('registroConfirmarError');

    // Limpiar errores previos
    [nombreError, documentoError, emailError, passwordError, confirmarError].forEach(el => { if (el) el.textContent = ''; });
    [nombreInput, documentoInput, emailInput, passwordInput, confirmarInput].forEach(el => { if (el) el.classList.remove('error'); });

    // Validar nombre: obligatorio, mínimo 3, solo letras y espacios
    const valorNombre = nombreInput ? nombreInput.value.trim() : '';
    if (!valorNombre) {
        const msg = 'El nombre es obligatorio';
        if (nombreError) nombreError.textContent = msg;
        if (nombreInput) nombreInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorNombre.length < 3) {
        const msg = 'El nombre debe tener al menos 3 caracteres';
        if (nombreError) nombreError.textContent = msg;
        if (nombreInput) nombreInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(valorNombre)) {
        // Si el nombre tiene números o caracteres especiales no se acepta
        const msg = 'El nombre solo puede contener letras y espacios';
        if (nombreError) nombreError.textContent = msg;
        if (nombreInput) nombreInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Validar documento: obligatorio, solo números, mínimo 5
    const valorDocumento = documentoInput ? documentoInput.value.trim() : '';
    if (!valorDocumento) {
        const msg = 'El número de documento es obligatorio';
        if (documentoError) documentoError.textContent = msg;
        if (documentoInput) documentoInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^\d+$/.test(valorDocumento)) {
        // Si el documento tiene letras o caracteres especiales no se acepta
        const msg = 'El documento solo puede contener números';
        if (documentoError) documentoError.textContent = msg;
        if (documentoInput) documentoInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorDocumento.length < 5) {
        const msg = 'El documento debe tener al menos 5 dígitos';
        if (documentoError) documentoError.textContent = msg;
        if (documentoInput) documentoInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Validar email: obligatorio, formato válido (tiene @ y dominio)
    const valorEmail = emailInput ? emailInput.value.trim() : '';
    if (!valorEmail) {
        const msg = 'El correo electrónico es obligatorio';
        if (emailError) emailError.textContent = msg;
        if (emailInput) emailInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorEmail)) {
        const msg = 'El correo electrónico no tiene un formato válido';
        if (emailError) emailError.textContent = msg;
        if (emailInput) emailInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Validar contraseña: obligatoria, mínimo 6 caracteres
    const valorPassword = passwordInput ? passwordInput.value : '';
    if (!valorPassword) {
        const msg = 'La contraseña es obligatoria';
        if (passwordError) passwordError.textContent = msg;
        if (passwordInput) passwordInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorPassword.length < 6) {
        const msg = 'La contraseña debe tener al menos 6 caracteres';
        if (passwordError) passwordError.textContent = msg;
        if (passwordInput) passwordInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Validar confirmar contraseña: obligatoria y debe coincidir con la contraseña
    const valorConfirmar = confirmarInput ? confirmarInput.value : '';
    if (!valorConfirmar) {
        const msg = 'Debes confirmar tu contraseña';
        if (confirmarError) confirmarError.textContent = msg;
        if (confirmarInput) confirmarInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorPassword && valorConfirmar !== valorPassword) {
        const msg = 'Las contraseñas no coinciden';
        if (confirmarError) confirmarError.textContent = msg;
        if (confirmarInput) confirmarInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }
    
    // Mostrar el primer error como toast de SweetAlert2
    if (primerMensaje) await mostrarNotificacion(primerMensaje, 'error');

    return esValido;
}

// Registra todos los eventos del modal de cambio de contraseña: abrir, cerrar y enviar.
// Se llama una sola vez desde registrarEventosNavegacion al arrancar el sistema.
// El modal se puede abrir desde el botón de perfil de cualquiera de los tres paneles.
function registrarListenerCambioPassword() {
    const modal          = document.getElementById('cambioPasswordModal');
    const btnCerrar      = document.getElementById('cambioPasswordClose');
    const btnCancelar    = document.getElementById('cambioPasswordCancelar');
    const form           = document.getElementById('cambioPasswordForm');

    // Función auxiliar para abrir el modal — limpia el formulario antes de mostrarlo
    function abrirModalPassword() {
        if (form) form.reset();
        // Limpiar mensajes de error del formulario anterior
        const errores = modal.querySelectorAll('.form__error, .modal-admin__error');
        errores.forEach(el => { el.textContent = ''; });
        // Limpiar clases de error de los inputs
        const inputs = modal.querySelectorAll('.form__input, .modal-admin__input');
        inputs.forEach(el => el.classList.remove('error'));
        modal.classList.remove('hidden');
    }

    // Función auxiliar para cerrar el modal
    function cerrarModalPassword() {
        modal.classList.add('hidden');
        if (window.location.hash === '#' + RUTAS.MODAL.CAMBIO_PASSWORD) volverDeModal();
    }

    // Registrar la ruta del modal para que sea navegable via ir(RUTAS.MODAL.CAMBIO_PASSWORD)
    registrarRuta(RUTAS.MODAL.CAMBIO_PASSWORD, abrirModalPassword);

    // Abrir el modal desde el botón de perfil del panel admin
    const btnPerfilAdmin = document.getElementById('btnPerfilAdmin');
    if (btnPerfilAdmin) btnPerfilAdmin.addEventListener('click', function() { ir(RUTAS.MODAL.CAMBIO_PASSWORD); });

    // Abrir el modal desde el botón de perfil del panel usuario
    const btnPerfilUsuario = document.getElementById('btnPerfilUsuario');
    if (btnPerfilUsuario) btnPerfilUsuario.addEventListener('click', function() { ir(RUTAS.MODAL.CAMBIO_PASSWORD); });

    // Abrir el modal desde el botón de perfil del panel instructor
    const btnPerfilInstructor = document.getElementById('btnPerfilInstructor');
    if (btnPerfilInstructor) btnPerfilInstructor.addEventListener('click', function() { ir(RUTAS.MODAL.CAMBIO_PASSWORD); });

    // Cerrar el modal con el botón X
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalPassword);

    // Cerrar el modal con el botón Cancelar
    if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalPassword);

    // Cerrar el modal al hacer clic fuera del contenido del modal
    if (modal) {
        modal.addEventListener('click', function(e) {
            // Solo cerrar si el clic fue en el overlay (fondo oscuro), no en el contenido
            if (e.target === modal) cerrarModalPassword();
        });
    }

    // Submit del formulario de cambio de contraseña
    // También escucha el botón externo al form (modal-admin__btn-guardar)
    const btnSubmitExterno = document.getElementById('cambioPasswordSubmit');
    if (btnSubmitExterno && form) {
        btnSubmitExterno.addEventListener('click', function() { form.dispatchEvent(new Event('submit')); });
    }

    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();

            const actual     = document.getElementById('passwordActual').value;
            const nueva      = document.getElementById('passwordNueva').value;
            const confirmar  = document.getElementById('passwordConfirmar').value;

            // Limpiar errores anteriores antes de validar
            document.getElementById('passwordActualError').textContent    = '';
            document.getElementById('passwordNuevaError').textContent     = '';
            document.getElementById('passwordConfirmarError').textContent = '';

            // Validación de campos obligatorios
            let esValido = true;
            if (!actual) {
                document.getElementById('passwordActualError').textContent = 'La contraseña actual es obligatoria';
                esValido = false;
            }
            if (!nueva || nueva.length < 6) {
                document.getElementById('passwordNuevaError').textContent = 'La nueva contraseña debe tener al menos 6 caracteres';
                esValido = false;
            }
            if (nueva !== confirmar) {
                document.getElementById('passwordConfirmarError').textContent = 'Las contraseñas no coinciden';
                esValido = false;
            }
            if (!esValido) return;

            // Obtener el id del usuario logueado desde sesion.js
            const usuarioSesion = obtenerUsuarioSesion();
            if (!usuarioSesion) {
                await mostrarNotificacion('No hay sesión activa. Por favor inicia sesión.', 'error');
                return;
            }

            // Llamar al endpoint PATCH /api/users/:id/password
            const resultado = await cambiarPassword(usuarioSesion.id, {
                currentPassword: actual,
                newPassword:     nueva,
            });

            if (resultado === true) {
                cerrarModalPassword();
                await mostrarNotificacion('Contraseña actualizada correctamente', 'exito');
            } else {
                // El backend respondió con un error específico (ej: contraseña actual incorrecta)
                await mostrarNotificacion(resultado.error || 'Error al cambiar la contraseña', 'error');
            }
        });
    }
}

// Abre el modal de edición en modo usuario: el estudiante solo puede cambiar el estado
// y agregar un comentario. No puede editar título ni descripción (son de solo lectura).
// Se llama cuando el estudiante hace clic en el botón Editar de su tabla de tareas.
function manejarEdicionTareaUsuario(tarea) {
    mostrarModalEdicion(tarea, true); // soloLecturaTituloDesc = true

    const formulario = document.getElementById('editTaskForm');
    if (!formulario) return;

    const tareaId = String(tarea.id);

    async function guardarCambiosUsuario(ev) {
        ev.preventDefault();

        const nuevoEstado     = document.getElementById('editTaskStatus').value;
        const nuevoComentario = document.getElementById('editTaskComment')
            ? document.getElementById('editTaskComment').value.trim()
            : '';

        // Usamos PATCH /tasks/:id/status — accesible por todos los roles (no requiere admin/instructor)
        // PUT /tasks/:id requiere requireAdminOrInstructor y devolvería 403 para el estudiante
        const { cambiarEstadoTarea } = await import('../api/tareasApi.js');
        const tareaActualizada = await cambiarEstadoTarea(tareaId, nuevoEstado, nuevoComentario);

        if (tareaActualizada) {
            const { actualizarFilaTarea } = await import('./tareasUI.js');
            actualizarFilaTarea(tareaActualizada);
            ocultarModalEdicion();
            await mostrarNotificacion('Tarea actualizada correctamente', 'exito');
        } else {
            await mostrarNotificacion('Error al actualizar la tarea', 'error');
        }

        formulario.removeEventListener('submit', guardarCambiosUsuario);
        _activeEditHandler = null;
    }

    if (_activeEditHandler) formulario.removeEventListener('submit', _activeEditHandler);
    _activeEditHandler = guardarCambiosUsuario;
    formulario.addEventListener('submit', guardarCambiosUsuario);
}

// ── REGISTRO DE EVENTOS DE NAVEGACIÓN ────────────────────────────────────────
// Registra todas las rutas del router SPA y los listeners de todos los formularios
// y botones del sistema. Se llama una sola vez al cargar la aplicación desde main.js.

export function registrarEventosNavegacion() {
    // Iniciamos el router que escucha cambios en el hash de la URL
    iniciarRouter();

    // Registramos las rutas de los modales globales disponibles desde cualquier panel
    registrarRuta(RUTAS.MODAL.REGISTRO,      function() { abrirModalRegistro(); });
    registrarRuta(RUTAS.MODAL.CERRAR_SESION, function() { manejarCerrarSesion(); });

    // ── VER TAREA (por rol) ───────────────────────────────────────────────────
    [RUTAS.ADMIN.VER_TAREA, RUTAS.USUARIO.VER_TAREA, RUTAS.INSTRUCTOR.VER_TAREA].forEach(function(ruta) {
        registrarRuta(ruta, function() {
            if (!_pendingVerTarea) return;
            const t = _pendingVerTarea; _pendingVerTarea = null;
            abrirModalVerTarea(t);
        });
    });

    // ── EDITAR TAREA (por rol) ────────────────────────────────────────────────
    registrarRuta(RUTAS.ADMIN.EDITAR_TAREA, function() {
        if (!_pendingEditarTarea) return;
        const t = _pendingEditarTarea; _pendingEditarTarea = null;
        manejarEdicionTareaAdmin(t);
    });
    registrarRuta(RUTAS.USUARIO.EDITAR_TAREA, function() {
        if (!_pendingEditarTarea) return;
        const t = _pendingEditarTarea; _pendingEditarTarea = null;
        manejarEdicionTareaUsuario(t);
    });
    registrarRuta(RUTAS.INSTRUCTOR.EDITAR_TAREA, function() {
        if (!_pendingEditarTarea) return;
        const t = _pendingEditarTarea; _pendingEditarTarea = null;
        manejarEdicionTareaInstructor(t);
    });

    // ── ELIMINAR TAREA (admin e instructor) ──────────────────────────────────
    registrarRuta(RUTAS.ADMIN.ELIMINAR_TAREA, async function() {
        if (!_pendingEliminarTarea) return;
        const { tarea } = _pendingEliminarTarea; _pendingEliminarTarea = null;
        const confirmado = await confirmarEliminarTarea(tarea.title);
        volverDeModal();
        if (!confirmado) return;
        const eliminada = await eliminarTarea(tarea.id);
        if (eliminada) {
            todasLasTareas = todasLasTareas.filter(function(t) { return t.id !== tarea.id; });
            actualizarDashboardLocal();
            aplicarFiltrosAdmin();
            await mostrarNotificacion('Tarea eliminada correctamente', 'exito');
        } else {
            await mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
    });

    registrarRuta(RUTAS.INSTRUCTOR.ELIMINAR_TAREA, async function() {
        if (!_pendingEliminarTarea) return;
        const { tarea } = _pendingEliminarTarea; _pendingEliminarTarea = null;
        const confirmado = await confirmarEliminarTarea(tarea.title);
        volverDeModal();
        if (!confirmado) return;
        const eliminado = await eliminarTarea(tarea.id);
        if (eliminado) {
            const tbody = document.getElementById('instrTasksTableBody');
            const filaEl = tbody ? tbody.querySelector(`tr[data-id="${tarea.id}"]`) : null;
            if (filaEl) {
                filaEl.remove();
                if (tbody) Array.from(tbody.querySelectorAll('tr')).forEach(function(f, i) {
                    if (f.cells[0]) f.cells[0].textContent = i + 1;
                });
            } else { cargarTareasInstructor(); }
            const contador = document.getElementById('instrTasksCount');
            if (contador && tbody) { const n = tbody.querySelectorAll('tr').length; contador.textContent = `${n} ${n === 1 ? 'tarea' : 'tareas'}`; }
            mostrarNotificacion('Tarea eliminada correctamente', 'exito');
            cargarDashboardInstructor();
            cargarTablaUsuariosInstructor();
            registrarEvento('tarea_eliminada', `Tarea eliminada: "${tarea.title}"`);
            renderizarAuditoria(document.getElementById('auditoriaContenedor'));
        } else {
            await mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
    });

    // ── ACCIONES EN USUARIOS (admin) ──────────────────────────────────────────
    registrarRuta(RUTAS.ADMIN.VER_USUARIO, function() {
        if (!_pendingVerUsuario) return;
        const u = _pendingVerUsuario; _pendingVerUsuario = null;
        abrirModalUsuario(u);
    });
    registrarRuta(RUTAS.ADMIN.EDITAR_USUARIO, function() {
        if (!_pendingEditarUsuario) return;
        const u = _pendingEditarUsuario; _pendingEditarUsuario = null;
        abrirModalEditarUsuario(u);
    });
    registrarRuta(RUTAS.ADMIN.CAMBIAR_ROL, function() {
        if (!_pendingCambiarRol) return;
        const { usuario, fila } = _pendingCambiarRol; _pendingCambiarRol = null;
        abrirDropdownRol(usuario, fila);
    });
    registrarRuta(RUTAS.ADMIN.DESACTIVAR, async function() {
        if (!_pendingDesactivar) return;
        const { usuario, tdEstado } = _pendingDesactivar; _pendingDesactivar = null;
        const resultado = await mostrarModalToggleEstado(usuario.name, 'desactivar');
        volverDeModal();
        if (!resultado) return;
        while (tdEstado.firstChild) tdEstado.removeChild(tdEstado.firstChild);
        tdEstado.appendChild(crearBadgeEstado(0));
        registrarEvento('rol_cambiado', `${usuario.name} fue desactivado`);
        renderizarAuditoria(document.getElementById('auditoriaContenedor'));
        mostrarNotificacion(`${usuario.name} fue desactivado. Motivo: ${resultado.motivo}`, 'exito');
        desactivarUsuario(usuario.id, resultado.motivo)
            .then(() => { cargarTablaUsuarios(); })
            .catch(async function(error) {
                while (tdEstado.firstChild) tdEstado.removeChild(tdEstado.firstChild);
                tdEstado.appendChild(crearBadgeEstado(1));
                await mostrarNotificacion(error.message || 'No se pudo desactivar', 'error');
            });
    });
    registrarRuta(RUTAS.ADMIN.ACTIVAR, async function() {
        if (!_pendingActivar) return;
        const { usuario, tdEstado } = _pendingActivar; _pendingActivar = null;
        const resultado = await mostrarModalToggleEstado(usuario.name, 'activar');
        volverDeModal();
        if (!resultado) return;
        while (tdEstado.firstChild) tdEstado.removeChild(tdEstado.firstChild);
        tdEstado.appendChild(crearBadgeEstado(1));
        registrarEvento('login', `${usuario.name} fue reactivado`);
        renderizarAuditoria(document.getElementById('auditoriaContenedor'));
        mostrarNotificacion(`${usuario.name} fue reactivado. Motivo: ${resultado.motivo}`, 'exito');
        reactivarUsuario(usuario.id)
            .then(() => { cargarTablaUsuarios(); })
            .catch(async function(error) {
                while (tdEstado.firstChild) tdEstado.removeChild(tdEstado.firstChild);
                tdEstado.appendChild(crearBadgeEstado(0));
                await mostrarNotificacion(error.message || 'No se pudo reactivar', 'error');
            });
    });
    registrarRuta(RUTAS.ADMIN.ELIMINAR_USUARIO, async function() {
        if (!_pendingEliminarUsuario) return;
        const { usuario, fila, estaActivo } = _pendingEliminarUsuario; _pendingEliminarUsuario = null;
        const resultado = await mostrarModalEliminarUsuario(usuario.name, estaActivo);
        volverDeModal();
        if (!resultado) return;
        try {
            if (fila && fila.parentNode) fila.parentNode.removeChild(fila);
            const tbodyUsers = document.getElementById('usersTableBody');
            const contadorEl = document.getElementById('adminUsersCount');
            if (contadorEl && tbodyUsers) { const n = tbodyUsers.querySelectorAll('tr').length; contadorEl.textContent = `${n} ${n === 1 ? 'usuario' : 'usuarios'}`; }
            mostrarNotificacion(`${usuario.name} fue eliminado correctamente`, 'exito');
            const fn = resultado.forzoso ? forceEliminarUsuario : eliminarUsuario;
            fn(usuario.id, resultado.motivo)
                .then(function() {
                    registrarEvento('usuario_eliminado', `Usuario eliminado: ${usuario.name}`);
                    renderizarAuditoria(document.getElementById('auditoriaContenedor'));
                    cargarTodasLasTareas();
                    cargarDashboard();
                })
                .catch(async function(error) {
                    cargarTablaUsuarios();
                    await mostrarNotificacion(error.message || 'No se pudo eliminar el usuario', 'error');
                });
        } catch (error) {
            cargarTablaUsuarios();
            await mostrarNotificacion(error.message || 'No se pudo eliminar el usuario', 'error');
        }
    });

    // ── VER ESTUDIANTE (instructor) ───────────────────────────────────────────
    registrarRuta(RUTAS.INSTRUCTOR.VER_ESTUDIANTE, function() {
        if (!_pendingVerUsuario) return;
        const u = _pendingVerUsuario; _pendingVerUsuario = null;
        abrirModalUsuario(u);
    });

    // Olvido y cambio de password se registran en registrarListenerOlvido/CambioPassword más abajo.

    // Se registra el comportamiento de toggle en las cards contraíbles del panel admin
    registrarCardsContraibles();

    // ── FORMULARIO DE LOGIN ───────────────────────────────────────────────────────
    // Tomamos referencias a todos los elementos del formulario de inicio de sesión
    const formLogin       = document.getElementById('loginForm');
    const inputEmail      = document.getElementById('loginEmail');
    const inputPassword   = document.getElementById('loginPassword');
    const errorEmail      = document.getElementById('loginEmailError');
    const errorPassword   = document.getElementById('loginPasswordError');
    const bienvenidaDiv   = document.getElementById('loginBienvenida');
    const bienvenidaTexto = document.getElementById('loginBienvenidaTexto');
    const btnToggle       = document.getElementById('btnTogglePassword');

    // El botón con el ícono de ojo alterna entre mostrar y ocultar la contraseña
    if (btnToggle) {
        btnToggle.addEventListener('click', function () {
            // Si el campo es tipo "password" lo cambiamos a "text" y viceversa
            const tipo = inputPassword.type === 'password' ? 'text' : 'password';
            inputPassword.type = tipo;
            // Cambiamos el ícono del ojo: abierto cuando se ve la contraseña, tachado cuando no
            const iconoEl = document.getElementById('iconoTogglePassword');
            if (iconoEl) {
                iconoEl.setAttribute('data-lucide', tipo === 'text' ? 'eye-off' : 'eye');
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    // Al enviar el formulario de inicio de sesión validamos y llamamos al backend
    if (formLogin) {
        formLogin.addEventListener('submit', async function (event) {
            // Prevenimos que el navegador recargue la página al enviar el formulario
            event.preventDefault();

            // Validamos que el email y la contraseña tengan el formato correcto
            // Si la validación falla, la función muestra el error y retorna false
            const esValido = await validarFormularioLogin({
                emailInput:    inputEmail,
                passwordInput: inputPassword,
                emailError:    errorEmail,
                passwordError: errorPassword,
            });
            // Si hay errores de validación, detenemos el proceso sin llamar al servidor
            if (!esValido) return;

            // Deshabilitamos el botón mientras se procesa para evitar doble envío
            const btnLogin = document.getElementById('btnLogin');
            if (btnLogin) { btnLogin.disabled = true; btnLogin.textContent = 'Ingresando...'; }

            try {
                // Enviamos las credenciales al servidor para verificar la identidad del usuario
                const datos = await loginUsuario({
                email:    inputEmail.value.trim(),
                password: inputPassword.value,
            })

                // Guardar tokens y datos del usuario en localStorage
                guardarSesion(datos);

                // Si el backend no incluye el email en datos.user, lo tomamos del campo del formulario
                if (!datos.user.email) {
                    const emailIngresado = inputEmail.value.trim();
                    const usuarioConEmail = { ...datos.user, email: emailIngresado };
                    guardarSesion({ ...datos, user: usuarioConEmail });
                } else {
                    guardarSesion(datos);
                }

                // Mostrar saludo personalizado con el rol
                const etiquetaRol = datos.user.role === 'admin' ? 'Administrador' : 'Usuario';
                if (bienvenidaDiv && bienvenidaTexto) {
                    bienvenidaTexto.textContent = `Sesión iniciada · ${datos.user.name}`;
                    bienvenidaDiv.classList.remove('hidden');
                }

                // Pequeña pausa para que el usuario vea el saludo antes de redirigir
                await new Promise(resolve => setTimeout(resolve, 1200));

                // Redirigir al modo que corresponde según el rol del usuario
                // Se evalúan los 3 roles posibles: admin, instructor y user
                // Sin este bloque completo, el instructor aterrizaba en la vista de usuario
                if (datos.user.role === 'admin') {
                    // El administrador ve el panel azul con acceso a usuarios, tareas y auditoría
                    registrarEvento('login', `Sesión iniciada: ${datos.user.name}`);
                    await activarModoAdmin();
                } else if (datos.user.role === 'instructor') {
                    // El instructor ve el panel verde con gestión de tareas y calificación
                    registrarEvento('login', `Sesión iniciada: ${datos.user.name}`);
                    await activarModoInstructor();
                } else {
                    // El estudiante ve el panel morado con solo sus tareas asignadas
                    activarModoUsuario();
                }

            } catch (error) {
                // El mensaje de error viene del backend en español
                await mostrarNotificacion(error.message || 'Credenciales incorrectas', 'error');
            } finally {
                // Siempre rehabilitar el botón, haya error o no
                if (btnLogin) {
                    btnLogin.disabled    = false;
                    btnLogin.textContent = 'Ingresar al Sistema';
                }
            }
        });
    }

    // Botones volver
    const btnLogoutUsuario = document.getElementById('btnLogoutUsuario');
    if (btnLogoutUsuario) {
        btnLogoutUsuario.addEventListener('click', function() { ir(RUTAS.MODAL.CERRAR_SESION); });
    }

    const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');
    if (btnLogoutAdmin) {
        btnLogoutAdmin.addEventListener('click', function() { ir(RUTAS.MODAL.CERRAR_SESION); });
    }

    // Botón de cerrar sesión del panel instructor
    const btnLogoutInstructor = document.getElementById('btnLogoutInstructor');
    if (btnLogoutInstructor) {
        btnLogoutInstructor.addEventListener('click', function() { ir(RUTAS.MODAL.CERRAR_SESION); });
    }


    // Filtros de la tabla admin
    const btnAplicar = document.getElementById('adminBtnAplicarFiltros');
    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltrosAdmin);

    const btnLimpiar = document.getElementById('adminBtnLimpiarFiltros');
    if (btnLimpiar) btnLimpiar.addEventListener('click', function() {
        const fe = document.getElementById('adminFiltroEstado');
        const fu = document.getElementById('adminFiltroUsuario');
        const fo = document.getElementById('adminOrdenSelect');
        if (fe) fe.value = '';
        if (fu) fu.value = '';
        if (fo) fo.value = '';
        aplicarFiltrosAdmin();
    });

    // Exportar JSON
    const btnExportar = document.getElementById('adminBtnExportar');
    if (btnExportar) btnExportar.addEventListener('click', function() {
        const exportado = exportarTareasJSON(todasLasTareas);
        if (!exportado) {
            mostrarNotificacion('No hay tareas para exportar', 'advertencia');
        } else {
            mostrarNotificacion('Exportación completada', 'exito');
        }
    });

      // ── EXPORTAR USUARIOS — PANEL ADMIN ───────────────────────────────────────
    // Listener del botón "Exportar JSON" en la card de Usuarios del Sistema del admin
    // exportarListaJSON es la función genérica de exportacion.js que descarga
    // cualquier arreglo como archivo JSON con nombre y fecha en el nombre del archivo
    const btnExportarUsuariosAdmin = document.getElementById('adminBtnExportarUsuarios');
    if (btnExportarUsuariosAdmin) {
        btnExportarUsuariosAdmin.addEventListener('click', async function(event) {
            // Detener la propagación para que el clic no active el toggle de la card
            event.stopPropagation();
            // Obtener la lista actualizada de usuarios desde el backend
            // No usamos una variable local porque puede haber usuarios nuevos desde que cargó la tabla
            const usuarios = await obtenerTodosLosUsuarios();
            const exportado = exportarListaJSON(usuarios, 'usuarios');
            if (!exportado) {
                mostrarNotificacion('No hay usuarios para exportar', 'advertencia');
            } else {
                mostrarNotificacion('Lista de usuarios exportada correctamente', 'exito');
            }
        });
    }

    // ── EXPORTAR USUARIOS — PANEL INSTRUCTOR ──────────────────────────────────
    // Igual que el de admin pero activado desde el panel del instructor
    // Usa los mismos datos del backend (todos los usuarios del sistema)
    const btnExportarUsuariosInstr = document.getElementById('instrBtnExportarUsuarios');
    if (btnExportarUsuariosInstr) {
        btnExportarUsuariosInstr.addEventListener('click', async function(event) {
            // stopPropagation evita que el clic active el toggle de la card contenedora
            event.stopPropagation();
            const usuarios = await obtenerTodosLosUsuarios();
            const exportado = exportarListaJSON(usuarios, 'usuarios');
            if (!exportado) {
                mostrarNotificacion('No hay usuarios para exportar', 'advertencia');
            } else {
                mostrarNotificacion('Lista de usuarios exportada correctamente', 'exito');
            }
        });
    }

    // ── FILTROS DE TAREAS — PANEL INSTRUCTOR ──────────────────────────────────
    // El instructor ya tiene los botones en el HTML (instrBtnAplicarFiltros, instrBtnLimpiarFiltros)
    // pero no tenían listeners — los registramos aquí igual que los del admin
    // La diferencia es que llaman a aplicarFiltrosInstructor() (que crearemos abajo)
    // en lugar de aplicarFiltrosAdmin()
    const btnAplicarInstr = document.getElementById('instrBtnAplicarFiltros');
    if (btnAplicarInstr) {
        btnAplicarInstr.addEventListener('click', function() {
            aplicarFiltrosInstructor();
        });
    }

    const btnLimpiarInstr = document.getElementById('instrBtnLimpiarFiltros');
    if (btnLimpiarInstr) {
        btnLimpiarInstr.addEventListener('click', function() {
            const filtroEstadoInstr  = document.getElementById('instrFiltroEstado');
            const filtroUsuarioInstr = document.getElementById('instrFiltroUsuario');
            const ordenInstr         = document.getElementById('instrOrdenSelect');
            if (filtroEstadoInstr)  filtroEstadoInstr.value  = '';
            if (filtroUsuarioInstr) filtroUsuarioInstr.value = '';
            if (ordenInstr)         ordenInstr.value         = '';
            cargarTareasInstructor();
        });
    }

    // Exportar tareas — panel instructor
    const btnExportarTareasInstr = document.getElementById('instrBtnExportarTareas');
    if (btnExportarTareasInstr) {
        btnExportarTareasInstr.addEventListener('click', async function(event) {
            event.stopPropagation();
            const tareas = await obtenerTodasLasTareas();
            const exportado = exportarTareasJSON(tareas);
            if (!exportado) {
                mostrarNotificacion('No hay tareas para exportar', 'advertencia');
            } else {
                mostrarNotificacion('Tareas exportadas correctamente', 'exito');
            }
        });
    }

    // — EXPORTAR TAREAS — PANEL USUARIO
    const btnExportarTareasUsuario = document.getElementById('userBtnExportarTareas');
    if (btnExportarTareasUsuario) {
        btnExportarTareasUsuario.addEventListener('click', async function(event) {
            event.stopPropagation();
            const usuarioSesion = obtenerUsuarioSesion();
            if (!usuarioSesion) return;
            const tareas = await obtenerTareasDeUsuario(usuarioSesion.id);
            const exportado = exportarTareasJSON(tareas);
            if (!exportado) {
                await mostrarNotificacion('No tienes tareas para exportar', 'advertencia');
            } else {
                await mostrarNotificacion('Tareas exportadas correctamente', 'exito');
            }
        });
    }

    // Búsqueda de usuario en el header del admin
    const formBusqueda = document.getElementById('adminSearchUserForm');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', async function(event) {
            event.preventDefault();
            const input   = document.getElementById('adminUserDocument');
            const termino = (input.value || '').trim().toLowerCase();
            if (!termino) return;

            const usuarios = await obtenerTodosLosUsuarios();
            if (!usuarios) {
                await mostrarNotificacion('Error al buscar usuarios', 'error');
                return;
            }

            const encontrado = usuarios.find(u =>
                u.id.toString()                         === termino ||
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

            input.value = '';
            _pendingVerUsuario = encontrado;
            ir(RUTAS.ADMIN.VER_USUARIO + '/' + encontrado.id);
        });
    }

    // Listener del buscador del instructor — previene recarga de página al dar Enter
    // El input tiene id="instrUserDocument" (no instrSearchUserInput)
    const formBuscadorInstructor = document.getElementById('instrSearchUserForm');
    if (formBuscadorInstructor) {
        formBuscadorInstructor.addEventListener('submit', async function(event) {
            // Sin este preventDefault el navegador recarga la página al dar Enter
            event.preventDefault();
            const inputInstr = document.getElementById('instrUserDocument');
            const termino    = inputInstr ? inputInstr.value.trim().toLowerCase() : '';
            if (!termino) return;
            try {
                const usuarios  = await obtenerTodosLosUsuarios();
                const encontrado = usuarios ? usuarios.find(function(u) {
                    return u.id.toString() === termino
                        || (u.documento && u.documento.toString() === termino)
                        || u.name.toLowerCase().includes(termino);
                }) : null;
                if (encontrado) {
                    if (inputInstr) inputInstr.value = '';
                    _pendingVerUsuario = encontrado;
                    ir(RUTAS.INSTRUCTOR.VER_ESTUDIANTE + '/' + encontrado.id);
                } else {
                    await mostrarNotificacion(
                        `No se encontró ningún usuario con: "${inputInstr ? inputInstr.value.trim() : termino}"`,
                        'advertencia'
                    );
                }
            } catch (error) {
                await mostrarNotificacion('Error al buscar el usuario', 'error');
            }
        });
    }
    
    // Formulario de crear tarea en la card "Crear Tarea" del panel admin
    const formCrearTarea = document.getElementById('createTaskForm');
    if (formCrearTarea) {
        formCrearTarea.addEventListener('submit', async function(event) {
            // Prevenimos que el navegador recargue la página al enviar el formulario
            event.preventDefault();

            // Tomamos referencias a los campos del formulario para leer sus valores
            const titleInput   = document.getElementById('newTaskTitle');
            const descInput    = document.getElementById('newTaskDescription');
            const statusInput  = document.getElementById('newTaskStatus');
            const commentInput = document.getElementById('newTaskComment');
            const titleError   = document.getElementById('newTaskTitleError');
            const statusError  = document.getElementById('newTaskStatusError');

            // Leemos los valores ingresados por el usuario y quitamos espacios innecesarios
            const titulo  = titleInput  ? titleInput.value.trim()  : '';
            const estado  = statusInput ? statusInput.value         : '';

            const validoTareaForm = await validarFormularioTarea({
                titleInput,
                statusInput,
                titleError,
                statusError,
            });
            if (!validoTareaForm) return;

            // Se obtienen los IDs de los usuarios seleccionados en el dropdown de checkboxes
            const assignedUsers = obtenerIdsSeleccionados();

            // Validación: al menos un usuario debe estar seleccionado
            if (assignedUsers.length === 0) {
                await mostrarNotificacion('Debes asignar al menos un usuario a la tarea', 'advertencia');
                return;
            }

            // Se construye el objeto de la nueva tarea para enviar al backend
            const datosTarea = {
                title:         titulo,
                description:   descInput && descInput.value.trim() !== '' ? descInput.value.trim() : undefined,
                status:        estado,
                comment:       commentInput && commentInput.value.trim() !== '' ? commentInput.value.trim() : undefined,
                assignedUsers: assignedUsers,
            };

            // Se llama al backend para crear la tarea
            let tareaCreada;
            try {
                tareaCreada = await registrarTarea(datosTarea);
            } catch (errorCreacion) {
                // Mostrar el mensaje exacto que devuelve el backend
                // Si hay errores de validación Zod, mostrar el campo y mensaje del primero
                let msgError = errorCreacion.message || 'No se pudo crear la tarea';
                if (Array.isArray(errorCreacion.validationErrors) && errorCreacion.validationErrors.length > 0) {
                    const primero = errorCreacion.validationErrors[0];
                    msgError = primero.message || msgError;
                }
                await mostrarNotificacion(msgError, 'error');
                return;
            }

            if (tareaCreada) {
                // Se limpia el formulario después de crear exitosamente
                formCrearTarea.reset();

                // Se limpian los checkboxes del dropdown
                const panel = document.getElementById('usuariosDropdownPanel');
                if (panel) {
                    panel.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
                        cb.checked = false;
                    });
                }
                const textoDropdown = document.getElementById('usuariosDropdownTexto');
                if (textoDropdown) textoDropdown.textContent = 'Seleccionar usuarios...';

                // Se recargan la tabla de tareas y el dashboard para reflejar la nueva tarea
                cargarTodasLasTareas();
                cargarDashboard();
                await mostrarNotificacion(`Tarea "${datosTarea.title}" creada correctamente`, 'exito');
            }
        });
    }

        // Formulario de crear tarea en la card "Crear Tarea" del panel del instructor
    const instrCreateTaskForm = document.getElementById('instrCreateTaskForm');
    if (instrCreateTaskForm) {
        instrCreateTaskForm.addEventListener('submit', async function(event) {
            // Prevenimos que el navegador recargue la página al enviar el formulario
            event.preventDefault();

            // Tomamos referencias a los campos del formulario del instructor
            const tituloInput    = document.getElementById('instrNewTaskTitle');
            const estadoInput    = document.getElementById('instrNewTaskStatus');
            const instrComentEl  = document.getElementById('instrNewTaskComment');

            // Tomamos referencias a los spans que muestran los mensajes de error de cada campo
            const errorTitulo    = document.getElementById('instrNewTaskTitleError');
            const errorEstado    = document.getElementById('instrNewTaskStatusError');
            const errorUsuarios  = document.getElementById('instrNewTaskUsersError');

            // Limpiar todos los spans de error antes de validar
            // Así los errores del intento anterior desaparecen al intentar de nuevo
            if (errorTitulo)   errorTitulo.textContent   = '';
            if (errorEstado)   errorEstado.textContent   = '';
            if (errorUsuarios) errorUsuarios.textContent = '';

            // Leer los valores de los campos
            const titulo    = tituloInput   ? tituloInput.value.trim()   : '';
            const estado    = estadoInput   ? estadoInput.value          : '';
            const comentario = instrComentEl && instrComentEl.value.trim() !== ''
                ? instrComentEl.value.trim()
                : undefined;

            // Variable para controlar si el formulario es válido
            let esValido = true;

            // Validar título: obligatorio, mínimo 3 caracteres
            if (!titulo || titulo.length < 3) {
                if (errorTitulo) errorTitulo.textContent = 'El título es obligatorio (mínimo 3 caracteres)';
                if (tituloInput) tituloInput.classList.add('error');
                esValido = false;
            } else {
                // Limpiar el estilo de error si el campo es válido
                if (tituloInput) tituloInput.classList.remove('error');
            }

            // Validar estado: obligatorio — no puede ser el placeholder vacío
            if (!estado) {
                if (errorEstado) errorEstado.textContent = 'Debes seleccionar un estado para la tarea';
                if (estadoInput) estadoInput.classList.add('error');
                esValido = false;
            } else {
                if (estadoInput) estadoInput.classList.remove('error');
            }

            // Obtener los usuarios seleccionados en el dropdown del instructor
            const checkboxes = document.querySelectorAll('#instrUsuariosDropdownPanel input:checked');
            const usuariosSeleccionados = Array.from(checkboxes).map(function(cb) {
                return parseInt(cb.value, 10);
            });

            // Validar usuarios: debe haber al menos uno seleccionado
            if (usuariosSeleccionados.length === 0) {
                if (errorUsuarios) errorUsuarios.textContent = 'Selecciona al menos un usuario para la tarea';
                esValido = false;
            }

            // Si hay errores, detener el envío — el usuario ve los spans de error
            if (!esValido) return;

            // Construir el objeto de tarea para enviar al backend
            const desc = document.getElementById('instrNewTaskDescription');
            const datosTarea = {
                title:         titulo,
                description:   desc && desc.value.trim() !== '' ? desc.value.trim() : undefined,
                status:        estado,
                comment:       comentario,
                assignedUsers: usuariosSeleccionados,
            };

            try {
                const tareaCreada = await registrarTarea(datosTarea);
                if (tareaCreada) {
                    // Limpiar el formulario y el dropdown tras crear la tarea exitosamente
                    instrCreateTaskForm.reset();
                    document.querySelectorAll('#instrUsuariosDropdownPanel input').forEach(function(cb) {
                        cb.checked = false;
                    });
                    const textoDropdown = document.getElementById('instrUsuariosDropdownTexto');
                    if (textoDropdown) textoDropdown.textContent = 'Seleccionar usuarios...';

                    // Recargar las tablas del instructor para mostrar la nueva tarea
                    cargarTareasInstructor();
                    cargarDashboardInstructor();
                    // Refrescar calendario al crear nueva tarea
                    obtenerTodasLasTareas().then(function(t) {
                        if (t) crearCalendario({ contenedorId: 'instrCalendario', paleta: 'instructor', soloLectura: false, tareas: t });
                    }).catch(function() {});
                    await mostrarNotificacion(`Tarea "${datosTarea.title}" creada correctamente`, 'exito');
                }
            } catch (error) {
                const msg = error.message || 'Error al crear la tarea';
                await mostrarNotificacion(msg, 'error');
            }
        });
    }

    // ── MODAL DE REGISTRO ─────────────────────────────────────────────────────────
    // Abrir el modal al hacer clic en "Regístrate aquí"
    const btnAbrirRegistro = document.getElementById('btnAbrirRegistro');
    if (btnAbrirRegistro) {
        btnAbrirRegistro.addEventListener('click', function() { ir(RUTAS.MODAL.REGISTRO); });
    }

    // Cerrar el modal al hacer clic en el botón X
    const btnCerrarRegistro = document.getElementById('registroCloseBtn');
    if (btnCerrarRegistro) {
        btnCerrarRegistro.addEventListener('click', cerrarModalRegistro);
    }

    // Cerrar el modal al hacer clic fuera de él (en el overlay oscuro)
    const registroModal = document.getElementById('registroModal');
    if (registroModal) {
        registroModal.addEventListener('click', function(event) {
            // Solo cerrar si el clic fue directamente en el overlay, no en el modal
            if (event.target === registroModal) cerrarModalRegistro();
        });
    }

    // Submit del formulario de registro
    const formRegistro = document.getElementById('registroForm');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Validar los campos antes de enviar
            const esValido = await validarFormularioRegistroLocal();
            if (!esValido) return;

            const btnRegistrar = document.getElementById('btnRegistrar');
            if (btnRegistrar) { btnRegistrar.disabled = true; btnRegistrar.textContent = 'Creando cuenta...'; }

            try {
                // Enviar el registro al backend (POST /api/auth/register)
                await registrarUsuario({
                    name:      document.getElementById('registroNombre').value.trim(),
                    documento: document.getElementById('registroDocumento').value.trim(),
                    email:     document.getElementById('registroEmail').value.trim(),
                    password:  document.getElementById('registroPassword').value,
                });

                // Si el registro fue exitoso cerrar el modal y mostrar notificación
                cerrarModalRegistro();
                await mostrarNotificacion('Cuenta creada correctamente. Ya puedes iniciar sesión.', 'exito');

            } catch (error) {
                // Si el backend respondió con un error (409 email duplicado, etc.)
                await mostrarNotificacion(error.message || 'No se pudo crear la cuenta', 'error');
            } finally {
                // Siempre rehabilitar el botón, haya error o no
                if (btnRegistrar) {
                    btnRegistrar.disabled    = false;
                    btnRegistrar.textContent = 'Crear cuenta';
                }
            }
        });
    }

    // ── BÚSQUEDA DE TAREAS EN EL PANEL USUARIO ────────────────────────────────
    // El buscador filtra las filas visibles en la tabla sin hacer peticiones al servidor.
    // Trabaja directamente sobre el DOM comparando el texto de cada fila con el término buscado.
    const formBuscador     = document.getElementById('userSearchTaskForm');
    const inputBuscador    = document.getElementById('userSearchTaskInput');
    const btnLimpiarBuscador = document.getElementById('userSearchClearBtn');

    if (formBuscador) {
        formBuscador.addEventListener('submit', function(event) {
            event.preventDefault();
            const termino     = inputBuscador ? inputBuscador.value.trim().toLowerCase() : '';
            const tablaTareas = document.querySelector('#tasksTableBody');
            if (!tablaTareas) return;
            const filas = Array.from(tablaTareas.querySelectorAll('tr'));
            const anterior = tablaTareas.querySelector('.fila-sin-resultados');
            if (anterior) tablaTareas.removeChild(anterior);
            if (!termino) {
                filas.forEach(function(f) { f.classList.remove('hidden'); });
                if (btnLimpiarBuscador) btnLimpiarBuscador.classList.add('hidden');
                return;
            }
            if (btnLimpiarBuscador) btnLimpiarBuscador.classList.remove('hidden');
            let hayCoincidencias = false;
            filas.forEach(function(fila) {
                if (fila.textContent.toLowerCase().includes(termino)) {
                    fila.classList.remove('hidden');
                    hayCoincidencias = true;
                } else {
                    fila.classList.add('hidden');
                }
            });
            if (!hayCoincidencias) {
                const tr = document.createElement('tr');
                tr.className = 'fila-sin-resultados';
                const td = document.createElement('td');
                td.setAttribute('colspan', '6');
                td.style.textAlign = 'center';
                td.style.color     = 'var(--texto-claro)';
                td.textContent = `Sin resultados para "${inputBuscador.value.trim()}"`;
                tr.appendChild(td);
                tablaTareas.appendChild(tr);
            }
        });
    }

    if (btnLimpiarBuscador) {
        btnLimpiarBuscador.addEventListener('click', function() {
            if (inputBuscador) inputBuscador.value = '';
            btnLimpiarBuscador.classList.add('hidden');
            const tablaTareas = document.querySelector('#tasksTableBody');
            if (!tablaTareas) return;
            Array.from(tablaTareas.querySelectorAll('tr')).forEach(function(f) { f.classList.remove('hidden'); });
            const anterior = tablaTareas.querySelector('.fila-sin-resultados');
            if (anterior) tablaTareas.removeChild(anterior);
        });
    }

    // Prevenimos que el formulario de búsqueda recargue la página al presionar Enter
    const userSearchTaskForm = document.getElementById('userSearchTaskForm');
    if (userSearchTaskForm) {
        userSearchTaskForm.addEventListener('submit', function(event) {
            // Sin este preventDefault el navegador recargaría la página al dar Enter
            event.preventDefault();
        });
    }

    // ── BOTONES DE ACCIÓN DE LA TABLA DE TAREAS DEL USUARIO ──────────────────
    // Los botones de acción (ver, editar, exportar) se crean dinámicamente en tareasUI.js
    // con el atributo data-action. Usamos delegación de eventos en el tbody para que
    // el listener funcione incluso con filas que se agregaron después de registrarlo.
    const tablaUsuario = document.getElementById('tasksTableBody');
    if (tablaUsuario) {
        tablaUsuario.addEventListener('click', async function(event) {
            // Se busca el botón más cercano al elemento clickeado
            const btn = event.target.closest('button[data-action]');
            if (!btn) return; // El clic no fue en un botón de acción

            const accion  = btn.dataset.action;
            const tareaId = btn.dataset.id;

            if (accion === 'ver') {
                // Usar obtenerTareaPorId para tener todos los datos (incluyendo assignedUsersDisplay)
                // Reconstruir desde el DOM no tiene el nombre del usuario asignado
                const tareaFresca = await obtenerTareaPorId(tareaId);
                _pendingVerTarea = tareaFresca || { id: tareaId };
                ir(RUTAS.USUARIO.VER_TAREA + '/' + tareaId);

            } else if (accion === 'edit') {
                const fila        = btn.closest('tr');
                const titulo      = fila.cells[1].textContent;
                const spanDesc    = fila.cells[2].querySelector('.celda-desc__texto');
                const descripcion = spanDesc ? (spanDesc.textContent === '—' ? '' : spanDesc.textContent) : '';
                const estado      = fila.cells[3].querySelector('.status-badge').className
                    .split(' ')
                    .find(c => c.startsWith('status-') && c !== 'status-badge')
                    ?.replace('status-', '') || '';

                // Guardia: tareas finalizadas no se pueden modificar
                if (estado === 'completada' || estado === 'reprobada') {
                    await mostrarNotificacion('Esta tarea ya fue calificada y no puede modificarse', 'advertencia');
                    return;
                }
                const comentario = fila.cells[4].textContent === '—' ? '' : fila.cells[4].textContent;

                _pendingEditarTarea = { id: tareaId, title: titulo, description: descripcion, status: estado, comment: comentario };
                ir(RUTAS.USUARIO.EDITAR_TAREA + '/' + tareaId);

            } else if (accion === 'export') {
                // Exportar solo esta tarea como JSON
                // Se reconstruye el objeto mínimo necesario para la exportación
                const fila = btn.closest('tr');
                const spanDescExp = fila.cells[2].querySelector('.celda-desc__texto');
                const tareaExportar = {
                    id:          tareaId,
                    title:       fila.cells[1].textContent,
                    description: spanDescExp ? (spanDescExp.textContent === '—' ? '' : spanDescExp.textContent) : '',
                    status:      fila.cells[3].querySelector('.status-badge').textContent,
                    comment:     fila.cells[4].textContent === '—' ? '' : fila.cells[4].textContent,
                };
                // exportarTareasJSON viene de exportacion.js y descarga el archivo
                const exportado = exportarTareasJSON([tareaExportar]);
                if (exportado) {
                    await mostrarNotificacion('Tarea exportada correctamente', 'exito');
                } else {
                    await mostrarNotificacion('No se pudo exportar la tarea', 'error');
                }
            }
        });
    }

    // Al final del cuerpo de registrarEventosNavegacion():
    registrarListenerCambioPassword();
    registrarListenerOlvidoPassword();

    // Modal Ver Tarea — solo lectura
    const verTareaModal = document.getElementById('verTareaModal');
    const verTareaClose = document.getElementById('verTareaClose');
    const verTareaCerrar = document.getElementById('verTareaCerrar');
    function cerrarVerTarea() {
        if (verTareaModal) verTareaModal.classList.add('hidden');
        const h = window.location.hash.slice(1);
        if (h.startsWith(RUTAS.ADMIN.VER_TAREA) || h.startsWith(RUTAS.USUARIO.VER_TAREA) || h.startsWith(RUTAS.INSTRUCTOR.VER_TAREA)) volverDeModal();
    }
    if (verTareaClose)  verTareaClose.addEventListener('click', cerrarVerTarea);
    if (verTareaCerrar) verTareaCerrar.addEventListener('click', cerrarVerTarea);
    if (verTareaModal)  verTareaModal.addEventListener('click', function(e) { if (e.target === verTareaModal) cerrarVerTarea(); });
}

// Actualiza las tarjetas de estadísticas del panel del estudiante.
// Usa las tareas que ya se cargaron en activarModoUsuario para no hacer una petición extra.
// Usa IDs de elementos distintos a los del admin para que ambos paneles coexistan sin conflictos.
function cargarDashboardUsuario(tareas) {
    // Verificamos que haya un arreglo de tareas válido antes de calcular los contadores
    if (!tareas || !Array.isArray(tareas)) return;

    const el = {
        total:      document.getElementById('userDashTotal'),
        pendiente:  document.getElementById('userDashPendiente'),
        progreso:   document.getElementById('userDashProgreso'),
        aprobacion: document.getElementById('userDashAprobacion'),
        completada: document.getElementById('userDashCompletada'),
        reprobada:  document.getElementById('userDashReprobada'),
    };

    if (el.total)      el.total.textContent      = tareas.length;
    if (el.pendiente)  el.pendiente.textContent  = tareas.filter(function(t) { return t.status === 'pendiente'; }).length;
    if (el.progreso)   el.progreso.textContent   = tareas.filter(function(t) { return t.status === 'en_progreso'; }).length;
    if (el.aprobacion) el.aprobacion.textContent = tareas.filter(function(t) { return t.status === 'pendiente_aprobacion'; }).length;
    if (el.completada) el.completada.textContent = tareas.filter(function(t) { return t.status === 'completada'; }).length;
    if (el.reprobada)  el.reprobada.textContent  = tareas.filter(function(t) { return t.status === 'reprobada'; }).length;
}

// Registra todos los eventos del flujo de recuperación de contraseña olvidada.
// Se llama una sola vez al arrancar el sistema. El flujo tiene 3 pasos:
// 1) El usuario ingresa su email  →  2) Ingresa el código de verificación  →  3) Escribe la nueva contraseña.
function registrarListenerOlvidoPassword() {
    const modal     = document.getElementById('olvidoPasswordModal');
    const btnAbrir  = document.getElementById('btnOlvidoPassword');
    const btnCerrar = document.getElementById('olvidoPasswordClose');
    const titulo    = document.getElementById('olvidoPasswordTitulo');

    // Variable para recordar el email entre los 3 pasos
    // Se usa let porque cambia durante el flujo
    let emailRecuperacion = '';

    // Función para mostrar solo el paso indicado y ocultar los demás
    // pasoVisible: 1, 2 o 3
    function mostrarPaso(pasoVisible) {
        const titulosPasos = {
            1: 'Recuperar contraseña',
            2: 'Verificar código',
            3: 'Nueva contraseña',
        };
        if (titulo) titulo.textContent = titulosPasos[pasoVisible];

        [1, 2, 3].forEach(function(num) {
            const el = document.getElementById(`olvidoPaso${num}`);
            if (el) {
                if (num === pasoVisible) el.classList.remove('hidden');
                else el.classList.add('hidden');
            }
        });
    }

    // Función para abrir el modal en el paso 1
    function abrirModalOlvido() {
        emailRecuperacion = '';
        mostrarPaso(1);
        // Limpiar los campos del formulario del paso 1
        const emailInput = document.getElementById('olvidoEmail');
        if (emailInput) emailInput.value = '';
        const emailError = document.getElementById('olvidoEmailError');
        if (emailError) emailError.textContent = '';
        modal.classList.remove('hidden');
    }

    // Función para cerrar el modal completamente
    function cerrarModalOlvido() {
        modal.classList.add('hidden');
        emailRecuperacion = '';
        if (window.location.hash === '#' + RUTAS.MODAL.OLVIDO_PASSWORD) volverDeModal();
    }

    // Registrar la ruta del modal para que sea navegable via ir(RUTAS.MODAL.OLVIDO_PASSWORD)
    registrarRuta(RUTAS.MODAL.OLVIDO_PASSWORD, abrirModalOlvido);

    // Abrir el modal al hacer clic en el enlace
    if (btnAbrir) btnAbrir.addEventListener('click', function() { ir(RUTAS.MODAL.OLVIDO_PASSWORD); });

    // Cerrar con el botón X
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalOlvido);

    // Cerrar al hacer clic en el overlay
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) cerrarModalOlvido();
        });
    }

    // Botones de cancelar/volver en cada paso
    const paso1Cancelar = document.getElementById('olvidoPaso1Cancelar');
    if (paso1Cancelar) paso1Cancelar.addEventListener('click', cerrarModalOlvido);

    const paso2Volver = document.getElementById('olvidoPaso2Volver');
    if (paso2Volver) paso2Volver.addEventListener('click', function() { mostrarPaso(1); });

    const paso3Cancelar = document.getElementById('olvidoPaso3Cancelar');
    if (paso3Cancelar) paso3Cancelar.addEventListener('click', cerrarModalOlvido);

    // ── PASO 1: enviar el email ────────────────────────────────────────────────
    const formEmail = document.getElementById('olvidoEmailForm');
    if (formEmail) {
        formEmail.addEventListener('submit', async function(event) {
            event.preventDefault();

            const emailInput = document.getElementById('olvidoEmail');
            const emailError = document.getElementById('olvidoEmailError');
            const valor      = emailInput.value.trim();

            // Validar formato de email con regex básica
            const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!valor || !formatoEmail.test(valor)) {
                emailError.textContent = 'Ingresa un correo electrónico válido';
                return;
            }
            emailError.textContent = '';

            // Llamar al endpoint forgot-password
            const resultado = await forgotPassword(valor);

            if (resultado === true) {
                // Guardar el email para usarlo en los siguientes pasos
                emailRecuperacion = valor;
                mostrarPaso(2);
                // Limpiar el campo de código
                const codigoInput = document.getElementById('olvidoCodigo');
                if (codigoInput) codigoInput.value = '';
            } else {
                await mostrarNotificacion(resultado.error || 'Error al enviar el correo', 'error');
            }
        });
    }

    // ── PASO 2: verificar el código ───────────────────────────────────────────
    const formCodigo = document.getElementById('olvidoCodigoForm');
    if (formCodigo) {
        formCodigo.addEventListener('submit', async function(event) {
            event.preventDefault();

            const codigoInput = document.getElementById('olvidoCodigo');
            const codigoError = document.getElementById('olvidoCodigoError');
            const valor       = codigoInput.value.trim();

            // Validar que sean exactamente 6 dígitos numéricos
            if (!valor || !/^\d{6}$/.test(valor)) {
                codigoError.textContent = 'El código debe tener exactamente 6 dígitos numéricos';
                return;
            }
            codigoError.textContent = '';

            const resultado = await verifyResetCode(emailRecuperacion, valor);

            if (resultado === true) {
                mostrarPaso(3);
                // Limpiar los campos de contraseña
                const nuevaInput     = document.getElementById('olvidoNuevaPassword');
                const confirmarInput = document.getElementById('olvidoConfirmarPassword');
                if (nuevaInput)     nuevaInput.value     = '';
                if (confirmarInput) confirmarInput.value = '';
            } else {
                await mostrarNotificacion(resultado.error || 'Código incorrecto o expirado', 'error');
            }
        });
    }

    // ── PASO 3: cambiar la contraseña ─────────────────────────────────────────
    const formNuevaPassword = document.getElementById('olvidoNuevaPasswordForm');
    if (formNuevaPassword) {
        formNuevaPassword.addEventListener('submit', async function(event) {
            event.preventDefault();

            const nuevaInput      = document.getElementById('olvidoNuevaPassword');
            const confirmarInput  = document.getElementById('olvidoConfirmarPassword');
            const nuevaError      = document.getElementById('olvidoNuevaPasswordError');
            const confirmarError  = document.getElementById('olvidoConfirmarPasswordError');
            const nueva           = nuevaInput.value;
            const confirmar       = confirmarInput.value;

            let esValido = true;
            nuevaError.textContent    = '';
            confirmarError.textContent = '';

            if (!nueva || nueva.length < 6) {
                nuevaError.textContent = 'La contraseña debe tener al menos 6 caracteres';
                esValido = false;
            }
            if (nueva !== confirmar) {
                confirmarError.textContent = 'Las contraseñas no coinciden';
                esValido = false;
            }
            if (!esValido) return;

            const resultado = await resetPassword(emailRecuperacion, nueva);

            if (resultado === true) {
                cerrarModalOlvido();
                await mostrarNotificacion('Contraseña restablecida correctamente. Ya puedes iniciar sesión.', 'exito');
            } else {
                await mostrarNotificacion(resultado.error || 'Error al restablecer la contraseña', 'error');
            }
        });
    }
}