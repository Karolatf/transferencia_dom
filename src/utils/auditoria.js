// MÓDULO: utils/auditoria.js
// CAPA: Utils — registro de auditoría en memoria

const eventos = [];
const MAXIMO_EVENTOS = 50;

const COLORES_POR_TIPO = {
    login:             'var(--color-completada)',
    tarea_creada:      'var(--color-admin)',
    tarea_eliminada:   'var(--color-error)',
    usuario_eliminado: 'var(--color-error)',
    rol_cambiado:      'var(--color-aprobacion)',
    logout:            'var(--texto-claro)',
};

export function registrarEvento(tipo, descripcion) {
    if (eventos.length >= MAXIMO_EVENTOS) eventos.shift();
    eventos.push({ tipo, descripcion, ts: Date.now() });
}

export function obtenerEventos() {
    return eventos.slice();
}

function calcularTiempoRelativo(ts) {
    const dif      = Date.now() - ts;
    const segundos = Math.floor(dif / 1000);
    const minutos  = Math.floor(dif / 60000);
    const horas    = Math.floor(dif / 3600000);
    if (horas > 0)   return `hace ${horas} h`;
    if (minutos > 0) return `hace ${minutos} min`;
    return `hace ${segundos} seg`;
}

export function renderizarAuditoria(contenedorEl) {
    while (contenedorEl.firstChild) contenedorEl.removeChild(contenedorEl.firstChild);
    if (eventos.length === 0) {
        const p = document.createElement('p');
        p.className   = 'auditoria__vacio';
        p.textContent = 'Sin actividad registrada';
        contenedorEl.appendChild(p);
        return;
    }
    const lista = document.createElement('ul');
    lista.className = 'auditoria__lista';
    eventos.slice().reverse().forEach(function(ev) {
        const item = document.createElement('li');
        item.className = 'auditoria__item';
        const punto = document.createElement('span');
        punto.className = 'auditoria__punto';
        punto.style.backgroundColor = COLORES_POR_TIPO[ev.tipo] || 'var(--texto-claro)';
        item.appendChild(punto);
        const contenido = document.createElement('span');
        contenido.className = 'auditoria__contenido';
        const desc = document.createElement('span');
        desc.className   = 'auditoria__descripcion';
        desc.textContent = ev.descripcion;
        contenido.appendChild(desc);
        const tiempo = document.createElement('span');
        tiempo.className   = 'auditoria__tiempo';
        tiempo.textContent = calcularTiempoRelativo(ev.ts);
        contenido.appendChild(tiempo);
        item.appendChild(contenido);
        lista.appendChild(item);
    });
    contenedorEl.appendChild(lista);
}