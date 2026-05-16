# Preguntas Frecuentes del Instructor — Frontend

> Respuestas preparadas para las preguntas más probables sobre el frontend.
> Cada respuesta referencia el archivo y la función real del código.
> Léelas con VSCode abierto para poder señalar las líneas exactas.

---

## ARQUITECTURA Y ORGANIZACIÓN

---

### ¿Cómo está organizado el frontend? ¿Qué hace cada carpeta?

**Respuesta:**

> "El frontend sigue una arquitectura en 4 capas, cada una con una responsabilidad única. La carpeta `api/` solo hace peticiones HTTP al servidor — nunca toca el HTML. La carpeta `ui/` solo dibuja en pantalla — nunca llama al servidor directamente. La carpeta `utils/` tiene funciones reutilizables que no tienen acceso ni al servidor ni al DOM. Y `services/` coordina entre la API y la UI para los casos que necesitan combinar las dos.
>
> El punto de entrada es `main.js` — el primer archivo que ejecuta el navegador. Luego está `router.js` que maneja la navegación sin recargar la página. Todo el HTML está en un solo `index.html` — el JavaScript muestra y oculta secciones según la ruta."

**Mostrar:** El árbol de carpetas en VSCode Explorer.

---

### ¿Por qué usaron JavaScript puro y no React o Angular?

**Respuesta:**

> "La transferencia de conocimiento del SENA evaluaba manipulación del DOM con JavaScript nativo. Usar React o Angular habría ocultado esos conceptos fundamentales detrás de abstracciones. Además, el proyecto demuestra que se puede construir una aplicación completa y funcional sin frameworks — entendiendo cada línea que escribimos. Usamos módulos ES6 (`import/export`) y Vite como herramienta de desarrollo para tener recarga automática y bundling sin configuración compleja."

---

### ¿Qué es Vite y para qué lo usan?

**Respuesta:**

> "Vite es una herramienta de construcción moderna para JavaScript. Resuelve dos problemas: en desarrollo, levanta un servidor con recarga automática cuando guardamos un archivo, y permite usar `import/export` de ES6 en el navegador sin configuración. En producción, empaqueta y optimiza todo el código en archivos mínimos. El comando `npm run dev` arranca el servidor de Vite en `localhost:5173`."

---

## NAVEGACIÓN SPA

---

### ¿Qué es una SPA y cómo funciona la navegación en este proyecto?

**Respuesta:**

> "SPA significa Single Page Application — aplicación de una sola página. En lugar de cargar una página HTML diferente por cada sección, la aplicación carga un solo `index.html` y JavaScript actualiza el contenido sin recargar la página. La navegación cambia el fragmento `#` al final de la URL — por ejemplo, de `#admin/inicio` a `#admin/usuarios`.
>
> Esto lo implementa `router.js`. Cuando el usuario hace clic en un enlace del menú, la URL cambia a algo como `#admin/tareas`. El evento `hashchange` dispara la función `_despachar()`, que busca en el mapa `_rutas` la función registrada para ese hash y la ejecuta. Esa función muestra la sección correcta en pantalla."

**Mostrar:** `src/router.js` — función `_despachar()` y `registrarRutas()`.

---

### ¿Cómo se registran y se navega entre rutas?

**Respuesta:**

> "En `modoUI.js`, cuando se activa el panel del admin, se llama a `registrarRutas()` del router con un objeto que mapea cada hash a su función. Por ejemplo: `'admin/usuarios': () => cargarTablaUsuarios()`. Cuando el usuario hace clic en el menú de usuarios, el sidebar llama a `ir('admin/usuarios')` — esa función cambia el hash de la URL y el router ejecuta `cargarTablaUsuarios()` automáticamente.
>
> Para modales, usamos `irAModal()` y `volverDeModal()` que recuerdan la ruta anterior para poder regresar al cerrar el modal."

**Mostrar:** `src/router.js` — funciones `ir()`, `registrarRutas()`, `volverDeModal()`.

---

## AUTENTICACIÓN

---

### ¿Cómo funciona el login desde el frontend?

**Respuesta:**

