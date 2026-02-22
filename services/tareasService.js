// MÓDULO: services/tareasService.js
// CAPA:   Services (Lógica intermedia entre API y UI)

// Responsabilidad ÚNICA: coordinar el flujo completo de cada
// operación. Recibe eventos del DOM, llama a la API, actualiza
// el estado local y ordena a la UI que se actualice.

// Este módulo es el "cerebro" de la aplicación:
//   - Conoce la API (puede importar de api/)
//   - Conoce la UI (puede importar de ui/)
//   - Conoce el estado (mantiene variables de estado propias)
//   - Conoce las validaciones (puede importar de utils/)

// REGLA CLAVE: la UI NUNCA llama directamente a la API.
// Todo pasa por este service.
// Flujo: Usuario → Evento → service → api → respuesta → service → ui → DOM

// RF-01 READ   -> manejarBusquedaUsuario
// RF-02 CREATE -> manejarRegistroTarea
// RF-03 UPDATE -> manejarEdicionTarea, manejarGuardadoEdicion
// RF-04 DELETE -> manejarEliminacionTarea

// Dependencias:
//   api/tareasApi.js      (peticiones HTTP)
//   ui/tareasUI.js        (actualización visual)
//   utils/validaciones.js (validación de formularios)

// ----- IMPORTACIONES DESDE LA CAPA API -----
// Solo este módulo (service) puede importar funciones de la capa api
// La UI nunca debe conocer la existencia de la API directamente
import {
    buscarUsuarioPorDocumento, // RF-01: GET /users
    registrarTarea,            // RF-02: POST /tasks
    actualizarTarea,           // RF-03: PATCH /tasks/:id
    eliminarTarea              // RF-04: DELETE /tasks/:id
} from '../api/tareasApi.js';

// ----- IMPORTACIONES DESDE LA CAPA UI -----
// Usamos las funciones de UI para actualizar lo que el usuario ve en pantalla
import {
    mostrarDatosUsuario,     // Muestra nombre, email e ID del usuario encontrado
    ocultarDatosUsuario,     // Oculta y limpia la sección de datos del usuario
    mostrarFormularioTareas, // Revela el formulario de registro de tareas
    ocultarFormularioTareas, // Oculta el formulario de tareas
    agregarTareaATabla,      // Inserta una fila nueva en la tabla de tareas
    limpiarFormularioTareas, // Limpia los campos del formulario de tareas
    actualizarFilaTarea,     // Actualiza visualmente una fila existente (RF-03)
    eliminarFilaTarea,       // Elimina visualmente una fila de la tabla (RF-04)
    mostrarModalEdicion,     // Muestra el modal de edición con datos precargados (RF-03)
    ocultarModalEdicion      // Oculta y limpia el modal de edición (RF-03)
} from '../ui/tareasUI.js';

// ----- IMPORTACIONES DESDE LA CAPA UTILS -----
// Usamos las funciones de validación para verificar los formularios antes de procesarlos
import {
    validarFormularioBusqueda, // Valida el formulario de búsqueda de usuario
    validarFormularioTareas,   // Valida el formulario de registro de tareas
    mostrarError,              // Muestra error en un campo del DOM
    limpiarError               // Limpia el error de un campo del DOM
} from '../utils/validaciones.js';

// ESTADO LOCAL DEL MÓDULO

// Estas variables mantienen el estado de la aplicación en memoria.
// Solo este service las conoce y modifica, respetando la
// separación de responsabilidades (la UI no conoce el estado).

// Usuario actualmente seleccionado (null si no hay búsqueda activa)
let usuarioActual = null;

// Arreglo con todas las tareas registradas durante la sesión
let tareasRegistradas = [];

// Contador total de tareas (para numerar las filas de la tabla)
let contadorTareas = 0;

// FUNCIONES PRIVADAS (auxiliares, no exportadas)

// Reinicia el estado de la aplicación a sus valores iniciales
// Se llama antes de cada nueva búsqueda para limpiar datos del usuario anterior
function reiniciarEstadoAplicacion() {
    // Limpiamos el usuario actual
    usuarioActual = null;

    // Ocultamos y vaciamos la sección de datos del usuario anterior
    ocultarDatosUsuario();

    // Ocultamos el formulario de tareas porque ya no hay usuario activo
    ocultarFormularioTareas();
}

// RF-01 – BUSCAR USUARIO (READ)

