// Archivo: main.js
// Este es el punto de entrada de la aplicación — el primer archivo que se ejecuta.
// Se encarga de verificar si hay una sesión guardada en el navegador y, según el rol
// del usuario, muestra el panel correspondiente (admin, instructor o estudiante).

// Importamos la función que registra todos los eventos de las acciones de tareas del estudiante
import { registrarEventListeners }          from './services/tareasService.js';
// Importamos la función que muestra el mensaje de "no hay tareas" cuando la lista está vacía
import { mostrarEstadoVacio }               from './ui/tareasUI.js';
// Importamos las cuatro funciones que activan el modo visual según el rol del usuario
import { activarModoInicio, activarModoAdmin, activarModoUsuario, activarModoInstructor } from './ui/modoUI.js';
// Importamos la dirección base del servidor backend
import { API_BASE_URL }                     from './utils/config.js';
// Importamos las funciones para manejar la sesión guardada en el navegador
import {
    haySesionActiva,        // verifica si hay un token de acceso guardado
    obtenerUsuarioSesion,   // lee los datos del usuario (nombre, rol, id) del navegador
    obtenerRefreshToken,    // lee el token de renovación del navegador
    actualizarAccessToken,  // guarda el nuevo token de acceso en el navegador
    cerrarSesion,           // borra todos los datos de sesión del navegador
} from './utils/sesion.js';
// Importamos la función que llama al backend para validar y renovar el token de acceso
import { renovarToken } from './api/authApi.js';

// Esperamos a que el HTML termine de cargarse completamente antes de ejecutar el código
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Sistema de Gestión de Tareas — SENA');
    console.log('Backend esperado en:', API_BASE_URL);

    // Registramos todos los botones y acciones de la vista del estudiante
    registrarEventListeners();

    // Comprobamos si el navegador tiene una sesión guardada (hay un token de acceso en localStorage)
    if (haySesionActiva()) {
        // Aunque haya un token guardado, debemos verificar con el servidor que siga siendo válido
        // (podría haber expirado o el servidor podría haberse reiniciado desde la última sesión)
        let sesionValida = false;
        // Leemos el token de renovación del navegador
        const refreshToken = obtenerRefreshToken();

        if (refreshToken) {
            try {
                // Llamamos al servidor para renovar el token — si el token de renovación es válido,
                // el servidor responde con un nuevo token de acceso
                const { accessToken } = await renovarToken(refreshToken);
                // Guardamos el nuevo token de acceso en el navegador
                actualizarAccessToken(accessToken);
                // Marcamos que la sesión es válida para continuar
                sesionValida = true;
            } catch {
                // El servidor rechazó el token (expirado, servidor reiniciado, etc.)
                // Cerramos la sesión guardada para que el usuario deba hacer login de nuevo
                cerrarSesion();
            }
        } else {
            // No hay token de renovación — cerramos la sesión corrupta
            cerrarSesion();
        }

        if (sesionValida) {
            // Leemos los datos del usuario guardados en el navegador (nombre, rol, id, etc.)
            const usuario = obtenerUsuarioSesion();
            // Según el rol del usuario, mostramos el panel correspondiente
            if (usuario && usuario.role === 'admin') {
                // El usuario es administrador — mostramos el panel de administración
                activarModoAdmin();
            } else if (usuario && usuario.role === 'instructor') {
                // El usuario es instructor — mostramos el panel del instructor
                activarModoInstructor();
            } else if (usuario) {
                // El usuario es estudiante — mostramos el panel del estudiante
                activarModoUsuario();
                // Mostramos el mensaje de estado vacío mientras cargan las tareas
                mostrarEstadoVacio();
            } else {
                // El token fue válido pero los datos del usuario están corruptos
                // Cerramos la sesión y mostramos la pantalla de login
                cerrarSesion();
                activarModoInicio();
                mostrarEstadoVacio();
            }
        } else {
            // La sesión expiró o es inválida — mostramos la pantalla de login
            activarModoInicio();
            mostrarEstadoVacio();
        }
    } else {
        // No hay ninguna sesión guardada en el navegador — mostramos la pantalla de login
        activarModoInicio();
        mostrarEstadoVacio();
    }

    console.log('Aplicación lista.');

    // Inicializamos los íconos de Lucide que se usan en todo el HTML
    // lucide.createIcons() busca todos los elementos <i data-lucide="nombre"> y los convierte en SVG
    if (window.lucide) window.lucide.createIcons();
});
