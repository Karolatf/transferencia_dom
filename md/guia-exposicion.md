# Guía de Exposición — Sistema de Gestión de Tareas (SGT)

> Guía paso a paso para la exposición final ante los instructores del SENA.
> Léela al pie de la letra durante la presentación. Cada sección indica qué decir
> y qué mostrar en pantalla o en el código.

---

## ANTES DE EMPEZAR — Preparación

**Verificar que esté corriendo:**
1. Abrir VSCode con la carpeta `transferencia_dom`.
2. Abrir la terminal y ejecutar: `npm run dev`
3. Abrir el navegador en `http://localhost:5173`
4. Tener el servidor backend corriendo en otra terminal.
5. Tener DBeaver o la herramienta de base de datos lista para mostrar.
6. Cerrar sesión si hay una activa — la exposición empieza desde el login.

---

## PASO 1 — Presentación Personal (2 minutos)

> *Ponerse de pie, mirar al instructor, hablar con seguridad.*

**Decir:**

> "Buenos días/tardes. Mi nombre es [TU NOMBRE]. Soy aprendiz del programa Técnico en Programación de Software del SENA.
>
> El proyecto que voy a presentar hoy se llama **Sistema de Gestión de Tareas**, también conocido como SGT. Es una aplicación web completa, con frontend en JavaScript puro y backend en Node.js con base de datos MySQL.
>
> El objetivo del sistema es permitir que administradores e instructores asignen tareas a estudiantes, hagan seguimiento del progreso, califiquen el trabajo realizado y gestionen los usuarios del sistema.
>
> La exposición está dividida en seis partes: primero veremos la aplicación en funcionamiento, luego las validaciones, después la comunicación con el servidor, después explicaré el código en VSCode, mostraré la base de datos, y finalmente explicaré la arquitectura completa del proyecto."

---

## PASO 2 — Demo Visual: Cómo funciona la aplicación (10 minutos)

> *Compartir pantalla. Tener el navegador en `http://localhost:5173`.*

### 2.1 — Pantalla de login

**Decir:**

> "Esta es la pantalla de inicio de sesión. El diseño usa un efecto llamado *Liquid Glass* — una tarjeta de vidrio con transparencia y desenfoque sobre un fondo con orbs de color animados. Visualmente comunica modernidad y profesionalismo.
>
> El sistema tiene tres roles: **administrador**, **instructor** y **estudiante**. Cada uno tiene su propio panel con colores distintivos: azul para el admin, verde para el instructor y morado para el estudiante."

**Hacer:**
- Mostrar el formulario de login sin llenar y señalar los campos.
- Mostrar el botón del ojo para revelar la contraseña.

---

### 2.2 — Login como estudiante (panel morado)

**Hacer:** Ingresar con credenciales de un estudiante.

**Decir:**

> "Al ingresar como estudiante, la aplicación detecta el rol y carga automáticamente el panel del estudiante con tema morado.
>
> En la parte superior izquierda tenemos el botón de menú —las tres líneas horizontales llamadas 'hamburguesa'— que abre el menú lateral o *sidebar*.
>
> En el panel de inicio vemos: primero una bienvenida personalizada con el nombre del estudiante, luego un dashboard con 6 tarjetas que muestran los contadores de tareas por estado en tiempo real, después los datos del perfil del usuario, y a la derecha el calendario personal con los eventos asignados."

**Hacer:**
- Abrir el sidebar y mostrarlo, cerrarlo con la X.
- Señalar cada tarjeta del dashboard.
- Navegar a "Mis Tareas" desde el sidebar.

**Decir sobre la sección de tareas:**

> "Aquí el estudiante ve todas sus tareas asignadas. Puede buscar por título o ID usando el buscador. Cada tarea muestra su título, descripción, estado con un badge de color, y un comentario del instructor.
>
> El estudiante puede hacer dos cosas con sus tareas: ver los detalles o cambiar el estado. Por ejemplo, puede marcar una tarea como 'En progreso' cuando la empieza, o 'Por aprobar' cuando la termina y quiere que el instructor la revise."

