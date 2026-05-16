// Archivo: utils/auditoria.js
// Este archivo registra en memoria los eventos importantes que ocurren en la aplicación
// (login, creación de tareas, eliminación de usuarios, cambios de rol, etc.)
// y los muestra en la sección de auditoría del panel del administrador.
// Los registros se borran cuando el usuario recarga la página o cierra el navegador.

// Arreglo en memoria donde guardamos la lista de eventos registrados
const eventos = [];
// Número máximo de eventos que guardamos — cuando se llena, el más antiguo se elimina
const MAXIMO_EVENTOS = 50;

// Objeto que asigna un color específico de nuestra paleta CSS a cada tipo de evento
const COLORES_POR_TIPO = {
    login:             'var(--color-completada)',  // verde: ingreso exitoso al sistema
    tarea_creada:      'var(--color-admin)',        // azul: se creó una nueva tarea
    tarea_eliminada:   'var(--color-error)',        // rojo: se eliminó una tarea
    usuario_eliminado: 'var(--color-error)',        // rojo: se eliminó un usuario
    rol_cambiado:      'var(--color-aprobacion)',   // amarillo: se cambió el rol de un usuario
    logout:            'var(--texto-claro)',         // gris: el usuario cerró sesión
};

// Exportamos la función registrarEvento que agrega un nuevo evento a la lista en memoria
// Recibe el tipo de evento (ej: "login") y una descripción legible (ej: "Usuario admin inició sesión")
export function registrarEvento(tipo, descripcion) {
    // Si ya llegamos al límite máximo, eliminamos el evento más antiguo (el primero del arreglo)
    if (eventos.length >= MAXIMO_EVENTOS) eventos.shift();
    // Agregamos el nuevo evento al final del arreglo con el tipo, la descripción y la hora exacta
    eventos.push({ tipo, descripcion, ts: Date.now() });
}

// Exportamos la función obtenerEventos que retorna una copia de la lista de eventos
// Se usa para leer los eventos sin poder modificar el arreglo original
export function obtenerEventos() {
    return eventos.slice();
}

// Función privada que calcula cuánto tiempo hace que ocurrió un evento
// Recibe la marca de tiempo del evento (ts) y retorna un texto como "hace 5 min"
function calcularTiempoRelativo(ts) {
    // Calculamos la diferencia entre ahora y el momento del evento en milisegundos
    const dif      = Date.now() - ts;
    // Convertimos la diferencia a segundos, minutos y horas
    const segundos = Math.floor(dif / 1000);
    const minutos  = Math.floor(dif / 60000);
    const horas    = Math.floor(dif / 3600000);
    // Retornamos el texto más apropiado según cuánto tiempo pasó
    if (horas > 0)   return `hace ${horas} h`;
    if (minutos > 0) return `hace ${minutos} min`;
    return `hace ${segundos} seg`;
}

// Exportamos la función renderizarAuditoria que dibuja la lista de eventos en la pantalla
// Recibe el elemento HTML del contenedor donde se van a mostrar los eventos
export function renderizarAuditoria(contenedorEl) {
    // Limpiamos el contenedor eliminando todos los elementos que hubiera antes
    while (contenedorEl.firstChild) contenedorEl.removeChild(contenedorEl.firstChild);
    // Si no hay eventos registrados, mostramos un mensaje de "Sin actividad registrada" y terminamos
    if (eventos.length === 0) {
        const p = document.createElement('p');
        p.className   = 'auditoria__vacio';
        p.textContent = 'Sin actividad registrada';
        contenedorEl.appendChild(p);
        return;
    }
    // Creamos una lista HTML para mostrar los eventos
    const lista = document.createElement('ul');
    lista.className = 'auditoria__lista';
    // Recorremos los eventos en orden inverso (el más reciente primero) para mostrar la actividad más nueva arriba
    eventos.slice().reverse().forEach(function(ev) {
        // Creamos el elemento de lista para este evento
        const item = document.createElement('li');
        item.className = 'auditoria__item';
        // Creamos el punto de color que identifica visualmente el tipo de evento
        const punto = document.createElement('span');
        punto.className = 'auditoria__punto';
        // Asignamos el color según el tipo de evento, o gris si el tipo no está en el mapa
        punto.style.backgroundColor = COLORES_POR_TIPO[ev.tipo] || 'var(--texto-claro)';
        item.appendChild(punto);
        // Creamos el contenedor del texto del evento
        const contenido = document.createElement('span');
        contenido.className = 'auditoria__contenido';
        // Creamos el texto de la descripción del evento
        const desc = document.createElement('span');
        desc.className   = 'auditoria__descripcion';
        desc.textContent = ev.descripcion;
        contenido.appendChild(desc);
        // Creamos el texto del tiempo relativo (ej: "hace 3 min")
        const tiempo = document.createElement('span');
        tiempo.className   = 'auditoria__tiempo';
        tiempo.textContent = calcularTiempoRelativo(ev.ts);
        contenido.appendChild(tiempo);
        item.appendChild(contenido);
        // Agregamos el elemento del evento a la lista
        lista.appendChild(item);
    });
    // Insertamos la lista completa en el contenedor de la pantalla
    contenedorEl.appendChild(lista);
}
