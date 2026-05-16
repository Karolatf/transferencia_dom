// MÓDULO: main.js
// Punto de entrada. Inicializa la aplicación.

import { registrarEventListeners }          from './services/tareasService.js';
import { mostrarEstadoVacio }               from './ui/tareasUI.js';
import { activarModoInicio, activarModoAdmin, activarModoUsuario, activarModoInstructor } from './ui/modoUI.js';
import { API_BASE_URL }                     from './utils/config.js';
import {
    haySesionActiva,
    obtenerUsuarioSesion,
    obtenerRefreshToken,
    actualizarAccessToken,
    cerrarSesion,
} from './utils/sesion.js';
import { renovarToken } from './api/authApi.js';

document.addEventListener('DOMContentLoaded', async function () {
    console.log('Sistema de Gestión de Tareas — SENA');
    console.log('Backend esperado en:', API_BASE_URL);

    registrarEventListeners();

    if (haySesionActiva()) {
        // Verificar con el backend si la sesión sigue vigente antes de auto-login.
        // Usamos renovarToken: si el refreshToken es válido el backend responde con
        // un nuevo accessToken; si expiró o el servidor se reinició, lanza error.
        let sesionValida = false;
        const refreshToken = obtenerRefreshToken();

        if (refreshToken) {
            try {
                const { accessToken } = await renovarToken(refreshToken);
                actualizarAccessToken(accessToken);
                sesionValida = true;
            } catch {
                // El backend rechazó el token (expirado, servidor reiniciado, etc.)
                cerrarSesion();
            }
        } else {
            cerrarSesion();
        }

        if (sesionValida) {
            const usuario = obtenerUsuarioSesion();
            if (usuario && usuario.role === 'admin') {
                activarModoAdmin();
            } else if (usuario && usuario.role === 'instructor') {
                activarModoInstructor();
            } else if (usuario) {
                activarModoUsuario();
                mostrarEstadoVacio();
            } else {
                // Token válido pero datos del usuario corruptos
                cerrarSesion();
                activarModoInicio();
                mostrarEstadoVacio();
            }
        } else {
            // Sesión inválida o expirada → login
            activarModoInicio();
            mostrarEstadoVacio();
        }
    } else {
        // No hay sesión guardada → mostrar el formulario de login
        activarModoInicio();
        mostrarEstadoVacio();
    }

    console.log('Aplicación lista.');

    if (window.lucide) window.lucide.createIcons();
});