**Hacer:** Abrir el modal de edición de una tarea. Mostrar las opciones de estado limitadas.

---

### 2.3 — Login como administrador (panel azul)

**Hacer:** Cerrar sesión. Ingresar como administrador.

**Decir:**

> "Ahora ingresamos como administrador. El tema cambia a azul automáticamente — mismo HTML, mismos estilos base, solo cambia la variable de color CSS según el rol. Esto se hace con el atributo `data-modo` en el body del HTML.
>
> El administrador tiene poder total: gestiona usuarios, crea y asigna tareas, ve todas las actividades del sistema y puede cambiar roles."

**Hacer:** Mostrar el panel de inicio del admin.

**Decir sobre el panel de inicio:**

> "En el inicio del admin vemos el dashboard global con las estadísticas de TODAS las tareas del sistema, no solo las propias.
>
> Debajo hay tres columnas: la de auditoría muestra el log de actividad reciente —cada acción importante queda registrada—, la de roles muestra las tarjetas de cada rol con sus permisos, y la de información del sistema muestra los datos del proyecto."

**Hacer:** Hacer clic en "Ver permisos" del rol Administrador. Mostrar el modal de permisos.

**Decir:**

> "Este modal muestra todos los permisos del rol administrador, agrupados por categoría: tareas, usuarios y calendario. Cada permiso tiene un formato `recurso.accion`, como `tasks.create` o `users.delete`. Esto nos permite controlar con precisión qué puede hacer cada rol."

**Hacer:** Cerrar el modal. Navegar a "Usuarios" en el sidebar.

**Decir sobre la tabla de usuarios:**

> "Aquí vemos todos los usuarios registrados en el sistema. Para cada uno tenemos su nombre, documento de identidad, correo, el rol con un badge de color, y el estado activo o inactivo.
>
> Las acciones disponibles son: ver perfil, editar datos, cambiar rol, desactivar/reactivar la cuenta y eliminar permanentemente. Cada una de estas acciones tiene una confirmación antes de ejecutarse."

**Hacer:** Navegar a "Todas las Tareas".

**Decir:**

> "En esta sección el administrador ve todas las tareas del sistema. Puede filtrar por estado, por nombre del usuario asignado, ordenar la tabla de distintas formas, y exportar la lista filtrada como archivo JSON con un solo clic."

---

### 2.4 — Login como instructor (panel verde)

**Hacer:** Cerrar sesión. Ingresar como instructor.

**Decir:**

> "El instructor tiene un panel verde. Tiene permisos intermedios: puede crear y gestionar tareas, ver los estudiantes y su progreso, y lo más importante — puede **calificar** las tareas.
>
> En la sección de inicio del instructor hay un widget especial llamado 'Panel de calificación' que muestra directamente las tareas que están en estado 'Por aprobar', permitiendo calificarlas rápidamente sin tener que ir a la tabla completa."

**Hacer:** Mostrar el panel de calificación si hay tareas pendientes. Mostrar la tabla de estudiantes.

---

## PASO 3 — Validaciones (5 minutos)

> *Permanecer en el navegador.*

**Decir:**

> "Las validaciones son una parte fundamental del sistema. Todo el código de validación está centralizado en un solo archivo: `utils/validaciones.js`. Vamos a probar algunas."

### 3.1 — Validación del login

**Hacer:** Volver al login. Hacer clic en "Ingresar" sin llenar nada.

**Decir:**

> "El sistema muestra mensajes de error en rojo debajo de cada campo inválido, y un toast con el primer error en la esquina superior derecha. El toast desaparece automáticamente en 3 segundos. El campo incorrecto queda resaltado en rojo."

### 3.2 — Validación del formulario de registro

