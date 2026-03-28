// MÓDULO: utils/config.js
// CAPA:   Utils (Funciones reutilizables e independientes)

// Responsabilidad ÚNICA: centralizar todas las constantes de
// configuración de la aplicación en un único lugar.

// Al tener la configuración aquí, si el puerto del servidor cambia
// (por ejemplo, de 3000 a 4000), solo debemos editar ESTE archivo
// y el cambio se propaga automáticamente a todos los módulos que
// importen estas constantes.

// Dependencias de este módulo: NINGUNA
// (es el módulo de nivel más bajo de la jerarquía)

// URL base del servidor Express (backend real con MySQL).
// Este servidor debe estar corriendo en el puerto 3000.
export const API_BASE_URL = 'http://localhost:3000';

// Prefijo de todas las rutas del backend Express.
// El backend registra sus rutas como /api/users y /api/tasks en app.js.
// Centralizarlo aquí evita repetir '/api' en cada archivo de la capa api/.
// Si el backend cambia su prefijo en el futuro, solo se edita esta línea.
export const API_PREFIX = '/api';