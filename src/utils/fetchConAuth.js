// MÓDULO: utils/fetchConAuth.js
// CAPA: Utils
//
// Responsabilidad única: realizar peticiones HTTP autenticadas con JWT.
//
// Si el servidor responde 401 (token expirado), este módulo:
//   1. Pide automáticamente un nuevo accessToken usando el refreshToken.
//   2. Guarda el nuevo accessToken en localStorage.
//   3. Reintenta la petición original con el nuevo token.
// Todo esto sin que el usuario note ninguna interrupción. Se llama "Silent Refresh".
//
// USO en tareasApi.js o usuariosApi.js:
//   import { fetchConAuth } from '../utils/fetchConAuth.js';
//   const response = await fetchConAuth(url, { method: 'GET' });
//
// fetchConAuth tiene exactamente la misma firma que el fetch() nativo.

// renovarToken llama a POST /api/auth/refresh en el backend para obtener un nuevo accessToken
// Es la única función que NO usa fetchConAuth — la llama directamente con fetch para evitar
// un bucle infinito (fetchConAuth llama a renovarToken que llama a fetchConAuth...)
import { renovarToken }         from '../api/authApi.js';

// obtenerAccessToken lee el accessToken del localStorage (guardado por guardarSesion)
// obtenerRefreshToken lee el refreshToken del localStorage (token de larga duración)
// actualizarAccessToken guarda el nuevo accessToken después del Silent Refresh
// cerrarSesion elimina ambos tokens del localStorage al expirar la sesión
import {
    obtenerAccessToken,
    obtenerRefreshToken,
    actualizarAccessToken,
    cerrarSesion,
}                               from './sesion.js';

// activarModoInicio redirige al usuario a la pantalla de login después de cerrar sesión
import { activarModoInicio }    from '../ui/modoUI.js';

// mostrarNotificacion muestra el toast de "sesión expirada" al usuario
import { mostrarNotificacion }  from './notificaciones.js';

// _refrescando — flag booleano que indica si ya hay un Silent Refresh en curso
// Evita que múltiples peticiones que fallen con 401 al mismo tiempo
// lancen múltiples llamadas simultáneas al endpoint de refresh
let _refrescando      = false;

// _esperandoRefresh — cola de peticiones que llegaron con 401 mientras ya había
// un refresh en curso. Se resuelven todas con el nuevo token una vez que termina
let _esperandoRefresh = [];