**Hacer:** Hacer clic en "Regístrate". Intentar enviar el formulario vacío.

**Decir:**

> "El modal de registro valida 5 campos con reglas específicas: el nombre solo acepta letras y espacios, el documento solo acepta números y mínimo 5 dígitos, el correo debe tener formato válido, la contraseña mínimo 6 caracteres, y las dos contraseñas deben coincidir. Si alguna regla no se cumple, el sistema señala exactamente qué está mal."

### 3.3 — Validación de crear tarea (como admin)

**Hacer:** Iniciar sesión como admin. Ir a "Crear Tarea". Intentar crear sin título.

**Decir:**

> "El formulario de creación de tareas valida que el título y el estado sean obligatorios antes de enviar nada al servidor. Esto evita desperdiciar peticiones HTTP con datos incompletos."

---

## PASO 4 — Comunicación con el servidor (5 minutos)

> *Abrir las Herramientas de Desarrollador del navegador (F12) → pestaña Network.*

**Decir:**

> "Toda la comunicación entre el frontend y el servidor ocurre a través de peticiones HTTP. Vamos a ver cómo funciona esto en tiempo real."

### 4.1 — Petición de login

**Hacer:** Con Network abierto, hacer login. Señalar la petición `POST /api/auth/login`.

**Decir:**

> "Al hacer login, el sistema envía una petición POST al servidor con el correo y la contraseña. El servidor valida las credenciales y responde con dos tokens: el *Access Token* que dura 1 hora, y el *Refresh Token* que dura 7 días. Estos tokens se guardan en el `localStorage` del navegador."

**Hacer:** Abrir `localStorage` en la pestaña Application de DevTools y mostrar los tokens.

### 4.2 — Silent Refresh (renovación automática)

**Decir:**

> "Cuando el Access Token expira (después de 1 hora), el sistema no cierra la sesión automáticamente. En cambio, detecta el error 401 del servidor y automáticamente solicita un nuevo token usando el Refresh Token. Esto se hace en el archivo `fetchConAuth.js` de forma completamente transparente para el usuario."

### 4.3 — Petición GET de tareas

**Hacer:** Navegar a la tabla de tareas. Señalar el GET a `/api/tasks` en Network.

**Decir:**

> "Cada vez que se carga la tabla de tareas, se hace una petición GET al servidor. La petición incluye el Access Token en el header `Authorization: Bearer [token]`. El servidor verifica el token antes de responder con los datos. Si el token es inválido o expiró, responde con 401 y el sistema renueva el token automáticamente."

---

## PASO 5 — El código en VSCode (10 minutos)

> *Cambiar a VSCode. Tener el explorador de archivos visible a la izquierda.*

**Decir:**

> "El proyecto está organizado en una estructura de capas clara. Cada carpeta tiene una responsabilidad específica y ningún archivo hace más de lo que le corresponde."

### 5.1 — Estructura de carpetas

**Hacer:** Mostrar el árbol de carpetas en el explorador.

```
src/
  api/       ← solo peticiones HTTP al servidor
  services/  ← coordina api + ui
  ui/        ← dibuja en pantalla
  utils/     ← funciones reutilizables
  main.js    ← punto de entrada
  router.js  ← navegación SPA
  rutas.js   ← todas las URLs
```

**Decir:**

> "Esta separación se llama arquitectura en capas. La capa `api` solo habla con el servidor. La capa `ui` solo dibuja en pantalla. Los archivos en `utils` son funciones reutilizables que no tienen acceso directo al servidor ni al DOM. Esto hace el código más fácil de mantener y depurar."

---

### 5.2 — Mostrar `main.js`

**Hacer:** Abrir `src/main.js`.

**Decir:**

> "El archivo `main.js` es el punto de entrada de toda la aplicación. Es el primero que se ejecuta. Hace dos cosas: primero verifica si hay una sesión activa en el localStorage, y si la hay, valida que el token siga siendo válido con el servidor. Si el token está vivo, activa el panel del rol correspondiente. Si no hay sesión o el token expiró, muestra la pantalla de login."

