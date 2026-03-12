// MÓDULO: ui/modoUI.js
// CAPA: UI — control de modos de navegación
// Responsabilidad: gestionar qué vista está activa (inicio, usuario, admin)
// y la visibilidad dinámica de cards dentro de cada modo.
// No contiene lógica de negocio ni fetch de datos de usuario individual.

import { API_BASE_URL } from '../utils/config.js';

// Referencias a las tres vistas principales
const pantallaInicio = document.getElementById('pantallaInicio');
const vistaUsuario   = document.getElementById('vistaUsuario');
const vistaAdmin     = document.getElementById('vistaAdmin');

// Oculta todas las vistas antes de mostrar la activa
function ocultarTodo() {
    pantallaInicio.classList.add('hidden');
    vistaUsuario.classList.add('hidden');
    vistaAdmin.classList.add('hidden');
}

export function activarModoInicio() {
    ocultarTodo();
    pantallaInicio.classList.remove('hidden');
    document.body.dataset.modo = 'inicio';
}

export function activarModoUsuario() {
    ocultarTodo();
    vistaUsuario.classList.remove('hidden');
    document.body.dataset.modo = 'usuario';
}

export function activarModoAdmin() {
    ocultarTodo();
    vistaAdmin.classList.remove('hidden');
    document.body.dataset.modo = 'admin';
    // Al entrar al admin, cargamos automáticamente usuarios y tareas
    cargarTablaUsuarios();
    cargarTodasLasTareas();
}

// Carga todos los usuarios del servidor y los pinta en la tabla del admin
export async function cargarTablaUsuarios() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
        // Usamos el endpoint sin prefijo /api para compatibilidad con server.js
        const res      = await fetch(`${API_BASE_URL}/users`);
        const usuarios = await res.json();

        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

        if (usuarios.length === 0) {
            const fila  = document.createElement('tr');
            const celda = document.createElement('td');
            celda.colSpan     = 5;
            celda.textContent = 'No hay usuarios registrados';
            celda.style.textAlign = 'center';
            celda.style.color     = '#9ca3af';
            fila.appendChild(celda);
            tbody.appendChild(fila);
            return;
        }

        usuarios.forEach(function(usuario, indice) {
            const fila = document.createElement('tr');

            const celdaNum = document.createElement('td');
            celdaNum.textContent = indice + 1;

            // Columna "Documento": mostramos usuario.documento, no usuario.id
            const celdaDoc = document.createElement('td');
            celdaDoc.textContent = usuario.documento || usuario.id;

            const celdaNombre = document.createElement('td');
            celdaNombre.textContent = usuario.name;

            const celdaEmail = document.createElement('td');
            celdaEmail.textContent = usuario.email;

            const celdaAcciones = document.createElement('td');
            const contenedor    = document.createElement('div');
            contenedor.classList.add('task-actions');

            // Botón: ver tareas del usuario y opción de asignarle una
            const btnVerTareas = document.createElement('button');
            btnVerTareas.textContent = 'Ver / Asignar';
            btnVerTareas.classList.add('btn-action', 'btn-action--edit');
            btnVerTareas.type = 'button';
            btnVerTareas.addEventListener('click', function() {
                mostrarPanelUsuarioAdmin(usuario);
            });

            // Botón: eliminar usuario
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = '🗑️ Eliminar';
            btnEliminar.classList.add('btn-action', 'btn-action--delete');
            btnEliminar.type = 'button';
            btnEliminar.addEventListener('click', async function() {
                const ok = confirm(`Eliminar usuario ${usuario.name}?`);
                if (!ok) return;
                try {
                    await fetch(`${API_BASE_URL}/users/${usuario.id}`, { method: 'DELETE' });
                    cargarTablaUsuarios();
                    cargarTodasLasTareas();
                    // Si el panel mostraba a este usuario, lo ocultamos
                    const panel = document.getElementById('adminUserPanel');
                    const panelId = document.getElementById('adminPanelUserId');
                    if (panel && panelId && panelId.value.toString() === usuario.id.toString()) {
                        panel.classList.add('hidden');
                    }
                } catch (err) {
                    console.error('Error eliminando usuario:', err);
                }
            });

            contenedor.appendChild(btnVerTareas);
            contenedor.appendChild(btnEliminar);
            celdaAcciones.appendChild(contenedor);

            fila.appendChild(celdaNum);
            fila.appendChild(celdaDoc);
            fila.appendChild(celdaNombre);
            fila.appendChild(celdaEmail);
            fila.appendChild(celdaAcciones);
            tbody.appendChild(fila);
        });

    } catch (err) {
        console.error('Error cargando usuarios:', err);
    }
}

