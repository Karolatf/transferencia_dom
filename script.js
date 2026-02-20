// Autores: Karol Nicolle Torres Fuentes, Juan Sebastian Patiño Hernandez
// Fecha: 19-02-26
// Institución: SENA - Técnico en Programación de Software

// PUNTO DE ENTRADA PRINCIPAL DE LA APLICACIÓN

// Este es el archivo de arranque del Sistema de Gestión de Tareas
// Es el único archivo que debe ser referenciado directamente desde el HTML
// y se encarga de inicializar todo lo que la aplicación necesita para funcionar
// Gracias al archivo barril, todos los imports se hacen desde un único lugar

// Importamos la URL del servidor para mostrarla en la consola al iniciar
// Viene del módulo de configuración a través del barril
import { API_BASE_URL } from './modulos/barril.js';

// Importamos la función que conecta todos los elementos del DOM con sus handlers
// Viene del módulo de eventos a través del barril
import { registerEventListeners } from './modulos/barril.js';

// Importamos la función que muestra el mensaje inicial de "no hay tareas"
// Viene del módulo de UI a través del barril
import { showEmptyState } from './modulos/barril.js';

// Escuchamos el evento 'DOMContentLoaded' del documento
// Este evento se dispara cuando el HTML fue completamente analizado y el DOM está listo
// Es importante esperar este evento antes de manipular el DOM o registrar eventos,
// ya que si intentamos acceder a elementos antes de que existan, obtendremos null
document.addEventListener('DOMContentLoaded', function () {
    // ----- MENSAJES DE INICIO EN CONSOLA -----
    // Confirmamos en consola que el DOM está listo y la app inicia correctamente
    console.log('DOM completamente cargado');
    console.log('Sistema de Gestión de Tareas iniciado');
    // Mostramos la URL del servidor para verificar que la configuración es correcta
    console.log('Servidor esperado en:', API_BASE_URL);

    // ----- REGISTRAR TODOS LOS EVENT LISTENERS -----
    // Llamamos a la función que conecta cada elemento del DOM con su handler correspondiente
    // Esto debe hacerse aquí (dentro de DOMContentLoaded) para garantizar que todos
    // los elementos del HTML ya existen en el DOM antes de intentar añadirles eventos
    registerEventListeners();

    // ----- INICIALIZAR EL ESTADO VACÍO -----
    // Mostramos el mensaje de "no hay tareas" al iniciar la aplicación
    // Así el usuario ve feedback inmediato de que la tabla existe pero está vacía
    showEmptyState();

    // Confirmamos en consola que la inicialización fue exitosa
    console.log('Event listeners registrados correctamente');
    console.log('Aplicación lista para usar');
});