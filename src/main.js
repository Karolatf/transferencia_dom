// Autores: Karol Nicolle Torres Fuentes, Juan Sebastian Patiño Hernandez
// Fecha: 19-02-26
// Institución: SENA - Técnico en Programación de Software

// PUNTO DE ENTRADA PRINCIPAL DE LA APLICACIÓN

// Este es el archivo de arranque del Sistema de Gestión de Tareas
// Es el único archivo que debe ser referenciado directamente desde el HTML
// y se encarga de inicializar todo lo que la aplicación necesita para funcionar
// Gracias al archivo barril, todos los imports se hacen desde un único lugar

// Flujo de la aplicación:
// Usuario → Evento → main.js → services → api → respuesta → services → ui → DOM

// ----- IMPORTACIONES -----
// Importamos SOLO lo que main.js necesita para arrancar la aplicación.
// Toda la lógica de negocio, API y UI se delega a los módulos correspondientes.

// Importamos el servicio de eventos que conecta el DOM con los manejadores
// Viene de la capa de servicios, que coordina la lógica intermedia
import { registrarEventListeners } from './services/tareasService.js';

// Importamos la función de UI que muestra el mensaje inicial de "no hay tareas"
// Viene directamente de la capa de interfaz, ya que es solo una acción visual
import { mostrarEstadoVacio } from './ui/tareasUI.js';

// Importamos la URL base para confirmar en consola que la configuración es correcta
import { API_BASE_URL } from './utils/config.js';

// Se importa la función que monta el panel de administración
import { montarAdminPanel } from './ui/adminPanel.js';

// Se importa la función que monta la vista de búsqueda por documento
import { montarBuscarUsuario } from './ui/buscarUsuario.js';

// INICIALIZACIÓN DE LA APLICACIÓN

// Esperamos el evento 'DOMContentLoaded' antes de ejecutar cualquier lógica.
// Este evento se dispara cuando el navegador termina de analizar el HTML
// y construir el árbol del DOM, pero antes de cargar imágenes y estilos.

// Si intentáramos acceder a elementos del DOM antes de este evento,
// document.getElementById() retornaría null y la aplicación fallaría.
document.addEventListener('DOMContentLoaded', function () {

    // ----- PASO 1: CONFIRMAR INICIO EN CONSOLA -----
    // Mensajes de diagnóstico para verificar que el módulo cargó correctamente
    console.log('DOM completamente cargado y listo');
    console.log('Sistema de Gestión de Tareas - SENA iniciando...');
    console.log('Servidor esperado en:', API_BASE_URL);

    // ----- PASO 2: REGISTRAR TODOS LOS EVENT LISTENERS -----
    // Delegamos al servicio la responsabilidad de conectar cada elemento
    // del DOM con su manejador de eventos correspondiente.
    // Esto debe hacerse aquí (dentro de DOMContentLoaded) para garantizar
    // que todos los elementos HTML ya existen antes de añadirles eventos.
    registrarEventListeners();

    // ----- PASO 3: INICIALIZAR EL ESTADO VISUAL -----
    // Mostramos el mensaje "no hay tareas" para dar feedback inmediato al usuario
    // de que la tabla existe pero aún está vacía, esperando la primera tarea.
    mostrarEstadoVacio();

    // ----- PASO 4: CONFIRMAR INICIALIZACIÓN EXITOSA -----
    console.log('📋 Event listeners registrados correctamente');
    console.log('✔️  Aplicación lista para usar');

    // ----- PASO 5: CONECTAR BOTONES DE NAVEGACIÓN CON LAS VISTAS NUEVAS -----

    // Se obtienen los botones de navegación del header
    const btnAdmin = document.getElementById('btnAdmin');
    const btnBuscar = document.getElementById('btnBuscar');

    // Se obtienen las secciones de las vistas nuevas
    const adminSection = document.getElementById('adminSection');
    const buscarSection = document.getElementById('buscarSection');

    // Se obtienen los contenedores donde cada vista renderiza su contenido
    const adminPanelContenedor = document.getElementById('adminPanelContenedor');
    const buscarContenedor = document.getElementById('buscarContenedor');

    // Al hacer clic en "Panel Admin" se muestra esa sección y se oculta la otra
    btnAdmin.addEventListener('click', async function () {
        // Se muestra la sección del admin y se oculta la de búsqueda
        adminSection.classList.remove('hidden');
        buscarSection.classList.add('hidden');
        // Se monta el panel cada vez que se abre para tener datos actualizados
        await montarAdminPanel(adminPanelContenedor);
    });

    // Al hacer clic en "Buscar por Documento" se muestra esa sección y se oculta la otra
    btnBuscar.addEventListener('click', function () {
        // Se muestra la sección de búsqueda y se oculta la del admin
        buscarSection.classList.remove('hidden');
        adminSection.classList.add('hidden');
        // Se monta la vista de búsqueda en su contenedor
        montarBuscarUsuario(buscarContenedor);
    });
});