// Carga todas las tareas del sistema y las pinta en la tabla del admin
export async function cargarTodasLasTareas() {
    const tbody = document.getElementById('adminTasksTableBody');
    if (!tbody) return;

    try {
        const res    = await fetch(`${API_BASE_URL}/tasks`);
        const tareas = await res.json();

        // Guardamos en variable del módulo para filtrar/ordenar sin nueva petición
        todasLasTareas = tareas;
        aplicarFiltrosAdmin();

    } catch (err) {
        console.error('Error cargando tareas:', err);
    }
}

// Fuente de verdad del admin — todas las tareas del sistema
let todasLasTareas = [];

// Aplica los filtros y orden activos sobre todasLasTareas y repinta la tabla
export function aplicarFiltrosAdmin() {
    const tbody         = document.getElementById('adminTasksTableBody');
    const contadorEl    = document.getElementById('adminTasksCount');
    const filtroEstado  = document.getElementById('adminFiltroEstado');
    const filtroUsuario = document.getElementById('adminFiltroUsuario');
    const ordenSelect   = document.getElementById('adminOrdenSelect');

    if (!tbody) return;

    let resultado = [...todasLasTareas];

    // Filtro por estado
    const estado = filtroEstado ? filtroEstado.value : '';
    if (estado) {
        resultado = resultado.filter(t => t.status === estado);
    }

    // Filtro por nombre, documento o id del usuario asignado
    const termino = filtroUsuario ? filtroUsuario.value.trim().toLowerCase() : '';
    if (termino) {
        resultado = resultado.filter(t =>
            (t.userName && t.userName.toLowerCase().includes(termino)) ||
            (t.userId   && t.userId.toString().includes(termino))
        );
    }

    // Ordenamiento
    const orden = ordenSelect ? ordenSelect.value : '';
    if (orden === 'titulo_asc') {
        resultado.sort((a, b) => a.title.localeCompare(b.title));
    } else if (orden === 'titulo_desc') {
        resultado.sort((a, b) => b.title.localeCompare(a.title));
    } else if (orden === 'estado') {
        const prioridad = { pendiente: 0, en_progreso: 1, completada: 2 };
        resultado.sort((a, b) => (prioridad[a.status] || 0) - (prioridad[b.status] || 0));
    } else if (orden === 'usuario') {
        resultado.sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
    }

    // Vaciamos la tabla antes de repintar
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (contadorEl) {
        contadorEl.textContent = `${resultado.length} ${resultado.length === 1 ? 'tarea' : 'tareas'}`;
    }

    if (resultado.length === 0) {
        const fila  = document.createElement('tr');
        const celda = document.createElement('td');
        celda.colSpan     = 6;
        celda.textContent = 'No hay tareas que coincidan con los filtros';
        celda.style.textAlign = 'center';
        celda.style.color     = '#9ca3af';
        fila.appendChild(celda);
        tbody.appendChild(fila);
        return;
    }

    resultado.forEach(function(tarea, indice) {
        const fila = document.createElement('tr');

        const celdaNum = document.createElement('td');
        celdaNum.textContent = indice + 1;

        const celdaTitulo = document.createElement('td');
        celdaTitulo.textContent = tarea.title;

        const celdaDesc = document.createElement('td');
        celdaDesc.textContent = tarea.description;

        const celdaEstado = document.createElement('td');
        const badge = document.createElement('span');
        badge.classList.add('status-badge', `status-${tarea.status}`);
        badge.textContent = formatearEstado(tarea.status);
        celdaEstado.appendChild(badge);

        // Muestra el nombre del usuario asignado; si no tiene, lo indica
        const celdaUsuario = document.createElement('td');
        celdaUsuario.textContent = tarea.userName || 'Sin asignar';

        const celdaAcciones = document.createElement('td');
        const contenedor    = document.createElement('div');
        contenedor.classList.add('task-actions');

        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = '🗑️ Eliminar';
        btnEliminar.classList.add('btn-action', 'btn-action--delete');
        btnEliminar.type = 'button';
        btnEliminar.addEventListener('click', async function() {
            const ok = confirm(`Eliminar la tarea "${tarea.title}"?`);
            if (!ok) return;
            try {
                await fetch(`${API_BASE_URL}/tasks/${tarea.id}`, { method: 'DELETE' });
                cargarTodasLasTareas();
            } catch (err) {
                console.error('Error eliminando tarea:', err);
            }
        });

        contenedor.appendChild(btnEliminar);
        celdaAcciones.appendChild(contenedor);

        fila.appendChild(celdaNum);
        fila.appendChild(celdaTitulo);
        fila.appendChild(celdaDesc);
        fila.appendChild(celdaEstado);
        fila.appendChild(celdaUsuario);
        fila.appendChild(celdaAcciones);
        tbody.appendChild(fila);
    });
}

