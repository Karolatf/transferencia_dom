// MÓDULO: utils/notificaciones.js
// CAPA:   Utils (Funciones reutilizables e independientes)

// Responsabilidad ÚNICA: mostrar mensajes visuales (toasts) al usuario
// sin interrumpir su flujo de trabajo con ventanas emergentes nativas (alert()).
//
// Al centralizar las notificaciones aquí, evitamos duplicar la lógica de
// creación de elementos visuales en cada módulo que necesite informar al usuario.
// Además, este módulo puede reutilizarse en otros proyectos institucionales
// sin ninguna modificación.
//
// Dependencias de este módulo: NINGUNA
// (solo interactúa con el DOM global, no importa otros módulos del proyecto)

// Muestra una notificación visual tipo toast en la esquina de la pantalla
// Se crea dinámicamente en el DOM y desaparece automáticamente tras 6 segundos
// Parámetros:
//   mensaje - El texto que se mostrará al usuario en la notificación (string)
//   tipo    - Categoría visual del mensaje: 'info', 'exito', 'error', etc. (string)
//             Por defecto es 'info' si no se especifica
export function mostrarNotificacion(mensaje, tipo = 'info') {

    // Buscamos si ya existe el contenedor de notificaciones en el DOM
    // Usamos getElementById para no crear múltiples contenedores en llamadas sucesivas
    let contenedor = document.getElementById('notificaciones-contenedor');
    if (!contenedor) {
        // Si no existe aún, lo creamos como un div y le asignamos su ID único
        contenedor = document.createElement('div');
        contenedor.id = 'notificaciones-contenedor';

        // Lo agregamos al body para que esté disponible como raíz de todas
        // las notificaciones futuras y el CSS pueda posicionarlo fijo en pantalla
        document.body.appendChild(contenedor);
    }

    // Creamos el elemento toast individual que contiene este mensaje
    const toast = document.createElement('div');

    // Agregamos la clase base 'notificacion' para estilos comunes (padding, sombra, etc.)
    // y la clase dinámica 'notificacion--{tipo}' para el color según la categoría
    // Ejemplo: 'notificacion--exito' aplica verde, 'notificacion--error' aplica rojo
    toast.classList.add('notificacion', `notificacion--${tipo}`);

    // Usamos textContent para insertar el mensaje de forma segura
    // evitando posibles inyecciones de HTML malicioso en la interfaz
    toast.textContent = mensaje;

    // Insertamos el toast dentro del contenedor para que sea visible al usuario
    contenedor.appendChild(toast);

    // Programamos la eliminación automática del toast después de 6000 ms (6 segundos)
    // toast.remove() lo elimina del DOM completamente, liberando memoria
    setTimeout(() => toast.remove(), 6000);
}