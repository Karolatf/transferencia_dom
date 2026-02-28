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
// RF01  FILTER -> manejarFiltro           (Juan)
// RF02  SORT   -> manejarOrdenamiento     (Juan)
// RF04  EXPORT -> manejarExportacion      (Juan)

// Dependencias:
//   api/tareasApi.js         (peticiones HTTP)
//   ui/tareasUI.js           (actualización visual)
//   utils/validaciones.js    (validación de formularios)
//   utils/notificaciones.js  (mensajes visuales toast — RF03, Karol)
//   utils/filtros.js         (función pura de filtrado — RF01, Juan)
//   utils/ordenamiento.js    (función pura de ordenamiento — RF02, Juan)
//   utils/exportacion.js     (función pura de exportación — RF04, Juan)

// ----- IMPORTACIONES DESDE LA CAPA API -----
// Solo este módulo (service) puede importar funciones de la capa api.
// La UI nunca debe conocer la existencia de la API directamente.
import {
    buscarUsuarioPorDocumento, // RF-01: GET /users
    registrarTarea,            // RF-02: POST /tasks
    actualizarTarea,           // RF-03: PATCH /tasks/:id
    eliminarTarea              // RF-04: DELETE /tasks/:id
} from '../api/tareasApi.js';

// ----- IMPORTACIONES DESDE LA CAPA UI -----
// Usamos las funciones de UI para actualizar lo que el usuario ve en pantalla.
// El service ordena qué mostrar; la UI sabe cómo mostrarlo.
import {
    mostrarDatosUsuario,     // Muestra nombre, email e ID del usuario encontrado
    ocultarDatosUsuario,     // Oculta y limpia la sección de datos del usuario
    mostrarFormularioTareas, // Revela el formulario de registro de tareas
    ocultarFormularioTareas, // Oculta el formulario de tareas
    agregarTareaATabla,      // Inserta una fila nueva en la tabla de tareas
    limpiarFormularioTareas, // Limpia los campos del formulario de tareas
    actualizarFilaTarea,     // Actualiza visualmente una fila existente (RF-03)
    eliminarFilaTarea,       // Elimina visualmente una fila de la tabla (RF-04)
    mostrarModalEdicion,     // Muestra el modal de edición con datos precargados
    ocultarModalEdicion      // Oculta y limpia el modal de edición
} from '../ui/tareasUI.js';

// ----- IMPORTACIONES DESDE LA CAPA UTILS -----
// Funciones reutilizables e independientes que no pertenecen a ninguna capa específica

// Validaciones: verifican que los datos del formulario sean correctos
import {
    validarFormularioBusqueda, // Valida el formulario de búsqueda de usuario
    validarFormularioTareas,   // Valida el formulario de registro de tareas
    mostrarError,              // Muestra error visual en un campo del DOM
    limpiarError               // Limpia el error visual de un campo del DOM
} from '../utils/validaciones.js';

// RF03 — Notificaciones visuales (Karol)
// Reemplaza los alert() nativos por toasts visuales no bloqueantes
import { mostrarNotificacion } from '../utils/notificaciones.js';

// RF01 — Filtrado (Juan)
// Función pura que filtra el arreglo de tareas sin modificarlo
import { filtrarTareas } from '../utils/filtros.js';

// RF02 — Ordenamiento (Juan)
// Función pura que ordena el arreglo de tareas sin modificarlo
import { ordenarTareas } from '../utils/ordenamiento.js';

// RF04 — Exportación (Juan)
// Función que genera y dispara la descarga del archivo JSON
import { exportarTareasJSON } from '../utils/exportacion.js';

// ESTADO LOCAL DEL MÓDULO

// Estas variables mantienen el estado de la aplicación en memoria.
// Solo este service las conoce y las modifica.
// La UI nunca accede directamente al estado; siempre pasa por el service.

// Usuario actualmente seleccionado tras la búsqueda (null si no hay búsqueda activa)
let usuarioActual = null;

// Arreglo con TODAS las tareas registradas durante la sesión.
// Es la fuente de verdad: filtros y orden siempre se aplican sobre este arreglo,
// nunca lo modifican directamente.
let tareasRegistradas = [];

// Contador total de tareas registradas en la sesión (para numerar filas)
let contadorTareas = 0;

// ----- ESTADO DE FILTROS Y ORDEN (RF01, RF02 — Juan) -----
// Se guardan aquí para poder reaplicarlos automáticamente cada vez que
// la tabla se repinta (al agregar, editar, eliminar o cambiar filtros)

