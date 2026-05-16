// Archivo: ui/adminPanel.js
// Este archivo construye y gestiona el panel de administración.
// El panel tiene dos secciones:
//   1. Gestión de usuarios: formulario para crear usuarios y tabla con los existentes
//   2. Lista de todas las tareas del sistema
// Todo el HTML se construye con createElement y appendChild — nunca se usa innerHTML.

// Importamos las funciones del servidor para crear y eliminar usuarios
import { obtenerTodosLosUsuarios, crearUsuario, eliminarUsuario, forceEliminarUsuario } from '../api/usuariosApi.js';

// Importamos la función del servidor para obtener la lista de tareas
import { obtenerTodasLasTareas } from '../api/tareasApi.js';

// Importamos las funciones para mostrar mensajes y modales al administrador
import { mostrarNotificacion, mostrarConfirmacion, mostrarModalEliminarUsuario } from '../utils/notificaciones.js';

// Exportamos la función montarAdminPanel que construye todo el panel del administrador
// dentro del contenedor HTML que recibe como parámetro
export async function montarAdminPanel(contenedor) {

    // Vaciamos el contenedor para construirlo desde cero
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    // Creamos el título principal del panel de administración
    const titulo = document.createElement('h2');
    titulo.className   = 'card__title';
    titulo.textContent = 'Panel de Administración';
    contenedor.appendChild(titulo);

    // Construimos y agregamos las dos secciones del panel
    await montarSeccionUsuarios(contenedor);
    await montarSeccionTareas(contenedor);
}

// Función privada que construye la sección de gestión de usuarios
// Muestra el formulario de creación y la tabla de todos los usuarios
async function montarSeccionUsuarios(contenedor) {

    // Creamos la tarjeta de la sección de usuarios
    const seccion = document.createElement('div');
    seccion.className = 'card admin-seccion';

    // Creamos el título de la sección
    const tituloSeccion = document.createElement('h3');
    tituloSeccion.className   = 'admin-seccion__titulo';
    tituloSeccion.textContent = 'Usuarios del Sistema';
    seccion.appendChild(tituloSeccion);

    // Construimos el formulario de creación de usuario
    const formulario = construirFormularioUsuario();
    seccion.appendChild(formulario);

    // Creamos el contenedor donde irá la tabla de usuarios
    const contenedorTabla = document.createElement('div');
    contenedorTabla.id = 'admin-tabla-usuarios';
    seccion.appendChild(contenedorTabla);

    // Insertamos la sección completa en el panel
    contenedor.appendChild(seccion);

    // Registramos el evento del formulario de creación de usuario
    formulario.addEventListener('submit', async function(event) {

        // Evitamos que el formulario recargue la página
        event.preventDefault();

        // Leemos los valores de los tres campos del formulario
        const documento = document.getElementById('admin-input-documento').value.trim();
        const name      = document.getElementById('admin-input-name').value.trim();
        const email     = document.getElementById('admin-input-email').value.trim();

        // Verificamos que ningún campo esté vacío antes de enviar al servidor
        if (!documento || !name || !email) {
            await mostrarNotificacion('Todos los campos son obligatorios', 'advertencia');
            return;
        }

        // Enviamos los datos al servidor para crear el nuevo usuario
        const usuarioCreado = await crearUsuario({ documento, name, email });

        // Si el servidor creó el usuario exitosamente, recargamos la tabla y limpiamos el formulario
        if (usuarioCreado) {
            await mostrarNotificacion(`${name} fue agregado correctamente`, 'exito');
            formulario.reset(); // limpia todos los campos del formulario
            await renderizarTablaUsuarios(contenedorTabla);
        } else {
            await mostrarNotificacion('No se pudo crear el usuario', 'error');
        }
    });

    // Cargamos la tabla de usuarios al montar la sección por primera vez
    await renderizarTablaUsuarios(contenedorTabla);
}

