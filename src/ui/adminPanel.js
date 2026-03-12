// MÓDULO: ui/adminPanel.js
// CAPA: UI (manipulación visual de la interfaz)

// Responsabilidad única: montar y gestionar el panel de administración.
// El panel tiene dos secciones:
//   1. Lista de usuarios con opción de crear y eliminar
//   2. Lista de todas las tareas del sistema

// Este módulo importa de api/ y de utils/. No importa de services/.

// Se importan las funciones de la capa API para usuarios
import { obtenerTodosLosUsuarios, crearUsuario, eliminarUsuario } from '../api/usuariosApi.js';

// Se importa la URL base para hacer peticiones directas de tareas
import { API_BASE_URL } from '../utils/config.js';

// Se importa SweetAlert2 para los diálogos de confirmación y notificaciones
// Ya está disponible en el proyecto (lo usa tareasService.js)
import Swal from 'sweetalert2';

// Función principal que monta el panel de administración en el contenedor recibido
// Parámetro: contenedor — el elemento HTML donde se renderiza el panel
export async function montarAdminPanel(contenedor) {

    // Se limpia el contenedor antes de renderizar para evitar duplicados
    contenedor.innerHTML = '';

    // Se crea el título principal del panel
    const titulo = document.createElement('h2');
    titulo.className = 'card__title';
    titulo.textContent = 'Panel de Administración';
    contenedor.appendChild(titulo);

    // Se crean y montan las dos secciones del panel
    await montarSeccionUsuarios(contenedor);
    await montarSeccionTareas(contenedor);
}

// Función que construye la sección de gestión de usuarios
// Muestra un formulario para crear usuarios y una tabla con todos los existentes
// Parámetro: contenedor — el elemento padre donde se inserta esta sección
async function montarSeccionUsuarios(contenedor) {

    // Se crea el contenedor de la sección con las clases del proyecto
    const seccion = document.createElement('div');
    seccion.className = 'card admin-seccion';

    // Se agrega el título de la sección
    const tituloSeccion = document.createElement('h3');
    tituloSeccion.className = 'admin-seccion__titulo';
    tituloSeccion.textContent = 'Usuarios del Sistema';
    seccion.appendChild(tituloSeccion);

    // Se construye el formulario de creación de usuario
    const formulario = construirFormularioUsuario();
    seccion.appendChild(formulario);

    // Se crea el contenedor donde se renderizará la tabla de usuarios
    const contenedorTabla = document.createElement('div');
    contenedorTabla.id = 'admin-tabla-usuarios';
    seccion.appendChild(contenedorTabla);

    // Se inserta la sección completa en el panel
    contenedor.appendChild(seccion);

    // Se registra el evento submit del formulario de creación
    formulario.addEventListener('submit', async function (event) {

        // Se previene el comportamiento nativo del formulario (recarga de página)
        event.preventDefault();

        // Se leen los valores de los campos del formulario
        const documento = document.getElementById('admin-input-documento').value.trim();
        const name = document.getElementById('admin-input-name').value.trim();
        const email = document.getElementById('admin-input-email').value.trim();

        // Se valida que ninguno de los tres campos esté vacío
        if (!documento || !name || !email) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Todos los campos son obligatorios',
                customClass: { popup: 'swal-popup', title: 'swal-title',
                               confirmButton: 'swal-btn-confirmar' }
            });
            return;
        }

        // Se llama a la capa API para crear el usuario en el backend
        const usuarioCreado = await crearUsuario({ documento, name, email });

        // Si la creación fue exitosa se recarga la tabla y se limpia el formulario
        if (usuarioCreado) {
            Swal.fire({
                icon: 'success',
                title: 'Usuario creado',
                text: `${name} fue agregado correctamente`,
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'swal-popup' }
            });
            formulario.reset();
            await renderizarTablaUsuarios(contenedorTabla);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo crear el usuario',
                customClass: { popup: 'swal-popup', confirmButton: 'swal-btn-confirmar' }
            });
        }
    });

    // Se carga la tabla de usuarios por primera vez al montar la sección
    await renderizarTablaUsuarios(contenedorTabla);
}