// Valor actual del select de filtro por estado ('' = sin filtro)
let filtroEstadoActivo  = '';

// Valor actual del input de filtro por usuario ('' = sin filtro)
let filtroUsuarioActivo = '';

// Criterio actual del select de ordenamiento ('' = sin orden)
let criterioOrdenActivo = '';

// FUNCIONES PRIVADAS (auxiliares, no exportadas)

// Reinicia el estado de la aplicación a sus valores iniciales.
// Se llama antes de cada nueva búsqueda para limpiar datos del usuario anterior.
function reiniciarEstadoAplicacion() {
    usuarioActual = null;
    ocultarDatosUsuario();
    ocultarFormularioTareas();
}

// RF01 + RF02 — Juan
// Aplica los filtros y el orden activos sobre tareasRegistradas y repinta el tbody.
// Esta función centraliza TODO el proceso de pintado de la tabla:
//   1. Filtra sobre el arreglo completo (fuente de verdad)
//   2. Ordena el resultado filtrado
//   3. Limpia el tbody actual
//   4. Inserta solo las filas del resultado final

// Se llama desde CUALQUIER operación que modifique las tareas o los criterios:
// agregar, editar, eliminar, cambiar filtro, cambiar orden, limpiar filtros.
// Así siempre se ve el resultado correcto sin duplicar lógica de pintado.
function refrescarTabla() {

    // ----- PASO 1: FILTRAR -----
    // Pasamos el arreglo completo y los criterios activos a la función pura
    // filtrarTareas() devuelve un nuevo arreglo sin modificar tareasRegistradas
    const tareasFiltradas = filtrarTareas(
        tareasRegistradas,
        filtroEstadoActivo,
        filtroUsuarioActivo
    );

    // ----- PASO 2: ORDENAR -----
    // Pasamos el arreglo ya filtrado a ordenarTareas()
    // ordenarTareas() devuelve un nuevo arreglo sin modificar tareasFiltradas
    const tareasOrdenadas = ordenarTareas(tareasFiltradas, criterioOrdenActivo);

    // ----- PASO 3: LIMPIAR EL TBODY -----
    // Vaciamos el cuerpo de la tabla antes de volver a pintarla
    // innerHTML = '' es más rápido que eliminar cada fila individualmente
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';

    // ----- PASO 4: REPINTAR CON EL RESULTADO FINAL -----
    // Usamos el índice del forEach como número de fila para la columna '#'
    tareasOrdenadas.forEach((tarea, indice) => {
        agregarTareaATabla(tarea, indice);
    });
}

// RF-01 – BUSCAR USUARIO (READ)

// Maneja el evento submit del formulario de búsqueda de usuario.
// Valida el campo, llama a la API y actualiza la UI según el resultado.
// Es async porque usa await para esperar la respuesta del servidor.
// Parámetro: event - El objeto Event del formulario (para cancelar el submit nativo)
export async function manejarBusquedaUsuario(event) {

    // ----- PASO 1: PREVENIR COMPORTAMIENTO POR DEFECTO -----
    // Por defecto al enviar un formulario el navegador recarga la página.
    // preventDefault() cancela esa recarga para que nosotros manejemos el envío.
    event.preventDefault();

    // ----- PASO 2: OBTENER LOS ELEMENTOS DEL FORMULARIO -----
    const inputDocumento = document.getElementById('userDocument');
    const errorDocumento = document.getElementById('userDocumentError');

    // ----- PASO 3: VALIDAR EL FORMULARIO -----
    // Si el campo está vacío, validarFormularioBusqueda() muestra el error
    // y retorna false. Detenemos la ejecución para no hacer la petición.
    const esValido = validarFormularioBusqueda(inputDocumento, errorDocumento);
    if (!esValido) return;

    // ----- PASO 4: OBTENER EL VALOR DEL DOCUMENTO -----
    // trim() elimina espacios accidentales al inicio y al final
    const valorDocumento = inputDocumento.value.trim();

    // ----- PASO 5: REINICIAR EL ESTADO -----
    // Limpiamos datos del usuario anterior para evitar confusión visual
    reiniciarEstadoAplicacion();

    // ----- PASO 6: LLAMAR A LA CAPA API -----
    // Delegamos la petición HTTP al módulo de API.
    // El service NO hace fetch() directamente; esa es la responsabilidad de api/.
    const usuario = await buscarUsuarioPorDocumento(valorDocumento);

    // ----- PASO 7: PROCESAR EL RESULTADO Y ACTUALIZAR LA UI -----
    if (usuario) {

        // USUARIO ENCONTRADO
        usuarioActual = usuario;           // Guardamos en estado local
        mostrarDatosUsuario(usuario);      // UI: muestra nombre, email e ID
        mostrarFormularioTareas();         // UI: revela el formulario de tareas
        inputDocumento.value = '';         // Limpiamos el input para nueva búsqueda
        limpiarError(errorDocumento, inputDocumento); // Limpiamos error previo

    } else {

        // USUARIO NO ENCONTRADO
        // Mostramos el mensaje de error directamente bajo el campo de documento
        mostrarError(
            errorDocumento,
            inputDocumento,
            'No se encontró ningún usuario con ese documento'
        );
        usuarioActual = null; // Nos aseguramos de que no quede un usuario anterior
    }
}