> "Cuando el usuario hace clic en 'Ingresar', primero `validaciones.js` verifica que el email tenga formato válido y que la contraseña no esté vacía — si algo falla, muestra el error en rojo sin hacer ninguna petición al servidor.
>
> Si la validación pasa, `authApi.js` hace `POST /api/auth/login` enviando `{ email, password }` como JSON. Si el servidor responde con éxito, retorna `{ accessToken, refreshToken, user }`. El frontend llama a `guardarSesion()` de `sesion.js` que guarda los tres valores en `localStorage`. Luego `modoUI.js` lee el `user.role` y activa el panel correspondiente: `activarModoAdmin()`, `activarModoInstructor()` o `activarModoUsuario()`."

**Mostrar:** `src/api/authApi.js` función `loginUsuario`, y `src/utils/sesion.js` función `guardarSesion`.

---

### ¿Dónde se guarda el token y por qué en localStorage?

**Respuesta:**

> "El token se guarda en `localStorage` del navegador — es un almacenamiento clave-valor que persiste aunque se cierre la pestaña. Lo maneja exclusivamente `utils/sesion.js` — ningún otro archivo del proyecto accede al localStorage directamente. Esto se llama Single Source of Truth: si hay que cambiar cómo se guarda la sesión, solo se edita un archivo.
>
> Las claves que usamos son: `'accessToken'`, `'refreshToken'` y `'usuarioActual'`. El objeto usuario se guarda como string con `JSON.stringify()` y se lee de vuelta con `JSON.parse()`."

**Mostrar:** `src/utils/sesion.js` — el objeto `KEYS` y la función `guardarSesion`.

---

### ¿Qué pasa cuando el usuario ya tenía sesión y recarga la página?

**Respuesta:**

> "Al recargar la página, `main.js` se ejecuta desde el inicio. Llama a `haySesionActiva()` — si hay un accessToken en localStorage, intenta renovarlo con el servidor llamando a `renovarToken(refreshToken)`. Si el servidor acepta el refreshToken, guarda el nuevo accessToken y activa el panel del rol correspondiente — el usuario no ve el login, la sesión continúa transparentemente.
>
> Si el servidor rechaza el refreshToken (expiró en 7 días o el servidor se reinició), `cerrarSesion()` borra todo el localStorage y muestra el login."

**Mostrar:** `src/main.js` — el bloque `if (haySesionActiva())` y el `try/catch` de `renovarToken`.

---

### ¿Qué es el Silent Refresh y cómo funciona?

**Respuesta:**

> "El accessToken dura solo 1 hora. Cuando expira, el servidor responde con un error 401. `fetchConAuth.js` detecta ese 401 y, en lugar de mostrar un error al usuario, automáticamente usa el refreshToken para pedir un nuevo accessToken con `renovarToken()`. Si la renovación funciona, guarda el nuevo token y repite la petición original — todo invisible para el usuario.
>
> Para evitar que múltiples peticiones simultáneas que reciben 401 generen múltiples renovaciones al mismo tiempo, usa la variable `_refrescando`. Si ya hay una renovación en curso, las peticiones adicionales se ponen en la cola `_esperandoRefresh` y se resuelven juntas cuando termina la renovación."

**Mostrar:** `src/utils/fetchConAuth.js` — el bloque del comentario `SILENT REFRESH` y la variable `_refrescando`.

---

### ¿Cómo funciona el logout?

**Respuesta:**

> "Al hacer clic en cerrar sesión, el código llama a `cerrarSesion()` de `sesion.js` que borra los tres valores del localStorage (`accessToken`, `refreshToken`, `usuarioActual`). Luego llama a `resetearEstadoRouter()` que limpia el hash de la URL y borra las rutas memorizadas. Finalmente muestra la pantalla de login con `activarModoInicio()`. El usuario queda completamente desconectado y no puede volver atrás con el botón del navegador."

---

## VALIDACIONES

---

### ¿Cómo funcionan las validaciones de los formularios?

**Respuesta:**

> "Todas las validaciones están centralizadas en `utils/validaciones.js`. El patrón es siempre el mismo: se leen los valores de los campos, se valida campo por campo con condicionales, y si algo falla se llama a `mostrarError(elementoError, elementoInput, mensaje)` que escribe el mensaje en el span de error y agrega la clase CSS `'error'` al input para pintarlo de rojo. Se guarda el primer mensaje de error en `primerMensaje` y al final se muestra como toast con `mostrarNotificacion()`.
>
> Las validaciones se ejecutan antes de hacer cualquier petición al servidor — si algún campo es inválido, el `fetch` nunca se llama. Esto ahorra tráfico y da feedback inmediato al usuario."