---

### 5.3 — Mostrar `router.js`

**Hacer:** Abrir `src/router.js`.

**Decir:**

> "El router es el corazón de la navegación. La aplicación es una SPA — Single Page Application — lo que significa que nunca recarga la página. En cambio, cambia el fragmento `#` de la URL.
>
> Por ejemplo: cuando el admin hace clic en 'Usuarios', la URL cambia de `#admin/inicio` a `#admin/usuarios`. El router detecta ese cambio con el evento `hashchange`, busca la función registrada para esa ruta y la ejecuta. Esa función muestra la sección correcta en pantalla."

---

### 5.4 — Mostrar `fetchConAuth.js`

**Hacer:** Abrir `src/utils/fetchConAuth.js`.

**Decir:**

> "Este archivo es el intermediario entre el código y el servidor. Cada vez que necesitamos hacer una petición HTTP autenticada, usamos esta función en lugar de `fetch` directamente. Automáticamente agrega el token JWT al header, y si el servidor responde con error 401 (token expirado), renueva el token y repite la petición. Esto es lo que llamamos Silent Refresh."

---

### 5.5 — Mostrar `modoUI.js`

**Hacer:** Abrir `src/ui/modoUI.js`. Navegar a la función `activarModoAdmin`.

**Decir:**

> "Este es el archivo más grande del proyecto — es el que controla toda la interfaz. La función `activarModoAdmin` es un ejemplo: primero oculta todas las vistas con `ocultarTodo()`, luego muestra el panel del admin, establece el color azul con `document.body.dataset.modo = 'admin'`, carga los datos del servidor en paralelo, y registra todas las rutas de navegación del admin en el router."

---

### 5.6 — Mostrar `validaciones.js`

**Hacer:** Abrir `src/utils/validaciones.js`. Mostrar `validarFormularioRegistro`.

**Decir:**

> "Todo el código de validación está centralizado aquí. La función `validarFormularioRegistro` valida los 5 campos del formulario de registro. Noten que validamos campo por campo, y guardamos el primer error en la variable `primerMensaje`. Al final mostramos ese primer error como un toast. Si el campo es inválido, agregamos la clase CSS `error` que lo pinta de rojo."

---

### 5.7 — Mostrar `sesion.js`

**Hacer:** Abrir `src/utils/sesion.js`.

**Decir:**

> "Este archivo es el único en todo el proyecto que tiene acceso al `localStorage`. Ningún otro archivo guarda o lee tokens directamente. Todas las operaciones de sesión pasan por aquí: guardar tokens al hacer login, leer el token para enviarlo al servidor, y borrar todo al cerrar sesión."

---

### 5.8 — Mostrar `styles.css`

**Hacer:** Abrir `styles.css`. Navegar al bloque `:root`.

**Decir:**

> "Todo el sistema de colores del proyecto está definido en variables CSS dentro de `:root`. Hay una variable para el color primario, los espacios, los radios de borde, las sombras. Cuando el usuario inicia sesión como admin, el JavaScript cambia el atributo `data-modo` del body a 'admin', y el CSS automáticamente actualiza el color primario a azul. Es el mismo HTML, pero el color lo controla CSS según ese atributo."

---

## PASO 6 — Base de datos (5 minutos)

> *Cambiar a DBeaver o la herramienta de base de datos.*

**Decir:**

> "La base de datos es MySQL y corre en el backend — el servidor Node.js la usa directamente. El frontend nunca accede a la base de datos directamente; siempre le pide los datos al servidor a través de la API REST."

### 6.1 — Tablas principales

**Hacer:** Abrir las tablas y mostrarlas una por una.

**Decir por tabla:**

- **`users`**: almacena todos los usuarios. Columnas importantes: `id`, `name`, `email`, `documento`, `is_active` (1=activo / 0=inactivo), `password` (encriptado con bcrypt).