// RF-02 – REGISTRAR TAREA (CREATE)

// Maneja el evento submit del formulario de registro de tareas.
// Valida, construye el objeto, llama a la API y actualiza la tabla.
// Parámetro: event - El objeto Event del formulario de tareas
export async function manejarRegistroTarea(event) {

    // ----- PASO 1: PREVENIR RECARGA DE PÁGINA -----
    event.preventDefault();

    // ----- PASO 2: VERIFICAR QUE HAY USUARIO SELECCIONADO -----
    // No tiene sentido registrar una tarea si no hay usuario activo en el estado
    if (!usuarioActual) {
        mostrarNotificacion('Primero debes buscar y seleccionar un usuario', 'error');
        return;
    }

    // ----- PASO 3: OBTENER LOS ELEMENTOS DEL FORMULARIO -----
    const inputTitulo = document.getElementById('taskTitle');
    const inputDesc   = document.getElementById('taskDescription');
    const selectEst   = document.getElementById('taskStatus');
    const errorTitulo = document.getElementById('taskTitleError');
    const errorDesc   = document.getElementById('taskDescriptionError');
    const errorEst    = document.getElementById('taskStatusError');

    // ----- PASO 4: VALIDAR EL FORMULARIO -----
    // validarFormularioTareas() verifica todos los campos y muestra errores.
    // Si algún campo falla, retorna false y detenemos la ejecución.
    const esValido = validarFormularioTareas(
        inputTitulo, inputDesc, selectEst,
        errorTitulo, errorDesc, errorEst
    );
    if (!esValido) return;

    // ----- PASO 5: CONSTRUIR EL OBJETO DE TAREA -----
    // trim() elimina espacios accidentales en los campos de texto
    const datosTarea = {
        title:       inputTitulo.value.trim(),
        description: inputDesc.value.trim(),
        status:      selectEst.value,
        userId:      usuarioActual.id,           // Del estado local del service
        userName:    usuarioActual.name,         // Para mostrar en la tabla
        completed:   selectEst.value === 'completada' // Campo de coherencia
    };

    // ----- PASO 6: LLAMAR A LA CAPA API -----
    const tareaCreada = await registrarTarea(datosTarea);

    // ----- PASO 7: PROCESAR EL RESULTADO -----
    if (tareaCreada) {

        // REGISTRO EXITOSO
        tareasRegistradas.push(tareaCreada); // Guardamos en el estado local
        contadorTareas++;
        limpiarFormularioTareas();

        // RF01+RF02: refrescamos la tabla para que los filtros y el orden activos
        // se apliquen también sobre la tarea recién agregada
        refrescarTabla();

        mostrarNotificacion('Tarea registrada exitosamente', 'exito');

    } else {

        // ERROR EN EL REGISTRO
        mostrarNotificacion('Error al registrar la tarea. Por favor, intenta nuevamente.', 'error');
    }
}

// RF-03 – EDITAR TAREA (UPDATE)

