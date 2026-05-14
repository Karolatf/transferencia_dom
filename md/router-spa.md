# Documentación del Router SPA — Transferencia DOM

**Guía de exposición** 
**Fecha:** Mayo 2026

---

## ¿Qué es una SPA y por qué tiene un router?

Una **SPA (Single Page Application)** es una aplicación web que vive en **un solo archivo HTML** (`index.html`). En lugar de cargar una página nueva cada vez que el usuario navega, lo que cambia es lo que se *muestra* dentro de ese mismo archivo.

El problema es: si todo está en una sola página, ¿cómo sabe el navegador en qué sección estás? Ahí entra el **router**.

> **Analogía sencilla para la expo:** Imagina un álbum de fotos físico. El álbum completo es el `index.html`. El router es el sistema de pestañas o marcadores que te dice en qué página estás. Cambias de pestaña pero sigues con el mismo álbum.

---

## ¿Cómo funciona el router de este proyecto?

El router usa el **hash de la URL** — esa parte que viene después del `#` en la barra del navegador:

```
http://localhost:5173/#admin/usuarios
                       ↑
                    esto es el hash
```

Cuando el hash cambia, el navegador dispara un evento llamado `hashchange`. Nuestro router escucha ese evento y muestra la sección correcta.

**No se recarga la página.** Solo se ocultan y muestran elementos del DOM.

---

## Los archivos del sistema de rutas

```
src/
├── router.js     ← El motor: escucha cambios de hash y ejecuta funciones
├── rutas.js      ← El mapa: todos los nombres de ruta en un solo lugar
└── ui/
    └── modoUI.js ← El controlador: registra qué función va con qué ruta
```

### `router.js` — El motor

Es el archivo más pequeño pero el más importante del sistema de navegación. Hace 3 cosas:

1. **Guarda un mapa** de `"ruta"` → `función a ejecutar`
2. **Escucha** el evento `hashchange` del navegador
3. **Ejecuta** la función correcta cuando el hash cambia

Funciones clave que exporta:

| Función | ¿Para qué sirve? |
|---|---|
| `registrarRuta(hash, fn)` | Dice: "cuando el hash sea X, ejecuta la función Y" |
| `registrarRutas(mapa)` | Registra varias rutas de una sola vez |
| `ir(hash)` | Navega a una ruta (cambia el hash) |
| `iniciarRouter()` | Arranca el router — activa el listener de hashchange |
| `volverDeModal()` | Cierra un modal y regresa a la ruta anterior |
| `rutaActual()` | Devuelve el hash activo en este momento |
| `resetearEstadoRouter()` | Limpia el historial interno al hacer logout |

---

### `rutas.js` — El mapa de rutas

Este archivo es la **fuente única de verdad** de todas las rutas del proyecto. Si mañana quieres cambiar el nombre de una ruta, solo lo cambias aquí y todo el proyecto lo toma automáticamente.

```js
export const RUTAS = {

    USUARIO: {
        INICIO:       'usuario/inicio',
        TAREAS:       'usuario/tareas',
        NOTAS:        'usuario/notas',
        VER_TAREA:    'usuario/tareas/ver-tarea',
        EDITAR_TAREA: 'usuario/tareas/editar-tarea',
    },

    ADMIN: {
        INICIO:           'admin/inicio',
        CREAR_TAREA:      'admin/crear-tarea',
        USUARIOS:         'admin/usuarios',
        TAREAS:           'admin/tareas',
        VER_TAREA:        'admin/tareas/ver-tarea',
        EDITAR_TAREA:     'admin/tareas/editar-tarea',
        ELIMINAR_TAREA:   'admin/tareas/eliminar-tarea',
        VER_USUARIO:      'admin/usuarios/ver-usuario',
        EDITAR_USUARIO:   'admin/usuarios/editar-usuario',
        CAMBIAR_ROL:      'admin/usuarios/cambiar-rol',
        DESACTIVAR:       'admin/usuarios/desactivar-usuario',
        ACTIVAR:          'admin/usuarios/activar-usuario',
        ELIMINAR_USUARIO: 'admin/usuarios/eliminar-usuario',
    },

    INSTRUCTOR: {
        INICIO:         'instructor/inicio',
        CREAR_TAREA:    'instructor/crear-tarea',
        ESTUDIANTES:    'instructor/estudiantes',
        TAREAS:         'instructor/tareas',
        VER_TAREA:      'instructor/tareas/ver-tarea',
        EDITAR_TAREA:   'instructor/tareas/editar-tarea',
        ELIMINAR_TAREA: 'instructor/tareas/eliminar-tarea',
        VER_ESTUDIANTE: 'instructor/estudiantes/ver-estudiante',
    },

    MODAL: {
        REGISTRO:        'modal/registro',
        OLVIDO_PASSWORD: 'modal/olvido-password',
        CAMBIO_PASSWORD: 'modal/cambio-password',
        CERRAR_SESION:   'modal/cerrar-sesion',
    },
};
```

> **Para la expo:** "Usamos constantes en vez de escribir los strings directamente en el código. Si un día queremos que la ruta se llame diferente, solo la cambiamos en `rutas.js` y listo — no hay que buscar en 50 archivos."