**Mostrar:** `src/utils/validaciones.js` — función `validarFormularioUsuario`.

---

### ¿Qué pasa si los datos llegan al servidor y fallan la validación de Zod en el backend?

**Respuesta:**

> "Si por alguna razón los datos pasan el frontend pero fallan en el backend (Zod), el servidor responde con código 400 y un mensaje de error. Las funciones de `api/` verifican `if (!response.ok)` y lanzan un error con `throw new Error(json.message)`. Ese error llega al código que llamó la función y se muestra como toast de error al usuario. Las validaciones del backend son la última línea de defensa — las del frontend son la primera."

---

## PETICIONES AL SERVIDOR

---

### ¿Cómo se hacen las peticiones al servidor? ¿Cómo llega el token?

**Respuesta:**

> "Todas las peticiones autenticadas van a través de `fetchConAuth()` en `utils/fetchConAuth.js` — nunca con `fetch()` directamente. Esta función lee el token de `sesion.js` con `obtenerAccessToken()` y lo agrega automáticamente al header: `Authorization: Bearer [token]`. También agrega `Content-Type: application/json`. El código que llama a `fetchConAuth` no necesita preocuparse por el token — siempre está incluido."

**Mostrar:** `src/utils/fetchConAuth.js` — la construcción de `opcionesConAuth`.

---

### ¿Qué hace cada archivo en la carpeta `api/`?

**Respuesta:**

> "Cada archivo de `api/` corresponde a un módulo del backend y solo contiene funciones `async` que hacen peticiones HTTP. Ninguno toca el DOM ni modifica la pantalla:
> - `authApi.js` — login, registro, renovar token, recuperación de contraseña (3 pasos)
> - `usuariosApi.js` — CRUD de usuarios, cambio de rol, desactivar/reactivar
> - `tareasApi.js` — CRUD de tareas, filtros, asignación de usuarios, cambio de estado
> - `calendarApi.js` — obtener y crear eventos del calendario
> - `notesApi.js` — obtener, crear y eliminar notas personales"

---

### ¿Por qué la URL del backend está en `config.js` y no escrita directamente en cada archivo?

**Respuesta:**

> "Si la dirección del servidor cambia (por ejemplo, en producción es otra URL), bastaría con editar `src/utils/config.js` en un solo lugar. Sin `config.js`, habría que buscar y cambiar la URL en todos los archivos de `api/`. Este principio se llama DRY — Don't Repeat Yourself. `API_BASE_URL` y `API_PREFIX` se importan en cada archivo de `api/` y se combinan para construir cada URL."

**Mostrar:** `src/utils/config.js` y la primera línea de cualquier archivo de `api/`.

---

## INTERFAZ Y PANELES

---

### ¿Cómo cambia el color según el rol? ¿Por qué el mismo HTML se ve diferente para admin, instructor y estudiante?

**Respuesta:**

> "Todo el sistema de colores está en variables CSS dentro de `:root` en `styles.css`. Hay una variable `--color-primario` que define el color principal. Cuando `modoUI.js` activa un panel, agrega el atributo `data-modo='admin'`, `data-modo='instructor'` o `data-modo='usuario'` al `document.body`. El CSS tiene selectores que cambian las variables según ese atributo: `[data-modo='admin']` aplica azul, `[data-modo='instructor']` aplica verde, `[data-modo='usuario']` aplica morado. Es el mismo HTML y CSS — solo cambia el atributo."

---

### ¿Cómo funciona el menú hamburguesa y el sidebar?

**Respuesta:**

> "El botón hamburguesa (tres líneas) tiene un listener que alterna la clase CSS `'abierto'` en el sidebar. Cuando `'abierto'` está presente, el CSS posiciona el sidebar como visible usando `transform: translateX(0)`. Cuando no está la clase, el sidebar está fuera de pantalla con `transform: translateX(-100%)`. El overlay (fondo oscuro) se muestra/oculta con la misma clase. Al hacer clic en el overlay o en la X de cierre, se quita la clase `'abierto'` y el sidebar se desliza hacia afuera."

