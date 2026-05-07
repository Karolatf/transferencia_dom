// MÓDULO: ui/modoUI.js
// CAPA:   UI

// Responsabilidad: gestionar qué vista está activa (inicio, usuario, admin),
// el modal dinámico de usuario del panel admin, filtros y ordenamiento.
//
// Toda petición HTTP pasa por los módulos de api/.
// Toda notificación pasa por notificaciones.js.

import {
    obtenerTodasLasTareas,
    obtenerTareasDeUsuario,
    obtenerTareaPorId,
    eliminarTarea,
    registrarTarea,
    obtenerDashboard,
    actualizarTarea,
} from '../api/tareasApi.js';

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

import {
    mostrarNotificacion,
    mostrarConfirmacion,
    mostrarModalToggleEstado,
    mostrarModalEliminarUsuario,
} from '../utils/notificaciones.js';

import { filtrarTareas }  from '../utils/filtros.js';

import { mostrarModalEdicion, ocultarModalEdicion, agregarTareaATabla } from './tareasUI.js';

import { ordenarTareas }  from '../utils/ordenamiento.js';

// Se importan las dos funciones de exportación — la específica de tareas y la genérica
// exportarListaJSON es la nueva función para exportar usuarios y cualquier otro recurso
import { exportarTareasJSON, exportarListaJSON } from '../utils/exportacion.js';

// Se agrega validarFormularioRegistro a los imports de validaciones
// Este import conecta modoUI.js con la nueva función que valida los 5 campos del modal
import { validarFormularioUsuario, validarFormularioTarea, validarFormularioLogin, validarFormularioRegistro } from '../utils/validaciones.js';

// Agregar junto a los otros imports al inicio de modoUI.js:
import { loginUsuario, registrarUsuario, forgotPassword, verifyResetCode, resetPassword } from '../api/authApi.js';

import { guardarSesion, cerrarSesion, obtenerUsuarioSesion } from '../utils/sesion.js';

import { registrarEvento, renderizarAuditoria } from '../utils/auditoria.js';

import { PERMISOS_POR_ROL, METADATOS_ROL } from '../utils/rolesPermisos.js';

import { crearCalendario } from '../utils/eventosCalendario.js';
import { obtenerNotas, crearNota as crearNotaApi, eliminarNota as eliminarNotaApi } from '../api/notesApi.js';

// crearIconoLucide — función privada reutilizable para crear íconos Lucide en el DOM
// Parámetro: nombreIcono — string con el nombre del ícono según la librería Lucide
// Parámetro: claseExtra — string opcional con clases CSS adicionales
function crearIconoLucide(nombreIcono, claseExtra) {
    const icono = document.createElement('i');
    icono.setAttribute('data-lucide', nombreIcono);
    icono.classList.add('icono-accion');
    if (claseExtra) icono.classList.add(claseExtra);
    return icono;
}


// ── REFERENCIAS A VISTAS ──────────────────────────────────────────────────────

const pantallaInicio = document.getElementById('pantallaInicio');
const vistaUsuario   = document.getElementById('vistaUsuario');
const vistaAdmin     = document.getElementById('vistaAdmin');
// Busca donde están definidas vistaAdmin, vistaUsuario, pantallaInicio y agrega:
const vistaInstructor = document.getElementById('vistaInstructor');

// Oculta todas las vistas del sistema antes de mostrar la activa
// IMPORTANTE: incluir vistaInstructor en esta función es crítico
// Sin esta línea, al cerrar sesión el instructor la página quedaba visualmente rota
// porque vistaInstructor permanecía visible detrás de la pantalla de inicio
function ocultarTodo() {
    // Ocultar la pantalla de inicio (formulario de login)
    pantallaInicio.classList.add('hidden');
    // Ocultar la vista del panel de usuario normal
    vistaUsuario.classList.add('hidden');
    // Ocultar la vista del panel de administrador
    vistaAdmin.classList.add('hidden');
    // Ocultar la vista del panel instructor — faltaba esta línea
    // Su ausencia causaba que el panel verde quedara visible al cerrar sesión
    if (vistaInstructor) vistaInstructor.classList.add('hidden');
}

export function activarModoInicio() {
    ocultarTodo();
    pantallaInicio.classList.remove('hidden');
    document.body.dataset.modo = 'inicio';
    // Limpiar los campos del formulario para no exponer datos del usuario anterior
    // Esto es especialmente importante en computadores compartidos
    limpiarFormularioLogin();
}

// ── ACTIVAR MODO USUARIO (ACTUALIZADO) ────────────────────────────────────────
// Al entrar al panel de usuario ya no se muestra el formulario de búsqueda.
// En su lugar se leen los datos del usuario directamente desde el token JWT
// guardado en localStorage y se cargan sus tareas automáticamente.
//
// Esto es más seguro y profesional: el usuario no puede buscar las tareas
// de otra persona escribiendo un documento diferente.

// cargarPostits — carga y renderiza los post-its personales del usuario
// Los post-its se persisten en localStorage con la clave postits_${userId}
// Parámetro: userId — id numérico del usuario logueado (para clave de localStorage única)
// Este es el ÚNICO uso de localStorage permitido en el proyecto
async function cargarPostits(userId) {
    const seccion = document.getElementById('postitsSeccion');
    if (!seccion) return;

    const MAXIMO_POSTITS = 12;

    // Cargar notas desde el servidor
    let notas = await obtenerNotas();

    function renderizarPostits() {
        while (seccion.firstChild) seccion.removeChild(seccion.firstChild);

        // Cabecera
        const header = document.createElement('div');
        header.className = 'postits__header';
        const titulo = document.createElement('h3');
        titulo.className   = 'postits__titulo';
        titulo.textContent = 'Mis notas personales';
        header.appendChild(titulo);
        const contador = document.createElement('span');
        contador.className   = 'postits__contador';
        contador.textContent = notas.length + ' / ' + MAXIMO_POSTITS;
        header.appendChild(contador);
        seccion.appendChild(header);

        // Grid de notas
        const grid = document.createElement('div');
        grid.className = 'postits__grid';

        notas.forEach(function(nota) {
            const card = document.createElement('div');
            card.className = 'postit__card';
            card.style.backgroundColor = nota.color;

            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'postit__btn-eliminar';
            btnEliminar.title     = 'Eliminar nota';
            btnEliminar.type      = 'button';
            const iconoX = document.createElement('i');
            iconoX.setAttribute('data-lucide', 'x');
            iconoX.classList.add('icono-accion');
            btnEliminar.appendChild(iconoX);
            btnEliminar.addEventListener('click', async function() {
                const ok = await eliminarNotaApi(nota.id);
                if (ok) {
                    notas = notas.filter(function(n) { return n.id !== nota.id; });
                    renderizarPostits();
                }
            });
            card.appendChild(btnEliminar);

            const texto = document.createElement('p');
            texto.className   = 'postit__texto';
            texto.textContent = nota.texto;
            card.appendChild(texto);

            grid.appendChild(card);
        });

        seccion.appendChild(grid);

        // Botón Nueva nota
        const btnAgregar = document.createElement('button');
        btnAgregar.className = 'postit__btn-agregar';
        btnAgregar.title     = 'Agregar nota';
        btnAgregar.type      = 'button';
        const iconoPlus = document.createElement('i');
        iconoPlus.setAttribute('data-lucide', 'plus');
        iconoPlus.classList.add('icono-accion');
        btnAgregar.appendChild(iconoPlus);
        btnAgregar.appendChild(document.createTextNode(' Nueva nota'));
        btnAgregar.addEventListener('click', function() {
            if (notas.length >= MAXIMO_POSTITS) {
                mostrarNotificacion('Máximo de notas alcanzado (12)', 'advertencia');
                return;
            }
            mostrarFormularioPostit();
        });
        seccion.appendChild(btnAgregar);

        if (window.lucide) window.lucide.createIcons();
    }

    function mostrarFormularioPostit() {
        if (seccion.querySelector('.postit__formulario')) return;

        const formulario = document.createElement('div');
        formulario.className = 'postit__formulario';

        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Escribe tu nota aquí...';
        textarea.className   = 'postit__textarea';
        textarea.rows        = 3;

        const coloresPastel = ['#fef3c7', '#fce7f3', '#d1fae5', '#dbeafe'];
        let colorSeleccionado = coloresPastel[0];

        const selectoresColor = document.createElement('div');
        selectoresColor.className = 'postit__selectores-color';
        coloresPastel.forEach(function(color) {
            const selector = document.createElement('button');
            selector.type  = 'button';
            selector.className = 'postit__selector-color';
            selector.style.backgroundColor = color;
            if (color === colorSeleccionado) selector.classList.add('postit__selector-color--activo');
            selector.addEventListener('click', function() {
                selectoresColor.querySelectorAll('.postit__selector-color').forEach(function(s) {
                    s.classList.remove('postit__selector-color--activo');
                });
                selector.classList.add('postit__selector-color--activo');
                colorSeleccionado = color;
            });
            selectoresColor.appendChild(selector);
        });

        const btnGuardar = document.createElement('button');
        btnGuardar.type      = 'button';
        btnGuardar.className = 'postit__btn-guardar';
        btnGuardar.textContent = 'Guardar nota';
        btnGuardar.addEventListener('click', async function() {
            const textoVal = textarea.value.trim();
            if (!textoVal) { textarea.style.borderColor = '#ef4444'; return; }

            btnGuardar.disabled    = true;
            btnGuardar.textContent = 'Guardando...';

            const nuevaNota = await crearNotaApi(textoVal, colorSeleccionado);
            if (nuevaNota) {
                notas.push(nuevaNota);
                renderizarPostits();
            } else {
                btnGuardar.disabled    = false;
                btnGuardar.textContent = 'Guardar nota';
                textarea.style.borderColor = '#ef4444';
            }
        });

        const formularioLeft = document.createElement('div');
        formularioLeft.className = 'postit__formulario-left';
        formularioLeft.appendChild(textarea);
        formularioLeft.appendChild(selectoresColor);
        formulario.appendChild(formularioLeft);
        formulario.appendChild(btnGuardar);
        seccion.appendChild(formulario);
    }

    renderizarPostits();
}

