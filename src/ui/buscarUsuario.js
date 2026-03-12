// MÓDULO: ui/buscarUsuario.js
// CAPA: UI (manipulación visual de la interfaz)

// Responsabilidad única: montar la vista de búsqueda de usuario por documento.
// Cualquier persona puede escribir un número de documento y ver las tareas
// asignadas a ese usuario. No requiere ser administrador.

// Se importa la función de búsqueda de tareasApi.js (ya corregida en Tarea 1)
import { buscarUsuarioPorDocumento } from '../api/tareasApi.js';

// Se importa la URL base para hacer la petición de tareas
import { API_BASE_URL } from '../utils/config.js';

// Función principal que monta la vista de búsqueda en el contenedor recibido
// Parámetro: contenedor — el elemento HTML donde se renderiza la vista
export function montarBuscarUsuario(contenedor) {

    // Se limpia el contenedor antes de renderizar para evitar duplicados
    contenedor.innerHTML = '';

    // Se crea la tarjeta que agrupa toda la vista de búsqueda
    const card = document.createElement('div');
    card.className = 'card';

    // Se agrega el título de la sección
    const titulo = document.createElement('h2');
    titulo.className = 'card__title';
    titulo.textContent = 'Buscar Usuario por Documento';
    card.appendChild(titulo);

    // Se construye el formulario de búsqueda con un input y un botón
    const formulario = document.createElement('form');
    formulario.className = 'form';
    formulario.noValidate = true;
    formulario.innerHTML = `
        <div class="form__group">
            <label for="buscar-input-doc" class="form__label">
                Número de documento
            </label>
            <input
                type="text"
                id="buscar-input-doc"
                class="form__input"
                placeholder="Ingresa el número de documento"
            >
        </div>
        <button type="submit" class="btn btn--primary">
            <span class="btn__text">Buscar Usuario</span>
            <span class="btn__icon">🔍</span>
        </button>
    `;
    card.appendChild(formulario);

    // Se crea el área donde aparecerán los resultados
    // Empieza oculta con la clase 'hidden' del proyecto
    const areaResultado = document.createElement('div');
    areaResultado.id = 'buscar-resultado';
    areaResultado.className = 'buscar-resultado hidden';
    card.appendChild(areaResultado);

    // Se inserta la tarjeta en el contenedor
    contenedor.appendChild(card);

    // Se registra el evento submit del formulario de búsqueda
    formulario.addEventListener('submit', async function (event) {

        // Se previene el comportamiento nativo (recarga de página)
        event.preventDefault();

        // Se lee el valor del campo y se limpia de espacios
        const documento = document.getElementById('buscar-input-doc').value.trim();

        // Si el campo está vacío se detiene la búsqueda
        if (!documento) return;

        // Se muestra mensaje de carga mientras espera la respuesta
        areaResultado.classList.remove('hidden');
        areaResultado.innerHTML = '<p>Buscando...</p>';

        // Se llama a la API para buscar el usuario por su número de documento
        const usuario = await buscarUsuarioPorDocumento(documento);

        // Si no se encontró el usuario se muestra un mensaje de error
        if (!usuario) {
            areaResultado.innerHTML = `
                <p class="buscar-resultado__no-encontrado">
                    No se encontró ningún usuario con el documento: <strong>${documento}</strong>
                </p>
            `;
            return;
        }

        // Si se encontró el usuario se obtienen sus tareas desde el backend
        let tareas = [];
        try {
            const response = await fetch(`${API_BASE_URL}/api/tasks`);
            if (response.ok) {
                const todasLasTareas = await response.json();
                // Se filtran solo las tareas donde el id del usuario está en assignedUsers
                tareas = todasLasTareas.filter(function (tarea) {
                    return tarea.assignedUsers && tarea.assignedUsers.includes(usuario.id);
                });
            }
        } catch (error) {
            console.error('❌ Error al obtener las tareas del usuario:', error);
        }

        // Se construye y muestra el resultado con los datos del usuario y sus tareas
        renderizarResultadoBusqueda(areaResultado, usuario, tareas);
    });
}

// Función que construye el HTML del resultado y lo inserta en el área
// Parámetros:
//   area    — el div donde se inserta el resultado
//   usuario — el objeto del usuario encontrado
//   tareas  — el arreglo de tareas asignadas a ese usuario
function renderizarResultadoBusqueda(area, usuario, tareas) {

    // Se limpia el área antes de renderizar el resultado nuevo
    area.innerHTML = '';

    // Se muestra el nombre del usuario encontrado como título del resultado
    const tituloUsuario = document.createElement('h3');
    tituloUsuario.className = 'buscar-resultado__titulo';
    tituloUsuario.textContent = `Usuario encontrado: ${usuario.name}`;
    area.appendChild(tituloUsuario);

    // Si el usuario no tiene tareas se muestra un mensaje informativo
    if (tareas.length === 0) {
        const sinTareas = document.createElement('p');
        sinTareas.className = 'buscar-resultado__sin-tareas';
        sinTareas.textContent = 'Este usuario no tiene tareas asignadas.';
        area.appendChild(sinTareas);
        return;
    }

    // Se muestra el número de tareas encontradas
    const contador = document.createElement('p');
    contador.className = 'buscar-resultado__contador';
    contador.textContent = `Tareas asignadas: ${tareas.length}`;
    area.appendChild(contador);

    // Se crea la lista de tareas sin viñetas
    const lista = document.createElement('ul');
    lista.className = 'buscar-resultado__lista';

    // Se recorre el arreglo de tareas y se crea un elemento por cada una
    tareas.forEach(function (tarea) {

        const item = document.createElement('li');
        item.className = 'buscar-resultado__item';

        // Se formatea el estado para mostrarlo de forma legible
        const estadoFormateado = formatearEstado(tarea.status);

        item.innerHTML = `
            <span class="buscar-resultado__tarea-titulo">${tarea.title}</span>
            <span class="status-badge status-${tarea.status}">${estadoFormateado}</span>
        `;

        lista.appendChild(item);
    });

    area.appendChild(lista);
}

// Función auxiliar que convierte el valor técnico del estado a texto legible
function formatearEstado(estado) {
    if (estado === 'pendiente')   return 'Pendiente';
    if (estado === 'en_progreso') return 'En Progreso';
    if (estado === 'completada')  return 'Completada';
    return estado;
}