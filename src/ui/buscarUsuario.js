// Archivo: ui/buscarUsuario.js
// Este archivo construye y maneja la vista de búsqueda de tareas para el estudiante.
// El estudiante escribe su número de documento y ve la lista de sus tareas asignadas.
// Todo el HTML se construye con createElement y appendChild — nunca se usa innerHTML.

// Importamos las funciones del servidor para buscar usuario y obtener sus tareas
import {
    buscarUsuarioPorDocumento, // busca en el servidor un usuario por su documento de identidad
    obtenerTareasDeUsuario     // trae del servidor las tareas asignadas a un usuario
} from '../api/tareasApi.js';

// Importamos la función para mostrar mensajes emergentes (toasts) al usuario
import { mostrarNotificacion } from '../utils/notificaciones.js';

// Exportamos la función montarBuscarUsuario que construye toda la vista de búsqueda
// y la inserta dentro del elemento HTML que recibe como parámetro
export function montarBuscarUsuario(contenedor) {

    // Vaciamos el contenedor antes de construir la vista para no duplicar elementos
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    // Creamos la tarjeta principal que envuelve toda la vista de búsqueda
    const card = document.createElement('div');
    card.className = 'card';

    // Creamos el título de la sección
    const titulo = document.createElement('h2');
    titulo.className   = 'card__title';
    titulo.textContent = 'Buscar mis tareas';
    card.appendChild(titulo);

    // Creamos el formulario de búsqueda con el campo de documento y el botón buscar
    const formulario = document.createElement('form');
    formulario.className = 'form';
    // noValidate desactiva la validación automática del navegador para manejarla nosotros mismos
    formulario.noValidate = true;

    // Creamos el grupo del campo de documento (contiene etiqueta, input y mensaje de error)
    const grupo = document.createElement('div');
    grupo.className = 'form__group';

    // Creamos la etiqueta del campo de documento
    const label = document.createElement('label');
    label.setAttribute('for', 'buscar-input-doc');
    label.className   = 'form__label';
    label.textContent = 'Numero de documento';
    grupo.appendChild(label);

    // Creamos el campo de texto donde el estudiante escribe su número de documento
    const input = document.createElement('input');
    input.type        = 'text';
    input.id          = 'buscar-input-doc';
    input.className   = 'form__input';
    input.placeholder = 'Ingresa tu numero de documento';
    grupo.appendChild(input);

    // Creamos el span donde mostraremos el mensaje de error si el campo está vacío
    const errorSpan = document.createElement('span');
    errorSpan.className = 'form__error';
    errorSpan.id        = 'buscar-input-error';
    grupo.appendChild(errorSpan);

    formulario.appendChild(grupo);

    // Creamos el botón de búsqueda que envía el formulario
    const boton = document.createElement('button');
    boton.type      = 'submit';
    boton.className = 'btn btn--primary';

    // Creamos el texto del botón (el span interno es requerido por los estilos del proyecto)
    const textoBoton = document.createElement('span');
    textoBoton.className   = 'btn__text';
    textoBoton.textContent = 'Buscar mis tareas';
    boton.appendChild(textoBoton);
    formulario.appendChild(boton);

    card.appendChild(formulario);

    // Creamos el área donde se mostrará el resultado de la búsqueda
    // Empieza oculta con la clase 'hidden' — se revela cuando hay un resultado
    const areaResultado = document.createElement('div');
    areaResultado.id        = 'buscar-resultado';
    areaResultado.className = 'buscar-resultado hidden';
    card.appendChild(areaResultado);

    // Insertamos la tarjeta completa dentro del contenedor recibido como parámetro
    contenedor.appendChild(card);

    // Hacemos que el mensaje de error desaparezca mientras el estudiante escribe en el campo
    input.addEventListener('input', function() {
        errorSpan.textContent = '';
        input.classList.remove('error');
    });

    // Manejamos el envío del formulario cuando el estudiante presiona "Buscar mis tareas"
    formulario.addEventListener('submit', async function(event) {
        // Evitamos que el formulario recargue la página
        event.preventDefault();

        // Leemos el número de documento escrito por el estudiante (sin espacios al inicio/final)
        const documento = input.value.trim();

        // Si el campo está vacío, mostramos el error y cancelamos la búsqueda
        if (!documento) {
            const msg = 'El documento del usuario es obligatorio';
            errorSpan.textContent = msg;
            input.classList.add('error');
            // Mostramos también un toast con el error para que sea más visible
            await mostrarNotificacion(msg, 'error');
            return;
        }

        // Mostramos el área de resultado y ponemos un mensaje de "Buscando..."
        areaResultado.classList.remove('hidden');
        // Vaciamos el resultado anterior antes de mostrar el nuevo
        while (areaResultado.firstChild) areaResultado.removeChild(areaResultado.firstChild);

        // Mostramos el mensaje de carga mientras el servidor responde
        const cargando = document.createElement('p');
        cargando.textContent = 'Buscando...';
        areaResultado.appendChild(cargando);

        // Consultamos al servidor si existe un usuario con ese documento
        const usuario = await buscarUsuarioPorDocumento(documento);

        // Vaciamos el mensaje de carga una vez que el servidor respondió
        while (areaResultado.firstChild) areaResultado.removeChild(areaResultado.firstChild);

        // Si el servidor no encontró ningún usuario con ese documento, mostramos el mensaje y terminamos
        if (!usuario) {
            const noEncontrado = document.createElement('p');
            noEncontrado.className   = 'buscar-resultado__no-encontrado';
            noEncontrado.textContent = `No se encontro ningun usuario con el documento: ${documento}`;
            areaResultado.appendChild(noEncontrado);
            return;
        }

        // Si encontramos al usuario, pedimos sus tareas al servidor usando su id interno
        let tareas = [];
        try {
            tareas = await obtenerTareasDeUsuario(usuario.id);
        } catch (error) {
            console.error('Error al obtener las tareas del usuario:', error);
        }

        // Dibujamos el resultado completo con los datos del usuario y la lista de tareas
        renderizarResultadoBusqueda(areaResultado, usuario, tareas);
    });
}