// Muestra el panel lateral del usuario seleccionado en el admin
// Carga sus tareas actuales y deja activo el formulario de asignar tarea
export async function mostrarPanelUsuarioAdmin(usuario) {
    const panel = document.getElementById('adminUserPanel');
    if (!panel) return;

    // Mostramos el nombre y documento del usuario en el encabezado del panel
    const tituloEl = panel.querySelector('#adminPanelUserName');
    if (tituloEl) tituloEl.textContent = `${usuario.name} — Doc: ${usuario.documento || usuario.id}`;

    try {
        // Cargamos las tareas cuyo userId coincide con el id interno del usuario
        const res    = await fetch(`${API_BASE_URL}/tasks?userId=${usuario.id}`);
        const tareas = await res.json();

        const listaTareas = document.getElementById('adminPanelTareasList');
        if (!listaTareas) return;

        while (listaTareas.firstChild) listaTareas.removeChild(listaTareas.firstChild);

        if (tareas.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'Este usuario no tiene tareas asignadas.';
            p.classList.add('panel-vacio');
            listaTareas.appendChild(p);
        } else {
            tareas.forEach(function(tarea) {
                const item = document.createElement('div');
                item.classList.add('panel-tarea-item');

                const textoTarea = document.createElement('span');
                textoTarea.textContent = tarea.title;

                const badge = document.createElement('span');
                badge.classList.add('status-badge', `status-${tarea.status}`);
                badge.textContent = formatearEstado(tarea.status);

                item.appendChild(textoTarea);
                item.appendChild(badge);
                listaTareas.appendChild(item);
            });
        }

        // Guardamos el id interno y el nombre del usuario en los inputs ocultos
        // para que el formulario de asignar tarea los use
        const inputId   = document.getElementById('adminPanelUserId');
        const inputName = document.getElementById('adminPanelUserNameHidden');
        if (inputId)   inputId.value   = usuario.id;
        if (inputName) inputName.value = usuario.name;

    } catch (err) {
        console.error('Error cargando tareas del usuario en admin:', err);
    }

    panel.classList.remove('hidden');

    // Scroll suave hasta el panel para que el admin lo vea sin buscar
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatearEstado(estado) {
    const mapa = { pendiente: 'Pendiente', en_progreso: 'En Progreso', completada: 'Completada' };
    return mapa[estado] || estado;
}

// Registra todos los eventos de navegación y del panel admin
export function registrarEventosNavegacion() {
    document.getElementById('btnAccesoUsuario')
        .addEventListener('click', activarModoUsuario);
    document.getElementById('btnAccesoAdmin')
        .addEventListener('click', activarModoAdmin);
    document.getElementById('btnVolverUsuario')
        .addEventListener('click', activarModoInicio);
    document.getElementById('btnVolverAdmin')
        .addEventListener('click', activarModoInicio);

    // Botón actualizar tabla de usuarios
    const btnRefrescar = document.getElementById('btnRefrescarUsuarios');
    if (btnRefrescar) btnRefrescar.addEventListener('click', cargarTablaUsuarios);

    // Filtros del admin — botón aplicar
    const btnAplicar = document.getElementById('adminBtnAplicarFiltros');
    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltrosAdmin);

    // Limpiar filtros del admin
    const btnLimpiar = document.getElementById('adminBtnLimpiarFiltros');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', function() {
            const fe = document.getElementById('adminFiltroEstado');
            const fu = document.getElementById('adminFiltroUsuario');
            const fo = document.getElementById('adminOrdenSelect');
            if (fe) fe.value = '';
            if (fu) fu.value = '';
            if (fo) fo.value = '';
            aplicarFiltrosAdmin();
        });
    }

    // Exportar JSON con todas las tareas del sistema
    const btnExportar = document.getElementById('adminBtnExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', function() {
            if (todasLasTareas.length === 0) {
                alert('No hay tareas para exportar');
                return;
            }
            const json = JSON.stringify(todasLasTareas, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = 'tareas_sistema.json';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Formulario de búsqueda admin — acepta id, nombre o número de documento
    const formBusqueda = document.getElementById('adminSearchUserForm');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', async function(event) {
            event.preventDefault();
            const input = document.getElementById('adminUserDocument');
            if (!input || !input.value.trim()) return;

            const termino = input.value.trim().toLowerCase();

            try {
                const res      = await fetch(`${API_BASE_URL}/users`);
                const usuarios = await res.json();

                // Busca coincidencia exacta por id o documento, o parcial por nombre
                const encontrado = usuarios.find(u =>
                    u.id.toString() === termino ||
                    (u.documento && u.documento.toString() === termino) ||
                    u.name.toLowerCase().includes(termino)
                );

                if (!encontrado) {
                    alert('Usuario no encontrado');
                    return;
                }

                mostrarPanelUsuarioAdmin(encontrado);

            } catch (err) {
                console.error('Error buscando usuario en admin:', err);
            }
        });
    }

    // Formulario de crear usuario en el admin
    // El campo "Numero de documento" se envía como campo 'documento', no como 'id'
    // json-server asigna el id numérico automáticamente
    const formCrear = document.getElementById('createUserForm');
    if (formCrear) {
        formCrear.addEventListener('submit', async function(event) {
            event.preventDefault();
            const inputDoc    = document.getElementById('newUserId');
            const inputNombre = document.getElementById('newUserName');
            const inputEmail  = document.getElementById('newUserEmail');

            const errorDoc    = document.getElementById('newUserIdError');
            const errorNombre = document.getElementById('newUserNameError');
            const errorEmail  = document.getElementById('newUserEmailError');

            // Limpiamos errores anteriores
            if (errorDoc)    { errorDoc.textContent    = ''; inputDoc.classList.remove('error'); }
            if (errorNombre) { errorNombre.textContent = ''; inputNombre.classList.remove('error'); }
            if (errorEmail)  { errorEmail.textContent  = ''; inputEmail.classList.remove('error'); }

            let valido = true;
            if (!inputDoc.value.trim()) {
                if (errorDoc) errorDoc.textContent = 'El documento es obligatorio';
                inputDoc.classList.add('error');
                valido = false;
            }
            if (!inputNombre.value.trim()) {
                if (errorNombre) errorNombre.textContent = 'El nombre es obligatorio';
                inputNombre.classList.add('error');
                valido = false;
            }
            if (!inputEmail.value.trim()) {
                if (errorEmail) errorEmail.textContent = 'El correo es obligatorio';
                inputEmail.classList.add('error');
                valido = false;
            }
            if (!valido) return;

            // El usuario nuevo lleva 'documento' como campo separado del 'id'
            // json-server asigna el id numérico auto-incremental
            const nuevoUsuario = {
                documento: inputDoc.value.trim(),
                name:      inputNombre.value.trim(),
                email:     inputEmail.value.trim()
            };

            try {
                const res = await fetch(`${API_BASE_URL}/users`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(nuevoUsuario)
                });
                if (!res.ok) throw new Error('Error al crear usuario');

                const usuarioCreado = await res.json();

                inputDoc.value    = '';
                inputNombre.value = '';
                inputEmail.value  = '';

                // Actualizamos la tabla y abrimos el panel del nuevo usuario
                // para que el admin pueda asignarle una tarea de inmediato
                cargarTablaUsuarios();
                mostrarPanelUsuarioAdmin(usuarioCreado);

            } catch (err) {
                console.error('Error creando usuario:', err);
                alert('No se pudo crear el usuario. Verifica que el servidor esté activo.');
            }
        });
    }

    // Formulario de asignar tarea desde el panel del usuario en admin
    const formAsignar = document.getElementById('adminAsignarTareaForm');
    if (formAsignar) {
        formAsignar.addEventListener('submit', async function(event) {
            event.preventDefault();
            const userId   = document.getElementById('adminPanelUserId').value;
            const inputName = document.getElementById('adminPanelUserNameHidden');
            const userName  = inputName ? inputName.value : '';
            const titulo    = document.getElementById('adminTareaTitulo').value.trim();
            const desc      = document.getElementById('adminTareaDesc').value.trim();
            const estado    = document.getElementById('adminTareaEstado').value;

            if (!titulo || !estado) {
                alert('El titulo y el estado son obligatorios');
                return;
            }

            const tarea = {
                title:       titulo,
                description: desc,
                status:      estado,
                // userId guarda el id numérico del usuario, no el documento
                userId:      parseInt(userId, 10) || userId,
                userName:    userName,
                completed:   estado === 'completada'
            };

            try {
                const res = await fetch(`${API_BASE_URL}/tasks`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(tarea)
                });
                if (!res.ok) throw new Error('Error al asignar tarea');

                // Limpiamos el formulario de asignar
                document.getElementById('adminTareaTitulo').value = '';
                document.getElementById('adminTareaDesc').value   = '';
                document.getElementById('adminTareaEstado').value = '';

                // Recargamos el panel del usuario y la tabla general
                const res2     = await fetch(`${API_BASE_URL}/users`);
                const usuarios = await res2.json();
                const usuario  = usuarios.find(u => u.id.toString() === userId.toString());
                if (usuario) mostrarPanelUsuarioAdmin(usuario);
                cargarTodasLasTareas();

            } catch (err) {
                console.error('Error asignando tarea:', err);
            }
        });
    }
}