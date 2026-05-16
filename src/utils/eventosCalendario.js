// Archivo: utils/eventosCalendario.js
// Este archivo construye y gestiona el calendario interactivo de la aplicación.
// El calendario muestra los eventos guardados en el servidor y los puntos de colores
// de las tareas del usuario. El instructor puede crear y eliminar eventos desde aquí.
//
// Colores de eventos del calendario:
//   Evento propio del instructor:   #6366f1 (índigo)
//   Evento asignado a un estudiante: #0ea5e9 (celeste)
//
// Puntos de tareas en los días:
//   pendiente:             amarillo
//   en_progreso:           azul
//   completada:            verde
//   pendiente_aprobacion:  naranja
//   reprobada:             rojo

// Importamos las funciones del servidor para obtener, crear y eliminar eventos
import {
    obtenerEventosInstructor, // trae los eventos del instructor autenticado
    obtenerEventosUsuario,    // trae los eventos asignados al estudiante autenticado
    crearEvento,              // crea un nuevo evento en el servidor
    eliminarEvento,           // elimina un evento del servidor
} from '../api/calendarApi.js';

// Importamos la función para obtener la lista de usuarios (para el selector de estudiante)
import { obtenerTodosLosUsuarios } from '../api/usuariosApi.js';

// Arreglo con los nombres de los meses en español para mostrar en el encabezado del calendario
const MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
// Arreglo con los nombres cortos de los días de la semana en español
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// Color para los eventos propios del instructor (recordatorios personales)
const COLOR_PROPIO     = '#6366f1'; // índigo
// Color para los eventos que el instructor asignó a un estudiante
const COLOR_ESTUDIANTE = '#0ea5e9'; // celeste

// Mapa de colores para los puntos de tareas según su estado
const COLORES_TAREA = {
    pendiente:             'var(--color-pendiente)',   // amarillo
    en_progreso:           'var(--color-progreso)',    // azul
    completada:            'var(--color-completada)',  // verde
    pendiente_aprobacion:  'var(--color-aprobacion)', // naranja
    reprobada:             '#dc2626',                  // rojo
};

// Mapa de etiquetas legibles en español para mostrar el estado de la tarea en el popover
const ETIQUETAS_ESTADO = {
    pendiente:             'Pendiente',
    en_progreso:           'En progreso',
    completada:            'Completada',
    pendiente_aprobacion:  'Por aprobar',
    reprobada:             'Reprobada',
};

// ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────────

// Exportamos la función crearCalendario que construye el calendario completo
// dentro del elemento HTML identificado por el id recibido como parámetro
// Recibe:
//   contenedorId — id del elemento HTML donde se monta el calendario
//   paleta       — 'instructor' o 'usuario' para aplicar el esquema de color correcto
//   soloLectura  — true para el estudiante (no puede crear eventos), false para el instructor
//   tareas       — lista de tareas del usuario para mostrar como puntos en los días
//   onVerTarea   — función que se llama al presionar "Ver tarea" en el popover
//   userId       — id del usuario autenticado para validar permisos de eliminación
export async function crearCalendario({
    contenedorId,
    paleta,
    soloLectura,
    tareas     = [],
    onVerTarea = null,
    userId     = null,
}) {
    // Buscamos el elemento HTML donde montar el calendario
    const contenedor = document.getElementById(contenedorId);
    // Si el contenedor no existe en el HTML, salimos sin hacer nada
    if (!contenedor) return;

    // Mostramos un mensaje de carga mientras el servidor responde con los eventos
    contenedor.innerHTML = '<div class="calendario__cargando">Cargando calendario...</div>';

    // Pedimos los eventos al servidor según el rol del usuario
    let eventos = [];
    try {
        eventos = paleta === 'instructor'
            ? await obtenerEventosInstructor()   // instructor: sus propios eventos y los de sus estudiantes
            : await obtenerEventosUsuario();     // estudiante: los eventos que el instructor le asignó
    } catch {
        // Si el servidor falla, continuamos con la lista vacía
        eventos = [];
    }

    // Guardamos el estado del calendario: el mes y año visibles y la lista de eventos
    const estado = {
        mes:    new Date().getMonth(),  // mes actual (0 = enero, 11 = diciembre)
        anio:   new Date().getFullYear(), // año actual
        eventos,                        // lista de eventos cargada del servidor
        cargandoEvento: false,          // flag para evitar doble envío al guardar
    };

    // Dibujamos el calendario con el estado inicial
    renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId);
}

