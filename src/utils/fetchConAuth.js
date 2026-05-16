// Archivo: utils/fetchConAuth.js
// Este archivo contiene la función principal para hacer peticiones HTTP al backend.
// Es un "envoltorio" de la función nativa fetch() del navegador que agrega automáticamente
// el token de autenticación (JWT) en cada petición.
//
// Si el servidor responde con el código 401 (token expirado), este archivo:
//   1. Pide automáticamente un nuevo token de acceso usando el token de renovación.
//   2. Guarda el nuevo token en el navegador.
//   3. Reintenta la petición original con el nuevo token.
// Todo esto ocurre de forma invisible para el usuario — se llama "Silent Refresh".

// Importamos la función que llama al backend para renovar el token de acceso
import { renovarToken }         from '../api/authApi.js';

// Importamos las funciones de sesion.js para leer y actualizar los tokens del navegador
import {
    obtenerAccessToken,     // lee el token de acceso del navegador
    obtenerRefreshToken,    // lee el token de renovación del navegador
    actualizarAccessToken,  // guarda el nuevo token de acceso en el navegador
    cerrarSesion,           // borra todos los datos de sesión del navegador
}                               from './sesion.js';

// Importamos la función que muestra la pantalla de login cuando la sesión expira
import { activarModoInicio }    from '../ui/modoUI.js';

// Importamos la función que muestra mensajes emergentes (toasts) al usuario
import { mostrarNotificacion }  from './notificaciones.js';

// Variable que indica si ya hay una renovación de token en curso
// Evita que varias peticiones fallidas con 401 lancen múltiples llamadas simultáneas al servidor
let _refrescando      = false;

// Arreglo (cola) que guarda las peticiones que llegaron mientras ya había una renovación en curso
// Se resuelven todas juntas con el nuevo token cuando la renovación termina
let _esperandoRefresh = [];

// Exportamos la función fetchConAuth que tiene exactamente la misma forma de uso que fetch() del navegador
// Recibe la URL del endpoint y un objeto opcional con las opciones de la petición (método, body, etc.)
export async function fetchConAuth(url, opciones = {}) {
    // Leemos el token de acceso guardado en el navegador (lo guardó sesion.js al hacer login)
    const token = obtenerAccessToken();

    // Construimos el objeto de opciones combinando los del llamador con los headers de autenticación
    const opcionesConAuth = {
        // Copiamos todas las opciones que el llamador pasó (método HTTP, body, etc.)
        ...opciones,
        headers: {
            // Este encabezado le dice al backend que el cuerpo de la petición está en formato JSON
            'Content-Type': 'application/json',
            // Copiamos cualquier encabezado adicional que el llamador haya incluido
            ...opciones.headers,
            // Agregamos el encabezado de autorización solo si hay un token disponible
            // El formato "Bearer TOKEN" es el estándar para enviar tokens JWT en HTTP
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };

    // Ejecutamos la petición al backend con todos los encabezados construidos
    const respuesta = await fetch(url, opcionesConAuth);

    // Si el servidor respondió con cualquier código diferente a 401, retornamos la respuesta directamente
    // (200 OK, 400 Error, 404 No encontrado, 500 Error del servidor, etc.)
    if (respuesta.status !== 401) return respuesta;

    // ── RENOVACIÓN AUTOMÁTICA DE TOKEN (SILENT REFRESH) ───────────────────────
    // Solo llegamos aquí si el servidor respondió con 401, lo que significa que el token de acceso expiró

    // Si ya hay otra renovación en curso, ponemos esta petición en la cola de espera
    // y retornamos una promesa que se resolverá cuando la renovación termine
    if (_refrescando) {
        return new Promise((resolve, reject) => {
            // Guardamos la promesa y los datos de la petición para reintentarla con el nuevo token
            _esperandoRefresh.push({ resolve, reject, url, opciones });
        });
    }

    // Marcamos que hay una renovación en curso para que las siguientes peticiones esperen
    _refrescando = true;

    // Leemos el token de renovación del navegador (tiene una duración de 7 días)
    const refreshToken = obtenerRefreshToken();

    // Si no hay token de renovación, no podemos recuperar la sesión — el usuario debe hacer login de nuevo
    if (!refreshToken) {
        // Liberamos el indicador de renovación antes de salir
        _refrescando = false;
        // Cerramos la sesión y redirigimos al login
        _cerrarSesionYRedirigir();
        // Retornamos la respuesta 401 original
        return respuesta;
    }

    try {
        // Llamamos al endpoint del backend para obtener un nuevo token de acceso
        // Esta llamada usa fetch() directamente (no fetchConAuth) para evitar un bucle infinito
        const { accessToken: nuevoToken } = await renovarToken(refreshToken);

        // Guardamos el nuevo token de acceso en el navegador para las próximas peticiones
        actualizarAccessToken(nuevoToken);

        // Resolvemos todas las peticiones que estaban esperando en la cola,
        // reintentándolas ahora con el nuevo token guardado en el navegador
        _esperandoRefresh.forEach(({ resolve, url: u, opciones: o }) => {
            resolve(fetchConAuth(u, o));
        });
        // Vaciamos la cola después de resolver todas las peticiones
        _esperandoRefresh = [];

        // Reintentamos la petición original que disparó la renovación, ahora con el nuevo token
        return fetchConAuth(url, opciones);

    } catch (_error) {
        // La renovación falló — el token de renovación también expiró o el servidor rechazó la petición
        // No hay más opciones: el usuario debe hacer login de nuevo

        // Rechazamos todas las peticiones que estaban en la cola con un mensaje de error
        _esperandoRefresh.forEach(({ reject }) => reject(new Error('Sesión expirada')));
        // Vaciamos la cola después de rechazarlas todas
        _esperandoRefresh = [];

        // Cerramos la sesión completamente y redirigimos al login
        _cerrarSesionYRedirigir();

        // Retornamos la respuesta 401 original
        return respuesta;

    } finally {
        // El bloque finally se ejecuta siempre, haya error o no
        // Liberamos el indicador de renovación para que futuras peticiones no queden bloqueadas
        _refrescando = false;
    }
}

// Función privada del módulo que cierra la sesión del usuario y lo lleva a la pantalla de login
// El guion bajo al inicio del nombre indica que esta función no debe usarse fuera de este archivo
function _cerrarSesionYRedirigir() {
    // Borramos el token de acceso y el token de renovación del navegador
    cerrarSesion();
    // Mostramos un mensaje informativo avisando que la sesión expiró
    mostrarNotificacion('Tu sesión expiró. Por favor inicia sesión de nuevo.', 'advertencia');
    // Mostramos la pantalla de login ocultando los paneles del sistema
    activarModoInicio();
}