// Función privada que construye y retorna el formulario de creación de usuario
// con tres campos: documento, nombre completo y correo electrónico
function construirFormularioUsuario() {

    // Creamos el elemento form del formulario
    const form = document.createElement('form');
    form.className = 'admin-form';

    // ── CAMPO DOCUMENTO ───────────────────────────────────────────────────────
    const grupoDoc = document.createElement('div');
    grupoDoc.className = 'form__group admin-form__grupo';

    // Etiqueta del campo documento
    const labelDoc = document.createElement('label');
    labelDoc.setAttribute('for', 'admin-input-documento');
    labelDoc.className   = 'form__label';
    labelDoc.textContent = 'Número de documento';

    // Campo de texto donde el admin escribe el número de documento del nuevo usuario
    const inputDoc = document.createElement('input');
    inputDoc.type        = 'text';
    inputDoc.id          = 'admin-input-documento';
    inputDoc.className   = 'form__input';
    inputDoc.placeholder = 'Ej: 1097497124';

    grupoDoc.appendChild(labelDoc);
    grupoDoc.appendChild(inputDoc);

    // ── CAMPO NOMBRE ──────────────────────────────────────────────────────────
    const grupoNombre = document.createElement('div');
    grupoNombre.className = 'form__group admin-form__grupo';

    const labelNombre = document.createElement('label');
    labelNombre.setAttribute('for', 'admin-input-name');
    labelNombre.className   = 'form__label';
    labelNombre.textContent = 'Nombre completo';

    // Campo de texto donde el admin escribe el nombre completo del nuevo usuario
    const inputNombre = document.createElement('input');
    inputNombre.type        = 'text';
    inputNombre.id          = 'admin-input-name';
    inputNombre.className   = 'form__input';
    inputNombre.placeholder = 'Ej: María López';

    grupoNombre.appendChild(labelNombre);
    grupoNombre.appendChild(inputNombre);

    // ── CAMPO CORREO ──────────────────────────────────────────────────────────
    const grupoEmail = document.createElement('div');
    grupoEmail.className = 'form__group admin-form__grupo';

    const labelEmail = document.createElement('label');
    labelEmail.setAttribute('for', 'admin-input-email');
    labelEmail.className   = 'form__label';
    labelEmail.textContent = 'Correo electrónico';

    // Campo de correo electrónico — type="email" activa la validación nativa del navegador
    const inputEmail = document.createElement('input');
    inputEmail.type        = 'email';
    inputEmail.id          = 'admin-input-email';
    inputEmail.className   = 'form__input';
    inputEmail.placeholder = 'Ej: maria@correo.com';

    grupoEmail.appendChild(labelEmail);
    grupoEmail.appendChild(inputEmail);

    // ── BOTÓN CREAR ───────────────────────────────────────────────────────────
    const boton = document.createElement('button');
    boton.type      = 'submit'; // type="submit" hace que el clic en el botón envíe el formulario
    boton.className = 'btn btn--primary';

    // Span interior requerido por los estilos del botón del proyecto
    const spanBoton = document.createElement('span');
    spanBoton.className   = 'btn__text';
    spanBoton.textContent = 'Crear Usuario';
    boton.appendChild(spanBoton);

    // Ensamblamos todos los grupos y el botón en el formulario
    form.appendChild(grupoDoc);
    form.appendChild(grupoNombre);
    form.appendChild(grupoEmail);
    form.appendChild(boton);

    return form;
}

