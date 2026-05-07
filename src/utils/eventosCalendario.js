// MÓDULO: utils/eventosCalendario.js
// CAPA: Utils — calendario interactivo con persistencia en backend
//
// VERSIÓN 2.0 — Cambios respecto a v1:
//   - Eventos guardados en el backend (MySQL), no en memoria local
//   - Instructor puede crear eventos de dos tipos:
//       'propio'     → recordatorio personal (color morado/índigo)
//       'estudiante' → asignado a un estudiante (color celeste)
//   - El estudiante ve en su calendario los eventos que el instructor le asignó
//   - Las tareas del usuario siguen mostrándose como puntos de colores
//   - Popover rediseñado: muestra título + estado + botón "Ver tarea"
//   - Diseño visual mejorado: celdas más grandes, sombras, transiciones
//
// API usada:
//   obtenerEventosInstructor() — GET /api/calendar/instructor
//   obtenerEventosUsuario()    — GET /api/calendar/usuario
//   crearEvento(datos)         — POST /api/calendar
//   eliminarEvento(id)         — DELETE /api/calendar/:id
//
// Colores por tipo de evento:
//   Propio del instructor:    #6366f1 (índigo)
//   Para estudiante:          #0ea5e9 (celeste)
//   Para usuario (recibido):  #0ea5e9 (mismo celeste)
//
// Colores de tareas (puntos en días):
//   pendiente:            var(--color-pendiente)   → amarillo
//   en_progreso:          var(--color-progreso)    → azul
//   completada:           var(--color-completada)  → verde
//   pendiente_aprobacion: var(--color-aprobacion)  → naranja
//   reprobada:            #dc2626                  → rojo

import {
    obtenerEventosInstructor,
    obtenerEventosUsuario,
    crearEvento,
    eliminarEvento,
} from '../api/calendarApi.js';

import { obtenerTodosLosUsuarios } from '../api/usuariosApi.js';

// Nombres de meses y días en español
const MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// Colores del sistema
const COLOR_PROPIO     = '#6366f1';   // índigo — eventos propios del instructor
const COLOR_ESTUDIANTE = '#0ea5e9';   // celeste — eventos asignados a estudiante

// Mapa de colores por estado de tarea (puntos en el día)
const COLORES_TAREA = {
    pendiente:             'var(--color-pendiente)',
    en_progreso:           'var(--color-progreso)',
    completada:            'var(--color-completada)',
    pendiente_aprobacion:  'var(--color-aprobacion)',
    reprobada:             '#dc2626',
};

// Etiquetas legibles de estado para el popover
const ETIQUETAS_ESTADO = {
    pendiente:             'Pendiente',
    en_progreso:           'En progreso',
    completada:            'Completada',
    pendiente_aprobacion:  'Por aprobar',
    reprobada:             'Reprobada',
};

// ── FUNCIÓN PRINCIPAL ───────────────────────────────────────────────────────

// crearCalendario — monta el calendario en el contenedor dado.
//
// Parámetros:
//   contenedorId  — ID del elemento HTML donde se monta
//   paleta        — 'instructor' | 'usuario'
//   soloLectura   — boolean (usuario = true, instructor = false)
//   tareas        — arreglo de tareas del usuario (para puntos de colores)
//   onVerTarea    — callback(tareaId) al pulsar "Ver tarea" en el popover
export async function crearCalendario({
    contenedorId,
    paleta,
    soloLectura,
    tareas     = [],
    onVerTarea = null,
    userId     = null,   // id del usuario logueado (para permisos de borrado)
}) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    // Mostrar skeleton de carga mientras se obtienen los eventos
    contenedor.innerHTML = '<div class="calendario__cargando">Cargando calendario...</div>';

    // Cargar eventos del backend según el rol
    let eventos = [];
    try {
        eventos = paleta === 'instructor'
            ? await obtenerEventosInstructor()
            : await obtenerEventosUsuario();
    } catch {
        eventos = [];
    }

    // Estado del calendario: mes y año visibles
    const estado = {
        mes:    new Date().getMonth(),
        anio:   new Date().getFullYear(),
        eventos,            // arreglo de eventos del backend
        cargandoEvento: false,
    };

    renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId);
}

