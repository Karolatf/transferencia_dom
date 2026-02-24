// MÓDULO: utils/notificaciones.js
// CAPA: Utils
// Responsabilidad: mostrar mensajes visuales al usuario sin usar alert()
// No depende de la API ni de otros servicios

export function mostrarNotificacion(mensaje, tipo = 'info') {

    // Buscamos si ya existe el contenedor de notificaciones en el DOM
    // Si no existe lo creamos y lo agregamos al body
    let contenedor = document.getElementById('notificaciones-contenedor');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'notificaciones-contenedor';
        document.body.appendChild(contenedor);
    }

    // Creamos el elemento toast con el mensaje y el tipo recibido
    const toast = document.createElement('div');
    toast.classList.add('notificacion', `notificacion--${tipo}`);
    toast.textContent = mensaje;

    // Lo insertamos en el contenedor
    contenedor.appendChild(toast);

    // Lo eliminamos automáticamente después de 6 segundos
    setTimeout(() => toast.remove(), 6000);
}