// Maneja el clic en el botón "Editar" de una fila.
// Precarga el modal con los datos actuales y gestiona su envío y cancelación.
// Parámetro: tarea - Objeto con los datos actuales de la tarea a editar
export function manejarEdicionTarea(tarea) {

    // ----- PASO 1: MOSTRAR EL MODAL CON LOS DATOS ACTUALES -----
    // La UI se encarga de precargar cada campo con los valores de 'tarea'
    mostrarModalEdicion(tarea);

    // ----- PASO 2: OBTENER EL FORMULARIO DEL MODAL -----
    const formularioEdicion = document.getElementById('editTaskForm');

    // ----- PASO 3: DEFINIR EL HANDLER DE GUARDADO -----
    // Se define aquí dentro (función anidada) para que capture la variable
    // 'tarea' mediante closure y sepa qué ID actualizar al enviar
    async function manejarGuardadoEdicion(event) {
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
            completed:   estado === 'completada' // Mantenemos el campo sincronizado
        };

        // ----- PASO 6: LLAMAR A LA CAPA API -----
        // El service delega la petición PATCH al módulo de API
        const tareaActualizada = await actualizarTarea(tareaId, datosActualizados);

        // ----- PASO 7: PROCESAR EL RESULTADO -----
        if (tareaActualizada) {

            // ACTUALIZACIÓN EXITOSA
            // Actualizamos el objeto en el estado local del service
            const indice = tareasRegistradas.findIndex(
                t => t.id.toString() === tareaActualizada.id.toString()
            );
            if (indice !== -1) {
                tareasRegistradas[indice] = tareaActualizada;
            }

            // RF01+RF02: refrescamos la tabla para que los filtros y el orden
            // se mantengan activos después de la edición
            refrescarTabla();

            ocultarModalEdicion();
            mostrarNotificacion('Tarea actualizada exitosamente', 'exito');

        } else {

            // ERROR EN LA ACTUALIZACIÓN
            mostrarNotificacion('Error al actualizar la tarea. Por favor, intenta nuevamente.', 'error');
        }

        // ----- PASO 8: REMOVER EL LISTENER DE SUBMIT -----
        // Es crucial remover este listener para evitar que se acumule cada vez
        // que el usuario abra el modal. Sin esto, al tercer clic en Editar
        // el formulario dispararía el submit tres veces.
        formularioEdicion.removeEventListener('submit', manejarGuardadoEdicion);
    }

    // Registramos el listener de submit en el formulario del modal
    formularioEdicion.addEventListener('submit', manejarGuardadoEdicion);

    // ----- PASO 9: MANEJAR EL CIERRE DEL MODAL SIN GUARDAR -----
    // El modal tiene dos formas de cerrarse sin guardar:
    //   - Botón "Cancelar" (id="editCancelBtn")
    //   - Botón "✕"        (id="editCloseBtn")
    const botonCancelar = document.getElementById('editCancelBtn');
    const botonCerrar   = document.getElementById('editCloseBtn');

    // Función compartida por ambos botones de cierre
    function manejarCancelacionEdicion() {
        ocultarModalEdicion();

        // Removemos todos los listeners acumulados al cancelar
        formularioEdicion.removeEventListener('submit', manejarGuardadoEdicion);
        botonCancelar.removeEventListener('click', manejarCancelacionEdicion);
        botonCerrar.removeEventListener('click', manejarCancelacionEdicion);
    }

    botonCancelar.addEventListener('click', manejarCancelacionEdicion);
    botonCerrar.addEventListener('click', manejarCancelacionEdicion);
}

// RF-04 – ELIMINAR TAREA (DELETE)

// Maneja el clic en el botón "Eliminar" de una fila.
// Pide confirmación y, si el usuario acepta, llama a la API y actualiza la UI.
// Parámetro: tarea - Objeto con los datos de la tarea a eliminar
export async function manejarEliminacionTarea(tarea) {

    // ----- PASO 1: PEDIR CONFIRMACIÓN AL USUARIO -----
    // confirm() muestra un diálogo nativo; retorna true si acepta
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

        // ELIMINACIÓN EXITOSA
        // filter() crea un nuevo arreglo conservando solo las tareas
        // cuyo ID es distinto al de la tarea eliminada
        tareasRegistradas = tareasRegistradas.filter(
            t => t.id.toString() !== tarea.id.toString()
        );

        // RF01+RF02: refrescamos la tabla para que los filtros y el orden
        // se mantengan activos después de la eliminación
        refrescarTabla();

        mostrarNotificacion('Tarea eliminada exitosamente', 'exito');

    } else {

        // ERROR EN LA ELIMINACIÓN
        mostrarNotificacion('Error al eliminar la tarea. Por favor, intenta nuevamente.', 'error');
    }
}

// DELEGACIÓN DE EVENTOS DE LA TABLA (RF-03 y RF-04)