// ── RENDERIZADO DEL CALENDARIO ────────────────────────────────────────────────

// Función privada que dibuja el calendario completo con el mes y año del estado actual
// Se llama al cargar el calendario y al navegar entre meses
function renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId) {
    // Vaciamos el contenedor antes de volver a dibujarlo
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    // El color del día de hoy depende del rol: verde para instructor, morado para usuario
    const colorHoy = paleta === 'instructor'
        ? 'var(--color-instructor)'
        : 'var(--color-primario)';

    // ── Encabezado con mes, año y botones de navegación ─────────────────────────
    const cabecera = document.createElement('div');
    cabecera.className = 'cal2__cabecera';

    // Botón para ir al mes anterior
    const btnPrev = crearBtnNav('chevron-left', 'Mes anterior', function() {
        // Si estamos en enero, vamos a diciembre del año anterior
        if (estado.mes === 0) { estado.mes = 11; estado.anio--; }
        else estado.mes--;
        // Volvemos a dibujar el calendario con el nuevo mes
        renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId);
    });

    // Título con el nombre del mes y el año actuales
    const titulo = document.createElement('span');
    titulo.className   = 'cal2__titulo';
    titulo.textContent = `${MESES[estado.mes]} ${estado.anio}`;

    // Botón para ir al mes siguiente
    const btnNext = crearBtnNav('chevron-right', 'Mes siguiente', function() {
        // Si estamos en diciembre, vamos a enero del año siguiente
        if (estado.mes === 11) { estado.mes = 0; estado.anio++; }
        else estado.mes++;
        // Volvemos a dibujar el calendario con el nuevo mes
        renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId);
    });

    cabecera.appendChild(btnPrev);
    cabecera.appendChild(titulo);
    cabecera.appendChild(btnNext);
    contenedor.appendChild(cabecera);

    // ── Cuadrícula del calendario (7 columnas: una por cada día de la semana) ──
    const grid = document.createElement('div');
    grid.className = 'cal2__grid';

    // Pintamos los nombres de los días de la semana en la primera fila de la cuadrícula
    DIAS.forEach(function(d) {
        const el = document.createElement('div');
        el.className   = 'cal2__dia-nombre';
        el.textContent = d;
        grid.appendChild(el);
    });

    // ── Cálculos del mes ──────────────────────────────────────────────────────
    // getDay() retorna 0=domingo, 1=lunes ... 6=sábado — cuántas celdas vacías van al principio
    const primerDia   = new Date(estado.anio, estado.mes, 1).getDay();
    // Cuántos días tiene el mes actual (getDate() del último día del mes)
    const diasEnMes   = new Date(estado.anio, estado.mes + 1, 0).getDate();
    // La fecha de hoy para resaltar el día actual con un color especial
    const hoy         = new Date();

    // Función que verifica si un número de día es el día de hoy en el mes y año visibles
    const esHoy = function(dia) {
        return dia === hoy.getDate()
            && estado.mes  === hoy.getMonth()
            && estado.anio === hoy.getFullYear();
    };

    // ── Índice de eventos por fecha ───────────────────────────────────────────
    // Construimos un objeto donde cada clave es una fecha ("2025-01-15") y
    // el valor es la lista de eventos que ocurren en esa fecha
    const eventosPorFecha = {};
    estado.eventos.forEach(function(ev) {
        const f = ev.date;
        if (!eventosPorFecha[f]) eventosPorFecha[f] = [];
        eventosPorFecha[f].push(ev);
    });

    // ── Índice de tareas por fecha ────────────────────────────────────────────
    // Construimos un índice similar para las tareas, usando la fecha de creación
    // para mostrar un punto de color en el día en que se creó cada tarea
    const tareasPorFecha = {};
    tareas.forEach(function(tarea) {
        if (!tarea.createdAt) return;
        // createdAt puede llegar como fecha ISO ("2025-01-15T10:30:00.000Z") o como objeto Date
        const fecha = typeof tarea.createdAt === 'string'
            ? tarea.createdAt.split('T')[0]         // tomamos solo la parte de la fecha (antes de la T)
            : tarea.createdAt instanceof Date
                ? tarea.createdAt.toISOString().split('T')[0]
                : null;
        if (!fecha) return;
        if (!tareasPorFecha[fecha]) tareasPorFecha[fecha] = [];
        tareasPorFecha[fecha].push(tarea);
    });

    // ── Celdas vacías antes del primer día del mes ────────────────────────────
    // Si el mes empieza en miércoles (día 3), necesitamos 3 celdas vacías al inicio
    for (let i = 0; i < primerDia; i++) {
        const vacio = document.createElement('div');
        vacio.className = 'cal2__celda cal2__celda--vacia';
        grid.appendChild(vacio);
    }

    // ── Celdas de cada día del mes ────────────────────────────────────────────
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const celda = document.createElement('div');
        celda.className = 'cal2__celda';

        // Construimos la cadena de fecha en formato "YYYY-MM-DD" para buscarla en los índices
        const fechaDia = `${estado.anio}-${String(estado.mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        // Obtenemos los eventos y tareas de este día específico (o arreglo vacío si no hay)
        const eventosDelDia = eventosPorFecha[fechaDia] || [];
        const tareasDelDia  = tareasPorFecha[fechaDia]  || [];

        // Si este día es hoy, le aplicamos el estilo de resaltado y la variable de color
        if (esHoy(dia)) {
            celda.classList.add('cal2__celda--hoy');
            celda.style.setProperty('--color-hoy', colorHoy);
        }

        // Si hay eventos en este día, marcamos la celda con una clase para el borde sutil
        if (eventosDelDia.length > 0) {
            celda.classList.add('cal2__celda--con-eventos');
        }

        // Número del día del mes dentro de la celda
        const numEl = document.createElement('span');
        numEl.className   = 'cal2__numero-dia';
        numEl.textContent = dia;
        celda.appendChild(numEl);

        // ── Puntos de eventos y tareas en el día ──────────────────────────────
        const hayPuntos = eventosDelDia.length > 0 || tareasDelDia.length > 0;
        if (hayPuntos) {
            const puntos = document.createElement('div');
            puntos.className = 'cal2__puntos';

            // Pintamos un punto por cada color de evento diferente en este día
            const tiposVistos = new Set(); // evitamos pintar dos puntos del mismo color
            eventosDelDia.forEach(function(ev) {
                const color = ev.tipo === 'propio' ? COLOR_PROPIO : COLOR_ESTUDIANTE;
                if (!tiposVistos.has(color)) {
                    tiposVistos.add(color);
                    puntos.appendChild(crearPunto(color));
                }
            });

            // Pintamos un punto por cada estado de tarea diferente en este día
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

        // Al hacer clic en un día, abrimos el popover con los eventos y tareas de ese día
        celda.addEventListener('click', function(e) {
            // Evitamos que el clic en la celda cierre el popover que acabamos de abrir
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
                // Función que se llama al guardar un nuevo evento desde el formulario del popover
                onNuevoEvento: async function(datos) {
                    // Enviamos el nuevo evento al servidor
                    const creado = await crearEvento(datos);
                    if (creado) {
                        // Esperamos 800ms para que el usuario vea el mensaje de confirmación
                        await new Promise(function(r) { setTimeout(r, 800); });
                        // Actualizamos la lista de eventos desde el servidor
                        try {
                            estado.eventos = paleta === 'instructor'
                                ? await obtenerEventosInstructor()
                                : await obtenerEventosUsuario();
                        } catch { /* si falla, mantenemos los eventos actuales */ }
                        // Volvemos a dibujar el calendario con los eventos actualizados
                        renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId);
                    }
                    return creado;
                },
                // Función que se llama al eliminar un evento desde el popover
                onEliminarEvento: async function(id) {
                    const ok = await eliminarEvento(id);
                    if (ok) {
                        // Cerramos el popover antes de volver a dibujar el calendario
                        document.querySelectorAll('.cal2__popover').forEach(function(p) {
                            if (p.parentNode) p.parentNode.removeChild(p);
                        });
                        // Quitamos el evento eliminado de la lista local
                        estado.eventos = estado.eventos.filter(function(ev) { return ev.id !== id; });
                        // Volvemos a dibujar el calendario sin el evento eliminado
                        renderizar(contenedor, estado, paleta, soloLectura, tareas, onVerTarea, userId);
                    }
                },
            });
        });

        grid.appendChild(celda);
    }

    contenedor.appendChild(grid);

    // ── Leyenda de colores ────────────────────────────────────────────────────
    // Mostramos la leyenda debajo del calendario explicando qué significa cada color
    const leyenda = document.createElement('div');
    leyenda.className = 'cal2__leyenda';

    // La leyenda del instructor incluye todos los colores de estados
    // La leyenda del estudiante no incluye "Reprobada" porque no está en su flujo
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

    // Creamos un elemento de leyenda por cada color con su punto y texto explicativo
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

    // Inicializamos los íconos de Lucide que se usen en los botones de navegación
    if (window.lucide) window.lucide.createIcons();
}

// ── POPOVER DE DÍA ───────────────────────────────────────────────────────────

// Función privada que abre el popover (pequeña ventana flotante) sobre un día del calendario
// Muestra los eventos y tareas de ese día, y el formulario para agregar un nuevo evento
function abrirPopover({
    celdaEl, fechaDia, eventosDelDia, tareasDelDia, soloLectura, paleta,
    onVerTarea, userId, onNuevoEvento, onEliminarEvento,
}) {
    // Cerramos cualquier popover anterior que pudiera estar abierto
    document.querySelectorAll('.cal2__popover').forEach(function(p) {
        if (p.parentNode) p.parentNode.removeChild(p);
    });

    // Creamos el panel del popover
    const pop = document.createElement('div');
    pop.className = 'cal2__popover';
    // Evitamos que un clic dentro del popover lo cierre
    pop.addEventListener('click', function(e) { e.stopPropagation(); });

    // Título del popover con la fecha en formato legible ("15 de Enero 2025")
    const [anio, mes, dia] = fechaDia.split('-');
    const fechaLegible = `${parseInt(dia)} de ${MESES[parseInt(mes) - 1]} ${anio}`;
    const tituloEl = document.createElement('p');
    tituloEl.className   = 'cal2__popover-titulo';
    tituloEl.textContent = fechaLegible;
    pop.appendChild(tituloEl);

    // ── Lista de eventos del calendario ───────────────────────────────────────
    if (eventosDelDia.length > 0) {
        const lista = document.createElement('div');
        lista.className = 'cal2__popover-lista';

        // Por cada evento del día creamos un elemento con su barra de color y título
        eventosDelDia.forEach(function(ev) {
            const item = document.createElement('div');
            item.className = 'cal2__popover-evento';

            // Barra de color lateral según el tipo de evento (propio = índigo, estudiante = celeste)
            const barra = document.createElement('div');
            barra.className = 'cal2__popover-barra';
            barra.style.backgroundColor = ev.tipo === 'propio' ? COLOR_PROPIO : COLOR_ESTUDIANTE;
            item.appendChild(barra);

            const cuerpo = document.createElement('div');
            cuerpo.className = 'cal2__popover-cuerpo';

            // Título del evento
            const tituloEv = document.createElement('span');
            tituloEv.className   = 'cal2__popover-evento-titulo';
            tituloEv.textContent = ev.title;
            cuerpo.appendChild(tituloEv);

            // Si el evento está asignado a un estudiante, mostramos su nombre
            if (ev.studentName) {
                const est = document.createElement('span');
                est.className   = 'cal2__popover-evento-meta';
                est.textContent = `👤 ${ev.studentName}`;
                cuerpo.appendChild(est);
            }

            // Si el evento está relacionado con una tarea, mostramos el badge del estado
            // y el botón "Ver tarea" para navegar al detalle de esa tarea
            if (ev.taskTitle) {
                const tareaInfo = document.createElement('div');
                tareaInfo.className = 'cal2__popover-tarea-info';

                // Badge de color con el estado de la tarea relacionada
                const estadoBadge = document.createElement('span');
                estadoBadge.className   = 'cal2__popover-estado-badge';
                estadoBadge.textContent = ETIQUETAS_ESTADO[ev.taskStatus] || ev.taskStatus || '—';
                estadoBadge.style.backgroundColor = (COLORES_TAREA[ev.taskStatus] || '#e5e7eb') + '33';
                estadoBadge.style.color           = COLORES_TAREA[ev.taskStatus] || '#374151';
                tareaInfo.appendChild(estadoBadge);

                // Botón "Ver tarea" que navega al detalle de la tarea al hacer clic
                if (onVerTarea && ev.taskId) {
                    const btnVer = document.createElement('button');
                    btnVer.className   = 'cal2__popover-btn-ver';
                    btnVer.textContent = 'Ver tarea';
                    btnVer.addEventListener('click', function() {
                        // Cerramos el popover antes de navegar
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

            // Botón X para eliminar el evento (solo si el usuario tiene permiso)
            // El instructor puede eliminar cualquier evento suyo
            // El estudiante solo puede eliminar sus propios recordatorios
            const puedeEliminar = !soloLectura && (
                paleta === 'instructor' ||
                (paleta === 'usuario' && userId !== null && Number(ev.instructorId) === Number(userId))
            );
            if (puedeEliminar) {
                const btnDel = document.createElement('button');
                btnDel.className   = 'cal2__popover-btn-del';
                btnDel.title       = 'Eliminar evento';
                btnDel.innerHTML   = '&times;'; // símbolo ×
                // Al hacer clic en X, llamamos a la función de eliminación del evento
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

    // ── Lista de tareas del día (solo lectura, para referencia visual) ─────────
    if (tareasDelDia && tareasDelDia.length > 0) {
        // Si ya mostramos eventos arriba, agregamos un separador con el título "Tareas"
        if (eventosDelDia.length > 0) {
            const sep = document.createElement('p');
            sep.className   = 'cal2__popover-seccion-titulo';
            sep.textContent = 'Tareas';
            pop.appendChild(sep);
        }

        const listaTareas = document.createElement('div');
        listaTareas.className = 'cal2__popover-lista';

        // Por cada tarea del día creamos un elemento con su barra de color y título
        tareasDelDia.forEach(function(tarea) {
            const item = document.createElement('div');
            item.className = 'cal2__popover-evento';

            // Barra de color lateral según el estado de la tarea
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

            // Nombre del usuario asignado a la tarea si está disponible
            const usuarioNombre = tarea.assignedUsersDisplay || tarea.assignedUsersNames || null;
            if (usuarioNombre) {
                const usuEl = document.createElement('span');
                usuEl.className   = 'cal2__popover-evento-meta';
                usuEl.textContent = `👤 ${usuarioNombre}`;
                cuerpo.appendChild(usuEl);
            }

            // Badge con el estado de la tarea
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

    // Si no hay ni eventos ni tareas en este día, mostramos el mensaje vacío
    if (eventosDelDia.length === 0 && (!tareasDelDia || tareasDelDia.length === 0)) {
        const vacio = document.createElement('p');
        vacio.className   = 'cal2__popover-vacio';
        vacio.textContent = 'Sin eventos este día';
        pop.appendChild(vacio);
    }

    // Si el usuario puede crear eventos (modo instructor), mostramos el formulario de nuevo evento
    if (!soloLectura) {
        pop.appendChild(crearFormularioEvento(fechaDia, onNuevoEvento, paleta));
    }

    // Insertamos el popover directamente en el body (no dentro de la celda)
    // para evitar problemas de posición y parpadeo al pasar el mouse
    document.body.appendChild(pop);

    // Calculamos la posición del popover según el espacio disponible en la pantalla
    const rect   = celdaEl.getBoundingClientRect(); // posición y tamaño de la celda del día
    const isMobile = window.innerWidth <= 600;      // detectamos si es dispositivo móvil

    if (isMobile) {
        // En móvil: mostramos el popover como una hoja anclada al fondo de la pantalla
        pop.style.cssText = [
            'position:fixed',
            'left:0',
            'right:0',
            'bottom:0',
            'width:100%',
            'max-width:100%',
            'max-height:75vh',
            'border-radius:18px 18px 0 0',
            'overflow-y:auto',
            'z-index:9999',
            'padding:16px',
            'box-shadow:0 -4px 24px rgba(0,0,0,0.18)',
        ].join(';');
    } else {
        // En escritorio: el popover flota debajo de la celda (o arriba si no hay espacio)
        const popW  = 260; // ancho fijo del popover en píxeles
        let left    = rect.left + rect.width / 2 - popW / 2; // centrado horizontalmente sobre la celda
        const spaceBelow = window.innerHeight - rect.bottom - 6; // espacio disponible debajo
        const popH  = Math.min(420, pop.scrollHeight || 320);    // altura estimada del popover
        // Colocamos el popover debajo si hay espacio, o arriba si no lo hay
        const top   = spaceBelow >= popH
            ? rect.bottom + 6
            : Math.max(8, rect.top - popH - 6);

        pop.style.position = 'fixed';
        pop.style.top      = `${top}px`;
        pop.style.width    = `${popW}px`;

        // Evitamos que el popover se salga por los bordes laterales de la ventana
        if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
        if (left < 8) left = 8;
        pop.style.left = `${left}px`;
    }

    // Registramos un listener global para cerrar el popover al hacer clic fuera de él
    setTimeout(function() {
        function cerrar(e) {
            if (!pop.contains(e.target) && !celdaEl.contains(e.target)) {
                if (pop.parentNode) pop.parentNode.removeChild(pop);
                document.removeEventListener('click', cerrar);
            }
        }
        document.addEventListener('click', cerrar);
    }, 0); // el setTimeout 0 evita que el clic que abrió el popover lo cierre inmediatamente
}

// ── FORMULARIO DE NUEVO EVENTO ────────────────────────────────────────────────

// Función privada que construye el formulario para agregar un nuevo evento dentro del popover
// Recibe la fecha del día, la función a llamar al guardar y la paleta de colores
function crearFormularioEvento(fechaDia, onNuevoEvento, paleta) {
    const form = document.createElement('div');
    form.className = 'cal2__form';

    // Título del formulario
    const formTitulo = document.createElement('p');
    formTitulo.className   = 'cal2__form-titulo';
    formTitulo.textContent = 'Nuevo evento';
    form.appendChild(formTitulo);

    // Campo de texto para el título del nuevo evento
    const inputTitulo = document.createElement('input');
    inputTitulo.type        = 'text';
    inputTitulo.placeholder = 'Título del evento...';
    inputTitulo.className   = 'cal2__form-input';
    form.appendChild(inputTitulo);

    // Selector del tipo de evento:
    // El estudiante solo puede crear recordatorios propios
    // El instructor puede crear recordatorios propios o asignar eventos a estudiantes
    const esUsuario = paleta === 'usuario';

    const selectTipo = document.createElement('select');
    selectTipo.className = 'cal2__form-select';
    // Definimos las opciones según el rol
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
    // Si el usuario solo tiene una opción, ocultamos el selector
    if (esUsuario) selectTipo.style.display = 'none';
    form.appendChild(selectTipo);

    // Selector de estudiante (aparece cuando el instructor elige "Para un estudiante")
    const grupoEstudiante = document.createElement('div');
    grupoEstudiante.className = 'cal2__form-grupo cal2__form-grupo--oculto'; // empieza oculto
    const selectEstudiante = document.createElement('select');
    selectEstudiante.className = 'cal2__form-select';
    // Opción placeholder mientras cargan los estudiantes
    const optPlaceholder = document.createElement('option');
    optPlaceholder.value       = '';
    optPlaceholder.textContent = 'Cargando estudiantes...';
    optPlaceholder.disabled    = true;
    optPlaceholder.selected    = true;
    selectEstudiante.appendChild(optPlaceholder);
    grupoEstudiante.appendChild(selectEstudiante);
    form.appendChild(grupoEstudiante);

    // Cuando el instructor cambia el tipo a "Para un estudiante", cargamos la lista de estudiantes
    let usuariosCargados = false; // evitamos cargar la lista dos veces
    selectTipo.addEventListener('change', async function() {
        const esEstudiante = selectTipo.value === 'estudiante';
        // Mostramos u ocultamos el selector de estudiante según la opción elegida
        grupoEstudiante.classList.toggle('cal2__form-grupo--oculto', !esEstudiante);

        // Si es la primera vez que se selecciona "Para un estudiante", cargamos la lista
        if (esEstudiante && !usuariosCargados) {
            usuariosCargados = true;
            try {
                const usuarios = await obtenerTodosLosUsuarios();
                // Vaciamos el placeholder antes de agregar las opciones reales
                while (selectEstudiante.firstChild) selectEstudiante.removeChild(selectEstudiante.firstChild);
                const optEmpty = document.createElement('option');
                optEmpty.value       = '';
                optEmpty.textContent = 'Selecciona un estudiante...';
                optEmpty.disabled    = true;
                optEmpty.selected    = true;
                selectEstudiante.appendChild(optEmpty);

                // Solo mostramos los usuarios con rol 'user' (estudiantes)
                usuarios.filter(u => u.role === 'user' || u.role === 'usuario').forEach(function(u) {
                    const opt = document.createElement('option');
                    opt.value       = u.id;
                    opt.textContent = u.name || u.documento;
                    selectEstudiante.appendChild(opt);
                });
            } catch {
                // Si falla la carga, mostramos el error en el placeholder
                optPlaceholder.textContent = 'Error al cargar estudiantes';
            }
        }
    });

    // Párrafo donde mostramos los mensajes de error de validación del formulario
    const errorEl = document.createElement('p');
    errorEl.className = 'cal2__form-error';
    form.appendChild(errorEl);

    // Botón "Agregar evento" que envía el evento al servidor
    const btnGuardar = document.createElement('button');
    btnGuardar.className   = 'cal2__form-btn';
    btnGuardar.textContent = 'Agregar evento';
    btnGuardar.addEventListener('click', async function() {
        // Limpiamos el mensaje de error anterior
        errorEl.textContent = '';
        const titulo = inputTitulo.value.trim();
        const tipo   = selectTipo.value;

        // Validamos que el título no esté vacío
        if (!titulo) { errorEl.textContent = 'El título es obligatorio'; return; }
        // Validamos que se haya seleccionado un estudiante si el tipo es "Para un estudiante"
        if (tipo === 'estudiante' && !selectEstudiante.value) {
            errorEl.textContent = 'Selecciona un estudiante'; return;
        }

        // Deshabilitamos el botón y mostramos "Guardando..." para evitar doble envío
        btnGuardar.disabled     = true;
        btnGuardar.textContent  = 'Guardando...';

        // Construimos el objeto con los datos del nuevo evento
        const datos = {
            date:      fechaDia,    // fecha del día en formato "YYYY-MM-DD"
            title:     titulo,      // título del evento
            tipo,                   // "propio" o "estudiante"
            studentId: tipo === 'estudiante' ? parseInt(selectEstudiante.value) : null,
            color:     tipo === 'propio' ? COLOR_PROPIO : COLOR_ESTUDIANTE,
        };

        // Llamamos a la función que envía el evento al servidor
        const creado = await onNuevoEvento(datos);

        if (!creado) {
            // Si el servidor no pudo crear el evento, mostramos el error y habilitamos el botón
            errorEl.textContent    = 'Error al guardar el evento';
            btnGuardar.disabled    = false;
            btnGuardar.textContent = 'Agregar evento';
        } else {
            // Si el evento se guardó exitosamente, mostramos la confirmación visual
            btnGuardar.textContent                = '✓ Evento guardado';
            btnGuardar.style.backgroundColor      = '#16a34a'; // verde de confirmación
        }
    });

    form.appendChild(btnGuardar);
    return form;
}

// ── FUNCIONES AUXILIARES ──────────────────────────────────────────────────────

// Función privada que crea el punto de color que se muestra en los días del calendario
function crearPunto(color) {
    const p = document.createElement('span');
    p.className = 'cal2__punto';
    // Asignamos el color directamente con un estilo en línea
    p.style.backgroundColor = color;
    return p;
}

// Función privada que crea los botones de navegación del mes (flechas izquierda y derecha)
function crearBtnNav(icono, titulo, onClick) {
    const btn = document.createElement('button');
    btn.className = 'cal2__nav-btn';
    btn.title     = titulo; // texto que aparece al pasar el mouse
    // Creamos el ícono de Lucide dentro del botón
    const i = document.createElement('i');
    i.setAttribute('data-lucide', icono);
    btn.appendChild(i);
    // Registramos la función que se ejecuta al hacer clic en el botón
    btn.addEventListener('click', onClick);
    return btn;
}
