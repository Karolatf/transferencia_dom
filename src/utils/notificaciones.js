// MÓDULO: utils/notificaciones.js
// CAPA:   Utils (Funciones reutilizables e independientes)

// Responsabilidad ÚNICA: mostrar mensajes visuales al usuario usando
// SweetAlert2 en lugar de los diálogos nativos del navegador (alert, confirm).
// Centralizar aquí evita duplicar lógica en cada módulo que necesite
// informar al usuario o pedir confirmación.

// Separación de responsabilidades:
//   - Este módulo NO conoce el estado interno del service
//   - Este módulo NO decide qué mensaje mostrar ni cuándo mostrarlo
//   - Solo recibe parámetros y delega el renderizado a SweetAlert2

// Usamos async/await en lugar de .then() para mantener consistencia
// con el resto del proyecto y facilitar la lectura del flujo de ejecución.

// Dependencias: sweetalert2 (instalada vía npm install sweetalert2)

// ─── IMPORTACIÓN ─────────────────────────────────────────────────────────────

// Importamos la clase Swal desde el paquete sweetalert2.
// Al usar Vite con módulos ES, esta importación funciona directamente
// sin necesidad de agregar ningún script en el HTML.
import Swal from 'sweetalert2';

// ─── MIXIN BASE ───────────────────────────────────────────────────────────────

// Swal.mixin() crea una instancia de SweetAlert2 preconfigurada.
// Todo lo que definimos aquí se hereda automáticamente en cada llamada
// a Toast.fire(), evitando repetir la misma configuración en cada toast.
// Es equivalente a crear una "plantilla base" reutilizable.
const Toast = Swal.mixin({

    // toast: true activa el modo toast (notificación pequeña no bloqueante).
    // A diferencia del popup normal, el toast no oscurece el fondo
    // ni interrumpe el flujo de trabajo del usuario.
    toast: true,

    // position define en qué esquina de la pantalla aparece el toast.
    // 'top-end' = esquina superior derecha, convención estándar en dashboards.
    position: 'top-end',

    // showConfirmButton: false oculta el botón "OK" en los toasts.
    // El usuario no necesita confirmar una notificación informativa;
    // desaparece sola gracias al timer definido abajo.
    showConfirmButton: false,

    // timer define en milisegundos cuánto tiempo permanece visible el toast.
    // 4000 ms = 4 segundos: suficiente para leer el mensaje sin ser invasivo.
    timer: 4000,

    // timerProgressBar: true muestra una barra de progreso en la parte
    // inferior del toast que se va reduciendo hasta que desaparece.
    // Da feedback visual al usuario de cuánto tiempo le queda al mensaje.
    timerProgressBar: true,

    // customClass permite asociar clases CSS propias a las partes del popup.
    // Así podemos aplicar la paleta de colores del proyecto definida en styles.css
    // en lugar de depender de los colores por defecto de SweetAlert2.
    customClass: {

        // 'swal-popup' se aplica al contenedor principal del toast.
        // En styles.css esta clase define border-radius, border morado y box-shadow
        // usando las variables --radio-xl, --color-primario y --sombra-lg del proyecto.
        popup: 'swal-popup',

        // 'swal-title' se aplica al texto del título del toast.
        // En styles.css define color --texto-oscuro y font-size --texto-xl.
        title: 'swal-title',
    },
});

// ─── mostrarNotificacion() ────────────────────────────────────────────────────

// Muestra una notificación visual tipo toast en la esquina superior derecha.
// Reemplaza la implementación anterior que usaba document.createElement()
// para construir toasts manuales con HTML y CSS propio.

// La función es async porque Toast.fire() retorna una Promesa.
// Aunque en la mayoría de los casos no necesitamos esperar a que el toast
// se cierre, declararla async permite que el caller haga await si lo necesita.

// Parámetros:
//   mensaje - Texto que se mostrará al usuario en el toast (string)
//   tipo    - Categoría visual: 'exito' | 'error' | 'info' | 'advertencia'
//             Determina el ícono y el color del toast. Por defecto 'info'.
export async function mostrarNotificacion(mensaje, tipo = 'info') {

    // Mapeamos nuestros tipos internos (en español, consistentes con el proyecto)
    // a los tipos que acepta SweetAlert2 (en inglés).
    // Usamos un objeto como mapa en lugar de un switch para mayor concisión.
    // El operador ?? asigna 'info' como fallback si el tipo no existe en el mapa,
    // evitando que un tipo desconocido rompa la función silenciosamente.
    const tipoSwal = {
        exito:       'success', // ícono de tilde verde
        error:       'error',   // ícono de X roja
        info:        'info',    // ícono de i azul
        advertencia: 'warning', // ícono de ! amarillo
    }[tipo] ?? 'info';

    // Toast.fire() dispara el toast con la configuración del mixin más
    // los parámetros específicos de esta llamada.
    // await pausa la ejecución hasta que el toast termina de mostrarse,
    // lo que permite al caller encadenar lógica después si lo necesita.
    await Toast.fire({

        // icon recibe el tipo de SweetAlert2 ya mapeado desde nuestro tipo interno.
        // Determina el ícono que aparece a la izquierda del mensaje.
        icon: tipoSwal,

        // title es el texto principal que muestra el toast.
        // SweetAlert2 llama "title" a lo que visualmente es el mensaje del toast.
        title: mensaje,
    });
}