export async function activarModoUsuario() {
    ocultarTodo();
    vistaUsuario.classList.remove('hidden');
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
        // Mostrar estado vacío si no hay tareas asignadas
        const estadoVacio = document.getElementById('tasksEmptyState');
        if (estadoVacio) estadoVacio.classList.remove('hidden');
        return;
    }

    // Ocultar el estado vacío y pintar cada tarea
    const estadoVacio = document.getElementById('tasksEmptyState');
    if (estadoVacio) estadoVacio.classList.add('hidden');

    tareas.forEach(function(tarea, indice) {
        // agregarTareaATabla viene de tareasUI.js y construye la fila con createElement
        agregarTareaATabla(tarea, indice);
    });

    // Cargar el dashboard de estadísticas del panel usuario.
    // Se llama con los IDs del vistaUsuario (prefijo userDash) para no
    // sobreescribir los valores del dashboard del panel admin.
    cargarDashboardUsuario(tareas);   // pasar tareas ya cargadas, no hacer fetch extra

    // Montar el calendario del usuario:
    // soloLectura: false — el usuario puede agregar eventos propios además de ver los del instructor
    await crearCalendario({
        contenedorId: 'usuarioCalendario',
        paleta:       'usuario',
        soloLectura:  false,
        tareas:       tareas,
        userId:       usuarioSesion.id,   // para restringir borrado a eventos propios
    });

    // Cargar los post-its personales
    cargarPostits(usuarioSesion.id);
}

// renderizarDiccionarioRoles — cards de roles en la columna derecha del admin
function renderizarDiccionarioRoles(contenedorEl) {
    while (contenedorEl.firstChild) contenedorEl.removeChild(contenedorEl.firstChild);
    Object.keys(METADATOS_ROL).forEach(function(rol) {
        const meta = METADATOS_ROL[rol];
        const card = document.createElement('div');
        card.className = 'rol-card';
        const headerCard = document.createElement('div');
        headerCard.className = 'rol-card__header';
        const icono = document.createElement('i');
        icono.setAttribute('data-lucide', meta.icono);
        icono.classList.add('icono-accion');
        icono.style.color = meta.color;
        headerCard.appendChild(icono);
        const nombre = document.createElement('span');
        nombre.className   = 'rol-card__nombre';
        nombre.textContent = meta.nombre;
        headerCard.appendChild(nombre);
        card.appendChild(headerCard);
        const desc = document.createElement('p');
        desc.className   = 'rol-card__descripcion';
        desc.textContent = meta.descripcion;
        card.appendChild(desc);
        const btn = document.createElement('button');
        btn.className   = 'btn btn-sm';
        btn.textContent = 'Ver permisos';
        btn.addEventListener('click', function() { abrirModalPermisos(rol, meta); });
        card.appendChild(btn);
        contenedorEl.appendChild(card);
    });
    if (window.lucide) window.lucide.createIcons();
}

