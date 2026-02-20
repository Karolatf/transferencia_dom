// CONFIGURACIÓN INICIAL Y CONSTANTES

// Este módulo centraliza todas las constantes de configuración de la aplicación
// Al tenerlas aquí, si necesitamos cambiar algo (como el puerto del servidor), solo lo cambiamos en un lugar y afecta a toda la aplicación

// URL base del servidor JSON (json-server)
// Este servidor simula una API REST y debe estar corriendo en el puerto 3000
// Se usa 'export' para que otros módulos puedan importar esta constante
export const API_BASE_URL = 'http://localhost:3000';