// Maneja el evento submit del formulario de búsqueda de usuario
// Valida, llama a la API y actualiza la UI según el resultado
// Es async porque usa await para esperar la respuesta del servidor
// Parámetro: event - El objeto Event del formulario (para cancelar el submit por defecto)
export async function manejarBusquedaUsuario(event) {
    // ----- PASO 1: PREVENIR COMPORTAMIENTO POR DEFECTO -----
    // Por defecto, al enviar un formulario el navegador recarga la página
    // preventDefault() cancela esa recarga para que nosotros manejemos el envío
    event.preventDefault();

    // ----- PASO 2: OBTENER LOS ELEMENTOS DEL FORMULARIO PARA VALIDAR -----
    const inputDocumento = document.getElementById('userDocument');
    const errorDocumento = document.getElementById('userDocumentError');

    // ----- PASO 3: VALIDAR EL FORMULARIO -----
    // Si el campo está vacío, mostramos error y detenemos la ejecución
    const esValido = validarFormularioBusqueda(inputDocumento, errorDocumento);
    if (!esValido) return;

    // ----- PASO 4: OBTENER EL VALOR DEL DOCUMENTO -----
    // trim() elimina espacios accidentales al inicio y al final
    const valorDocumento = inputDocumento.value.trim();

    // ----- PASO 5: REINICIAR EL ESTADO -----
    // Limpiamos datos del usuario anterior para evitar confusión visual
    reiniciarEstadoAplicacion();

    // ----- PASO 6: LLAMAR A LA CAPA API -----
    // Delegamos la petición HTTP al módulo de API (el service NO hace fetch directamente)
    const usuario = await buscarUsuarioPorDocumento(valorDocumento);

    // ----- PASO 7: PROCESAR EL RESULTADO Y ACTUALIZAR LA UI -----
    if (usuario) {
        // ----- USUARIO ENCONTRADO -----

        // Guardamos el usuario en el estado local del service
        usuarioActual = usuario;

        // Ordenamos a la UI que muestre los datos del usuario encontrado
        mostrarDatosUsuario(usuario);

        // Revelamos el formulario para que el usuario pueda registrar tareas
        mostrarFormularioTareas();

        // Limpiamos el input para que el usuario pueda hacer otra búsqueda
        inputDocumento.value = '';

        // Limpiamos cualquier error previo del campo de documento
        limpiarError(errorDocumento, inputDocumento);

    } else {
        // ----- USUARIO NO ENCONTRADO -----

        // Mostramos el mensaje de error bajo el campo de documento
        mostrarError(
            errorDocumento,
            inputDocumento,
            'No se encontró ningún usuario con ese documento'
        );

        // Nos aseguramos de que el estado quede sin usuario activo
        usuarioActual = null;
    }
}

// RF-02 – REGISTRAR TAREA (CREATE)

// Maneja el evento submit del formulario de registro de tareas
// Valida, construye el objeto, llama a la API y actualiza la tabla
// Parámetro: event - El objeto Event del formulario de tareas
export async function manejarRegistroTarea(event) {
    // ----- PASO 1: PREVENIR RECARGA DE PÁGINA -----
    event.preventDefault();

    // ----- PASO 2: VERIFICAR QUE HAY USUARIO SELECCIONADO -----
    // No tiene sentido registrar una tarea si no hay usuario activo
    if (!usuarioActual) {
        alert('⚠️ Primero debes buscar y seleccionar un usuario');
        return;
    }

    // ----- PASO 3: OBTENER LOS ELEMENTOS DEL FORMULARIO -----
    const inputTitulo     = document.getElementById('taskTitle');
    const inputDesc       = document.getElementById('taskDescription');
    const selectEst       = document.getElementById('taskStatus');
    const errorTitulo     = document.getElementById('taskTitleError');
    const errorDesc       = document.getElementById('taskDescriptionError');
    const errorEst        = document.getElementById('taskStatusError');

    // ----- PASO 4: VALIDAR EL FORMULARIO -----
    // validarFormularioTareas verifica todos los campos y muestra errores si los hay
    const esValido = validarFormularioTareas(
        inputTitulo, inputDesc, selectEst,
        errorTitulo, errorDesc, errorEst
    );
    if (!esValido) return;

    // ----- PASO 5: CONSTRUIR EL OBJETO DE TAREA -----
    // trim() elimina espacios accidentales al inicio y al final de los campos de texto
    const datosTarea = {
        title:       inputTitulo.value.trim(),
        description: inputDesc.value.trim(),
        status:      selectEst.value,             // El select no necesita trim
        userId:      usuarioActual.id,            // ID del usuario activo (del estado local)
        userName:    usuarioActual.name,          // Nombre para mostrarlo en la tabla
        completed:   selectEst.value === 'completada' // Campo extra de coherencia
    };

    // ----- PASO 6: LLAMAR A LA CAPA API -----
    // Enviamos la tarea al servidor; el service no hace fetch directamente
    const tareaCreada = await registrarTarea(datosTarea);

    // ----- PASO 7: PROCESAR EL RESULTADO -----
    if (tareaCreada) {
        // ----- REGISTRO EXITOSO -----

        // Guardamos la tarea en el estado local del service
        tareasRegistradas.push(tareaCreada);

        // Ordenamos a la UI que inserte la fila en la tabla
        agregarTareaATabla(tareaCreada, contadorTareas);

        // Incrementamos el contador para la próxima tarea
        contadorTareas++;

        // Limpiamos el formulario para dejarlo listo para la siguiente tarea
        limpiarFormularioTareas();

    } else {
        // ----- ERROR EN EL REGISTRO -----
        alert('❌ Error al registrar la tarea. Por favor, intenta nuevamente.');
    }
}