- **`tasks`**: almacena todas las tareas. Columnas: `id`, `title`, `description`, `status`, `comment`, `grade` (la calificación del instructor), `grade_reason` (motivo si se editó la nota), `assigned_users` (JSON con los IDs de los usuarios asignados), `created_ud`.

- **`user_roles`**: relaciona cada usuario con su rol. Columnas: `user_id`, `role_id`. Aquí se guarda si un usuario es admin, instructor o estudiante.

- **`roles`** y **`permissions`**: tablas de permisos del sistema. `roles` define los roles disponibles y `permissions` define qué puede hacer cada rol.

- **`role_permissions`**: tabla de unión entre roles y permisos — qué permisos tiene cada rol.

- **`calendar_events`**: eventos del calendario. Columnas: `id`, `title`, `date`, `type`, `userId` (instructor que lo creó), `targetUserId` (estudiante al que se asignó), `taskId` (tarea relacionada).

- **`user_notes`**: notas personales (post-its) de los estudiantes. Columnas: `id`, `userId`, `texto`, `color`.

- **`refresh_tokens`**: tokens de renovación activos. El servidor los invalida al hacer logout.

### 6.2 — Mostrar un registro real

**Hacer:** Ejecutar las siguientes consultas una por una en MySQL Workbench.

**Consulta 1 — Ver los usuarios registrados:**
```sql
SELECT id, name, email, documento, is_active
FROM users
LIMIT 10;
```

**Consulta 2 — Ver las tareas con su estado y calificación:**
```sql
SELECT id, title, status, grade, assigned_users
FROM tasks
LIMIT 10;
```

**Consulta 3 — Ver los roles asignados a cada usuario:**
```sql
SELECT u.name, u.email, r.name AS rol
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r       ON r.id = ur.role_id
LIMIT 10;
```

**Decir:**

> "Aquí vemos directamente cómo se guardan los datos. En `tasks`, la columna `assigned_users` guarda un JSON con los IDs de los estudiantes asignados a esa tarea — eso nos permite asignar una tarea a varios estudiantes al mismo tiempo sin necesitar una tabla separada. La columna `grade` guarda la nota que pone el instructor, y `status` guarda el estado actual de la tarea."

---

## PASO 7 — Cómo construimos el proyecto (5 minutos)

> *Volver a VSCode. Mostrar el árbol de carpetas.*

**Decir:**

> "El proyecto se construyó de adentro hacia afuera, capa por capa."

**Orden de construcción:**

1. **Configuración base**: iniciamos el proyecto con Vite (`npm create vite`), configuramos el servidor backend con Express, creamos la base de datos y las tablas.

2. **Autenticación**: lo primero fue el sistema de login. Implementamos JWT — el servidor genera tokens al hacer login, y el frontend los guarda en localStorage.

3. **API layer**: creamos los archivos en `api/` — primero `authApi.js`, luego `usuariosApi.js`, luego `tareasApi.js`. Cada archivo solo habla con el servidor.

4. **fetchConAuth.js**: después de tener la API básica, implementamos el Silent Refresh para que los tokens se renueven automáticamente.

5. **Router SPA**: implementamos el sistema de navegación por hash en `router.js` para poder tener múltiples vistas sin recargar la página.

6. **UI por roles**: construimos los tres paneles (usuario, admin, instructor) en `modoUI.js`, incluyendo tablas, formularios, modales y el sidebar.

7. **Utilidades**: `validaciones.js`, `filtros.js`, `ordenamiento.js`, `exportacion.js`, `auditoria.js` — todas las funciones auxiliares que se reutilizan en todo el sistema.

8. **Calendario y notas**: los últimos módulos en agregarse — `eventosCalendario.js` para el calendario interactivo y `notesApi.js` para los post-its.

---

## PASO 8 — Preguntas frecuentes del instructor (preparar respuestas)