// abrirModalPermisos — modal rediseñado con agrupación por categoría y badge del rol
function abrirModalPermisos(rol, meta) {
    const cerrar = () => { if (document.body.contains(overlay)) document.body.removeChild(overlay); };

    // ── Overlay ───────────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay';
    overlay.style.cssText = 'display:flex;align-items:center;justify-content:center;';
    overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrar(); });

    // ── Panel ─────────────────────────────────────────────────────────────────
    const panel = document.createElement('div');
    panel.style.cssText = `
        background:#fff;
        border-radius:1.25rem;
        box-shadow:0 20px 60px rgba(0,0,0,0.18);
        width:min(520px,92vw);
        max-height:85vh;
        overflow:hidden;
        display:flex;
        flex-direction:column;
        font-family:inherit;
    `;

    // ── Header con color del rol ───────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = `
        background:${meta.color};
        padding:1.5rem 1.75rem 1.25rem;
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:1rem;
    `;

    const headerLeft = document.createElement('div');
    headerLeft.style.cssText = 'display:flex;align-items:center;gap:0.875rem;';

    // Icono circular blanco
    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = `
        width:48px;height:48px;
        background:rgba(255,255,255,0.25);
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;
    `;
    const icono = document.createElement('i');
    icono.setAttribute('data-lucide', meta.icono);
    icono.style.cssText = 'width:22px;height:22px;color:#fff;';
    iconWrap.appendChild(icono);
    headerLeft.appendChild(iconWrap);

    const headerTexto = document.createElement('div');
    const titulo = document.createElement('h2');
    titulo.textContent = meta.nombre;
    titulo.style.cssText = 'color:#fff;font-size:1.2rem;font-weight:700;margin:0 0 0.2rem;';
    const subtitulo = document.createElement('p');
    subtitulo.textContent = meta.descripcion;
    subtitulo.style.cssText = 'color:rgba(255,255,255,0.82);font-size:0.82rem;margin:0;';
    headerTexto.appendChild(titulo);
    headerTexto.appendChild(subtitulo);
    headerLeft.appendChild(headerTexto);
    header.appendChild(headerLeft);

    // Botón cerrar blanco
    const btnCerrar = document.createElement('button');
    btnCerrar.type = 'button';
    btnCerrar.style.cssText = `
        width:32px;height:32px;
        background:rgba(255,255,255,0.2);
        border:none;border-radius:50%;
        cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;
        transition:background 150ms;
    `;
    btnCerrar.addEventListener('mouseenter', () => { btnCerrar.style.background='rgba(255,255,255,0.35)'; });
    btnCerrar.addEventListener('mouseleave', () => { btnCerrar.style.background='rgba(255,255,255,0.2)'; });
    const icoX = document.createElement('i');
    icoX.setAttribute('data-lucide', 'x');
    icoX.style.cssText = 'width:16px;height:16px;color:#fff;';
    btnCerrar.appendChild(icoX);
    btnCerrar.addEventListener('click', cerrar);
    header.appendChild(btnCerrar);
    panel.appendChild(header);

    // ── Badge contador ────────────────────────────────────────────────────────
    const permisos = PERMISOS_POR_ROL[rol] || [];
    const badgeBar = document.createElement('div');
    badgeBar.style.cssText = `
        padding:0.75rem 1.75rem;
        background:#f8fafc;
        border-bottom:1px solid #e2e8f0;
        display:flex;align-items:center;gap:0.5rem;
    `;
    const badgeCount = document.createElement('span');
    badgeCount.textContent = `${permisos.length} permisos activos`;
    badgeCount.style.cssText = `
        background:${meta.color};
        color:#fff;
        font-size:0.72rem;
        font-weight:700;
        letter-spacing:0.03em;
        padding:0.25rem 0.65rem;
        border-radius:9999px;
    `;
    const badgeRol = document.createElement('span');
    badgeRol.textContent = `Rol: ${meta.nombre}`;
    badgeRol.style.cssText = 'font-size:0.78rem;color:#64748b;font-weight:500;';
    badgeBar.appendChild(badgeCount);
    badgeBar.appendChild(badgeRol);
    panel.appendChild(badgeBar);

    // ── Cuerpo con permisos agrupados ─────────────────────────────────────────
    const cuerpo = document.createElement('div');
    cuerpo.style.cssText = 'padding:1.25rem 1.75rem 1.5rem;overflow-y:auto;flex:1;';

    // Agrupar permisos por prefijo (tasks.* / users.*)
    const grupos = {};
    permisos.forEach(function(p) {
        const prefijo = p.split('.')[0];
        if (!grupos[prefijo]) grupos[prefijo] = [];
        grupos[prefijo].push(p);
    });

    const etiquetasGrupo = {
        tasks: { label: 'Tareas', icon: 'clipboard-list', color: '#0ea5e9' },
        users: { label: 'Usuarios', icon: 'users',         color: '#8b5cf6' },
    };

    Object.keys(grupos).forEach(function(grupo) {
        const meta_g = etiquetasGrupo[grupo] || { label: grupo, icon: 'lock', color: '#64748b' };

        // Encabezado de grupo
        const grupoHeader = document.createElement('div');
        grupoHeader.style.cssText = `
            display:flex;align-items:center;gap:0.5rem;
            margin:0.75rem 0 0.5rem;
            padding-bottom:0.4rem;
            border-bottom:1.5px solid #f1f5f9;
        `;
        const icoGrupo = document.createElement('i');
        icoGrupo.setAttribute('data-lucide', meta_g.icon);
        icoGrupo.style.cssText = `width:15px;height:15px;color:${meta_g.color};`;
        const labelGrupo = document.createElement('span');
        labelGrupo.textContent = meta_g.label;
        labelGrupo.style.cssText = `font-size:0.75rem;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.06em;`;
        grupoHeader.appendChild(icoGrupo);
        grupoHeader.appendChild(labelGrupo);
        cuerpo.appendChild(grupoHeader);

        // Items de permisos
        const grid = document.createElement('div');
        grid.style.cssText = 'display:flex;flex-direction:column;gap:0.35rem;margin-bottom:0.5rem;';

        grupos[grupo].forEach(function(permiso) {
            const item = document.createElement('div');
            item.style.cssText = `
                display:flex;align-items:center;gap:0.6rem;
                padding:0.45rem 0.75rem;
                border-radius:0.5rem;
                background:#f8fafc;
                border:1px solid #e2e8f0;
                transition:background 150ms;
            `;
            item.addEventListener('mouseenter', () => { item.style.background='#f0f9ff'; item.style.borderColor=meta_g.color; });
            item.addEventListener('mouseleave', () => { item.style.background='#f8fafc'; item.style.borderColor='#e2e8f0'; });

            const checkWrap = document.createElement('div');
            checkWrap.style.cssText = `
                width:20px;height:20px;
                background:${meta_g.color}18;
                border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                flex-shrink:0;
            `;
            const icoCheck = document.createElement('i');
            icoCheck.setAttribute('data-lucide', 'check');
            icoCheck.style.cssText = `width:11px;height:11px;color:${meta_g.color};font-weight:700;`;
            checkWrap.appendChild(icoCheck);
            item.appendChild(checkWrap);

            const texto = document.createElement('code');
            texto.textContent = permiso;
            texto.style.cssText = 'font-size:0.82rem;color:#1e293b;font-family:ui-monospace,monospace;flex:1;';
            item.appendChild(texto);

            grid.appendChild(item);
        });
        cuerpo.appendChild(grid);
    });

    panel.appendChild(cuerpo);

    // ── Pie ───────────────────────────────────────────────────────────────────
    const pie = document.createElement('div');
    pie.style.cssText = `
        padding:0.875rem 1.75rem;
        background:#f8fafc;
        border-top:1px solid #e2e8f0;
        display:flex;justify-content:flex-end;
    `;
    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.textContent = 'Cerrar';
    btnOk.style.cssText = `
        background:${meta.color};
        color:#fff;
        border:none;
        border-radius:0.6rem;
        padding:0.5rem 1.5rem;
        font-size:0.875rem;
        font-weight:600;
        cursor:pointer;
        transition:opacity 150ms;
    `;
    btnOk.addEventListener('mouseenter', () => { btnOk.style.opacity='0.85'; });
    btnOk.addEventListener('mouseleave', () => { btnOk.style.opacity='1'; });
    btnOk.addEventListener('click', cerrar);
    pie.appendChild(btnOk);
    panel.appendChild(pie);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();
}

export async function activarModoAdmin() {
    ocultarTodo();
    vistaAdmin.classList.remove('hidden');
    document.body.dataset.modo = 'admin';
    // Carga inicial en paralelo: no bloqueamos la UI
    cargarDashboard();
    cargarTablaUsuarios();
    cargarTodasLasTareas();
    // Se inicializa el dropdown de usuarios de la card "Crear Tarea"
    // await garantiza que los checkboxes están cargados antes de continuar
    await inicializarDropdownUsuarios();

    // Inicializar la columna de auditoría vacía
    const contenedorAuditoria = document.getElementById('auditoriaContenedor');
    if (contenedorAuditoria) renderizarAuditoria(contenedorAuditoria);

    // Inicializar la columna derecha de roles
    const contenedorRoles = document.getElementById('rolesContenedor');
    if (contenedorRoles) renderizarDiccionarioRoles(contenedorRoles);
}

// ── ACTIVAR MODO INSTRUCTOR ───────────────────────────────────────────────────
// Activa el panel de docente con paleta verde pastel.
// El instructor tiene CRUD completo de tareas pero no puede gestionar usuarios.
// Se llama desde main.js cuando role === 'instructor'.
export async function activarModoInstructor() {
    ocultarTodo();
    vistaInstructor.classList.remove('hidden');
    document.body.dataset.modo = 'instructor';

    // Cargar datos en paralelo: no bloqueamos la UI mientras carga
    cargarDashboardInstructor();
    cargarTablaUsuariosInstructor();
    cargarTareasInstructor();
    // Inicializar el dropdown de usuarios para la card "Crear Tarea" del instructor
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

    // Auto-refresh del panel de calificación.
    // Se cancela el intervalo anterior antes de crear uno nuevo para
    // evitar que se acumulen y causen recargas visuales no deseadas.
    if (window._panelCalificacionInterval) {
        clearInterval(window._panelCalificacionInterval);
        window._panelCalificacionInterval = null;
    }
    window._panelCalificacionInterval = setInterval(async function() {
        // Verificar que la vistaInstructor esté VISIBLE (no hidden).
        // La condición anterior usaba getElementById que siempre retorna
        // el elemento (es HTML estático), por lo que el intervalo nunca se cancelaba.
        const vistaInstr = document.getElementById('vistaInstructor');
        const estaVisible = vistaInstr && !vistaInstr.classList.contains('hidden');
        if (estaVisible) {
            await cargarPanelCalificacion();
            cargarDashboardInstructor();
            cargarTablaUsuariosInstructor();
        } else {
            clearInterval(window._panelCalificacionInterval);
            window._panelCalificacionInterval = null;
        }
    }, 10000);
}

// calcularRendimiento — determina el nivel de rendimiento y el estado resultante
// según la nota asignada por el instructor.
// Retorna: { estado, rendimiento, color, bg, icono }
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

// cargarPanelCalificacion — lista las tareas con status=pendiente_aprobacion
// para que el instructor las apruebe con una nota del 0 al 100
async function cargarPanelCalificacion() {
    const panel = document.getElementById('instrPanelCalificacion');
    if (!panel) return;
    while (panel.firstChild) panel.removeChild(panel.firstChild);

    try {
        const todasLasTareas   = await obtenerTodasLasTareas();
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

        const lista = document.createElement('div');
        lista.className = 'panel-cal__lista';

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

                    // Eliminar la card del DOM sin recargar toda la lista
                    if (card.parentNode) card.parentNode.removeChild(card);

                    // Si no quedan cards, mostrar vacío
                    if (lista.querySelectorAll('.panel-cal__card').length === 0) {
                        while (lista.firstChild) lista.removeChild(lista.firstChild);
                        const vacioWrap = document.createElement('div');
                        vacioWrap.className = 'panel-cal__vacio';
                        const icVacio = document.createElement('div');
                        icVacio.textContent = '🎉';
                        icVacio.style.cssText = 'font-size:2.5rem;margin-bottom:0.5rem;';
                        const txVacio = document.createElement('p');
                        txVacio.textContent = 'Todas las entregas han sido revisadas';
                        txVacio.style.cssText = 'color:#6b7280;font-size:0.9rem;margin:0;';
                        vacioWrap.appendChild(icVacio);
                        vacioWrap.appendChild(txVacio);
                        lista.appendChild(vacioWrap);
                    }

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
            lista.appendChild(card);
        });

        panel.appendChild(lista);

    } catch (error) {
        const err = document.createElement('p');
        err.className   = 'texto-vacio';
        err.textContent = 'Error al cargar las entregas pendientes';
        panel.appendChild(err);
    }
}

// cargarDashboardInstructor — actualiza las tarjetas de estadísticas del panel instructor.
// FILTRO: solo cuenta tareas asignadas a estudiantes (role=user), no de admins ni otros instructores.
async function cargarDashboardInstructor() {
    const [todasTareas, todosUsuarios] = await Promise.all([
        obtenerTodasLasTareas(),
        obtenerTodosLosUsuarios(),
    ]);
    if (!todasTareas || !todosUsuarios) return;

    // Solo IDs de estudiantes (role=user)
    const idsEstudiantes = new Set(
        todosUsuarios.filter(u => u.role === 'user').map(u => u.id)
    );

    // Solo tareas con al menos un estudiante asignado
    const tareas = todasTareas.filter(t =>
        Array.isArray(t.assignedUsers) && t.assignedUsers.some(id => idsEstudiantes.has(Number(id)))
    );

    const el = {
        total:      document.getElementById('instrDashTotal'),
        pendiente:  document.getElementById('instrDashPendiente'),
        progreso:   document.getElementById('instrDashProgreso'),
        aprobacion: document.getElementById('instrDashAprobacion'),
        completada: document.getElementById('instrDashCompletada'),
        reprobada:  document.getElementById('instrDashReprobada'),
    };

    if (el.total)      el.total.textContent      = tareas.length;
    if (el.pendiente)  el.pendiente.textContent   = tareas.filter(t => t.status === 'pendiente').length;
    if (el.progreso)   el.progreso.textContent    = tareas.filter(t => t.status === 'en_progreso').length;
    if (el.aprobacion) el.aprobacion.textContent  = tareas.filter(t => t.status === 'pendiente_aprobacion').length;
    if (el.completada) el.completada.textContent  = tareas.filter(t => t.status === 'completada').length;
    if (el.reprobada)  el.reprobada.textContent   = tareas.filter(t => t.status === 'reprobada').length;
}

// cargarTablaUsuariosInstructor — llena la tabla de usuarios del panel instructor.
// DIFERENCIA con cargarTablaUsuarios (admin): aquí los botones de acción son
// SOLO "Ver / Asignar" — sin Editar, sin Cambiar Rol, sin Eliminar.
async function cargarTablaUsuariosInstructor() {
    const tbody = document.getElementById('instrUsersTableBody');
    if (!tbody) return;

    // Limpiar el tbody antes de rellenarlo para evitar duplicados
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    const [usuarios, todasTareas] = await Promise.all([
        obtenerTodosLosUsuarios(),
        obtenerTodasLasTareas(),
    ]);
    if (!usuarios) return;

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
        celdaNum.textContent = indice + 1;

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
        btnVer.addEventListener('click', function() { abrirModalUsuario(usuario); });

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
}

// aplicarFiltrosInstructor — filtra la tabla de tareas del instructor por estado, usuario y orden.
// Solo muestra tareas asignadas a estudiantes (role=user).
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

// cargarTareasInstructor — llena la tabla de tareas del panel instructor.
// Es equivalente a cargarTodasLasTareas del admin pero usa los IDs del instructor.
async function cargarTareasInstructor() {
    const tbody = document.getElementById('instrTasksTableBody');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    const [todasTareas, todosUsuarios] = await Promise.all([
        obtenerTodasLasTareas(),
        obtenerTodosLosUsuarios(),
    ]);
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

// formatearUsuariosDisplay — muestra el primer nombre y "+N" si hay más
// assignedUsersDisplay es un string "Nombre1, Nombre2, Nombre3"
function formatearUsuariosDisplay(displayStr) {
    if (!displayStr) return '—';
    const nombres = displayStr.split(', ');
    if (nombres.length === 1) return nombres[0];
    return `${nombres[0]} +${nombres.length - 1}`;
}

// ── CELDA DE DESCRIPCIÓN CON TRUNCADO ─────────────────────────────────────────
// Siempre muestra el botón "Ver tarea". El texto se trunca con CSS a 2 líneas.
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
    btn.addEventListener('click', function() { abrirModalVerTarea(tarea); });
    celda.appendChild(btn);

    return celda;
}

// abrirModalVerTarea — abre el modal de solo lectura con los datos de la tarea
// Muestra: título, descripción, estado, comentario, nota (grade), usuarios asignados.
// Si la tarea está completada y no tiene nota → muestra "Sin calificar".
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
        badgeNota.style.cssText = `background:${r.bg};color:${r.color};font-weight:700;font-size:1rem;padding:0.3rem 0.9rem;`;
        badgeNota.textContent = `${nota} / 100`;
        califEl.appendChild(badgeNota);

        // Badge de rendimiento
        const badgeRend = document.createElement('span');
        badgeRend.className = 'status-badge';
        badgeRend.style.cssText = `background:${r.bg};color:${r.color};font-weight:600;font-size:0.85rem;padding:0.25rem 0.75rem;margin-left:0.5rem;`;
        badgeRend.textContent = `${r.icono} ${r.rendimiento} · ${r.label}`;
        califEl.appendChild(badgeRend);

        if (grupoCalif) grupoCalif.style.display = '';
    } else {
        if (grupoSinCalif) grupoSinCalif.style.display = '';
    }

    modal.classList.remove('hidden');
}

// crearFilaTareaInstructor — construye una fila de la tabla de tareas del instructor.
// El instructor puede Editar y Eliminar tareas (CRUD completo).
// Sigue el mismo patrón de crearFilaTareaAdmin.
function crearFilaTareaInstructor(tarea, indice) {
    const fila = document.createElement('tr');
    fila.dataset.id = tarea.id;

    const celdaNum = document.createElement('td');
    celdaNum.textContent = indice + 1;

    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    const celdaDesc = crearCeldaDescripcion(tarea);

    const celdaEstado = document.createElement('td');
    // Construir el badge de estado con los mismos colores que el panel admin
    // CORRECCIÓN: la clase CSS es 'status-pendiente', 'status-completada', etc.
    // No 'status-badge--pendiente' — ese era el bug que causaba que no se vieran los colores
    const badgeEstado = document.createElement('span');
    // Dos clases: status-badge (estilos base del badge) y status-${tarea.status} (color específico)
    // Esto es exactamente lo mismo que hace crearFilaTareaAdmin — mantiene coherencia visual
    badgeEstado.classList.add('status-badge', `status-${tarea.status}`);
    // Usar la misma función formatearEstado que usa el admin para el texto del badge
    badgeEstado.textContent = formatearEstado(tarea.status);
    celdaEstado.appendChild(badgeEstado);

    const celdaUsuario = document.createElement('td');
    celdaUsuario.textContent = formatearUsuariosDisplay(tarea.assignedUsersDisplay);

    const celdaAcciones = document.createElement('td');
    const contenedor    = document.createElement('div');
    contenedor.classList.add('task-actions');

    // Botón Editar — circular con ícono, igual que en la tabla de usuarios
    const btnEditar = crearBotonIcono('pencil', 'Editar tarea', 'btn-accion--amarillo', function() {
        manejarEdicionTareaInstructor(tarea);
    });

    // Botón Eliminar — circular con ícono rojo
    const btnEliminar = crearBotonIcono('trash-2', 'Eliminar tarea', 'btn-accion--rojo', async function() {
        const confirmado = await mostrarConfirmacion(
            '¿Eliminar tarea?',
            'Sí, eliminar',
            'Cancelar',
            `"${tarea.title}" será eliminada permanentemente.`
        );
        if (!confirmado) return;

        const eliminado = await eliminarTarea(tarea.id);
        if (eliminado) {
            // Eliminar fila ANTES del toast para que sea inmediato
            const tbody = document.getElementById('instrTasksTableBody');
            const filaEl = tbody ? tbody.querySelector(`tr[data-id="${tarea.id}"]`) : null;
            if (filaEl) {
                filaEl.remove();
                // Renumerar filas restantes
                if (tbody) {
                    Array.from(tbody.querySelectorAll('tr')).forEach(function(fila, i) {
                        if (fila.cells[0]) fila.cells[0].textContent = i + 1;
                    });
                }
            } else {
                cargarTareasInstructor();
            }
            // Actualizar contador de la card
            const contador = document.getElementById('instrTasksCount');
            if (contador && tbody) {
                const n = tbody.querySelectorAll('tr').length;
                contador.textContent = `${n} ${n === 1 ? 'tarea' : 'tareas'}`;
            }
            // Toast + actualizaciones en background (sin bloquear)
            mostrarNotificacion('Tarea eliminada correctamente', 'exito');
            cargarDashboardInstructor();
            cargarTablaUsuariosInstructor();
            registrarEvento('tarea_eliminada', `Tarea eliminada: "${tarea.title}"`);
            renderizarAuditoria(document.getElementById('auditoriaContenedor'));
        } else {
            await mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
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

// actualizarFilaTareaInstructor — actualiza la fila del instructor en-place.
// Sin reconstruir la tabla completa — evita el parpadeo visual.
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

// inicializarDropdownInstructor — carga los usuarios en el dropdown de la card Crear Tarea del instructor.
// Usa los IDs instrUsuariosDropdown*, distintos a los del admin para coexistir en el DOM.
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

// Carga las estadísticas del dashboard desde el backend y las muestra en pantalla.
// GET /api/tasks/dashboard → { total, pendientes, enProgreso, aprobacion, completadas }
// ACTUALIZACIÓN v3.4.0: se agrega el elemento dashboardAprobacion para pendiente_aprobacion.
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

// crearBadgeRol — badge visual con el nombre y color del rol del usuario
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

// crearBadgeEstado — badge verde (Activo) o rojo (Inactivo) según is_active
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

// crearBotonIcono — botón circular 32x32 con ícono Lucide para la tabla de usuarios
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

// Construye una fila de la tabla de usuarios del panel admin
// Ahora incluye tres botones: Ver/Asignar, Editar y Eliminar
// Parámetros:
//   usuario — objeto del usuario a representar
//   indice  — posición en la lista (para el # correlativo)
// crearFilaUsuario — columnas: # | Nombre | Documento | Correo | Rol | Estado | Acciones
function crearFilaUsuario(usuario, indice) {
    const fila = document.createElement('tr');

    // Columna #
    const tdNum = document.createElement('td');
    tdNum.textContent = indice + 1;
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
        function() { abrirModalUsuario(usuario); }
    ));

    // Botón Editar datos
    tdAcciones.appendChild(crearBotonIcono('pencil', 'Editar usuario', 'btn-accion--amarillo',
        function() { abrirModalEditarUsuario(usuario); }
    ));

    // Botón Cambiar rol (mini-dropdown)
    tdAcciones.appendChild(crearBotonIcono('user-check', 'Cambiar rol', 'btn-accion--azul',
        function() { abrirDropdownRol(usuario, fila); }
    ));

    // Botón Desactivar o Activar según estado actual — modal mejorado con motivo obligatorio
    if (usuario.is_active === 1 || usuario.is_active === true) {
        tdAcciones.appendChild(crearBotonIcono('user-x', 'Desactivar usuario', 'btn-accion--gris',
            async function() {
                const resultado = await mostrarModalToggleEstado(usuario.name, 'desactivar');
                if (!resultado) return; // Canceló
                try {
                    await desactivarUsuario(usuario.id);
                    registrarEvento('rol_cambiado', `${usuario.name} fue desactivado`);
                    renderizarAuditoria(document.getElementById('auditoriaContenedor'));
                    await mostrarNotificacion(`${usuario.name} fue desactivado. Motivo: ${resultado.motivo}`, 'exito');
                    cargarTablaUsuarios();
                } catch (error) {
                    await mostrarNotificacion(error.message || 'No se pudo desactivar', 'error');
                }
            }
        ));
    } else {
        tdAcciones.appendChild(crearBotonIcono('user-check', 'Activar usuario', 'btn-accion--verde',
            async function() {
                const resultado = await mostrarModalToggleEstado(usuario.name, 'activar');
                if (!resultado) return; // Canceló
                try {
                    await reactivarUsuario(usuario.id);
                    registrarEvento('login', `${usuario.name} fue reactivado`);
                    renderizarAuditoria(document.getElementById('auditoriaContenedor'));
                    await mostrarNotificacion(`${usuario.name} fue reactivado. Motivo: ${resultado.motivo}`, 'exito');
                    cargarTablaUsuarios();
                } catch (error) {
                    await mostrarNotificacion(error.message || 'No se pudo reactivar', 'error');
                }
            }
        ));
    }

    // Botón Eliminar — modal mejorado con modo normal/forzoso y motivo obligatorio
    tdAcciones.appendChild(crearBotonIcono('trash-2', 'Eliminar permanentemente', 'btn-accion--rojo',
        async function() {
            const estaActivo = usuario.is_active === 1 || usuario.is_active === true;
            const resultado  = await mostrarModalEliminarUsuario(usuario.name, estaActivo);
            if (!resultado) return; // Canceló

            try {
                if (resultado.forzoso) {
                    // Cierre forzoso — no requiere estado inactivo ni tareas completadas
                    await forceEliminarUsuario(usuario.id, resultado.motivo);
                } else {
                    // Eliminación estándar — el backend valida que esté inactivo
                    await eliminarUsuario(usuario.id);
                }
                await mostrarNotificacion(`${usuario.name} fue eliminado correctamente`, 'exito');
                registrarEvento('usuario_eliminado', `Usuario eliminado: ${usuario.name}`);
                renderizarAuditoria(document.getElementById('auditoriaContenedor'));
                cargarTablaUsuarios();
                cargarTodasLasTareas();
                cargarDashboard();
            } catch (error) {
                await mostrarNotificacion(
                    error.message || 'No se pudo eliminar el usuario',
                    'error'
                );
            }
        }
    ));

    fila.appendChild(tdAcciones);
    return fila;
}

// abrirDropdownRol — modal de selección de rol (reemplaza el dropdown inline anterior)
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
    btnCerrar.addEventListener('click', function() { overlay.remove(); });

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
        if (event.target === overlay) overlay.remove();
    });
}

// ── MODAL EDITAR USUARIO ──────────────────────────────────────────────────────

// Abre un modal rediseñado (v2) para editar los datos de un usuario
// (nombre, correo, documento). Incluye avatar, botón X y diseño consistente con modal-v2.
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

function cerrarModalEditarUsuarioExistente() {
    const existing = document.getElementById('modalEditarUsuarioOverlay');
    if (existing) existing.remove();
}

// ── DASHBOARD LOCAL ──────────────────────────────────────────────────────────
// Recalcula los contadores del dashboard usando todasLasTareas en memoria,
// sin hacer ninguna petición al servidor.
// Se usa después de editar o eliminar una tarea para reflejar el cambio de inmediato.
// ACTUALIZACIÓN v3.4.0: incluye el contador de pendiente_aprobacion.
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

// Fuente de verdad del admin: todas las tareas sin filtrar
let todasLasTareas = [];

export async function cargarTodasLasTareas() {
    const tareas = await obtenerTodasLasTareas();
    todasLasTareas = tareas || [];
    aplicarFiltrosAdmin();
}

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

// Convierte el valor técnico del estado a texto legible en español.
// Se usa en la tabla de tareas del panel admin.
// ACTUALIZACIÓN v3.4.0: incluye el cuarto estado pendiente_aprobacion.
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

// Abre el modal de edición compartido para una tarea del panel admin.
// Al guardar, recarga la tabla de tareas y el dashboard.
function manejarEdicionTareaAdmin(tarea) {
    mostrarModalEdicion(tarea, false, 'admin');

    // Admin no puede calificar — ocultar campos exclusivos del instructor
    const _gradeGrupoA       = document.getElementById('editGradeGrupo');
    const _gradeReasonGrupoA = document.getElementById('editGradeReasonGrupo');
    const _chkCalifGrupoA    = document.getElementById('editChkCalifGrupo');
    if (_gradeGrupoA)       _gradeGrupoA.style.display       = 'none';
    if (_gradeReasonGrupoA) _gradeReasonGrupoA.style.display = 'none';
    if (_chkCalifGrupoA)    _chkCalifGrupoA.style.display    = 'none';

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
            // Siempre se remueve el listener al finalizar, sin importar el resultado
            formulario.removeEventListener('submit', guardarCambiosAdmin);
        }
    }

    formulario.addEventListener('submit', guardarCambiosAdmin);
}
// manejarEdicionTareaInstructor — abre el modal compartido de edición para el instructor.
// Diferencia con manejarEdicionTareaAdmin:
//   - Muestra los campos de nota (grade) y motivo de edición de nota
//   - Al guardar, recarga cargarTareasInstructor() y cargarDashboardInstructor()
//   - No actualiza todasLasTareas (esa variable es privada del panel admin)
// Usa el mismo modal editModal y el mismo formulario editTaskForm del index.html.
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

    // Estado inicial: checkbox OFF → campos ocultos
    const yaCalificada = tarea.grade !== null && tarea.grade !== undefined;
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
            // Motivo obligatorio (mín 10 caracteres)
            if (gradeReason.length < 10) {
                if (gradeReasonError) gradeReasonError.textContent = 'El motivo es obligatorio (mín. 10 caracteres).';
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
            // Actualizar fila en-place; si no existe hacer reload completo
            const actualizado = actualizarFilaTareaInstructor(tareaActualizada);
            if (!actualizado) cargarTareasInstructor();
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
    }

    formulario.addEventListener('submit', guardarCambiosInstructor);
}           

function crearFilaTareaAdmin(tarea, indice) {
    const fila = document.createElement('tr');

    const celdaNum = document.createElement('td');
    celdaNum.textContent = indice + 1;

    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    const celdaDesc = crearCeldaDescripcion(tarea);

    const celdaEstado = document.createElement('td');
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
        manejarEdicionTareaAdmin(tarea);
    });

    // Botón Eliminar — circular con ícono rojo
    const btnEliminar = crearBotonIcono('trash-2', 'Eliminar tarea', 'btn-accion--rojo', async function() {
        const confirmado = await mostrarConfirmacion(
            '¿Eliminar tarea?',
            'Sí, eliminar',
            'Cancelar',
            `"${tarea.title}" será eliminada permanentemente.`
        );
        if (!confirmado) return;

        const eliminada = await eliminarTarea(tarea.id);
        if (eliminada) {
            todasLasTareas = todasLasTareas.filter(t => t.id !== tarea.id);
            actualizarDashboardLocal();
            aplicarFiltrosAdmin();
            await mostrarNotificacion('Tarea eliminada correctamente', 'exito');
        } else {
            await mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
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
// Rediseño v2: layout en dos columnas con header de avatar, sección de tareas
// con scroll propio y formulario de asignación más compacto y visual.

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
                chipCalif.style.cssText = `background:${r.bg};color:${r.color};font-weight:700;`;
                chipCalif.textContent = `⭐ Promedio: ${promedio}/100 · ${r.rendimiento}`;
                metaFila.appendChild(chipCalif);
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
                chipNota.className = 'status-badge';
                chipNota.style.cssText = `background:${r.bg};color:${r.color};font-weight:700;`;
                chipNota.textContent = `${n} / 100 · ${r.rendimiento}`;
                filaBadges.appendChild(chipNota);
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

        const tareaCreada = await registrarTarea(datosTarea);

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
        } else {
            await mostrarNotificacion('Error al asignar la tarea', 'error');
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

function cerrarModalUsuarioExistente() {
    const existing = document.getElementById('modalUsuarioOverlay');
    if (existing) existing.remove();
}

// ── CARDS CONTRAÍBLES ─────────────────────────────────────────────────────────
// Registra el comportamiento de toggle (contraer/desplegar) en las cards del panel admin.
// Cada card tiene un encabezado con clase admin-card__cabecera--toggle y un cuerpo
// con clase admin-card__cuerpo. Al hacer clic en el encabezado (o en la flecha):
//   - Se alterna la clase "oculto" en el cuerpo para ocultarlo o mostrarlo
//   - Se alterna la clase "contraido" en la flecha para rotarla
//   - Se alterna la clase "sin-borde" en el encabezado para quitar el separador
function registrarCardsContraibles() {
     // Pares de [id del encabezado, id del cuerpo] de cada card contraíble.
    // Se agregan aquí los pares del instructor con prefijo "instr" para que
    // la misma función maneje ambos paneles (admin e instructor) sin duplicar código.
    const pares = [
        // Cards del panel admin
        ['toggleUsuarios',          'cuerpoUsuarios'],
        ['toggleTareas',            'cuerpoTareas'],
        ['toggleCrearTareas',       'cuerpoCrearTareas'],
        // Cards del panel instructor — mismos IDs que el HTML del vistaInstructor
        ['instrToggleCrearTareas',  'instrCuerpoCrearTareas'],
        ['instrToggleUsuarios',     'instrCuerpoUsuarios'],
        ['instrToggleTareas',       'instrCuerpoTareas'],
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
// Flag para registrar los listeners del botón y del documento solo una vez.
// Sin esto, cada vez que se llama inicializarDropdownUsuarios() (p.ej. al crear
// un usuario) se duplican los listeners y el panel se abre/cierra erráticamente.
let _dropdownListenersRegistrados = false;

// Recarga los checkboxes del panel sin volver a registrar listeners.
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

// Inicializa el dropdown de checkboxes de usuarios en la card "Crear Tarea".
// Registra los listeners del botón y del documento solo la primera vez.
// Las llamadas posteriores (tras crear un usuario) solo recargan los checkboxes.
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

// Actualiza el texto del botón del dropdown según los checkboxes seleccionados.
// Si ninguno está seleccionado muestra el placeholder.
// Si hay seleccionados muestra los nombres separados por coma (máximo 2 + "y N más").
// Parámetros:
//   btn   — el elemento button del dropdown
//   texto — el span que muestra el texto dentro del botón
//   panel — el div con los checkboxes para leer cuáles están marcados
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

// Retorna un arreglo con los IDs numéricos de los usuarios seleccionados en el dropdown.
// Se usa al hacer submit del formulario de crear tarea.
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
// Limpia los campos de email y contraseña del formulario de login,
// oculta el mensaje de bienvenida y quita los mensajes de error visibles.
//
// Se llama desde activarModoInicio() y desde manejarCerrarSesion()
// para garantizar que cuando el usuario vuelve a la pantalla de inicio
// no vea los datos del usuario anterior en los campos.
// Esto es crítico en entornos compartidos: un segundo usuario no debe
// ver el email del usuario anterior si este no cerró el navegador.
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
    if (btnToggle) btnToggle.textContent = '👁️';

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
// Se llama al hacer clic en el botón circular de logout en ambos paneles.
// Muestra una confirmación SweetAlert2 antes de cerrar sesión.
// Si el usuario confirma:
//   1. Se borra la sesión del localStorage (tokens y datos del usuario)
//   2. Se limpian los campos del formulario de login
//   3. Se redirige a la pantalla de inicio
// Así ningún dato queda expuesto si otro usuario usa el mismo computador.
async function manejarCerrarSesion() {

    // Pedir confirmación antes de cerrar sesión
    // mostrarConfirmacion viene de notificaciones.js y usa SweetAlert2
    const confirmado = await mostrarConfirmacion(
        '¿Cerrar sesión?',
        'Sí, cerrar sesión',
        'Cancelar',
        'Se cerrará tu sesión actual y volverás a la pantalla de inicio.'
    );

    // Si el usuario canceló no se hace nada
    if (!confirmado) return;

    // Borrar todos los datos de sesión del localStorage
    // cerrarSesion() está en src/utils/sesion.js y elimina accessToken,
    // refreshToken y usuarioActual en un solo paso
    if (window._panelCalificacionInterval) {
        clearInterval(window._panelCalificacionInterval);
        window._panelCalificacionInterval = null;
    }
    if (window._panelCalificacionInterval) {
        clearInterval(window._panelCalificacionInterval);
        window._panelCalificacionInterval = null;
    }
    registrarEvento('logout', 'Sesión cerrada');
    cerrarSesion();

    // Limpiar los campos del formulario antes de mostrar la pantalla de inicio
    // Así el próximo usuario que abra la página no verá los datos del anterior
    limpiarFormularioLogin();

    // Redirigir a la pantalla de inicio
    activarModoInicio();
}

// ── ABRIR MODAL DE REGISTRO ───────────────────────────────────────────────────
// Se llama al hacer clic en el botón "Regístrate aquí" debajo del login.
// El modal aparece encima de la pantalla de inicio sin que esta desaparezca.
function abrirModalRegistro() {
    const modal = document.getElementById('registroModal');
    if (modal) modal.classList.remove('hidden');
    // Limpiar el formulario por si el usuario lo abrió y cerró antes
    limpiarFormularioRegistro();
}

// ── CERRAR MODAL DE REGISTRO ──────────────────────────────────────────────────
// Se llama al hacer clic en el botón X o al registrarse exitosamente.
function cerrarModalRegistro() {
    const modal = document.getElementById('registroModal');
    if (modal) modal.classList.add('hidden');
    limpiarFormularioRegistro();
}

// ── LIMPIAR FORMULARIO DE REGISTRO ───────────────────────────────────────────
// Limpia todos los campos del formulario y los mensajes de error.
// Se llama al abrir y al cerrar el modal para siempre empezar limpio.
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
// Valida los 4 campos del formulario antes de enviar la petición al backend.
// Muestra errores en los spans de cada campo Y como toast de SweetAlert2.
// Retorna true si todos los campos son válidos.
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

// registrarListenerCambioPassword — registra todos los eventos del modal de cambio de contraseña.
// Se llama una sola vez al inicio desde registrarEventosNavegacion().
// El modal se abre desde los 3 botones de perfil circular (admin, usuario, instructor).
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
    }

    // Abrir el modal desde el botón de perfil del panel admin
    const btnPerfilAdmin = document.getElementById('btnPerfilAdmin');
    if (btnPerfilAdmin) btnPerfilAdmin.addEventListener('click', abrirModalPassword);

    // Abrir el modal desde el botón de perfil del panel usuario
    const btnPerfilUsuario = document.getElementById('btnPerfilUsuario');
    if (btnPerfilUsuario) btnPerfilUsuario.addEventListener('click', abrirModalPassword);

    // Abrir el modal desde el botón de perfil del panel instructor
    const btnPerfilInstructor = document.getElementById('btnPerfilInstructor');
    if (btnPerfilInstructor) btnPerfilInstructor.addEventListener('click', abrirModalPassword);

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

// ── REGISTRO DE EVENTOS DE NAVEGACIÓN ────────────────────────────────────────

export function registrarEventosNavegacion() {
    
    // Se registra el comportamiento de toggle en las cards contraíbles del panel admin
    registrarCardsContraibles();

    // ── FORMULARIO DE LOGIN ───────────────────────────────────────────────────────
    const formLogin       = document.getElementById('loginForm');
    const inputEmail     = document.getElementById('loginEmail');              // Se cambia el id de loginDocumento a loginEmail para que coincida con el HTML actualizado
    const inputPassword   = document.getElementById('loginPassword');
    const errorEmail     = document.getElementById('loginEmailError');
    const errorPassword   = document.getElementById('loginPasswordError');
    const bienvenidaDiv   = document.getElementById('loginBienvenida');
    const bienvenidaTexto = document.getElementById('loginBienvenidaTexto');
    const btnToggle       = document.getElementById('btnTogglePassword');

    // Botón 👁️ — alternar visibilidad de la contraseña
    if (btnToggle) {
        btnToggle.addEventListener('click', function () {
            const tipo = inputPassword.type === 'password' ? 'text' : 'password';
            inputPassword.type    = tipo;
            btnToggle.textContent = tipo === 'password' ? '👁️' : '🙈';
        });
    }

    // Submit del formulario de login
    if (formLogin) {
        formLogin.addEventListener('submit', async function (event) {
            event.preventDefault();

            // validarFormularioLogin valida ambos campos con el mismo patrón del proyecto:
            // muestra el error en el span del input Y como toast con SweetAlert2.
            // Retorna false si algo falla — en ese caso no llamamos al servidor.
             const esValido = await validarFormularioLogin({
                emailInput:    inputEmail,      // ← antes era docInput: inputDocumento
                passwordInput: inputPassword,
                emailError:    errorEmail,      // ← antes era docError: errorDocumento
                passwordError: errorPassword,
            });
            if (!esValido) return;

            // Deshabilitar el botón para evitar doble envío
            const btnLogin = document.getElementById('btnLogin');
            if (btnLogin) { btnLogin.disabled = true; btnLogin.textContent = 'Ingresando...'; }

            try {
                // Llamada al backend — si falla lanza un Error con el mensaje del servidor
                const datos = await loginUsuario({
                email:    inputEmail.value.trim(),     // ← antes era documento
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
                    // El rol admin activa el panel de administración con CRUD completo
                    registrarEvento('login', `Sesión iniciada: ${datos.user.name}`);
                    await activarModoAdmin();
                } else if (datos.user.role === 'instructor') {
                    // El rol instructor activa el panel docente con paleta verde
                    // Esta línea faltaba — causaba que instructor viera la vista de usuario
                    registrarEvento('login', `Sesión iniciada: ${datos.user.name}`);
                    await activarModoInstructor();
                } else {
                    // El rol user activa el panel personal con solo sus tareas
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
        btnLogoutUsuario.addEventListener('click', manejarCerrarSesion);
    }

    const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');
    if (btnLogoutAdmin) {
        btnLogoutAdmin.addEventListener('click', manejarCerrarSesion);
    }

    // Botón de cerrar sesión del panel instructor
    const btnLogoutInstructor = document.getElementById('btnLogoutInstructor');
    if (btnLogoutInstructor) {
        btnLogoutInstructor.addEventListener('click', manejarCerrarSesion);
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
            abrirModalUsuario(encontrado);
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
                        || (u.documento && u.documento.toString().includes(termino))
                        || u.name.toLowerCase().includes(termino);
                }) : null;
                if (encontrado) {
                    if (inputInstr) inputInstr.value = '';
                    abrirModalUsuario(encontrado);
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
            event.preventDefault();

            // Se leen los valores de los campos del formulario
            const titleInput   = document.getElementById('newTaskTitle');
            const descInput    = document.getElementById('newTaskDescription');
            const statusInput  = document.getElementById('newTaskStatus');
            const commentInput = document.getElementById('newTaskComment');
            const titleError   = document.getElementById('newTaskTitleError');
            const statusError  = document.getElementById('newTaskStatusError');

            // FEAT #57: validación con mensajes descriptivos del backend (Zod-matching)
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
                comment:       commentInput && commentInput.value.trim() !== '' ? commentInput.value.trim() : null,
                assignedUsers: assignedUsers,
            };

            // Se llama al backend para crear la tarea
            let tareaCreada;
            try {
                tareaCreada = await registrarTarea(datosTarea);
            } catch (errorCreacion) {
                // Si el backend responde 400 (Zod) se muestran los mensajes descriptivos
                if (errorCreacion.errors && errorCreacion.errors.length > 0) {
                    await mostrarNotificacion(errorCreacion.errors[0].message, 'error');
                } else {
                    await mostrarNotificacion(
                        errorCreacion.message || 'No se pudo crear la tarea',
                        'error'
                    );
                }
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

        // Formulario de crear tarea del instructor — con validaciones y spans de error
    const instrCreateTaskForm = document.getElementById('instrCreateTaskForm');
    if (instrCreateTaskForm) {
        instrCreateTaskForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Referencias a los campos del formulario del instructor
            const tituloInput    = document.getElementById('instrNewTaskTitle');
            const estadoInput    = document.getElementById('instrNewTaskStatus');
            const instrComentEl  = document.getElementById('instrNewTaskComment');

            // Referencias a los spans de error de cada campo
            // Estos IDs deben existir en index.html debajo de cada campo
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
            // Comentario: null si está vacío (el backend lo acepta así)
            const comentario = instrComentEl && instrComentEl.value.trim() !== ''
                ? instrComentEl.value.trim()
                : null;

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
            } else {
                await mostrarNotificacion('Error al crear la tarea', 'error');
            }
        });
    }

    // ── MODAL DE REGISTRO ─────────────────────────────────────────────────────────
    // Abrir el modal al hacer clic en "Regístrate aquí"
    const btnAbrirRegistro = document.getElementById('btnAbrirRegistro');
    if (btnAbrirRegistro) {
        btnAbrirRegistro.addEventListener('click', abrirModalRegistro);
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
    // El input filtra en tiempo real las filas ya pintadas en la tabla.
    // No hace peticiones al servidor — trabaja sobre el DOM directamente.
    // El id del input coincide con el que está en index.html
    // Buscador de tareas del usuario — ahora responde a submit, no a input en vivo
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

    // Prevenir que el form de búsqueda de tareas recargue la página al presionar Enter
    const userSearchTaskForm = document.getElementById('userSearchTaskForm');
    if (userSearchTaskForm) {
        userSearchTaskForm.addEventListener('submit', function(event) {
            event.preventDefault();
        });
    }

    // ── BOTONES EDITAR Y EXPORTAR DE LA TABLA DE TAREAS DEL USUARIO ──────────
    // Los botones se crean dinámicamente en tareasUI.js con data-action="edit" o "export".
    // Se usa delegación de eventos en el tbody para capturar clics aunque
    // las filas se agreguen después de registrar este listener.
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
                abrirModalVerTarea(tareaFresca || { id: tareaId });

            } else if (accion === 'edit') {
                // Buscar la tarea completa en el DOM para pasarla al modal
                // Se reconstruye el objeto desde las celdas de la fila
                const fila        = btn.closest('tr');
                const titulo      = fila.cells[1].textContent;
                const descripcion = fila.cells[2].textContent === '—' ? '' : fila.cells[2].textContent;
                const estado      = fila.cells[3].querySelector('.status-badge').className
                    .split(' ')
                    .find(c => c.startsWith('status-') && c !== 'status-badge')
                    ?.replace('status-', '') || '';
                const comentario  = fila.cells[4].textContent === '—' ? '' : fila.cells[4].textContent;

                // mostrarModalEdicion viene de tareasUI.js
                // soloLecturaTituloDesc=true → modo usuario: título y desc de solo lectura
                mostrarModalEdicion({
                    id:          tareaId,
                    title:       titulo,
                    description: descripcion,
                    status:      estado,
                    comment:     comentario,
                }, true);

                // Registrar el submit del modal de edición para el modo usuario
                const formularioEdicion = document.getElementById('editTaskForm');

                // Clonar el form para eliminar listeners anteriores y evitar duplicados
                const formularioClonado = formularioEdicion.cloneNode(true);
                formularioEdicion.parentNode.replaceChild(formularioClonado, formularioEdicion);

                // Re-registrar Cancelar y X en el form clonado (cloneNode pierde los listeners)
                const btnCancelClone = document.getElementById('editCancelBtn');
                if (btnCancelClone) btnCancelClone.addEventListener('click', ocultarModalEdicion);
                const btnCloseClone  = document.getElementById('editCloseBtn');
                if (btnCloseClone)  btnCloseClone.addEventListener('click', ocultarModalEdicion);

                formularioClonado.addEventListener('submit', async function(ev) {
                    ev.preventDefault();

                    const nuevoEstado   = document.getElementById('editTaskStatus').value;
                    const nuevoComentario = document.getElementById('editTaskComment')
                        ? document.getElementById('editTaskComment').value.trim()
                        : '';

                    // Solo se envía el estado y el comentario — título y desc son solo lectura
                    const { actualizarTarea } = await import('../api/tareasApi.js');
                    const tareaActualizada = await actualizarTarea(tareaId, {
                        status:  nuevoEstado,
                        comment: nuevoComentario,
                    });

                    if (tareaActualizada) {
                        // Actualizar la fila en el DOM sin recargar toda la tabla
                        const { actualizarFilaTarea } = await import('./tareasUI.js');
                        actualizarFilaTarea(tareaActualizada);
                        ocultarModalEdicion();
                        await mostrarNotificacion('Tarea actualizada correctamente', 'exito');
                        try {
                            const tareasAct = await obtenerTodasLasTareas();
                            crearCalendario({ contenedorId: 'instrCalendario', paleta: 'instructor', soloLectura: false, tareas: tareasAct });
                        } catch { /* calendar refresh opcional */ }
                    } else {
                        await mostrarNotificacion('Error al actualizar la tarea', 'error');
                    }
                });

            } else if (accion === 'export') {
                // Exportar solo esta tarea como JSON
                // Se reconstruye el objeto mínimo necesario para la exportación
                const fila = btn.closest('tr');
                const tareaExportar = {
                    id:          tareaId,
                    title:       fila.cells[1].textContent,
                    description: fila.cells[2].textContent === '—' ? '' : fila.cells[2].textContent,
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
    function cerrarVerTarea() { if (verTareaModal) verTareaModal.classList.add('hidden'); }
    if (verTareaClose)  verTareaClose.addEventListener('click', cerrarVerTarea);
    if (verTareaCerrar) verTareaCerrar.addEventListener('click', cerrarVerTarea);
    if (verTareaModal)  verTareaModal.addEventListener('click', function(e) { if (e.target === verTareaModal) cerrarVerTarea(); });
}

// cargarDashboardUsuario — carga las estadísticas del dashboard en el panel de usuario.
// Usa IDs distintos a los del panel admin para que ambos paneles puedan coexistir
// en el DOM sin sobrescribirse mutuamente.
// Se llama desde activarModoUsuario() al entrar al panel de usuario.
function cargarDashboardUsuario(tareas) {
    // Recibe las tareas ya cargadas en activarModoUsuario
    // No hace fetch extra — evita el 401 por userId=undefined
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

// registrarListenerOlvidoPassword — registra todos los eventos del flujo de recuperación.
// Se llama una sola vez desde registrarEventosNavegacion().
// El flujo tiene 3 pasos secuenciales: email → código → nueva contraseña.
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
    }

    // Abrir el modal al hacer clic en el enlace
    if (btnAbrir) btnAbrir.addEventListener('click', abrirModalOlvido);

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