// ── RENDERIZADO ─────────────────────────────────────────────────────────────

function renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId) {
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    const colorHoy = paleta === 'instructor'
        ? 'var(--color-instructor)'
        : 'var(--color-primario)';

    // ── Cabecera ────────────────────────────────────────────────────────────
    const cabecera = document.createElement('div');
    cabecera.className = 'cal2__cabecera';

    const btnPrev = crearBtnNav('chevron-left', 'Mes anterior', function() {
        if (estado.mes === 0) { estado.mes = 11; estado.anio--; }
        else estado.mes--;
        renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId);
    });

    const titulo = document.createElement('span');
    titulo.className   = 'cal2__titulo';
    titulo.textContent = `${MESES[estado.mes]} ${estado.anio}`;

    const btnNext = crearBtnNav('chevron-right', 'Mes siguiente', function() {
        if (estado.mes === 11) { estado.mes = 0; estado.anio++; }
        else estado.mes++;
        renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId);
    });

    cabecera.appendChild(btnPrev);
    cabecera.appendChild(titulo);
    cabecera.appendChild(btnNext);
    contenedor.appendChild(cabecera);

    // ── Nombres de días ─────────────────────────────────────────────────────
    const grid = document.createElement('div');
    grid.className = 'cal2__grid';

    DIAS.forEach(function(d) {
        const el = document.createElement('div');
        el.className   = 'cal2__dia-nombre';
        el.textContent = d;
        grid.appendChild(el);
    });

    // ── Celdas ──────────────────────────────────────────────────────────────
    const primerDia   = new Date(estado.anio, estado.mes, 1).getDay();
    const diasEnMes   = new Date(estado.anio, estado.mes + 1, 0).getDate();
    const hoy         = new Date();

    const esHoy = function(dia) {
        return dia === hoy.getDate()
            && estado.mes  === hoy.getMonth()
            && estado.anio === hoy.getFullYear();
    };

    // Construir índice de eventos por fecha → arreglo de eventos
    const eventosPorFecha = {};
    estado.eventos.forEach(function(ev) {
        const f = ev.date;
        if (!eventosPorFecha[f]) eventosPorFecha[f] = [];
        eventosPorFecha[f].push(ev);
    });

    // Agrupar tareas por su fecha real (createdAt → YYYY-MM-DD)
    // Así los puntos aparecen en el día real en que se creó la tarea
    const tareasPorFecha = {};
    tareas.forEach(function(tarea) {
        if (!tarea.createdAt) return;
        // createdAt puede llegar como Date object o string ISO
        const fecha = typeof tarea.createdAt === 'string'
            ? tarea.createdAt.split('T')[0]
            : tarea.createdAt instanceof Date
                ? tarea.createdAt.toISOString().split('T')[0]
                : null;
        if (!fecha) return;
        if (!tareasPorFecha[fecha]) tareasPorFecha[fecha] = [];
        tareasPorFecha[fecha].push(tarea);
    });

    // Celdas vacías iniciales
    for (let i = 0; i < primerDia; i++) {
        const vacio = document.createElement('div');
        vacio.className = 'cal2__celda cal2__celda--vacia';
        grid.appendChild(vacio);
    }

    // Celdas de cada día
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const celda = document.createElement('div');
        celda.className = 'cal2__celda';

        const fechaDia = `${estado.anio}-${String(estado.mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        const eventosDelDia = eventosPorFecha[fechaDia] || [];
        const tareasDelDia  = tareasPorFecha[fechaDia]  || [];

        // Resaltar hoy
        if (esHoy(dia)) {
            celda.classList.add('cal2__celda--hoy');
            celda.style.setProperty('--color-hoy', colorHoy);
        }

        // ¿Tiene eventos? marcar borde sutil
        if (eventosDelDia.length > 0) {
            celda.classList.add('cal2__celda--con-eventos');
        }

        // Número del día
        const numEl = document.createElement('span');
        numEl.className   = 'cal2__numero-dia';
        numEl.textContent = dia;
        celda.appendChild(numEl);

        // Puntos de eventos del backend (índigo o celeste)
        // y puntos de tareas del usuario
        const hayPuntos = eventosDelDia.length > 0 || tareasDelDia.length > 0;
        if (hayPuntos) {
            const puntos = document.createElement('div');
            puntos.className = 'cal2__puntos';

            // Puntos de eventos del calendario (índigo o celeste) — uno por tipo único
            const tiposVistos = new Set();
            eventosDelDia.forEach(function(ev) {
                const color = ev.tipo === 'propio' ? COLOR_PROPIO : COLOR_ESTUDIANTE;
                if (!tiposVistos.has(color)) {
                    tiposVistos.add(color);
                    puntos.appendChild(crearPunto(color));
                }
            });

            // Puntos de tareas — un punto por estado único ese día
            const estadosVistos = new Set();
            tareasDelDia.forEach(function(tarea) {
                const color = COLORES_TAREA[tarea.status] || 'var(--texto-claro)';
                if (!estadosVistos.has(color)) {
                    estadosVistos.add(color);
                    puntos.appendChild(crearPunto(color));
                }
            });

            celda.appendChild(puntos);
        }

        // Click en el día → popover
        celda.addEventListener('click', function(e) {
            e.stopPropagation();
            abrirPopover({
                celdaEl:       celda,
                fechaDia,
                eventosDelDia,
                tareasDelDia,
                soloLectura,
                paleta,
                onVerTarea,
                userId,
                onNuevoEvento: async function(datos) {
                    // Crear en backend
                    const creado = await crearEvento(datos);
                    if (creado) {
                        // Esperar 800ms para que el usuario vea "✓ Evento guardado"
                        await new Promise(function(r) { setTimeout(r, 800); });
                        // Refrescar lista de eventos del backend
                        try {
                            estado.eventos = paleta === 'instructor'
                                ? await obtenerEventosInstructor()
                                : await obtenerEventosUsuario();
                        } catch { /* mantener los actuales */ }
                        renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId);
                    }
                    return creado;
                },
                onEliminarEvento: async function(id) {
                    const ok = await eliminarEvento(id);
                    if (ok) {
                        // Cerrar el popover antes de re-renderizar
                        document.querySelectorAll('.cal2__popover').forEach(function(p) {
                            if (p.parentNode) p.parentNode.removeChild(p);
                        });
                        estado.eventos = estado.eventos.filter(function(ev) { return ev.id !== id; });
                        renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId);
                    }
                },
            });
        });

        grid.appendChild(celda);
    }

    contenedor.appendChild(grid);

    // ── Leyenda ─────────────────────────────────────────────────────────────
    const leyenda = document.createElement('div');
    leyenda.className = 'cal2__leyenda';

    const itemsLeyenda = paleta === 'instructor'
        ? [
            { color: COLOR_PROPIO,                       texto: 'Evento propio' },
            { color: COLOR_ESTUDIANTE,                   texto: 'Para estudiante' },
            { color: 'var(--color-pendiente)',            texto: 'Pendiente' },
            { color: 'var(--color-progreso)',             texto: 'En progreso' },
            { color: 'var(--color-completada)',           texto: 'Completada' },
            { color: 'var(--color-aprobacion)',           texto: 'Por aprobar' },
            { color: '#dc2626',                           texto: 'Reprobada' },
          ]
        : [
            { color: COLOR_PROPIO,                         texto: 'Evento propio' },
            { color: COLOR_ESTUDIANTE,                     texto: 'Evento del instructor' },
            { color: 'var(--color-pendiente)',              texto: 'Pendiente' },
            { color: 'var(--color-progreso)',               texto: 'En progreso' },
            { color: 'var(--color-completada)',             texto: 'Completada' },
            { color: 'var(--color-aprobacion)',             texto: 'Por aprobar' },
          ];

    itemsLeyenda.forEach(function(item) {
        const itemEl = document.createElement('div');
        itemEl.className = 'cal2__leyenda-item';
        itemEl.appendChild(crearPunto(item.color));
        const txt = document.createElement('span');
        txt.textContent = item.texto;
        itemEl.appendChild(txt);
        leyenda.appendChild(itemEl);
    });

    contenedor.appendChild(leyenda);

    // Inicializar íconos Lucide
    if (window.lucide) window.lucide.createIcons();
}

// ── POPOVER ─────────────────────────────────────────────────────────────────

function abrirPopover({
    celdaEl, fechaDia, eventosDelDia, tareasDelDia, soloLectura, paleta,
    onVerTarea, userId, onNuevoEvento, onEliminarEvento,
}) {
    // Cerrar popovers anteriores
    document.querySelectorAll('.cal2__popover').forEach(function(p) {
        if (p.parentNode) p.parentNode.removeChild(p);
    });

    const pop = document.createElement('div');
    pop.className = 'cal2__popover';
    pop.addEventListener('click', function(e) { e.stopPropagation(); });

    // Título del popover — fecha en formato legible
    const [anio, mes, dia] = fechaDia.split('-');
    const fechaLegible = `${parseInt(dia)} de ${MESES[parseInt(mes) - 1]} ${anio}`;
    const tituloEl = document.createElement('p');
    tituloEl.className   = 'cal2__popover-titulo';
    tituloEl.textContent = fechaLegible;
    pop.appendChild(tituloEl);

    // Lista de eventos del calendario del instructor
    if (eventosDelDia.length > 0) {
        const lista = document.createElement('div');
        lista.className = 'cal2__popover-lista';

        eventosDelDia.forEach(function(ev) {
            const item = document.createElement('div');
            item.className = 'cal2__popover-evento';

            const barra = document.createElement('div');
            barra.className = 'cal2__popover-barra';
            barra.style.backgroundColor = ev.tipo === 'propio' ? COLOR_PROPIO : COLOR_ESTUDIANTE;
            item.appendChild(barra);

            const cuerpo = document.createElement('div');
            cuerpo.className = 'cal2__popover-cuerpo';

            const tituloEv = document.createElement('span');
            tituloEv.className   = 'cal2__popover-evento-titulo';
            tituloEv.textContent = ev.title;
            cuerpo.appendChild(tituloEv);

            if (ev.studentName) {
                const est = document.createElement('span');
                est.className   = 'cal2__popover-evento-meta';
                est.textContent = `👤 ${ev.studentName}`;
                cuerpo.appendChild(est);
            }

            if (ev.taskTitle) {
                const tareaInfo = document.createElement('div');
                tareaInfo.className = 'cal2__popover-tarea-info';

                const estadoBadge = document.createElement('span');
                estadoBadge.className   = 'cal2__popover-estado-badge';
                estadoBadge.textContent = ETIQUETAS_ESTADO[ev.taskStatus] || ev.taskStatus || '—';
                estadoBadge.style.backgroundColor = (COLORES_TAREA[ev.taskStatus] || '#e5e7eb') + '33';
                estadoBadge.style.color           = COLORES_TAREA[ev.taskStatus] || '#374151';
                tareaInfo.appendChild(estadoBadge);

                if (onVerTarea && ev.taskId) {
                    const btnVer = document.createElement('button');
                    btnVer.className   = 'cal2__popover-btn-ver';
                    btnVer.textContent = 'Ver tarea';
                    btnVer.addEventListener('click', function() {
                        document.querySelectorAll('.cal2__popover').forEach(function(p) {
                            if (p.parentNode) p.parentNode.removeChild(p);
                        });
                        onVerTarea(ev.taskId);
                    });
                    tareaInfo.appendChild(btnVer);
                }

                cuerpo.appendChild(tareaInfo);
            }

            item.appendChild(cuerpo);

            // Mostrar X solo si puede borrar:
            // instructor: puede borrar cualquier evento suyo
            // usuario: solo puede borrar sus propios recordatorios (no los del instructor)
            const puedeEliminar = !soloLectura && (
                paleta === 'instructor' ||
                (paleta === 'usuario' && userId !== null && Number(ev.instructorId) === Number(userId))
            );
            if (puedeEliminar) {
                const btnDel = document.createElement('button');
                btnDel.className   = 'cal2__popover-btn-del';
                btnDel.title       = 'Eliminar evento';
                btnDel.innerHTML   = '&times;';
                btnDel.addEventListener('click', function(e) {
                    e.stopPropagation();
                    onEliminarEvento(ev.id);
                });
                item.appendChild(btnDel);
            }

            lista.appendChild(item);
        });

        pop.appendChild(lista);
    }

    // ── Sección de tareas (solo lectura) ────────────────────────────────────
    if (tareasDelDia && tareasDelDia.length > 0) {
        // Separador con título solo si también hay eventos arriba
        if (eventosDelDia.length > 0) {
            const sep = document.createElement('p');
            sep.className   = 'cal2__popover-seccion-titulo';
            sep.textContent = 'Tareas';
            pop.appendChild(sep);
        }

        const listaTareas = document.createElement('div');
        listaTareas.className = 'cal2__popover-lista';

        tareasDelDia.forEach(function(tarea) {
            const item = document.createElement('div');
            item.className = 'cal2__popover-evento';

            // Barra de color según estado de la tarea
            const barra = document.createElement('div');
            barra.className = 'cal2__popover-barra';
            barra.style.backgroundColor = COLORES_TAREA[tarea.status] || '#e5e7eb';
            item.appendChild(barra);

            const cuerpo = document.createElement('div');
            cuerpo.className = 'cal2__popover-cuerpo';

            // Título de la tarea
            const tituloEl = document.createElement('span');
            tituloEl.className   = 'cal2__popover-evento-titulo';
            tituloEl.textContent = tarea.title;
            cuerpo.appendChild(tituloEl);

            // Usuario(s) asignado(s)
            const usuarioNombre = tarea.assignedUsersDisplay || tarea.assignedUsersNames || null;
            if (usuarioNombre) {
                const usuEl = document.createElement('span');
                usuEl.className   = 'cal2__popover-evento-meta';
                usuEl.textContent = `👤 ${usuarioNombre}`;
                cuerpo.appendChild(usuEl);
            }

            // Badge de estado
            const tareaInfo = document.createElement('div');
            tareaInfo.className = 'cal2__popover-tarea-info';

            const badge = document.createElement('span');
            badge.className   = 'cal2__popover-estado-badge';
            badge.textContent = ETIQUETAS_ESTADO[tarea.status] || tarea.status;
            badge.style.backgroundColor = (COLORES_TAREA[tarea.status] || '#e5e7eb') + '33';
            badge.style.color           = COLORES_TAREA[tarea.status] || '#374151';
            tareaInfo.appendChild(badge);

            cuerpo.appendChild(tareaInfo);
            item.appendChild(cuerpo);
            listaTareas.appendChild(item);
        });

        pop.appendChild(listaTareas);
    }

    // Mensaje de vacío si no hay ni eventos ni tareas
    if (eventosDelDia.length === 0 && (!tareasDelDia || tareasDelDia.length === 0)) {
        const vacio = document.createElement('p');
        vacio.className   = 'cal2__popover-vacio';
        vacio.textContent = 'Sin eventos este día';
        pop.appendChild(vacio);
    }

    // Formulario para agregar evento (solo instructor)
    if (!soloLectura) {
        pop.appendChild(crearFormularioEvento(fechaDia, onNuevoEvento, paleta));
    }

    // Montar el popover en el body (NO dentro de la celda) para evitar
    // el bug de parpadeo: si el popover está dentro de la celda, al pasar
    // el mouse sobre él dispara mouseleave/mouseenter de la celda en bucle.
    // Con position:fixed calculamos la posición desde getBoundingClientRect.
    document.body.appendChild(pop);

    // Calcular posición centrada debajo de la celda
    const rect = celdaEl.getBoundingClientRect();
    const popW = 260; // min-width del popover
    let left = rect.left + rect.width / 2 - popW / 2 + window.scrollX;
    let top  = rect.bottom + 6 + window.scrollY;

    // Evitar que se salga por la derecha
    if (left + popW > window.innerWidth - 8) {
        left = window.innerWidth - popW - 8;
    }
    // Evitar que se salga por la izquierda
    if (left < 8) left = 8;

    pop.style.position = 'fixed';
    pop.style.left     = `${rect.left + rect.width / 2 - popW / 2}px`;
    pop.style.top      = `${rect.bottom + 6}px`;
    pop.style.width    = `${popW}px`;
    // Corregir si se sale por la derecha o izquierda
    const popRect = pop.getBoundingClientRect();
    if (popRect.right > window.innerWidth - 8) {
        pop.style.left = `${window.innerWidth - popW - 8}px`;
    }
    if (popRect.left < 8) {
        pop.style.left = '8px';
    }

    // Cerrar al click fuera
    setTimeout(function() {
        function cerrar(e) {
            if (!pop.contains(e.target) && !celdaEl.contains(e.target)) {
                if (pop.parentNode) pop.parentNode.removeChild(pop);
                document.removeEventListener('click', cerrar);
            }
        }
        document.addEventListener('click', cerrar);
    }, 0);
}

// ── FORMULARIO DE NUEVO EVENTO ───────────────────────────────────────────────

function crearFormularioEvento(fechaDia, onNuevoEvento, paleta) {
    const form = document.createElement('div');
    form.className = 'cal2__form';

    // Título del formulario
    const formTitulo = document.createElement('p');
    formTitulo.className   = 'cal2__form-titulo';
    formTitulo.textContent = 'Nuevo evento';
    form.appendChild(formTitulo);

    // Input del título del evento
    const inputTitulo = document.createElement('input');
    inputTitulo.type        = 'text';
    inputTitulo.placeholder = 'Título del evento...';
    inputTitulo.className   = 'cal2__form-input';
    form.appendChild(inputTitulo);

    // Selector de tipo de evento
    // El usuario solo puede crear recordatorios propios
    // El instructor puede también crear eventos para estudiantes
    const esUsuario = paleta === 'usuario';

    const selectTipo = document.createElement('select');
    selectTipo.className = 'cal2__form-select';
    const opcionesTipo = esUsuario
        ? [{ value: 'propio', label: 'Recordatorio propio' }]
        : [
            { value: 'propio',     label: 'Recordatorio propio' },
            { value: 'estudiante', label: 'Para un estudiante' },
          ];
    opcionesTipo.forEach(function(op) {
        const opt = document.createElement('option');
        opt.value       = op.value;
        opt.textContent = op.label;
        selectTipo.appendChild(opt);
    });
    // Ocultar el select si solo hay una opción (usuario)
    if (esUsuario) selectTipo.style.display = 'none';
    form.appendChild(selectTipo);

    // Contenedor del selector de estudiante (aparece si tipo = 'estudiante')
    const grupoEstudiante = document.createElement('div');
    grupoEstudiante.className = 'cal2__form-grupo cal2__form-grupo--oculto';

    const selectEstudiante = document.createElement('select');
    selectEstudiante.className = 'cal2__form-select';
    const optPlaceholder = document.createElement('option');
    optPlaceholder.value       = '';
    optPlaceholder.textContent = 'Cargando estudiantes...';
    optPlaceholder.disabled    = true;
    optPlaceholder.selected    = true;
    selectEstudiante.appendChild(optPlaceholder);
    grupoEstudiante.appendChild(selectEstudiante);
    form.appendChild(grupoEstudiante);

    // Cargar usuarios al cambiar a tipo 'estudiante'
    let usuariosCargados = false;
    selectTipo.addEventListener('change', async function() {
        const esEstudiante = selectTipo.value === 'estudiante';
        grupoEstudiante.classList.toggle('cal2__form-grupo--oculto', !esEstudiante);

        if (esEstudiante && !usuariosCargados) {
            usuariosCargados = true;
            try {
                const usuarios = await obtenerTodosLosUsuarios();
                // Limpiar placeholder
                while (selectEstudiante.firstChild) selectEstudiante.removeChild(selectEstudiante.firstChild);
                const optEmpty = document.createElement('option');
                optEmpty.value       = '';
                optEmpty.textContent = 'Selecciona un estudiante...';
                optEmpty.disabled    = true;
                optEmpty.selected    = true;
                selectEstudiante.appendChild(optEmpty);

                // Solo mostrar usuarios con rol 'user'
                usuarios.filter(u => u.role === 'user' || u.role === 'usuario').forEach(function(u) {
                    const opt = document.createElement('option');
                    opt.value       = u.id;
                    opt.textContent = u.name || u.documento;
                    selectEstudiante.appendChild(opt);
                });
            } catch {
                optPlaceholder.textContent = 'Error al cargar estudiantes';
            }
        }
    });

    // Mensaje de error
    const errorEl = document.createElement('p');
    errorEl.className = 'cal2__form-error';
    form.appendChild(errorEl);

    // Botón guardar
    const btnGuardar = document.createElement('button');
    btnGuardar.className   = 'cal2__form-btn';
    btnGuardar.textContent = 'Agregar evento';
    btnGuardar.addEventListener('click', async function() {
        errorEl.textContent = '';
        const titulo = inputTitulo.value.trim();
        const tipo   = selectTipo.value;

        if (!titulo) { errorEl.textContent = 'El título es obligatorio'; return; }
        if (tipo === 'estudiante' && !selectEstudiante.value) {
            errorEl.textContent = 'Selecciona un estudiante'; return;
        }

        btnGuardar.disabled     = true;
        btnGuardar.textContent  = 'Guardando...';

        const datos = {
            date:      fechaDia,
            title:     titulo,
            tipo,
            studentId: tipo === 'estudiante' ? parseInt(selectEstudiante.value) : null,
            color:     tipo === 'propio' ? COLOR_PROPIO : COLOR_ESTUDIANTE,
        };

        const creado = await onNuevoEvento(datos);

        if (!creado) {
            errorEl.textContent    = 'Error al guardar el evento';
            btnGuardar.disabled    = false;
            btnGuardar.textContent = 'Agregar evento';
        } else {
            // Mostrar confirmación visual brevemente antes de que el calendario se re-renderice
            btnGuardar.textContent                = '✓ Evento guardado';
            btnGuardar.style.backgroundColor      = '#16a34a';
        }
    });

    form.appendChild(btnGuardar);
    return form;
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function crearPunto(color) {
    const p = document.createElement('span');
    p.className = 'cal2__punto';
    p.style.backgroundColor = color;
    return p;
}

function crearBtnNav(icono, titulo, onClick) {
    const btn = document.createElement('button');
    btn.className = 'cal2__nav-btn';
    btn.title     = titulo;
    const i = document.createElement('i');
    i.setAttribute('data-lucide', icono);
    btn.appendChild(i);
    btn.addEventListener('click', onClick);
    return btn;
}