// RF-03 – EDITAR TAREA (UPDATE)

// Maneja el clic en el botón "Editar" de una fila
// Busca la tarea en el estado local y le ordena a la UI mostrar el modal precargado
// Parámetro: tarea - Objeto con los datos actuales de la tarea a editar
export function manejarEdicionTarea(tarea) {
    // ----- PASO 1: MOSTRAR EL MODAL CON LOS DATOS ACTUALES -----
    // Delegamos a la UI la responsabilidad de precargar los campos y mostrar el modal
    mostrarModalEdicion(tarea);

    // ----- PASO 2: OBTENER EL FORMULARIO DEL MODAL -----
    // El ID correcto del formulario en el HTML es 'editTaskForm' (no 'editForm')
    const formularioEdicion = document.getElementById('editTaskForm');

    // ----- PASO 3: DEFINIR EL HANDLER DE GUARDADO DEL MODAL -----
    // Definimos la función aquí dentro para que tenga acceso al ID de la tarea
    // a través del closure (captura la variable 'tarea' del scope externo)
    async function manejarGuardadoEdicion(event) {
        // Prevenimos el submit por defecto del formulario
        event.preventDefault();

        // ----- PASO 4: LEER LOS VALORES EDITADOS DEL MODAL -----
        const titulo      = document.getElementById('editTaskTitle').value.trim();
        const descripcion = document.getElementById('editTaskDescription').value.trim();
        const estado      = document.getElementById('editTaskStatus').value;
        const tareaId     = document.getElementById('editTaskId').value;

        // ----- PASO 5: CONSTRUIR EL OBJETO CON LOS DATOS ACTUALIZADOS -----
        const datosActualizados = {
            title:       titulo,
            description: descripcion,
            status:      estado,
            // Mantenemos el campo 'completed' sincronizado con el estado
            completed:   estado === 'completada'
        };

        // ----- PASO 6: LLAMAR A LA CAPA API -----
        // El service delega la petición PATCH al módulo de API
        const tareaActualizada = await actualizarTarea(tareaId, datosActualizados);

        // ----- PASO 7: PROCESAR EL RESULTADO -----
        if (tareaActualizada) {
            // ----- ACTUALIZACIÓN EXITOSA -----

            // Actualizamos la tarea en el estado local del service
            const indice = tareasRegistradas.findIndex(
                t => t.id.toString() === tareaActualizada.id.toString()
            );
            if (indice !== -1) {
                tareasRegistradas[indice] = tareaActualizada;
            }

            // Ordenamos a la UI que actualice la fila visualmente
            actualizarFilaTarea(tareaActualizada);

            // Cerramos y limpiamos el modal
            ocultarModalEdicion();

            // Notificamos al usuario del éxito
            alert('✅ Tarea actualizada exitosamente');

        } else {
            // ----- ERROR EN LA ACTUALIZACIÓN -----
            alert('❌ Error al actualizar la tarea. Por favor, intenta nuevamente.');
        }

        // ----- PASO 8: REMOVER EL LISTENER PARA EVITAR ACUMULACIÓN -----
        // Es crucial remover este listener para que no se ejecute múltiples veces
        // si el usuario abre el modal en varias ocasiones en la misma sesión
        formularioEdicion.removeEventListener('submit', manejarGuardadoEdicion);
    }

    // Registramos el listener de submit en el formulario del modal
    // Cada apertura del modal registra uno nuevo (el anterior fue removido al cerrar)
    formularioEdicion.addEventListener('submit', manejarGuardadoEdicion);

    // ----- PASO 9: MANEJAR EL BOTÓN CANCELAR Y EL BOTÓN X -----
    // El modal tiene dos formas de cerrarse sin guardar:
    //   - El botón "Cancelar" (id="editCancelBtn") dentro del formulario
    //   - El botón "✕" (id="editCloseBtn") en el encabezado del modal
    const botonCancelar = document.getElementById('editCancelBtn');
    const botonCerrar   = document.getElementById('editCloseBtn');

    // Función compartida: cierra el modal sin guardar nada
    function manejarCancelacionEdicion() {
        // Ocultamos el modal sin enviar datos al servidor
        ocultarModalEdicion();

        // Removemos el listener del submit para evitar acumulación
        formularioEdicion.removeEventListener('submit', manejarGuardadoEdicion);

        // Removemos los listeners de cancelar y cerrar para evitar acumulación
        botonCancelar.removeEventListener('click', manejarCancelacionEdicion);
        botonCerrar.removeEventListener('click', manejarCancelacionEdicion);
    }

    // Registramos el mismo handler en los dos botones de cierre
    botonCancelar.addEventListener('click', manejarCancelacionEdicion);
    botonCerrar.addEventListener('click', manejarCancelacionEdicion);
}

