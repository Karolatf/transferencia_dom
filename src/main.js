// MÓDULO: main.js
// Punto de entrada. Inicializa la aplicación.

import { registrarEventListeners } from './services/tareasService.js';
import { mostrarEstadoVacio }      from './ui/tareasUI.js';
import { activarModoInicio }       from './ui/modoUI.js';
import { API_BASE_URL }            from './utils/config.js';

document.addEventListener('DOMContentLoaded', function () {
    console.log('Sistema de Gestión de Tareas — SENA');
    console.log('Backend esperado en:', API_BASE_URL);

    activarModoInicio();
    registrarEventListeners();
    mostrarEstadoVacio();

    console.log('Aplicación lista.');
});
