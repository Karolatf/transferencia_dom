// MÓDULO: utils/eventosCalendario.js
// CAPA: Utils — calendario de eventos reutilizable

// Responsabilidad única: generar un calendario interactivo en cualquier contenedor del DOM.
// Es genérico: funciona para el instructor (soloLectura: false) y el usuario (soloLectura: true).
// No importa de otros módulos del proyecto — es autónomo.

// Eventos del calendario almacenados en memoria por instancia
// La clave es el contenedorId para permitir múltiples calendarios independientes
const eventosPorCalendario = {};

// Nombres de los meses en español para mostrar en la cabecera del calendario
const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Nombres de los días en español para la fila de cabecera del grid
const NOMBRES_DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// crearCalendario — función principal exportada para generar el calendario
// Parámetro: contenedorId — string con el ID del elemento HTML donde se monta el calendario
// Parámetro: paleta — "instructor" | "usuario" — define los colores del día actual y los eventos
// Parámetro: soloLectura — boolean — si true: solo ver; si false: puede agregar eventos
// Parámetro: tareas — array de objetos tarea del usuario (para los indicadores de color)
export function crearCalendario({ contenedorId, paleta, soloLectura, tareas = [] }) {
    // Obtener el contenedor por ID
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    // Inicializar el arreglo de eventos para este calendario si no existe
    if (!eventosPorCalendario[contenedorId]) {
        eventosPorCalendario[contenedorId] = [];
    }

    // Estado del calendario: mes y año actualmente visibles
    const estado = {
        mes:  new Date().getMonth(),
        anio: new Date().getFullYear(),
    };

    // Renderizar el calendario por primera vez
    renderizarCalendario(contenedor, estado, paleta, soloLectura, tareas, contenedorId);
}