// Función privada que construye y muestra el resultado de búsqueda en el área de resultado
// Recibe el área HTML donde pintar, el objeto del usuario encontrado y su lista de tareas
function renderizarResultadoBusqueda(area, usuario, tareas) {

    // Vaciamos el área antes de construir el nuevo resultado
    while (area.firstChild) area.removeChild(area.firstChild);

    // Mostramos el nombre del usuario encontrado como título del resultado
    const tituloUsuario = document.createElement('h3');
    tituloUsuario.className   = 'buscar-resultado__titulo';
    tituloUsuario.textContent = `Usuario: ${usuario.name}`;
    area.appendChild(tituloUsuario);

    // Si el usuario no tiene tareas asignadas, mostramos un mensaje informativo y terminamos
    if (tareas.length === 0) {
        const sinTareas = document.createElement('p');
        sinTareas.className   = 'buscar-resultado__sin-tareas';
        sinTareas.textContent = 'No tienes tareas asignadas.';
        area.appendChild(sinTareas);
        return;
    }

    // Mostramos el número total de tareas asignadas al usuario
    const contador = document.createElement('p');
    contador.className   = 'buscar-resultado__contador';
    contador.textContent = `Tareas asignadas: ${tareas.length}`;
    area.appendChild(contador);

    // Creamos la lista HTML que contendrá una fila por cada tarea del usuario
    const lista = document.createElement('ul');
    lista.className = 'buscar-resultado__lista';

    // Por cada tarea, creamos un elemento de lista con el título y un badge de color con el estado
    tareas.forEach(function(tarea) {

        // Creamos el elemento de lista para esta tarea
        const item = document.createElement('li');
        item.className = 'buscar-resultado__item';

        // Creamos el texto con el título de la tarea
        const tituloTarea = document.createElement('span');
        tituloTarea.className   = 'buscar-resultado__tarea-titulo';
        tituloTarea.textContent = tarea.title;

        // Creamos el badge coloreado que muestra el estado de la tarea
        // Las clases 'status-badge' y 'status-pendiente' (por ejemplo) aplican el color correspondiente
        const badge = document.createElement('span');
        badge.classList.add('status-badge', `status-${tarea.status}`);
        badge.textContent = formatearEstado(tarea.status);

        item.appendChild(tituloTarea);
        item.appendChild(badge);
        lista.appendChild(item);
    });

    area.appendChild(lista);
}

// Función privada que convierte el valor técnico del estado a texto legible en español
// por ejemplo: "en_progreso" se convierte en "En Progreso"
function formatearEstado(estado) {
    const mapa = {
        pendiente:   'Pendiente',
        en_progreso: 'En Progreso',
        completada:  'Completada'
    };
    // Si el estado no está en el mapa, retornamos el valor original sin cambios
    return mapa[estado] || estado;
}
