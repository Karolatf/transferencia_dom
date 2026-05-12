// MÓDULO: router.js
// Router SPA basado en hash — controla qué sección es visible dentro de cada vista de rol

const _rutas = {};
let _escuchando = false;

export function registrarRutas(mapa) {
    Object.assign(_rutas, mapa);
}

export function navegarA(hash) {
    if (window.location.hash !== '#' + hash) {
        window.location.hash = hash;
    } else {
        _despachar();
    }
}

export function iniciarRouter() {
    if (!_escuchando) {
        window.addEventListener('hashchange', _despachar);
        _escuchando = true;
    }
}

export function limpiarHashActual() {
    history.replaceState(null, '', window.location.pathname);
}

function _despachar() {
    const hash = window.location.hash.slice(1);
    const fn = _rutas[hash];
    if (typeof fn === 'function') fn();
}