// Función que construye y devuelve el formulario de creación de usuario
// Tiene tres campos: documento, nombre y correo
function construirFormularioUsuario() {

    // Se crea el elemento form
    const form = document.createElement('form');
    form.className = 'admin-form';

    // Se crea el campo de documento
    const grupoDoc = document.createElement('div');
    grupoDoc.className = 'form__group admin-form__grupo';
    grupoDoc.innerHTML = `
        <label for="admin-input-documento" class="form__label">Número de documento</label>
        <input type="text" id="admin-input-documento" class="form__input" placeholder="Ej: 1097497124">
    `;

    // Se crea el campo de nombre
    const grupoNombre = document.createElement('div');
    grupoNombre.className = 'form__group admin-form__grupo';
    grupoNombre.innerHTML = `
        <label for="admin-input-name" class="form__label">Nombre completo</label>
        <input type="text" id="admin-input-name" class="form__input" placeholder="Ej: María López">
    `;

    // Se crea el campo de correo
    const grupoEmail = document.createElement('div');
    grupoEmail.className = 'form__group admin-form__grupo';
    grupoEmail.innerHTML = `
        <label for="admin-input-email" class="form__label">Correo electrónico</label>
        <input type="email" id="admin-input-email" class="form__input" placeholder="Ej: maria@correo.com">
    `;

    // Se crea el botón de submit
    const boton = document.createElement('button');
    boton.type = 'submit';
    boton.className = 'btn btn--primary';
    boton.innerHTML = '<span class="btn__text">Crear Usuario</span>';

    // Se ensamblan todos los elementos dentro del formulario
    form.appendChild(grupoDoc);
    form.appendChild(grupoNombre);
    form.appendChild(grupoEmail);
    form.appendChild(boton);

    return form;
}