---

### ¿Cómo funciona el filtro de tareas desde el frontend?

**Respuesta:**

> "Los filtros de tareas los maneja `utils/filtros.js`. Cuando el usuario escribe en el buscador o cambia el selector de estado, se llama a la función de filtrado que toma el arreglo completo de tareas (guardado en memoria) y aplica los criterios: filtra por texto buscando en el título, la descripción o el documento del usuario asignado. Filtra por estado comparando con el valor del selector. Filtra por rol del usuario asignado.
>
> El resultado es un arreglo filtrado que se pasa a la función de `ui/` para redibujar la tabla. No hace una nueva petición al servidor para cada filtro — usa los datos ya cargados. Eso hace el filtrado instantáneo."

---

### ¿Cómo funciona el calendario?

**Respuesta:**

> "El calendario lo maneja `utils/eventosCalendario.js`. Genera dinámicamente el HTML de una grilla mensual: crea una celda por cada día del mes. Para cada celda, busca en el arreglo de eventos si hay alguno en esa fecha. Si lo hay, agrega un punto de color con el título del evento como tooltip. Los botones de mes anterior/siguiente actualizan la variable del mes actual y regeneran toda la grilla.
>
> Los eventos se cargan desde el servidor con `calendarApi.js` cuando se activa la vista del calendario. El instructor ve sus propios eventos en su panel. El estudiante ve los eventos que el instructor le asignó."

**Mostrar:** `src/utils/eventosCalendario.js` si está disponible.

---

### ¿Cómo funciona la exportación a JSON?

**Respuesta:**

> "La exportación la maneja `utils/exportacion.js`. Recibe el arreglo de tareas que está actualmente visible en la tabla (ya filtrado y ordenado). Lo convierte a texto con `JSON.stringify(datos, null, 2)` con indentación. Luego crea un `Blob` — un objeto binario en memoria — con ese texto. Genera una URL temporal para ese blob con `URL.createObjectURL()`. Crea un elemento `<a>` invisible, le asigna esa URL como `href` y le pone el nombre del archivo con `download`. Simula un clic en ese enlace con `.click()`. El navegador descarga el archivo automáticamente. Finalmente libera la URL temporal con `URL.revokeObjectURL()`."

---

### ¿Cómo funcionan las notas personales (post-its)?

**Respuesta:**

> "Las notas se cargan del servidor cuando el estudiante abre la sección de notas — `notesApi.js` hace `GET /api/notes` que retorna solo las notas del usuario autenticado (el servidor filtra por `req.usuario.id`). Al crear una nota, `notesApi.js` hace `POST /api/notes` con `{ texto, color }`. Al eliminar, hace `DELETE /api/notes/:id`. Cada operación actualiza la vista redibuajando la lista de notas desde el servidor."

---

### ¿Qué es el sistema de auditoría?

**Respuesta:**

> "El sistema de auditoría lo maneja `utils/auditoria.js`. Guarda un log de acciones importantes (crear tarea, eliminar usuario, cambiar rol) en un arreglo en memoria. Cada entrada tiene el timestamp, el tipo de acción y el detalle. En el panel del admin hay una sección 'Log de actividad' que muestra ese arreglo. El log se reinicia al cerrar sesión porque está en memoria, no en la base de datos."

---

## PREGUNTAS GENERALES DE JAVASCRIPT

---

### ¿Qué es la desestructuración y dónde la usan?

**Respuesta:**

> "La desestructuración es una forma de extraer valores de un objeto o arreglo en variables individuales en una sola línea. Por ejemplo, en `sesion.js`: `export function guardarSesion({ accessToken, refreshToken, user })` — en lugar de recibir un objeto y acceder a `objeto.accessToken`, la desestructuración extrae los tres valores directamente en los parámetros. También se usa en `fetchConAuth.js`: `const { accessToken: nuevoToken } = await renovarToken(refreshToken)` — extrae `accessToken` y lo renombra a `nuevoToken` en la misma línea."

**Mostrar:** `src/utils/sesion.js` función `guardarSesion`.

---

### ¿Qué es el Spread operator (`...`) y dónde lo usan?

**Respuesta:**

