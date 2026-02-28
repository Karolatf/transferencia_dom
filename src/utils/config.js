// MÓDULO: utils/config.js
// CAPA:   Utils (Funciones reutilizables e independientes)

// Responsabilidad ÚNICA: centralizar todas las constantes de
// configuración de la aplicación en un único lugar.

// Al tener la configuración aquí, si el puerto del servidor cambia
// (por ejemplo, de 3000 a 4000), solo debemos editar ESTE archivo
// y el cambio se propaga automáticamente a todos los módulos que
// importen API_BASE_URL.

// Dependencias de este módulo: NINGUNA
// (es el módulo de nivel más bajo de la jerarquía)

// URL base del servidor JSON (json-server)
// Este servidor simula una API REST y debe estar corriendo en el puerto 3000.
// Usamos 'export' para que cualquier módulo pueda importar esta constante.
export const API_BASE_URL = 'http://localhost:3000';