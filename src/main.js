// MÓDULO: main.js
// Punto de entrada. Inicializa la aplicación mostrando la pantalla de inicio.

import { registrarEventListeners } from './services/tareasService.js';
import { mostrarEstadoVacio } from './ui/tareasUi.js';
import { activarModoInicio }  from './ui/modoUI.js';
import { API_BASE_URL }       from './utils/config.js';
 
document.addEventListener('DOMContentLoaded', function () {
    console.log('Sistema de Gestion de Tareas - SENA iniciando...');
    console.log('Servidor esperado en:', API_BASE_URL);
 
    activarModoInicio();
    registrarEventListeners();
    mostrarEstadoVacio();
 
    console.log('Aplicacion lista para usar');
});