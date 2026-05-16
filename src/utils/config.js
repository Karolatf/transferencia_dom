// Archivo: utils/config.js
// Este archivo guarda la dirección del servidor backend y el prefijo común de todos los endpoints.
// Si el servidor cambia de puerto o de dirección, solo hay que editar este archivo.

// Exportamos la constante llamada API_BASE_URL y le asignamos la dirección del servidor local en el puerto 3000
export const API_BASE_URL = 'http://localhost:3000';

// Exportamos la constante llamada API_PREFIX con el prefijo que comparten todos los endpoints del backend
export const API_PREFIX   = '/api';