---

## El recorrido completo: de un clic a la pantalla

Tomemos el ejemplo de un **administrador que hace clic en "Ver usuario"**:

```
Usuario hace clic en botón "Ver"
        ↓
Se guarda el dato del usuario en _pendingVerUsuario
        ↓
Se llama ir(RUTAS.ADMIN.VER_USUARIO)
        ↓
Cambia el hash de la URL → #admin/usuarios/ver-usuario
        ↓
El navegador dispara el evento hashchange
        ↓
router.js lo escucha y busca en su mapa interno
        ↓
Encuentra la función registrada para esa ruta
        ↓
Ejecuta: abrirModalUsuario(_pendingVerUsuario)
        ↓
Se muestra el modal con los datos del usuario
```

Cuando el admin **cierra el modal**:

```
Usuario hace clic en X o en Cancelar
        ↓
Se llama cerrarModalUsuarioExistente()
        ↓
El modal se elimina del DOM
        ↓
Se llama volverDeModal()
        ↓
El router navega al hash anterior → #admin/usuarios
        ↓
hashchange dispara → mostrarSeccionAdmin('usuarios')
        ↓
La tabla de usuarios vuelve a estar en foco
```

---

## Estructura de las URLs del proyecto

Las rutas siguen esta lógica: `#[rol]/[sección]/[acción]`

### Vista de Aprendiz (usuario)

| Lo que hace el usuario | URL resultante |
|---|---|
| Entra a su inicio | `#usuario/inicio` |
| Ve sus tareas | `#usuario/tareas` |
| Hace clic en "Ver tarea" | `#usuario/tareas/ver-tarea` |
| Hace clic en "Editar tarea" | `#usuario/tareas/editar-tarea` |
| Ve sus notas | `#usuario/notas` |

### Vista de Administrador

| Lo que hace el admin | URL resultante |
|---|---|
| Entra a su inicio | `#admin/inicio` |
| Sección usuarios | `#admin/usuarios` |
| Sección tareas | `#admin/tareas` |
| Clic en "Ver" (usuario) | `#admin/usuarios/ver-usuario` |
| Clic en "Editar" (usuario) | `#admin/usuarios/editar-usuario` |
| Clic en "Cambiar rol" | `#admin/usuarios/cambiar-rol` |
| Clic en "Desactivar" | `#admin/usuarios/desactivar-usuario` |
| Clic en "Activar" | `#admin/usuarios/activar-usuario` |
| Clic en "Eliminar" (usuario) | `#admin/usuarios/eliminar-usuario` |
| Clic en "Editar" (tarea) | `#admin/tareas/editar-tarea` |
| Clic en "Eliminar" (tarea) | `#admin/tareas/eliminar-tarea` |

### Vista de Instructor

| Lo que hace el instructor | URL resultante |
|---|---|
| Entra a su inicio | `#instructor/inicio` |
| Sección estudiantes | `#instructor/estudiantes` |
| Sección tareas | `#instructor/tareas` |
| Clic en "Ver estudiante" | `#instructor/estudiantes/ver-estudiante` |
| Clic en "Editar tarea" | `#instructor/tareas/editar-tarea` |
| Clic en "Eliminar tarea" | `#instructor/tareas/eliminar-tarea` |

### Modales globales (disponibles en cualquier rol)

| Modal | URL |
|---|---|
| Registrarse | `#modal/registro` |
| Olvidé mi contraseña | `#modal/olvido-password` |
| Cambiar contraseña | `#modal/cambio-password` |
| Cerrar sesión | `#modal/cerrar-sesion` |

---

## ¿Cómo se registran las rutas? (el código paso a paso)

Todo el registro de rutas ocurre dentro de la función `registrarEventosNavegacion()` en `modoUI.js`. Esta función se llama **una sola vez** cuando la página carga.

### Ejemplo 1 — Ruta de sección (sidebar)

Cuando el rol admin se activa, se registran sus 4 secciones de esta forma:

```js
// En activarModoAdmin()
registrarRutas({
    [RUTAS.ADMIN.INICIO]:      function() { mostrarSeccionAdmin('inicio'); },
    [RUTAS.ADMIN.CREAR_TAREA]: function() { mostrarSeccionAdmin('crear-tarea'); },
    [RUTAS.ADMIN.USUARIOS]:    function() { mostrarSeccionAdmin('usuarios'); },
    [RUTAS.ADMIN.TAREAS]:      function() { mostrarSeccionAdmin('tareas'); },
});
```

Esto le dice al router: "si el hash es `admin/usuarios`, ejecuta `mostrarSeccionAdmin('usuarios')`".

### Ejemplo 2 — Ruta de modal con datos (patrón "pending")

Los modales necesitan datos (¿a qué usuario o tarea abrir?). Usamos una variable temporal llamada **pending**:

```js
// 1. El botón guarda los datos y navega
function() {
    _pendingVerUsuario = usuario;          // guardo los datos
    ir(RUTAS.ADMIN.VER_USUARIO);           // navego a la ruta
}

// 2. El route handler toma los datos y abre el modal
registrarRuta(RUTAS.ADMIN.VER_USUARIO, function() {
    if (!_pendingVerUsuario) return;
    const u = _pendingVerUsuario;
    _pendingVerUsuario = null;             // limpio el pending
    abrirModalUsuario(u);                  // abro el modal con los datos
});
```

> **Para la expo:** "No podemos poner los datos en la URL porque sería un problema de seguridad y haría la URL muy larga. En cambio, guardamos el objeto del usuario en una variable temporal justo antes de navegar, y el handler lo toma al instante."

### Ejemplo 3 — Ruta de acción asíncrona (confirmar y ejecutar)

Para acciones que muestran una confirmación (como eliminar), el route handler es `async`:

```js
registrarRuta(RUTAS.ADMIN.ELIMINAR_TAREA, async function() {
    if (!_pendingEliminarTarea) return;
    const { tarea } = _pendingEliminarTarea;
    _pendingEliminarTarea = null;

    const confirmado = await confirmarEliminarTarea(tarea.title); // muestra el modal
    volverDeModal();           // limpia la URL independientemente del resultado
    if (!confirmado) return;   // si canceló, no hace nada más

    // si confirmó, elimina la tarea
    const eliminada = await eliminarTarea(tarea.id);
    // ... actualiza la tabla
});
```

---

## ¿Qué pasa al cerrar sesión?

El logout necesita un tratamiento especial porque el router tiene memoria del historial:

```js
async function manejarCerrarSesion() {
    // ... muestra confirmación
    cerrarSesion();           // borra el token de sesión
    activarModoInicio();      // vuelve al login
    resetearEstadoRouter();   // IMPORTANTE: limpia _hashActual y _hashAnterior
}
```

Sin `resetearEstadoRouter()`, si el admin cerró sesión mientras tenía abierto el modal de "Cerrar sesión", la próxima vez que alguien abriera ese modal y cancelara, el router intentaría navegar de vuelta al último hash de la sesión anterior.

---

## Aislamiento de errores

El router está diseñado para que si un handler falla (bug en una sección), **el resto de la app sigue funcionando**:

```js
try {
    handler();
} catch (err) {
    console.error(`[Router] Error en ruta "${hash}":`, err);
    // Solo falla esa ruta — las demás siguen funcionando
}
```

> **Para la expo:** "Si la sección de tareas del admin tiene un bug y explota, el admin todavía puede navegar a usuarios o al inicio. El error queda contenido."

---

## Preguntas frecuentes en exposición

**¿Por qué usar hash en la URL y no rutas normales (`/admin/usuarios`)?**  
Las rutas normales requieren que el servidor web conozca esas rutas y las redirija al `index.html`. Con hash, el navegador maneja todo localmente — funciona incluso abriendo el archivo sin servidor.

**¿Por qué centralizar las rutas en `rutas.js`?**  
Si el nombre de una ruta está escrito literalmente en 20 archivos diferentes y lo queremos cambiar, hay que buscar y reemplazar en todos. Con las constantes de `rutas.js`, se cambia una línea y listo.

**¿Qué pasa si escribo la URL a mano con un hash que no existe?**  
El router muestra un `console.warn("Ruta no registrada")` y no hace nada. No hay error visible para el usuario.

**¿Por qué no usar React Router o Vue Router?**  
El proyecto está hecho en Vanilla JavaScript sin frameworks. Este router propio es más liviano y está adaptado exactamente a las necesidades del proyecto.

**¿Qué es el patrón "pending state"?**  
Es la forma de pasarle datos a un modal que se abre por ruta. Antes de navegar, guardas el objeto (usuario, tarea, etc.) en una variable global temporal. Cuando el handler del router ejecuta, toma ese objeto y lo consume. La variable queda en `null` después para que no quede basura.

**¿Cómo sabe el router si está abriendo un modal del admin o del usuario?**  
El `<body>` tiene el atributo `data-modo` que siempre refleja el rol activo (`admin`, `usuario`, `instructor`). Los handlers pueden leer `document.body.dataset.modo` para decidir qué acción tomar.

---

## Resumen visual del flujo completo

```
index.html carga
    ↓
main.js → registrarEventosNavegacion()
    ↓
Se registran las rutas de modales globales
Se arranca el router (iniciarRouter)
    ↓
Usuario hace login
    ↓
activarModo[Rol]()
    ↓
Se registran las rutas de secciones del rol
ir(RUTA.ROL.INICIO) → muestra la pantalla de inicio del rol
    ↓
Usuario navega por el sidebar
    → hashchange → mostrarSeccion('nombre')
    ↓
Usuario hace clic en un botón de acción
    → _pendingX = datos
    → ir(RUTAS.ROL.ACCION)
    → hashchange → handler → abre modal
    ↓
Usuario cierra el modal
    → volverDeModal() → ir(rutaAnterior)
    → hashchange → vuelve a la sección
    ↓
Usuario cierra sesión
    → resetearEstadoRouter()
    → activarModoInicio()
    → vuelve al login
```