// fetchConAuth — wrapper de fetch que agrega el token JWT automáticamente
// y maneja el Silent Refresh cuando el accessToken expira
//
// Parámetros:
//   url      — URL completa del endpoint (ej: http://localhost:3000/api/tasks)
//   opciones — mismo objeto de opciones que fetch() nativo (method, body, headers…)
//
// Retorna: Promise<Response> — la respuesta del servidor, igual que fetch nativo
export async function fetchConAuth(url, opciones = {}) {
    // Leer el accessToken del localStorage — lo guarda sesion.js después del login
    const token = obtenerAccessToken();

    // Construir el objeto de opciones combinando las del llamador con los headers de auth
    // El spread operator (...) copia todas las propiedades sin mutar el objeto original
    const opcionesConAuth = {
        // Copiar todas las opciones del llamador (method, body, cache, etc.)
        ...opciones,
        headers: {
            // Content-Type: application/json es necesario para que el backend
            // interprete el body como JSON en peticiones POST, PUT y PATCH
            'Content-Type': 'application/json',
            // Copiar headers adicionales que el llamador pudo haber pasado
            // (ej: headers personalizados de alguna petición específica)
            ...opciones.headers,
            // Agregar el header Authorization solo si hay un token disponible
            // Si no hay token (usuario no logueado) el header no se agrega
            // El formato "Bearer TOKEN" es el estándar RFC 6750 para JWT en HTTP
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };

    // Ejecutar la petición al backend con todos los headers construidos
    const respuesta = await fetch(url, opcionesConAuth);

    // Si el servidor respondió con cualquier código diferente a 401
    // (200 OK, 400 Bad Request, 404 Not Found, 500 Server Error, etc.)
    // retornamos la respuesta directamente sin intentar el Silent Refresh
    if (respuesta.status !== 401) return respuesta;

    // ── SILENT REFRESH ────────────────────────────────────────────────────────
    // Solo llegamos aquí si el servidor respondió 401 Unauthorized
    // Esto significa que el accessToken expiró (duración: 1h configurada en .env)

    // Si ya hay otro refresh en curso, agregar esta petición a la cola de espera
    // y retornar una Promise que se resolverá cuando el refresh termine
    // Esto evita lanzar múltiples llamadas a POST /api/auth/refresh simultáneas
    if (_refrescando) {
        return new Promise((resolve, reject) => {
            // Guardamos resolve, reject y los datos de la petición original
            // para poder reintentarla con el nuevo token cuando el refresh termine
            _esperandoRefresh.push({ resolve, reject, url, opciones });
        });
    }

    // Marcar que hay un refresh en curso para que las demás peticiones esperen
    _refrescando = true;

    // Leer el refreshToken del localStorage — token de larga duración (7 días)
    // Se usa exclusivamente para obtener un nuevo accessToken, no para otras peticiones
    const refreshToken = obtenerRefreshToken();

    // Si no hay refreshToken guardado, no hay forma de renovar la sesión
    // Esto pasa cuando el usuario cerró sesión manualmente o el refreshToken también expiró
    if (!refreshToken) {
        // Liberar el flag antes de salir para no bloquear futuras peticiones
        _refrescando = false;
        // Cerrar sesión y redirigir al login — el usuario debe autenticarse de nuevo
        _cerrarSesionYRedirigir();
        // Retornar la respuesta 401 original para que el llamador pueda manejarla
        return respuesta;
    }

    try {
        // Llamar al endpoint de refresh: POST /api/auth/refresh con el refreshToken
        // renovarToken usa fetch directamente (no fetchConAuth) para evitar bucle infinito
        // Si el refreshToken es válido, el backend responde con un nuevo accessToken
        const { accessToken: nuevoToken } = await renovarToken(refreshToken);

        // Guardar el nuevo accessToken en localStorage para las próximas peticiones
        // actualizarAccessToken solo actualiza el accessToken, el refreshToken no cambia
        actualizarAccessToken(nuevoToken);

        // Resolver todas las peticiones que estaban esperando en la cola
        // Cada una se reintenta ahora con el nuevo token guardado en localStorage
        _esperandoRefresh.forEach(({ resolve, url: u, opciones: o }) => {
            // Al llamar fetchConAuth de nuevo, obtenerAccessToken ya retorna el nuevo token
            resolve(fetchConAuth(u, o));
        });
        // Vaciar la cola después de resolver todas las peticiones en espera
        _esperandoRefresh = [];

        // Reintentar la petición original que disparó el Silent Refresh
        // Esta vez fetchConAuth leerá el nuevo accessToken del localStorage
        return fetchConAuth(url, opciones);

    } catch (_error) {
        // El refresh también falló — el refreshToken expiró o el backend rechazó la petición
        // En este caso no hay nada más que hacer — el usuario debe hacer login de nuevo

        // Rechazar todas las peticiones en cola con un error descriptivo
        _esperandoRefresh.forEach(({ reject }) => reject(new Error('Sesión expirada')));
        // Vaciar la cola después de rechazar todas
        _esperandoRefresh = [];

        // Cerrar sesión completa y redirigir al login
        _cerrarSesionYRedirigir();

        // Retornar la respuesta 401 original
        return respuesta;

    } finally {
        // El bloque finally se ejecuta SIEMPRE, haya error o no
        // Liberar el flag _refrescando para que futuras peticiones no queden bloqueadas
        _refrescando = false;
    }
}

// _cerrarSesionYRedirigir — limpia la sesión del usuario y lo lleva al login
// Se llama cuando el refreshToken también expiró y no hay forma de renovar la sesión
// El guión bajo al inicio indica que es una función privada de este módulo
function _cerrarSesionYRedirigir() {
    // cerrarSesion elimina accessToken y refreshToken del localStorage
    cerrarSesion();
    // Mostrar un toast informativo antes de redirigir al login
    mostrarNotificacion('Tu sesión expiró. Por favor inicia sesión de nuevo.', 'advertencia');
    // activarModoInicio muestra la pantalla de login ocultando los paneles
    activarModoInicio();
}