// Archivo: router.js
// Este archivo implementa el sistema de navegación de la aplicación SPA (Single Page Application).
// En lugar de cargar páginas nuevas, la navegación cambia el fragmento (#) al final de la URL,
// por ejemplo: http://localhost/#admin/usuarios
// Cada fragmento tiene una función asociada (handler) que actualiza el contenido de la pantalla.

// Mapa donde guardamos todas las rutas registradas: { 'ruta': funcionHandler }
const _rutas     = new Map();
// Guardamos la ruta que está activa en este momento
let _hashActual  = null;
// Guardamos la ruta desde la cual llegamos a la ruta actual (ruta anterior)
let _hashAnterior = null;
// Variable que indica si ya estamos escuchando el evento de cambio de hash
let _escuchando  = false;

// Función privada que busca el handler de una ruta dada
// Primero busca coincidencia exacta y, si no la hay, busca por prefijo (para rutas con ID al final)
function _resolverHandler(hash) {
    // Intentamos encontrar un handler con la ruta exacta
    const exacto = _rutas.get(hash);
    if (typeof exacto === 'function') return exacto;
    // Si no hay coincidencia exacta, buscamos una ruta cuyo texto base coincida con el inicio del hash
    // Esto permite rutas con ID al final como "admin/tareas/ver-tarea/42"
    for (const [ruta, handler] of _rutas) {
        if (hash.startsWith(ruta + '/')) return handler;
    }
    // Si no encontramos ningún handler, retornamos null
    return null;
}

// Función privada que se ejecuta cada vez que cambia el hash de la URL
// Lee el hash actual, guarda el anterior, busca el handler y lo ejecuta
function _despachar() {
    // Leemos el hash actual de la URL (sin el símbolo #) o cadena vacía si no hay hash
    const hash = window.location.hash.slice(1) || '';

    // Guardamos la ruta anterior antes de actualizarla
    _hashAnterior = _hashActual;
    // Actualizamos la ruta actual con la nueva
    _hashActual   = hash;

    // Buscamos la función asociada a esta ruta
    const handler = _resolverHandler(hash);

    // Si no hay ningún handler registrado para esta ruta, avisamos en consola y salimos
    if (typeof handler !== 'function') {
        if (hash) console.warn(`[Router] Ruta no registrada: "${hash}"`);
        return;
    }

    // Ejecutamos el handler dentro de un try/catch para que un error en una ruta
    // no rompa la navegación del resto de la aplicación
    try {
        handler();
    } catch (err) {
        console.error(`[Router] Error en ruta "${hash}":`, err);
    }
}

// Función privada para forzar la ejecución del handler de la ruta actual
// Se usa cuando el hash ya es el mismo y el usuario quiere actualizar la vista de todas formas
function _despacharForzado() {
    const hash    = window.location.hash.slice(1) || '';
    _hashAnterior = _hashActual;
    _hashActual   = hash;

    const handler = _resolverHandler(hash);
    if (typeof handler === 'function') {
        try { handler(); } catch (err) { console.error(`[Router] Error en ruta "${hash}":`, err); }
    }
}

// Exportamos la función registrarRuta para agregar una sola ruta al mapa del router
// Recibe el nombre del hash (sin #) y la función que debe ejecutarse al navegar ahí
export function registrarRuta(hash, handler) {
    _rutas.set(hash, handler);
}

// Exportamos la función registrarRutas para agregar múltiples rutas al mismo tiempo
// Recibe un objeto donde cada clave es el hash y cada valor es la función handler
export function registrarRutas(mapa) {
    for (const [hash, handler] of Object.entries(mapa)) {
        _rutas.set(hash, handler);
    }
}

// Exportamos la función ir que navega a una ruta cambiando el hash de la URL
// Si la ruta destino ya está activa, fuerza la re-ejecución del handler
export function ir(hash) {
    if (window.location.hash !== '#' + hash) {
        // Cambiamos el hash — esto dispara el evento hashchange y ejecuta _despachar
        window.location.hash = hash;
    } else {
        // El hash ya es el mismo — ejecutamos el handler directamente sin esperar el evento
        _despacharForzado();
    }
}

// Exportamos navegarA como un alias de ir() para mantener compatibilidad con código existente
export const navegarA = ir;

// Exportamos irAModal para abrir un modal navegando a su hash
// Es un alias semántico de ir() — el comportamiento es idéntico
export function irAModal(hashModal) {
    ir(hashModal);
}

// Exportamos volverDeModal para cerrar un modal y regresar a la ruta anterior
// Si no hay ruta anterior, simplemente limpia el hash de la URL
export function volverDeModal() {
    if (_hashAnterior && _hashAnterior !== '') {
        // Navegamos de vuelta a la ruta desde donde se abrió el modal
        ir(_hashAnterior);
    } else {
        // No hay ruta anterior — limpiamos el hash sin agregar entrada al historial
        limpiarHashActual();
        _hashActual = null;
    }
}

// Exportamos rutaActual para consultar desde cualquier parte cuál es la ruta activa ahora mismo
export function rutaActual()   { return _hashActual;    }

// Exportamos rutaAnterior para consultar desde cualquier parte la ruta que estaba activa antes
export function rutaAnterior() { return _hashAnterior;  }

// Exportamos iniciarRouter que arranca el router escuchando los cambios de hash
// También despacha la ruta que ya esté en la URL al momento de cargar la página
export function iniciarRouter() {
    if (!_escuchando) {
        // Registramos el listener que ejecuta _despachar cada vez que el hash cambia
        window.addEventListener('hashchange', _despachar);
        // Marcamos que ya estamos escuchando para no registrar el listener dos veces
        _escuchando = true;
    }
    // Si la URL ya tiene un hash al cargar (el usuario llegó con un enlace directo), lo ejecutamos
    const hashInicial = window.location.hash.slice(1);
    if (hashInicial) _despacharForzado();
}

// Exportamos limpiarHashActual que elimina el hash de la URL sin agregar entrada al historial
// Se usa al cerrar modales o limpiar la navegación sin efecto de "botón atrás"
export function limpiarHashActual() {
    history.replaceState(null, '', window.location.pathname);
}

// Exportamos resetearEstadoRouter que restablece el estado del router al hacer logout
// Limpia las rutas memorizadas para que no apunten a pantallas de la sesión anterior
export function resetearEstadoRouter() {
    _hashActual   = null;
    _hashAnterior = null;
    limpiarHashActual();
}
