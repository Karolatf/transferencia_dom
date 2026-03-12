// MÓDULO: ui/buscarUsuario.js
// CAPA: UI (manipulación visual de la interfaz)

// Responsabilidad única: montar la vista de búsqueda de usuario para el modo usuario.
// El usuario escribe su número de documento y ve sus tareas asignadas.
// Solo puede editar el estado y el comentario de sus tareas; no puede crear tareas nuevas.

// Importamos la función de búsqueda que ya existe en tareasApi.js
import { buscarUsuarioPorDocumento } from '../api/tareasApi.js';

// Importamos la URL base para las peticiones de tareas
import { API_BASE_URL } from '../utils/config.js';

// Función principal que monta la vista de búsqueda en el contenedor recibido
// Parámetro: contenedor — el elemento HTML donde se renderiza la vista
export function montarBuscarUsuario(contenedor) {

    // Limpiamos el contenedor antes de renderizar para evitar duplicados
    contenedor.innerHTML = '';

    // Tarjeta principal de la vista
    const card = document.createElement('div');
    card.className = 'card';

    // Título de la sección
    const titulo = document.createElement('h2');
    titulo.className = 'card__title';
    titulo.textContent = 'Buscar mis tareas';
    card.appendChild(titulo);

    // Formulario de búsqueda con input de documento y botón
    const formulario = document.createElement('form');
    formulario.className = 'form';
    formulario.noValidate = true;

    const grupo = document.createElement('div');
    grupo.className = 'form__group';

    const label = document.createElement('label');
    label.setAttribute('for', 'buscar-input-doc');
    label.className = 'form__label';
    label.textContent = 'Numero de documento';
    grupo.appendChild(label);

    const input = document.createElement('input');
    input.type        = 'text';
    input.id          = 'buscar-input-doc';
    input.className   = 'form__input';
    input.placeholder = 'Ingresa tu numero de documento';
    grupo.appendChild(input);

    const errorSpan = document.createElement('span');
    errorSpan.className = 'form__error';
    errorSpan.id = 'buscar-input-error';
    grupo.appendChild(errorSpan);

    formulario.appendChild(grupo);

    const boton = document.createElement('button');
    boton.type      = 'submit';
    boton.className = 'btn btn--primary';
    const textoBoton = document.createElement('span');
    textoBoton.className   = 'btn__text';
    textoBoton.textContent = 'Buscar mis tareas';
    boton.appendChild(textoBoton);
    formulario.appendChild(boton);

    card.appendChild(formulario);

    // Área de resultado — empieza oculta
    const areaResultado = document.createElement('div');
    areaResultado.id        = 'buscar-resultado';
    areaResultado.className = 'buscar-resultado hidden';
    card.appendChild(areaResultado);

    contenedor.appendChild(card);

    // Limpia el error al escribir de nuevo
    input.addEventListener('input', function() {
        errorSpan.textContent = '';
        input.classList.remove('error');
    });

    // Evento submit del formulario de búsqueda
    formulario.addEventListener('submit', async function(event) {
        event.preventDefault();

        const documento = input.value.trim();

        if (!documento) {
            errorSpan.textContent = 'Ingresa tu numero de documento';
            input.classList.add('error');
            return;
        }

        // Limpiamos resultado anterior y mostramos mensaje de carga
        areaResultado.classList.remove('hidden');
        areaResultado.innerHTML = '';
        const cargando = document.createElement('p');
        cargando.textContent = 'Buscando...';
        areaResultado.appendChild(cargando);

        // Buscamos el usuario por documento
        const usuario = await buscarUsuarioPorDocumento(documento);

        if (!usuario) {
            areaResultado.innerHTML = '';
            const noEncontrado = document.createElement('p');
            noEncontrado.className   = 'buscar-resultado__no-encontrado';
            noEncontrado.textContent = `No se encontro ningun usuario con el documento: ${documento}`;
            areaResultado.appendChild(noEncontrado);
            return;
        }

        // Obtenemos las tareas del usuario filtrando por su id interno
        // El campo userId en las tareas guarda el id numérico del usuario (no el documento)
        let tareas = [];
        try {
            const response = await fetch(`${API_BASE_URL}/tasks?userId=${usuario.id}`);
            if (response.ok) {
                tareas = await response.json();
            }
        } catch (error) {
            console.error('Error al obtener las tareas del usuario:', error);
        }

        // Pintamos el resultado con los datos del usuario y sus tareas
        renderizarResultadoBusqueda(areaResultado, usuario, tareas);
    });
}

// Construye y muestra el resultado con los datos del usuario y sus tareas
// Parámetros:
//   area    — el div donde se inserta el resultado
//   usuario — objeto del usuario encontrado
//   tareas  — arreglo de tareas asignadas a ese usuario
function renderizarResultadoBusqueda(area, usuario, tareas) {

    area.innerHTML = '';

    // Nombre del usuario encontrado como encabezado del resultado
    const tituloUsuario = document.createElement('h3');
    tituloUsuario.className   = 'buscar-resultado__titulo';
    tituloUsuario.textContent = `Usuario: ${usuario.name}`;
    area.appendChild(tituloUsuario);

    // Si no tiene tareas mostramos un mensaje informativo
    if (tareas.length === 0) {
        const sinTareas = document.createElement('p');
        sinTareas.className   = 'buscar-resultado__sin-tareas';
        sinTareas.textContent = 'No tienes tareas asignadas.';
        area.appendChild(sinTareas);
        return;
    }

    // Contador de tareas encontradas
    const contador = document.createElement('p');
    contador.className   = 'buscar-resultado__contador';
    contador.textContent = `Tareas asignadas: ${tareas.length}`;
    area.appendChild(contador);

    // Lista de tareas con titulo y estado
    const lista = document.createElement('ul');
    lista.className = 'buscar-resultado__lista';

    tareas.forEach(function(tarea) {
        const item = document.createElement('li');
        item.className = 'buscar-resultado__item';

        const tituloTarea = document.createElement('span');
        tituloTarea.className   = 'buscar-resultado__tarea-titulo';
        tituloTarea.textContent = tarea.title;

        const badge = document.createElement('span');
        badge.classList.add('status-badge', `status-${tarea.status}`);
        badge.textContent = formatearEstado(tarea.status);

        item.appendChild(tituloTarea);
        item.appendChild(badge);
        lista.appendChild(item);
    });

    area.appendChild(lista);
}

// Convierte el valor técnico del estado a texto legible
function formatearEstado(estado) {
    const mapa = { pendiente: 'Pendiente', en_progreso: 'En Progreso', completada: 'Completada' };
    return mapa[estado] || estado;
}