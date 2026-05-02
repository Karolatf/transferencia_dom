// Importaciones
import { initRouter } from './router/router.js'

// Eventos
window.addEventListener("hashchange", initRouter);
window.addEventListener("DOMContentLoaded", initRouter);