// RF-04 – ELIMINAR TAREA (DELETE)

// Maneja el clic en el botón "Eliminar" de una fila
// Pide confirmación y, si el usuario acepta, llama a la API y actualiza la UI
// Parámetro: tarea - Objeto con los datos de la tarea a eliminar
export async function manejarEliminacionTarea(tarea) {
    // ----- PASO 1: PEDIR CONFIRMACIÓN AL USUARIO -----
    // confirm() abre un diálogo nativo; retorna true si el usuario acepta
    const confirmado = confirm(
        `¿Estás seguro de que deseas eliminar la tarea "${tarea.title}"?\nEsta acción no se puede deshacer.`
    );

    // ----- PASO 2: VERIFICAR SI EL USUARIO CONFIRMÓ -----
    // Si canceló, detenemos la ejecución sin hacer nada
    if (!confirmado) return;

    // ----- PASO 3: LLAMAR A LA CAPA API -----
    // Enviamos la petición DELETE al servidor a través del módulo de API
    const exitoso = await eliminarTarea(tarea.id);

    // ----- PASO 4: PROCESAR EL RESULTADO -----
    if (exitoso) {
        // ----- ELIMINACIÓN EXITOSA -----

        // Eliminamos la tarea del estado local del service usando filter()
        // filter() crea un nuevo arreglo conservando solo las que NO tienen el ID eliminado
        tareasRegistradas = tareasRegistradas.filter(
            t => t.id.toString() !== tarea.id.toString()
        );

        // Ordenamos a la UI que elimine visualmente la fila de la tabla
        eliminarFilaTarea(tarea.id);

        // Notificamos al usuario del éxito
        alert('🗑️ Tarea eliminada exitosamente');

    } else {
        // ----- ERROR EN LA ELIMINACIÓN -----
        alert('❌ Error al eliminar la tarea. Por favor, intenta nuevamente.');
    }
}

// DELEGACIÓN DE EVENTOS DE LA TABLA (RF-03 y RF-04)

// Maneja los clics en los botones de Editar y Eliminar usando delegación de eventos
// La delegación consiste en registrar UN SOLO listener en el tbody (contenedor padre)
// en lugar de uno por cada botón individual.

// Ventajas:
//   1. Las filas se crean dinámicamente DESPUÉS de registrar este listener,
//      por lo que sus botones no existen al iniciar la app.
//      Con delegación, el tbody ya escucha cualquier clic dentro de él,
//      sin importar si el botón fue creado antes o después.
//   2. Mejor rendimiento: un solo listener cubre todos los botones de todas las filas.