// Función que obtiene los usuarios del backend y renderiza la tabla
// Se llama al montar el panel y después de crear o eliminar un usuario
// Parámetro: contenedor — el div donde se inserta la tabla
async function renderizarTablaUsuarios(contenedor) {

    // Se vacía el contenedor para evitar duplicar filas
    contenedor.innerHTML = '';

    // Se obtienen todos los usuarios desde el backend
    const usuarios = await obtenerTodosLosUsuarios();

    // Si no hay usuarios o hubo error se muestra un mensaje
    if (!usuarios || usuarios.length === 0) {
        contenedor.innerHTML = '<p class="admin-vacio">No hay usuarios registrados.</p>';
        return;
    }

    // Se crea la tabla HTML reutilizando la clase tasks-table del proyecto
    const tabla = document.createElement('table');
    tabla.className = 'tasks-table admin-tabla';

    // Se crea el encabezado de la tabla con las columnas
    tabla.innerHTML = `
        <thead>
            <tr>
                <th scope="col">ID</th>
                <th scope="col">Documento</th>
                <th scope="col">Nombre</th>
                <th scope="col">Correo</th>
                <th scope="col">Acciones</th>
            </tr>
        </thead>
    `;

    // Se crea el tbody donde se insertarán las filas
    const tbody = document.createElement('tbody');

    // Se recorre el arreglo de usuarios y se crea una fila por cada uno
    usuarios.forEach(function (usuario) {

        const fila = document.createElement('tr');

        // Se rellena la fila con los datos del usuario
        fila.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.documento}</td>
            <td>${usuario.name}</td>
            <td>${usuario.email}</td>
            <td>
                <div class="task-actions">
                    <button
                        type="button"
                        class="btn-action btn-action--delete"
                        data-id="${usuario.id}"
                        data-nombre="${usuario.name}">
                        🗑 Eliminar
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    contenedor.appendChild(tabla);

    // Se registra un solo listener en el tbody para manejar todos los botones eliminar
    tbody.addEventListener('click', async function (event) {

        // Se busca el botón de eliminar más cercano al elemento clicado
        const boton = event.target.closest('[data-id]');
        if (!boton) return;

        // Se leen el id y el nombre del usuario desde los atributos del botón
        const userId = boton.dataset.id;
        const nombreUsuario = boton.dataset.nombre;

        // Se pide confirmación antes de eliminar usando SweetAlert2
        const resultado = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar usuario?',
            text: `"${nombreUsuario}" será eliminado permanentemente.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'swal-popup swal-eliminar',
                title: 'swal-title',
                confirmButton: 'swal-btn-confirmar',
                cancelButton: 'swal-btn-cancelar'
            }
        });

        if (!resultado.isConfirmed) return;

        // Se llama a la API para eliminar el usuario
        const exitoso = await eliminarUsuario(userId);

        if (exitoso) {
            Swal.fire({
                icon: 'success',
                title: 'Usuario eliminado',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'swal-popup' }
            });
            // Se recarga la tabla para reflejar el cambio
            await renderizarTablaUsuarios(contenedor);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                customClass: { popup: 'swal-popup', confirmButton: 'swal-btn-confirmar' }
            });
        }
    });
}

// Función que construye la sección de lista de todas las tareas
// Muestra una tabla con título, estado y usuarios asignados de cada tarea
// Parámetro: contenedor — el elemento padre donde se inserta esta sección
async function montarSeccionTareas(contenedor) {

    // Se crea el contenedor de la sección de tareas
    const seccion = document.createElement('div');
    seccion.className = 'card admin-seccion';

    // Se agrega el título de la sección
    const tituloSeccion = document.createElement('h3');
    tituloSeccion.className = 'admin-seccion__titulo';
    tituloSeccion.textContent = 'Todas las Tareas del Sistema';
    seccion.appendChild(tituloSeccion);

    // Se obtienen todas las tareas desde el backend
    let tareas = [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/tasks`);
        if (response.ok) {
            tareas = await response.json();
        }
    } catch (error) {
        console.error('❌ Error al obtener tareas para el panel admin:', error);
    }

    // Si no hay tareas se muestra un mensaje
    if (tareas.length === 0) {
        const mensaje = document.createElement('p');
        mensaje.className = 'admin-vacio';
        mensaje.textContent = 'No hay tareas registradas en el sistema.';
        seccion.appendChild(mensaje);
        contenedor.appendChild(seccion);
        return;
    }

    // Se crea la tabla de tareas reutilizando la clase tasks-table del proyecto
    const tabla = document.createElement('table');
    tabla.className = 'tasks-table admin-tabla';

    // Se agrega el encabezado de la tabla
    tabla.innerHTML = `
        <thead>
            <tr>
                <th scope="col">Título</th>
                <th scope="col">Estado</th>
                <th scope="col">Usuarios asignados</th>
            </tr>
        </thead>
    `;

    // Se crea el tbody para las filas de tareas
    const tbody = document.createElement('tbody');

    // Se recorre el arreglo de tareas y se crea una fila por cada una
    tareas.forEach(function (tarea) {

        const fila = document.createElement('tr');

        // Se formatea el estado para mostrarlo de forma legible
        const estadoFormateado = formatearEstado(tarea.status);

        // Se convierte el arreglo de ids de usuarios a texto legible
        const usuariosTexto = tarea.assignedUsers && tarea.assignedUsers.length > 0
            ? tarea.assignedUsers.join(', ')
            : 'Sin asignar';

        fila.innerHTML = `
            <td>${tarea.title}</td>
            <td><span class="status-badge status-${tarea.status}">${estadoFormateado}</span></td>
            <td>${usuariosTexto}</td>
        `;

        tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    seccion.appendChild(tabla);
    contenedor.appendChild(seccion);
}

// Función auxiliar que convierte el valor técnico del estado a texto legible
// Parámetro: estado — el valor del campo status (pendiente, en_progreso, completada)
function formatearEstado(estado) {
    if (estado === 'pendiente')   return 'Pendiente';
    if (estado === 'en_progreso') return 'En Progreso';
    if (estado === 'completada')  return 'Completada';
    return estado;
}