// Maneja los clics dentro del tbody usando delegación de eventos.
// En lugar de registrar un listener por cada botón (que se crean dinámicamente),
// registramos UN SOLO listener en el tbody padre.
// Cuando el usuario hace clic en cualquier botón, el evento burbujea
// hasta el tbody y este listener lo intercepta.
//
// Ventajas:
//   1. Los botones se crean después de que este listener se registra,
//      por lo que no existirían al momento de inicializar. Con delegación
//      el tbody ya los escucha sin importar cuándo fueron creados.
//   2. Un solo listener cubre todos los botones de todas las filas.
//
// Parámetro: event - El objeto Event del clic dentro de la tabla
function manejarClicEnTabla(event) {

    // ----- PASO 1: IDENTIFICAR EL ELEMENTO CLICADO -----
    // event.target es el elemento exacto donde cayó el clic
    // Puede ser el botón mismo o un elemento hijo (como el emoji dentro del botón)
    const objetivo = event.target;

    // ----- PASO 2: BUSCAR EL BOTÓN DE ACCIÓN MÁS CERCANO -----
    // closest() sube por el árbol del DOM buscando un elemento que tenga [data-action]
    // Esto maneja el caso de que el clic caiga en el emoji dentro del botón
    const botonAccion = objetivo.closest('[data-action]');

    // Si el clic no fue en ni dentro de un botón de acción, salimos
    if (!botonAccion) return;

    // ----- PASO 3: LEER EL ID Y LA ACCIÓN DEL BOTÓN -----
    // data-id y data-action se guardan en el HTML al crear cada fila en la UI
    const tareaId = botonAccion.dataset.id;
    const accion  = botonAccion.dataset.action; // 'edit' o 'delete'

    // ----- PASO 4: BUSCAR LA TAREA EN EL ESTADO LOCAL -----
    // Necesitamos el objeto completo para pasárselo al handler correspondiente
    const tarea = tareasRegistradas.find(
        t => t.id.toString() === tareaId.toString()
    );

    // Si no encontramos la tarea en el estado, salimos para evitar errores
    if (!tarea) {
        console.warn(`⚠️ No se encontró la tarea con id ${tareaId} en el estado local`);
        return;
    }

    // ----- PASO 5: EJECUTAR EL HANDLER SEGÚN LA ACCIÓN -----
    switch (accion) {
        case 'edit':
            manejarEdicionTarea(tarea);   // Abre el modal de edición (RF-03)
            break;
        case 'delete':
            manejarEliminacionTarea(tarea); // Pide confirmación y elimina (RF-04)
            break;
        default:
            console.warn(`⚠️ Acción desconocida: ${accion}`);
    }
}

// RF01 — MANEJADOR DE FILTRO

// Lee los valores actuales de los controles de filtro del DOM,
// actualiza las variables de estado de filtro y llama a refrescarTabla()
// para que la tabla se actualice sin recargar la página.
// No recibe parámetros: lee directamente del DOM los controles de filtro.
function manejarFiltro() {

    // Leemos el valor actual de cada control y lo guardamos en el estado del service
    // Así refrescarTabla() siempre tiene los criterios más recientes disponibles
    filtroEstadoActivo  = document.getElementById('filtroEstado').value;
    filtroUsuarioActivo = document.getElementById('filtroUsuario').value;

    // Repintamos la tabla aplicando los nuevos criterios
    refrescarTabla();
}

// RF02 — MANEJADOR DE ORDENAMIENTO

// Lee el criterio de ordenamiento seleccionado en el select del DOM,
// actualiza la variable de estado del orden activo y llama a refrescarTabla().
// No recibe parámetros: lee directamente del DOM el control de ordenamiento.
function manejarOrdenamiento() {

    // Guardamos el criterio seleccionado en el estado del service
    // para que refrescarTabla() lo aplique en cada repintado posterior
    criterioOrdenActivo = document.getElementById('ordenSelect').value;

    // Repintamos la tabla aplicando el nuevo criterio de orden
    refrescarTabla();
}

// RF04 — MANEJADOR DE EXPORTACIÓN