// ─── mostrarConfirmacion() ────────────────────────────────────────────────────

// Muestra un dialog de confirmación modal que reemplaza al confirm() nativo
// del navegador. A diferencia de confirm(), este dialog es visual, estilizable
// y no bloqueante a nivel del hilo principal del navegador.

// La función es async porque Swal.fire() retorna una Promesa que resuelve
// cuando el usuario hace clic en cualquier botón del dialog.
// El caller DEBE usar await para esperar la decisión antes de continuar:
//
//   const confirmado = await mostrarConfirmacion('¿Eliminar?', 'No se puede deshacer.');
//   if (!confirmado) return;  ← si no esperamos, siempre sería undefined

// Parámetros:
//   titulo      - Texto grande del encabezado del dialog (string)
//   texto       - Texto explicativo del cuerpo del dialog (string)
//   textoBoton  - Texto del botón de confirmación. Por defecto 'Sí, eliminar'.
//                 Parametrizable para reutilizar la función en otros contextos.
// Retorna: Promesa que resuelve con true (confirmó) o false (canceló)
export async function mostrarConfirmacion(titulo, texto, textoBoton = 'Sí, eliminar') {

    // Swal.fire() abre el dialog y retorna una Promesa.
    // await pausa la función aquí hasta que el usuario hace clic en un botón.
    // El objeto resultado contiene varias propiedades; solo nos interesa isConfirmed.
    const resultado = await Swal.fire({

        // title es el encabezado principal del dialog, en texto grande y negrita.
        title: titulo,

        // text es el cuerpo explicativo debajo del título.
        // Usamos text (no html) para evitar inyección de HTML malicioso,
        // ya que el valor viene de datos del usuario (nombre de la tarea).
        text: texto,

        // icon: 'warning' muestra el ícono de advertencia (triángulo amarillo).
        // Es la convención para dialogs de confirmación de acciones destructivas.
        icon: 'warning',

        // showCancelButton: true habilita el botón de cancelar en el dialog.
        // Por defecto SweetAlert2 solo muestra el botón de confirmar.
        showCancelButton: true,

        // confirmButtonText es la etiqueta del botón de acción principal.
        // Recibe el parámetro textoBoton para ser reutilizable en otros contextos.
        confirmButtonText: textoBoton,

        // cancelButtonText es la etiqueta del botón de cancelar.
        cancelButtonText: 'Cancelar',

        // buttonsStyling: false es CRÍTICO para que funcione customClass en los botones.
        // Sin esta opción, SweetAlert2 inyecta estilos inline con mayor especificidad
        // que cualquier clase CSS, sobreescribiendo nuestra paleta de colores.
        // Al desactivarlo, los botones quedan sin estilo propio y toman el nuestro.
        buttonsStyling: false,

        // customClass asocia nuestras clases CSS del proyecto a cada parte del dialog.
        // Esto permite que los botones, el título y el contenedor respeten la paleta
        // de colores morada definida en styles.css mediante variables CSS.
        customClass: {

            // 'swal-popup swal-eliminar': aplica al contenedor del dialog.
            // 'swal-popup' da el border morado y el border-radius del proyecto.
            // 'swal-eliminar' es una clase adicional que permite en styles.css
            // apuntar específicamente al ícono de warning de este dialog
            // para pintarlo del rojo --color-error en lugar del amarillo por defecto.
            popup: 'swal-popup swal-eliminar',

            // 'swal-title' aplica al título del dialog.
            // En styles.css define color --texto-oscuro y font-weight 700.
            title: 'swal-title',

            // 'swal-text' aplica al contenedor del texto del cuerpo.
            // En styles.css define color --texto-medio y font-size --texto-md.
            htmlContainer: 'swal-text',

            // 'swal-btn-confirmar' aplica al botón de acción principal.
            // En styles.css lo estiliza con fondo --color-primario (morado),
            // texto blanco, border-radius redondeado y transición en hover.
            confirmButton: 'swal-btn-confirmar',

            // 'swal-btn-cancelar' aplica al botón de cancelar.
            // En styles.css lo estiliza con fondo blanco, borde morado
            // y texto --color-primario, creando el estilo "outline" del proyecto.
            cancelButton: 'swal-btn-cancelar',
        },
    });

    // resultado.isConfirmed es true únicamente si el usuario hizo clic
    // en el botón de confirmar. Es false si canceló, cerró el dialog
    // con Escape o hizo clic fuera del popup.
    // Retornamos directamente este booleano para que el caller pueda escribir:
    //   if (!confirmado) return;
    // en lugar de tener que inspeccionar el objeto resultado completo.
    return resultado.isConfirmed;
}