// MÓDULO: router.js
// Router SPA basado en hash.
//
// Características:
//   - registrarRuta / registrarRutas  — registrar handlers
//   - ir(hash)                        — navegar (empuja al historial)
//   - navegarA                        — alias de ir() para compatibilidad
//   - irAModal(hash)                  — alias semántico para abrir modales
//   - volverDeModal()                 — cierra modal y regresa a ruta previa
//   - rutaActual / rutaAnterior       — consultar la ruta en curso
//   - iniciarRouter()                 — arrancar el listener de hashchange
//   - limpiarHashActual()             — quitar hash de la URL sin historial
//
// Aislamiento: cada handler corre dentro de un try/catch independiente,
// así un error en una ruta no rompe el resto de la aplicación.

const _rutas     = new Map();
let _hashActual  = null;
let _hashAnterior = null;
let _escuchando  = false;

// ── Despachador interno ───────────────────────────────────────────────────────
function _despachar() {
    const hash = window.location.hash.slice(1) || '';

    _hashAnterior = _hashActual;
    _hashActual   = hash;

    const handler = _rutas.get(hash);

    if (typeof handler !== 'function') {
        if (hash) console.warn(`[Router] Ruta no registrada: "${hash}"`);
        return;
    }

    try {
        handler();
    } catch (err) {
        // Aislamiento: el error queda contenido a esta ruta
        console.error(`[Router] Error en ruta "${hash}":`, err);
    }
}

// ── Forzar despacho (misma ruta) ─────────────────────────────────────────────
function _despacharForzado() {
    const hash    = window.location.hash.slice(1) || '';
    _hashAnterior = _hashActual;
    _hashActual   = hash;

    const handler = _rutas.get(hash);
    if (typeof handler === 'function') {
        try { handler(); } catch (err) { console.error(`[Router] Error en ruta "${hash}":`, err); }
    }
}

// ── Registro de rutas ─────────────────────────────────────────────────────────
export function registrarRuta(hash, handler) {
    _rutas.set(hash, handler);
}

export function registrarRutas(mapa) {
    for (const [hash, handler] of Object.entries(mapa)) {
        _rutas.set(hash, handler);
    }
}

// ── Navegación ────────────────────────────────────────────────────────────────
export function ir(hash) {
    if (window.location.hash !== '#' + hash) {
        window.location.hash = hash;   // dispara hashchange → _despachar
    } else {
        _despacharForzado();           // mismo hash: re-ejecutar handler
    }
}

// Alias para mantener compatibilidad con el código existente
export const navegarA = ir;

// Abre un modal navegando a su hash (semántico, igual que ir())
export function irAModal(hashModal) {
    ir(hashModal);
}

// Cierra el modal actual (por hash) y regresa a la ruta previa
export function volverDeModal() {
    if (_hashAnterior && _hashAnterior !== '') {
        ir(_hashAnterior);
    } else {
        limpiarHashActual();
        _hashActual = null;
    }
}

// ── Consulta de estado ────────────────────────────────────────────────────────
export function rutaActual()   { return _hashActual;    }
export function rutaAnterior() { return _hashAnterior;  }

// ── Ciclo de vida ─────────────────────────────────────────────────────────────
export function iniciarRouter() {
    if (!_escuchando) {
        window.addEventListener('hashchange', _despachar);
        _escuchando = true;
    }
    // Despachar la ruta que ya esté en la URL al cargar la página
    const hashInicial = window.location.hash.slice(1);
    if (hashInicial) _despacharForzado();
}

export function limpiarHashActual() {
    history.replaceState(null, '', window.location.pathname);
}

// Resetea el estado del router entre sesiones — llamar al hacer logout
// para que _hashAnterior no apunte a rutas de la sesión anterior.
export function resetearEstadoRouter() {
    _hashActual   = null;
    _hashAnterior = null;
    limpiarHashActual();
}