// Calcula las tareas actualmente visibles (con filtros y orden aplicados)
// y las pasa a exportarTareasJSON() para generar el archivo descargable.
//
// Separación de responsabilidades:
//   - Este manejador conoce el estado (tareasRegistradas, filtros, orden)
//   - exportarTareasJSON() solo recibe datos y genera la descarga
//   - mostrarNotificacion() solo muestra el resultado visual
// Ninguno de los tres módulos depende directamente de los otros dos.
function manejarExportacion() {

    // ----- PASO 1: CALCULAR LAS TAREAS VISIBLES -----
    // Aplicamos los mismos filtros y orden activos que usa refrescarTabla()
    // para que el archivo exportado sea exactamente lo que el usuario ve
    const tareasFiltradas = filtrarTareas(
        tareasRegistradas,
        filtroEstadoActivo,
        filtroUsuarioActivo
    );
    const tareasVisibles = ordenarTareas(tareasFiltradas, criterioOrdenActivo);

    // ----- PASO 2: LLAMAR AL MÓDULO DE EXPORTACIÓN -----
    // exportarTareasJSON() devuelve true si generó la descarga, false si estaba vacío
    const exitoso = exportarTareasJSON(tareasVisibles);

    // ----- PASO 3: MOSTRAR LA NOTIFICACIÓN CORRESPONDIENTE -----
    if (exitoso) {
        mostrarNotificacion('Tareas exportadas exitosamente', 'exito');
    } else {
        mostrarNotificacion('No hay tareas visibles para exportar', 'info');
    }
}

// REGISTRO DE EVENT LISTENERS

// Registra TODOS los event listeners de la aplicación en sus elementos del DOM.
// Esta función se llama UNA SOLA VEZ desde script.js al inicializar la app,
// dentro del evento DOMContentLoaded, para garantizar que todos los elementos
// HTML ya existen antes de intentar agregar listeners.
//
// Centralizar el registro aquí facilita agregar o quitar eventos en el futuro
// sin necesidad de tocar script.js ni otros módulos.
export function registrarEventListeners() {

    // ----- FORMULARIO DE BÚSQUEDA DE USUARIO -----

    // 'submit' se activa al hacer clic en "Buscar" o presionar Enter
    document.getElementById('searchUserForm')
        .addEventListener('submit', manejarBusquedaUsuario);

    // 'input' se activa con cada pulsación de tecla en el campo documento
    // Limpia el error en tiempo real mientras el usuario escribe
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

    // 'input' en el campo título: limpia el error del título en tiempo real
    document.getElementById('taskTitle')
        .addEventListener('input', function () {
            limpiarError(
                document.getElementById('taskTitleError'),
                document.getElementById('taskTitle')
            );
        });

    // 'input' en el campo descripción: limpia el error de descripción en tiempo real
    document.getElementById('taskDescription')
        .addEventListener('input', function () {
            limpiarError(
                document.getElementById('taskDescriptionError'),
                document.getElementById('taskDescription')
            );
        });

    // 'change' en el select de estado: limpia el error al seleccionar una opción
    // Se usa 'change' (no 'input') porque es el evento correcto para elementos select
    document.getElementById('taskStatus')
        .addEventListener('change', function () {
            limpiarError(
                document.getElementById('taskStatusError'),
                document.getElementById('taskStatus')
            );
        });

    // ----- TABLA DE TAREAS (DELEGACIÓN DE EVENTOS) -----

    // Un solo listener en el tbody gestiona los clics en TODOS los botones de acción.
    // Las filas se crean dinámicamente; con delegación el tbody ya las escucha
    // sin importar cuándo fueron creadas.
    document.getElementById('tasksTableBody')
        .addEventListener('click', manejarClicEnTabla);

    // ----- RF01: LISTENERS DE FILTROS -----

    // 'change' en el select de estado: se aplica al seleccionar una opción del dropdown
    document.getElementById('filtroEstado')
        .addEventListener('change', manejarFiltro);

    // 'input' en el campo de usuario: se aplica con cada pulsación de tecla
    // para dar respuesta inmediata sin necesitar que el usuario presione Enter
    document.getElementById('filtroUsuario')
        .addEventListener('input', manejarFiltro);

    // 'click' en el botón limpiar: resetea los controles del DOM y el estado interno,
    // luego repinta la tabla mostrando todas las tareas sin ningún filtro
    document.getElementById('limpiarFiltros')
        .addEventListener('click', function () {
            document.getElementById('filtroEstado').value  = '';
            document.getElementById('filtroUsuario').value = '';
            filtroEstadoActivo  = '';
            filtroUsuarioActivo = '';
            refrescarTabla();
        });

    // ----- RF02: LISTENER DE ORDENAMIENTO -----

    // 'change' en el select de orden: se aplica al seleccionar un criterio
    document.getElementById('ordenSelect')
        .addEventListener('change', manejarOrdenamiento);

    // ----- RF04: LISTENER DE EXPORTACIÓN -----

    // 'click' en el botón exportar: dispara la descarga del JSON con las tareas visibles
    document.getElementById('exportarBtn')
        .addEventListener('click', manejarExportacion);
}