// Parámetro: event - El objeto Event del clic en la tabla
function manejarClicEnTabla(event) {
    // ----- PASO 1: IDENTIFICAR EL ELEMENTO CLICADO -----
    // event.target es el elemento exacto donde el usuario hizo clic
    // Puede ser el botón mismo o un elemento hijo (como el emoji dentro del botón)
    const objetivo = event.target;

    // ----- PASO 2: VERIFICAR SI EL CLIC FUE EN UN BOTÓN DE ACCIÓN -----
    // closest() sube en el árbol del DOM hasta encontrar el botón con [data-action]
    // Esto maneja el caso de que el usuario haga clic en el emoji dentro del botón
    const botonAccion = objetivo.closest('[data-action]');

    // Si no se encontró ningún botón de acción en la cadena de clics, salimos
    if (!botonAccion) return;

    // ----- PASO 3: OBTENER EL ID Y LA ACCIÓN DEL BOTÓN -----
    const tareaId = botonAccion.dataset.id;     // ID de la tarea (guardado al crear la fila)
    const accion  = botonAccion.dataset.action; // 'edit' o 'delete'

    // ----- PASO 4: BUSCAR LA TAREA EN EL ESTADO LOCAL -----
    // Necesitamos el objeto completo de la tarea para pasárselo al handler correcto
    const tarea = tareasRegistradas.find(t => t.id.toString() === tareaId.toString());

    // Si no encontramos la tarea en el estado, salimos para evitar errores
    if (!tarea) {
        console.warn(`⚠️ No se encontró la tarea con id ${tareaId} en el estado local`);
        return;
    }

    // ----- PASO 5: EJECUTAR EL HANDLER CORRESPONDIENTE SEGÚN LA ACCIÓN -----
    switch (accion) {
        case 'edit':
            // El usuario hizo clic en Editar: abrimos el modal de edición (RF-03)
            manejarEdicionTarea(tarea);
            break;

        case 'delete':
            // El usuario hizo clic en Eliminar: pedimos confirmación y eliminamos (RF-04)
            manejarEliminacionTarea(tarea);
            break;

        default:
            // Acción desconocida: la registramos en consola para depuración
            console.warn(`⚠️ Acción desconocida: ${accion}`);
    }
}

// REGISTRO DE EVENT LISTENERS

// Registra TODOS los event listeners de la aplicación en sus elementos del DOM
// Esta función se llama UNA SOLA VEZ desde main.js al inicializar la app.
// Centralizar el registro aquí facilita agregar o quitar eventos en el futuro
// sin tocar main.js ni otros módulos.
export function registrarEventListeners() {
    // ----- FORMULARIO DE BÚSQUEDA DE USUARIO -----

    // 'submit' se activa cuando el usuario hace clic en "Buscar" o presiona Enter
    document.getElementById('searchUserForm')
        .addEventListener('submit', manejarBusquedaUsuario);

    // 'input' se activa con cada pulsación de tecla en el campo de documento
    // Usamos una función flecha para limpiar el error en tiempo real sin un handler externo
    document.getElementById('userDocument')
        .addEventListener('input', function () {
            limpiarError(
                document.getElementById('userDocumentError'),
                document.getElementById('userDocument')
            );
        });

    // ----- FORMULARIO DE REGISTRO DE TAREAS -----

    // 'submit' se activa al hacer clic en "Registrar Tarea"
    document.getElementById('taskForm')
        .addEventListener('submit', manejarRegistroTarea);

    // 'input' en el campo de título: limpia el error del título en tiempo real
    document.getElementById('taskTitle')
        .addEventListener('input', function () {
            limpiarError(
                document.getElementById('taskTitleError'),
                document.getElementById('taskTitle')
            );
        });

    // 'input' en el campo de descripción: limpia el error de descripción en tiempo real
    document.getElementById('taskDescription')
        .addEventListener('input', function () {
            limpiarError(
                document.getElementById('taskDescriptionError'),
                document.getElementById('taskDescription')
            );
        });

    // 'change' en el select de estado: limpia el error del estado al seleccionar opción
    // Usamos 'change' (no 'input') porque es el evento correcto para los elementos select
    document.getElementById('taskStatus')
        .addEventListener('change', function () {
            limpiarError(
                document.getElementById('taskStatusError'),
                document.getElementById('taskStatus')
            );
        });

    // ----- TABLA DE TAREAS (DELEGACIÓN DE EVENTOS) -----

    // Un solo listener en el tbody gestiona los clics en TODOS los botones de la tabla
    // Esto es necesario porque las filas se crean dinámicamente y sus botones
    // no existen en el DOM cuando se registra este listener
    document.getElementById('tasksTableBody')
        .addEventListener('click', manejarClicEnTabla);
}