// Función privada que pide los usuarios al servidor y construye la tabla con todos ellos
// Se llama al montar el panel y después de crear o eliminar un usuario para actualizarla
async function renderizarTablaUsuarios(contenedor) {

    // Vaciamos el contenedor antes de pintar la tabla actualizada
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    // Pedimos la lista completa de usuarios al servidor
    const usuarios = await obtenerTodosLosUsuarios();

    // Si no hay usuarios o el servidor falló, mostramos un mensaje informativo
    if (!usuarios || usuarios.length === 0) {
        const parrafoVacio = document.createElement('p');
        parrafoVacio.className   = 'admin-vacio';
        parrafoVacio.textContent = 'No hay usuarios registrados.';
        contenedor.appendChild(parrafoVacio);
        return;
    }

    // Creamos la tabla con las clases de estilo del proyecto
    const tabla = document.createElement('table');
    tabla.className = 'tasks-table admin-tabla';

    // Creamos el encabezado de la tabla con los nombres de las columnas
    const thead    = document.createElement('thead');
    const filaHead = document.createElement('tr');

    // Creamos cada celda del encabezado con scope="col" para accesibilidad
    ['ID', 'Documento', 'Nombre', 'Correo', 'Acciones'].forEach(function(texto) {
        const th = document.createElement('th');
        th.setAttribute('scope', 'col');
        th.textContent = texto;
        filaHead.appendChild(th);
    });

    thead.appendChild(filaHead);
    tabla.appendChild(thead);

    // Creamos el cuerpo de la tabla
    const tbody = document.createElement('tbody');

    // Por cada usuario creamos una fila con sus datos
    usuarios.forEach(function(usuario) {

        const fila = document.createElement('tr');

        // Celda con el ID interno del usuario en el sistema
        const celdaId = document.createElement('td');
        celdaId.textContent = usuario.id;

        // Celda con el número de documento de identidad
        const celdaDoc = document.createElement('td');
        celdaDoc.textContent = usuario.documento;

        // Celda con el nombre completo del usuario
        const celdaNombre = document.createElement('td');
        celdaNombre.textContent = usuario.name;
        // Si el usuario está desactivado, agregamos un badge "Inactivo" junto a su nombre
        if (usuario.is_active === 0 || usuario.is_active === false) {
            const badge = document.createElement('span');
            badge.className   = 'status-badge status-inactivo';
            badge.textContent = 'Inactivo';
            badge.style.marginLeft = '6px';
            celdaNombre.appendChild(badge);
        }

        // Celda con el correo electrónico del usuario
        const celdaEmail = document.createElement('td');
        celdaEmail.textContent = usuario.email;

        // Celda de acciones con el botón para desactivar o reactivar el usuario
        const celdaAcciones = document.createElement('td');
        const divAcciones   = document.createElement('div');
        divAcciones.className = 'task-actions';

        // Determinamos si el usuario está activo para mostrar el botón correspondiente
        const estaActivo = usuario.is_active === 1 || usuario.is_active === true;
        const btnEliminar = document.createElement('button');
        btnEliminar.type        = 'button';
        btnEliminar.className   = 'btn-action btn-action--delete';
        // Si está activo mostramos "Desactivar", si está inactivo mostramos "Reactivar"
        btnEliminar.textContent = estaActivo ? '🗑 Desactivar' : '✅ Reactivar';
        // Guardamos los datos del usuario en el botón para usarlos en el listener delegado
        btnEliminar.dataset.id     = usuario.id;
        btnEliminar.dataset.nombre = usuario.name;
        btnEliminar.dataset.activo = estaActivo ? '1' : '0';

        divAcciones.appendChild(btnEliminar);
        celdaAcciones.appendChild(divAcciones);

        // Ensamblamos todas las celdas en la fila
        fila.appendChild(celdaId);
        fila.appendChild(celdaDoc);
        fila.appendChild(celdaNombre);
        fila.appendChild(celdaEmail);
        fila.appendChild(celdaAcciones);
        tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    contenedor.appendChild(tabla);

    // Registramos un solo listener en el tbody para manejar todos los botones de acción
    // Esto es más eficiente que registrar un listener individual por cada botón
    tbody.addEventListener('click', async function(event) {

        // Subimos desde el elemento clicado hasta encontrar el botón que tiene data-id
        const boton = event.target.closest('[data-id]');
        // Si el clic no fue en un botón de acción, ignoramos el evento
        if (!boton) return;

        // Leemos los datos del usuario desde los atributos del botón
        const userId        = boton.dataset.id;
        const nombreUsuario = boton.dataset.nombre;
        const estaActivo    = boton.dataset.activo === '1';

        // Si el usuario está inactivo, mostramos el cuadro de confirmación para reactivarlo
        if (!estaActivo) {
            const confirmar = await mostrarConfirmacion(
                `¿Reactivar a ${nombreUsuario}?`,
                'El usuario podrá volver a iniciar sesión en el sistema.'
            );
            if (!confirmar) return;
            try {
                // Importamos la función dinámicamente para reactivar el usuario
                const { reactivarUsuario } = await import('../api/usuariosApi.js');
                const reactivado = await reactivarUsuario(userId);
                if (reactivado) {
                    await mostrarNotificacion(`${nombreUsuario} fue reactivado correctamente`, 'exito');
                    // Recargamos la tabla para reflejar el cambio
                    await renderizarTablaUsuarios(contenedor);
                } else {
                    await mostrarNotificacion('Error al reactivar el usuario', 'error');
                }
            } catch (error) {
                await mostrarNotificacion(error.message || 'Error al reactivar el usuario', 'error');
            }
            return;
        }

        // Si el usuario está activo, mostramos el modal de eliminación con las dos opciones:
        // eliminación estándar (solo si no tiene tareas activas) o eliminación forzosa (siempre)
        const resultado = await mostrarModalEliminarUsuario(nombreUsuario, estaActivo);
        // Si el admin canceló el modal, no hacemos nada
        if (!resultado) return;

        let exitoso = false;
        try {
            if (resultado.forzoso) {
                // Eliminación forzosa: elimina sin importar el estado de las tareas del usuario
                exitoso = await forceEliminarUsuario(userId, resultado.motivo);
            } else {
                // Eliminación estándar: falla si el usuario tiene tareas pendientes o en progreso
                exitoso = await eliminarUsuario(userId, resultado.motivo);
            }
        } catch (error) {
            // Si el servidor rechazó la eliminación, mostramos el mensaje de error específico
            await mostrarNotificacion(error.message || 'Error al eliminar el usuario', 'error');
            return;
        }

        // Si la eliminación fue exitosa, mostramos el mensaje y recargamos la tabla
        if (exitoso) {
            const mensaje = resultado.forzoso
                ? 'Usuario eliminado permanentemente (cierre forzoso)'
                : `${nombreUsuario} fue eliminado correctamente`;
            await mostrarNotificacion(mensaje, 'exito');
            await renderizarTablaUsuarios(contenedor);
        } else {
            await mostrarNotificacion('Error al procesar la operación', 'error');
        }
    });
}

// Función privada que construye la sección de lista de todas las tareas del sistema
// Muestra una tabla con el título, estado y usuarios asignados de cada tarea
async function montarSeccionTareas(contenedor) {

    // Creamos la tarjeta de la sección de tareas
    const seccion = document.createElement('div');
    seccion.className = 'card admin-seccion';

    // Creamos el título de la sección
    const tituloSeccion = document.createElement('h3');
    tituloSeccion.className   = 'admin-seccion__titulo';
    tituloSeccion.textContent = 'Todas las Tareas del Sistema';
    seccion.appendChild(tituloSeccion);

    // Pedimos todas las tareas al servidor
    let tareas = [];
    try {
        tareas = await obtenerTodasLasTareas();
    } catch (error) {
        console.error('Error al obtener tareas para el panel admin:', error);
    }

    // Si no hay tareas, mostramos un mensaje informativo y terminamos
    if (tareas.length === 0) {
        const mensaje = document.createElement('p');
        mensaje.className   = 'admin-vacio';
        mensaje.textContent = 'No hay tareas registradas en el sistema.';
        seccion.appendChild(mensaje);
        contenedor.appendChild(seccion);
        return;
    }

    // Creamos la tabla de tareas con las clases de estilo del proyecto
    const tabla = document.createElement('table');
    tabla.className = 'tasks-table admin-tabla';

    // Creamos el encabezado con tres columnas
    const thead    = document.createElement('thead');
    const filaHead = document.createElement('tr');

    ['Título', 'Estado', 'Usuarios asignados'].forEach(function(texto) {
        const th = document.createElement('th');
        th.setAttribute('scope', 'col');
        th.textContent = texto;
        filaHead.appendChild(th);
    });

    thead.appendChild(filaHead);
    tabla.appendChild(thead);

    // Creamos el cuerpo de la tabla
    const tbody = document.createElement('tbody');

    // Por cada tarea creamos una fila con sus datos
    tareas.forEach(function(tarea) {

        const fila = document.createElement('tr');

        // Celda con el título de la tarea
        const celdaTitulo = document.createElement('td');
        celdaTitulo.textContent = tarea.title;

        // Celda con el badge de color del estado de la tarea
        const celdaEstado = document.createElement('td');
        const badge = document.createElement('span');
        badge.classList.add('status-badge', `status-${tarea.status}`);
        badge.textContent = formatearEstado(tarea.status);
        celdaEstado.appendChild(badge);

        // Celda con los nombres de los usuarios asignados (ya resueltos por el servidor)
        const celdaUsuarios = document.createElement('td');
        celdaUsuarios.textContent = tarea.assignedUsersDisplay || 'Sin asignar';

        fila.appendChild(celdaTitulo);
        fila.appendChild(celdaEstado);
        fila.appendChild(celdaUsuarios);
        tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    seccion.appendChild(tabla);
    contenedor.appendChild(seccion);
}

// Función privada que convierte el valor técnico del estado en texto legible en español
// Se usa en los badges de la tabla de tareas del panel de administración
function formatearEstado(estado) {
    if (estado === 'pendiente')            return 'Pendiente';
    if (estado === 'en_progreso')          return 'En Progreso';
    if (estado === 'completada')           return 'Completada';
    if (estado === 'pendiente_aprobacion') return 'Por aprobar';
    if (estado === 'reprobada')            return 'Reprobada';
    // Si el estado no coincide con ninguno de los anteriores, retornamos el valor original
    return estado;
}