**P: ¿Por qué JavaScript puro y no React o Angular?**
> "La transferencia de conocimiento del SENA evaluaba manipulación del DOM con JavaScript nativo. Usando un framework se perdería ese conocimiento base. Además, el proyecto demuestra que se pueden construir aplicaciones complejas sin necesidad de un framework."

**P: ¿Qué es un SPA?**
> "Single Page Application. Es una aplicación web que carga una sola página HTML y luego actualiza solo las partes que cambian, sin recargar la página completa. Esto lo hace más rápido y da una experiencia similar a una aplicación de escritorio."

**P: ¿Cómo funciona la autenticación JWT?**
> "Al hacer login, el servidor genera un token firmado con una clave secreta. Ese token contiene el ID del usuario y su rol. El frontend lo guarda en localStorage y lo envía en el header de cada petición. El servidor verifica la firma del token — si es válida y no ha expirado, da acceso. Si no, responde con error 401."

**P: ¿Por qué localStorage y no cookies?**
> "LocalStorage es más sencillo de manejar en aplicaciones SPA. Las cookies tienen ventajas de seguridad (HttpOnly) pero requieren más configuración en el servidor. Para este proyecto, localStorage es apropiado dado el alcance educativo."

**P: ¿Cómo manejan los errores si el servidor no está disponible?**
> "Todas las funciones de `api/` tienen `try/catch`. Si el servidor no responde, el error es capturado y se muestra un toast de error al usuario. Las funciones retornan `null` o `[]` en caso de error para que la pantalla no se rompa."

**P: ¿Qué es el Spread operator?**
> "El operador `...` despliega los elementos de un arreglo u objeto. Se usa por ejemplo en `return [...tareas]` para retornar una copia del arreglo sin modificar el original."

**P: ¿Qué es la desestructuración?**
> "Es una forma de extraer valores de un objeto en variables individuales. Por ejemplo, `const { name, role } = usuario` extrae el nombre y el rol del objeto usuario en dos variables separadas."

**P: ¿Por qué usaron Vite?**
> "Vite es la herramienta de construcción moderna para JavaScript. Nos permite usar módulos ES6 (import/export), recarga automática en desarrollo, y optimización del código para producción — todo sin configuración compleja."

**P: ¿Cómo se hace responsivo?**
> "Con media queries en CSS. El sidebar pasa a ocupar el ancho completo en móvil, las tablas tienen scroll horizontal, las grillas de 3 columnas colapsan a 1 columna. Las imágenes y tamaños usan unidades relativas como `rem`, `vw`, y `min()`."

---

## CIERRE — Conclusiones (2 minutos)

**Decir:**

> "Para concluir, el Sistema de Gestión de Tareas es una aplicación web completa que demuestra el uso práctico de conceptos fundamentales de programación:
>
> - Manipulación dinámica del DOM con JavaScript puro
> - Comunicación cliente-servidor con la API REST mediante peticiones HTTP
> - Autenticación segura con tokens JWT y renovación automática
> - Arquitectura en capas separando responsabilidades
> - Diseño responsivo con CSS moderno
> - Sistema de roles y permisos para tres tipos de usuario
>
> El proyecto fue construido completamente desde cero, lo que nos permitió entender cada línea de código que escribimos. Estamos listos para responder cualquier pregunta sobre la implementación.
>
> Muchas gracias."

---

## Checklist final antes de la exposición

- [ ] El servidor backend está corriendo
- [ ] La base de datos tiene datos de prueba (usuarios de los 3 roles, tareas en varios estados)
- [ ] El navegador está en `http://localhost:5173` con el login visible
- [ ] VSCode tiene abiertos los archivos principales
- [ ] La herramienta de base de datos está lista
- [ ] DevTools del navegador cerradas (se abren solo en el paso 4)
- [ ] Cuentas de prueba conocidas: admin, instructor y estudiante con sus contraseñas