> "El operador `...` despliega los elementos de un objeto o arreglo. En `fetchConAuth.js` se usa para construir las opciones de la petición: `{ ...opciones, headers: { 'Content-Type': 'application/json', ...opciones.headers, Authorization: ... } }` — despliega las opciones del llamador y agrega encima los headers de autenticación. Si el llamador ya tenía headers, los mantiene (`...opciones.headers`), y agrega el de autorización encima. Esto permite combinar objetos sin mutar los originales."

**Mostrar:** `src/utils/fetchConAuth.js` — la construcción de `opcionesConAuth`.

---

### ¿Qué es `async/await` y por qué lo usan?

**Respuesta:**

> "JavaScript es asíncrono — las peticiones al servidor no bloquean el resto del código. `async/await` es la forma moderna de manejar esa asincronía. Una función marcada como `async` siempre retorna una Promesa. `await` pausa la ejecución de esa función hasta que la Promesa se resuelve, sin bloquear el hilo principal. Por ejemplo, en `authApi.js`: `const response = await fetch(url, options)` — espera que el servidor responda antes de continuar a la siguiente línea, pero el navegador puede seguir procesando eventos mientras espera."

---

### ¿Qué es el `try/catch` y por qué lo usan en las funciones de `api/`?

**Respuesta:**

> "Si una petición `fetch` falla (sin internet, servidor caído) o si el servidor responde con error, JavaScript lanza una excepción. Sin `try/catch`, esa excepción rompería toda la aplicación. Con `try/catch`, el error queda atrapado y podemos retornar un valor por defecto (como `null` o `[]`) para que la pantalla no se rompa. En los archivos de `api/`, el `catch` generalmente muestra un toast de error con `mostrarNotificacion()` y retorna `null` o el error para que la función que llamó pueda decidir qué hacer."

---

### ¿Qué es el `Map` y para qué lo usan en el router?

**Respuesta:**

> "Un `Map` es una estructura de datos de JavaScript que almacena pares clave-valor — similar a un objeto, pero con ventajas para agregar y consultar entradas dinámicamente. En `router.js`, `_rutas` es un `Map` donde la clave es el hash de la URL (como `'admin/usuarios'`) y el valor es la función que debe ejecutarse. `_rutas.get(hash)` busca la función en tiempo constante — más eficiente que recorrer un arreglo."

**Mostrar:** `src/router.js` — la declaración de `const _rutas = new Map()`.

---

### ¿Cómo funciona el `DOMContentLoaded` en `main.js`?

**Respuesta:**

> "El navegador carga el HTML y luego ejecuta el JavaScript. Si el script intenta acceder a un elemento del DOM antes de que el HTML termine de cargarse, falla porque el elemento todavía no existe. `DOMContentLoaded` es un evento que el navegador dispara cuando todo el HTML está parseado y listo. Poniendo el código de inicio dentro de `document.addEventListener('DOMContentLoaded', async function() { ... })` garantizamos que cuando `main.js` se ejecuta, todos los elementos del HTML ya existen en el DOM."

**Mostrar:** `src/main.js` — la primera línea del listener.

---

### ¿Cómo funciona el sistema de módulos (`import/export`)?

**Respuesta:**

> "ES6 Modules divide el código en archivos independientes donde cada uno declara explícitamente qué exporta y qué importa. `export function loginUsuario()` hace que esa función esté disponible para otros archivos. `import { loginUsuario } from './api/authApi.js'` la importa en otro archivo. Esto evita el problema del JavaScript antiguo donde todo era global y cualquier variable podía pisarse entre archivos. Vite hace posible que el navegador use estos módulos sin configuración adicional."

---

### ¿Qué es Lucide y para qué lo usan?

**Respuesta:**

> "Lucide es una librería de íconos SVG. En el HTML usamos elementos `<i data-lucide='nombre-del-icono'>` donde el nombre corresponde a un ícono de la librería (por ejemplo `data-lucide='user'`, `data-lucide='trash'`). Al final de `main.js`, `window.lucide.createIcons()` busca todos esos elementos en el DOM y los reemplaza con el SVG correspondiente. Usamos Lucide porque los íconos SVG son escalables, se ven perfectos en cualquier resolución y se pueden estilizar con CSS."