// renderizarCalendario — construye el DOM del calendario y lo inserta en el contenedor
// Se llama cada vez que el usuario navega a un mes diferente
function renderizarCalendario(contenedor, estado, paleta, soloLectura, tareas, contenedorId) {
    // Limpiar el contenedor para re-renderizar sin duplicados
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    // Color del día actual según la paleta del calendario
    const colorDiaActual = paleta === 'instructor'
        ? 'var(--color-instructor)'
        : 'var(--color-primario)';

    // Cabecera del calendario: botón prev + título mes/año + botón next
    const cabecera = document.createElement('div');
    cabecera.className = 'calendario__cabecera';

    // Botón para ir al mes anterior
    const btnPrev = document.createElement('button');
    btnPrev.className = 'calendario__nav-btn';
    btnPrev.title     = 'Mes anterior';
    const iconoPrev = document.createElement('i');
    iconoPrev.setAttribute('data-lucide', 'chevron-left');
    iconoPrev.classList.add('icono-accion');
    btnPrev.appendChild(iconoPrev);
    btnPrev.addEventListener('click', function() {
        // Retroceder un mes — si estamos en enero (0), ir a diciembre (11) del año anterior
        if (estado.mes === 0) {
            estado.mes  = 11;
            estado.anio -= 1;
        } else {
            estado.mes -= 1;
        }
        // Re-renderizar con el nuevo mes
        renderizarCalendario(contenedor, estado, paleta, soloLectura, tareas, contenedorId);
    });
    cabecera.appendChild(btnPrev);

    // Título con el mes y año actuales
    const titulo = document.createElement('span');
    titulo.className   = 'calendario__titulo';
    titulo.textContent = `${NOMBRES_MESES[estado.mes]} ${estado.anio}`;
    cabecera.appendChild(titulo);

    // Botón para ir al mes siguiente
    const btnNext = document.createElement('button');
    btnNext.className = 'calendario__nav-btn';
    btnNext.title     = 'Mes siguiente';
    const iconoNext = document.createElement('i');
    iconoNext.setAttribute('data-lucide', 'chevron-right');
    iconoNext.classList.add('icono-accion');
    btnNext.appendChild(iconoNext);
    btnNext.addEventListener('click', function() {
        // Avanzar un mes — si estamos en diciembre (11), ir a enero (0) del año siguiente
        if (estado.mes === 11) {
            estado.mes  = 0;
            estado.anio += 1;
        } else {
            estado.mes += 1;
        }
        renderizarCalendario(contenedor, estado, paleta, soloLectura, tareas, contenedorId);
    });
    cabecera.appendChild(btnNext);
    contenedor.appendChild(cabecera);

    // Grid del calendario: 7 columnas (Dom-Sáb)
    const grid = document.createElement('div');
    grid.className = 'calendario__grid';

    // Fila de nombres de los días (Dom, Lun, Mar...)
    NOMBRES_DIAS.forEach(function(nombreDia) {
        const celdaDia = document.createElement('div');
        celdaDia.className   = 'calendario__dia-nombre';
        celdaDia.textContent = nombreDia;
        grid.appendChild(celdaDia);
    });

    // Calcular el primer día del mes y la cantidad de días
    const primerDia     = new Date(estado.anio, estado.mes, 1).getDay();
    const diasEnElMes   = new Date(estado.anio, estado.mes + 1, 0).getDate();
    const hoy           = new Date();
    const esHoy = function(dia) {
        return dia === hoy.getDate()
            && estado.mes  === hoy.getMonth()
            && estado.anio === hoy.getFullYear();
    };

    // Celdas vacías para alinear el primer día con la columna correcta
    for (let i = 0; i < primerDia; i++) {
        const vacio = document.createElement('div');
        vacio.className = 'calendario__celda calendario__celda--vacia';
        grid.appendChild(vacio);
    }

    // Calcular indicadores de color por día según las tareas (solo para el usuario)
    // Distribución: numeroDia = (tarea.id % diasEnElMes) + 1
    const indicadoresPorDia = {};
    if (tareas && tareas.length > 0) {
        tareas.forEach(function(tarea) {
            const dia = (tarea.id % diasEnElMes) + 1;
            if (!indicadoresPorDia[dia]) indicadoresPorDia[dia] = [];
            // Mapear el status de la tarea a un color
            const coloresPorStatus = {
                pendiente:             'var(--color-error)',
                en_progreso:           'var(--color-aprobacion)',
                completada:            'var(--color-completada)',
                pendiente_aprobacion:  'var(--color-primario)',
            };
            const colorIndicador = coloresPorStatus[tarea.status] || 'var(--texto-claro)';
            // Solo agregar el color si no está duplicado (una tarea = un punto)
            if (!indicadoresPorDia[dia].includes(colorIndicador)) {
                indicadoresPorDia[dia].push(colorIndicador);
            }
        });
    }

    // Eventos del instructor almacenados en memoria
    const eventosDelCalendario = eventosPorCalendario[contenedorId] || [];

    // Celdas de los días del mes
    for (let dia = 1; dia <= diasEnElMes; dia++) {
        const celda = document.createElement('div');
        celda.className = 'calendario__celda';

        // Resaltar el día actual con el color de la paleta
        if (esHoy(dia)) {
            celda.classList.add('calendario__celda--hoy');
            celda.style.backgroundColor = colorDiaActual;
            celda.style.color = '#ffffff';
        }

        // Número del día
        const numeroDia = document.createElement('span');
        numeroDia.className   = 'calendario__numero-dia';
        numeroDia.textContent = dia;
        celda.appendChild(numeroDia);

        // Indicadores de color por tareas (puntos debajo del número)
        const indicadores = indicadoresPorDia[dia] || [];
        // Buscar también eventos del instructor para este día (formato YYYY-MM-DD)
        const fechaDia = `${estado.anio}-${String(estado.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const eventosDelDia = eventosDelCalendario.filter(function(ev) { return ev.fecha === fechaDia; });

        if (indicadores.length > 0 || eventosDelDia.length > 0) {
            const contenedorPuntos = document.createElement('div');
            contenedorPuntos.className = 'calendario__puntos';

            // Punto por cada indicador de tarea
            indicadores.forEach(function(color) {
                const punto = document.createElement('span');
                punto.className = 'calendario__punto';
                punto.style.backgroundColor = color;
                contenedorPuntos.appendChild(punto);
            });

            // Punto verde para eventos del instructor
            if (eventosDelDia.length > 0) {
                const puntoEvento = document.createElement('span');
                puntoEvento.className = 'calendario__punto';
                puntoEvento.style.backgroundColor = paleta === 'instructor'
                    ? 'var(--color-instructor)'
                    : 'var(--color-primario)';
                contenedorPuntos.appendChild(puntoEvento);
            }

            celda.appendChild(contenedorPuntos);
        }

        // Clic en el día: abrir popover con eventos y opción de agregar (si no es soloLectura)
        celda.addEventListener('click', function(e) {
            e.stopPropagation();
            abrirPopover(celda, fechaDia, eventosDelDia, soloLectura, paleta, contenedorId, function() {
                // Callback para re-renderizar cuando se agrega un evento nuevo
                renderizarCalendario(contenedor, estado, paleta, soloLectura, tareas, contenedorId);
            });
        });

        grid.appendChild(celda);
    }

    contenedor.appendChild(grid);

    // Leyenda de colores (solo para el calendario del usuario)
    if (!soloLectura || tareas.length > 0) {
        const leyenda = document.createElement('div');
        leyenda.className = 'calendario__leyenda';

        const items = [
            { color: 'var(--color-error)',       texto: 'Pendiente' },
            { color: 'var(--color-aprobacion)',  texto: 'En progreso' },
            { color: 'var(--color-completada)',  texto: 'Completada' },
            { color: 'var(--color-primario)',    texto: 'Por aprobar' },
        ];

        items.forEach(function(item) {
            const itemEl = document.createElement('div');
            itemEl.className = 'calendario__leyenda-item';

            const punto = document.createElement('span');
            punto.className = 'calendario__punto';
            punto.style.backgroundColor = item.color;
            itemEl.appendChild(punto);

            const texto = document.createElement('span');
            texto.textContent = item.texto;
            itemEl.appendChild(texto);

            leyenda.appendChild(itemEl);
        });

        contenedor.appendChild(leyenda);
    }

    // Inicializar íconos Lucide en el calendario recién renderizado
    if (window.lucide) window.lucide.createIcons();

    // Cerrar popover al hacer clic fuera del calendario
    document.addEventListener('click', function cerrarPopoverGlobal() {
        const popovers = document.querySelectorAll('.calendario__popover');
        popovers.forEach(function(p) { if (p.parentNode) p.parentNode.removeChild(p); });
        document.removeEventListener('click', cerrarPopoverGlobal);
    }, { once: true });
}

// abrirPopover — muestra un panel flotante con los eventos del día
// Parámetro: celdaEl — elemento HTML de la celda del día clickeada
// Parámetro: fecha — string en formato YYYY-MM-DD del día
// Parámetro: eventosDelDia — arreglo de eventos del calendario para ese día
// Parámetro: soloLectura — boolean — si false muestra formulario de agregar
// Parámetro: paleta — "instructor" | "usuario"
// Parámetro: contenedorId — ID del calendario para guardar nuevos eventos
// Parámetro: onNuevoEvento — callback para re-renderizar después de agregar evento
function abrirPopover(celdaEl, fecha, eventosDelDia, soloLectura, paleta, contenedorId, onNuevoEvento) {
    // Eliminar cualquier popover existente
    const popoversExistentes = document.querySelectorAll('.calendario__popover');
    popoversExistentes.forEach(function(p) { if (p.parentNode) p.parentNode.removeChild(p); });

    // Crear el popover
    const popover = document.createElement('div');
    popover.className = 'calendario__popover';

    // Detener la propagación para que el listener de document no lo cierre inmediatamente
    popover.addEventListener('click', function(e) { e.stopPropagation(); });

    // Título del popover con la fecha
    const tituloPop = document.createElement('p');
    tituloPop.className   = 'calendario__popover-titulo';
    tituloPop.textContent = fecha;
    popover.appendChild(tituloPop);

    // Lista de eventos del día
    if (eventosDelDia.length > 0) {
        const listaEventos = document.createElement('ul');
        listaEventos.className = 'calendario__popover-lista';
        eventosDelDia.forEach(function(ev) {
            const itemEv = document.createElement('li');
            itemEv.textContent = ev.titulo;
            listaEventos.appendChild(itemEv);
        });
        popover.appendChild(listaEventos);
    } else {
        const sinEventos = document.createElement('p');
        sinEventos.className   = 'calendario__popover-vacio';
        sinEventos.textContent = 'Sin eventos';
        popover.appendChild(sinEventos);
    }

    // Si no es solo lectura (instructor): formulario para agregar evento nuevo
    if (!soloLectura) {
        const inputEvento = document.createElement('input');
        inputEvento.type        = 'text';
        inputEvento.placeholder = 'Nuevo evento...';
        inputEvento.className   = 'calendario__popover-input';
        popover.appendChild(inputEvento);

        const btnAgregar = document.createElement('button');
        btnAgregar.className   = 'btn btn--sm';
        btnAgregar.textContent = 'Agregar';
        btnAgregar.style.backgroundColor = paleta === 'instructor'
            ? 'var(--color-instructor)'
            : 'var(--color-primario)';
        btnAgregar.style.color = '#ffffff';

        btnAgregar.addEventListener('click', function() {
            const tituloEvento = inputEvento.value.trim();
            if (!tituloEvento) return;

            // Agregar el nuevo evento al arreglo en memoria
            if (!eventosPorCalendario[contenedorId]) eventosPorCalendario[contenedorId] = [];
            eventosPorCalendario[contenedorId].push({
                fecha:  fecha,
                titulo: tituloEvento,
                tipo:   'recordatorio',
            });

            // Cerrar el popover y re-renderizar el calendario
            if (popover.parentNode) popover.parentNode.removeChild(popover);
            onNuevoEvento();
        });
        popover.appendChild(btnAgregar);
    }

    // Posicionar el popover absolutamente debajo de la celda
    celdaEl.style.position = 'relative';
    celdaEl.appendChild(popover);
}