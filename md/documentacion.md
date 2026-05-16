# Documentación Técnica — Sistema de Transferencia DOM
**Proyecto:** Plataforma de gestión de tareas y usuarios por roles  
**Tecnología:** Vanilla JavaScript (ES Modules), HTML5, CSS3 — sin frameworks  
**Fecha:** Mayo 2026

---

## Descripción General

Sistema web tipo SPA (Single Page Application) que gestiona tres tipos de usuarios: **Aprendiz**, **Instructor** y **Administrador**. Cada rol tiene su propia vista con navegación lateral, secciones independientes y funcionalidades específicas. El sistema se conecta a un servidor backend Express + MySQL para persistir los datos.

---

## Arquitectura General

```
transferencia_dom/
├── index.html              ← Punto de entrada único (SPA)
├── styles.css              ← Estilos globales + por rol + componentes
├── src/
│   ├── router.js           ← Router SPA basado en hash (con soporte de ID dinámico)
│   ├── rutas.js            ← Fuente única de verdad para nombres de ruta
│   ├── main.js             ← Inicialización y autenticación
│   ├── api/                ← Módulos de peticiones HTTP al backend
│   │   ├── tareasApi.js
│   │   ├── usuariosApi.js
│   │   └── authApi.js
│   ├── utils/              ← Utilidades compartidas
│   │   ├── config.js       ← API_BASE_URL
│   │   ├── fetchConAuth.js ← Fetch con token JWT automático
│   │   ├── notificaciones.js
│   │   └── sesion.js
│   ├── services/           ← Lógica de negocio por módulo
│   │   └── tareasService.js
│   └── ui/
│       ├── modoUI.js       ← Controlador principal de vistas y UI
│       └── tareasUI.js     ← Componentes visuales de tareas (usuario)
└── assets/
    └── bg-inicio.jpg       ← Fondo de pantalla de login
```

---

## Módulos Clave

### `src/router.js` — Router SPA hash-based

Gestiona la navegación interna de cada vista sin recargar la página. Funciona sobre `window.location.hash`.

**API exportada:**

| Función | Descripción |
|---|---|
| `registrarRuta(hash, fn)` | Registra un handler para un hash exacto |
| `registrarRutas(mapa)` | Registra varios handlers de una vez |
| `ir(hash)` | Navega a una ruta (cambia el hash) |
| `navegarA` | Alias de `ir()` para compatibilidad |
| `iniciarRouter()` | Arranca el listener de hashchange |
| `volverDeModal()` | Cierra un modal y regresa a la ruta anterior |
| `rutaActual()` | Devuelve el hash activo |
| `rutaAnterior()` | Devuelve el hash anterior (usado para detectar si venimos de un modal) |
| `limpiarHashActual()` | Elimina el hash de la URL sin navegar |
| `resetearEstadoRouter()` | Limpia el historial interno al hacer logout |

**Soporte de rutas con ID dinámico:**  
El router resuelve rutas que incluyen el ID de la entidad al final. Si el hash es `admin/usuarios/editar-usuario/3`, el router busca primero una coincidencia exacta y, si no la encuentra, busca el prefijo registrado `admin/usuarios/editar-usuario`. Esto permite que la URL refleje el ID real de la base de datos sin necesidad de registrar una ruta por cada ID.

**Rutas de sección por rol:**

| Rol | Secciones disponibles |
|---|---|
| Aprendiz | `#usuario/inicio` · `#usuario/tareas` · `#usuario/notas` |
| Administrador | `#admin/inicio` · `#admin/crear-tarea` · `#admin/usuarios` · `#admin/tareas` |
| Instructor | `#instructor/inicio` · `#instructor/crear-tarea` · `#instructor/estudiantes` · `#instructor/tareas` |

---

## Funcionalidades por Módulo

### 1. Sistema de autenticación y roles

- Login único en `index.html` con validación de credenciales contra el backend (JWT)
- Al autenticarse, se activa la vista correspondiente al rol (`activarModoUsuario`, `activarModoAdmin`, `activarModoInstructor`)
- El atributo `body[data-modo]` controla el esquema de color activo (`usuario`, `admin`, `instructor`)
- Logout disponible desde el sidebar de cada vista con confirmación

### 2. Pantalla de Login — Diseño Liquid Glass

La pantalla de inicio fue completamente rediseñada con una estética moderna:

- **Fondo:** imagen `bg-inicio.jpg` con overlay oscuro semitransparente
- **Orbs animados:** 3 esferas de color con `filter: blur` y animación flotante (`@keyframes orbFloat`)
- **Card de vidrio:** `backdrop-filter: blur(48px) saturate(160%)` con borde sutil y sombra multicapa
- **Logo:** ícono `shield-check` de Lucide Icons sobre fondo morado translúcido
- **Campos con íconos:** cada campo tiene un ícono prefijo (Lucide `mail` / `lock`) y el campo de contraseña incluye botón mostrar/ocultar
- **Modales secundarios** (Registro y Recuperar contraseña): estilo liquid glass consistente con `animation: none` para eliminar lag de renderizado

**Íconos usados (Lucide Icons CDN):**  
`shield-check` · `mail` · `lock` · `eye` · `eye-off` · `log-in` · `check-circle`

### 3. Navegación SPA — Sidebar + Menú Hamburguesa

Cada vista de rol incluye:

- **Botón hamburguesa** (`.btn-hamburguesa`) con animación de apertura/cierre en X
- **Sidebar drawer** (`.sidebar`) que desliza desde la izquierda (`transform: translateX(-100%)` → `translateX(0)`)
- **Overlay oscuro** (`.sidebar-overlay`) que cierra el sidebar al hacer clic fuera
- **Sección hero de bienvenida** visible al iniciar sesión (`.spa-hero`) con nombre del usuario y rol

**Comportamiento del sidebar con modales:**  
Cuando se abre un modal desde el sidebar (ej. "Cambiar contraseña" o "Cerrar sesión") y el usuario cancela o cierra el modal, el sidebar **permanece abierto**. Solo se cierra cuando el usuario hace clic en la X del sidebar o en el overlay directamente.

Las secciones de contenido (`.spa-seccion[data-seccion]`) se muestran/ocultan con la clase `.spa-seccion--oculta` sin recargar el DOM.

### 4. Tablas — Numeración con ID de base de datos

Todas las tablas del sistema (usuarios y tareas, en los tres roles) muestran en la columna `#` el **ID real de la base de datos**, no un índice secuencial. Esto refleja el comportamiento de MySQL con auto_increment: al eliminar un registro y crear uno nuevo, el nuevo toma el siguiente ID disponible (no reutiliza el eliminado). Así la numeración en el frontend coincide exactamente con la BD.

### 5. Botones de acción — ID en la URL

Al hacer clic en cualquier botón de acción (ver, editar, cambiar rol, desactivar, activar, eliminar) sobre una tarea o usuario, la URL incluye el ID de la entidad:

```
#admin/usuarios/editar-usuario/3
#admin/tareas/ver-tarea/15
#instructor/tareas/editar-tarea/22
#usuario/tareas/ver-tarea/4
```

Esto aplica a todos los roles y también a los resultados de la barra de búsqueda del header.

### 6. Vista Aprendiz

| Sección | Funcionalidad |
|---|---|
| Inicio | Dashboard con estadísticas de tareas (pendientes, en progreso, completadas) |
| Mis Tareas | Listado de tareas asignadas con filtros por estado, ver detalle, editar estado, exportar |
| Notas | Sistema de notas personales (crear, editar, eliminar) |

### 7. Vista Administrador

| Sección | Funcionalidad |
|---|---|
| Inicio | Dashboard global: resumen de usuarios, tareas por estado, roles registrados |
| Crear Tarea | Formulario con asignación múltiple de usuarios via dropdown con checkboxes |
| Usuarios | Gestión completa: ver, editar datos, cambiar rol, activar/desactivar, eliminar |
| Tareas | Tabla con filtros por estado (Pendiente, En Progreso, Por Aprobar, Completada, **Reprobada**), usuario y orden |

### 8. Vista Instructor

| Sección | Funcionalidad |
|---|---|
| Inicio | Dashboard con resumen de sus estudiantes y tareas creadas |
| Crear Tarea | Formulario para asignar tareas a sus estudiantes |
| Estudiantes | Listado de sus aprendices con progreso por tarea |
| Tareas | Seguimiento con filtros por estado (incluyendo **Reprobada**), editar calificación |

### 9. Dropdown de asignación de usuarios

- Panel desplegable con lista de checkboxes para selección múltiple de usuarios
- Altura dinámica calculada en tiempo real: `maxHeight = window.innerHeight - btn.bottom - 8px`
- Scroll interno con `overscroll-behavior: contain` para no propagar el scroll al fondo

### 10. Reset de formularios al navegar

Al navegar a otra sección y volver, el sistema limpia automáticamente:

- Campos de formulario (`form.reset()`)
- Mensajes de error (`.form__error` → `textContent = ''`)
- Clases de validación (`classList.remove('error')`)
- Checkboxes del dropdown de usuarios (desmarcados)
- Texto del dropdown restaurado a `'Seleccionar usuarios...'`
- Filtros de la sección Tareas restaurados a "Todos"
- Tabla de tareas recargada desde los datos actuales

### 11. Sistema de validaciones

- Al detectar error, añade clase `error` al campo correspondiente y muestra mensaje en `.form__error`
- Compatible con `input`, `select` y `textarea` dentro de formularios modales y de sección

**Validación del motivo de desactivación/activación de usuario:**  
El campo motivo requiere mínimo 10 caracteres **y al menos una letra** (no acepta solo números). Esto aplica tanto en el modal de desactivar como en el de activar usuarios.

**Validación del motivo de edición de calificación (instructor):**  
Igual que el anterior: mínimo 10 caracteres y al menos una letra.

### 12. Gestión de handlers de edición de tarea

El formulario de edición (`editTaskForm`) es compartido entre los tres roles. Para evitar que handlers de sesiones anteriores se acumulen y disparen de forma inesperada, se utiliza la variable `_activeEditHandler`:

- Antes de registrar un nuevo handler `submit`, se elimina el handler anterior
- Al completar o cancelar la edición, `_activeEditHandler` se limpia
- Esto garantiza que solo haya **un handler activo** a la vez, independientemente de cuántos modales se hayan abierto y cerrado sin guardar

---

## Esquema de Colores por Rol

| Variable CSS | Rol | Color |
|---|---|---|
| `--color-primario` | Aprendiz | Morado `#9333ea` |
| `--color-admin` | Administrador | Azul `#2563eb` |
| `--color-instructor` | Instructor | Verde `#059669` |

El color activo se aplica automáticamente a botones, badges, bordes de acento y la variable `--color-modal-acento` según el `body[data-modo]` activo.

---

## Animaciones y Rendimiento

| Elemento | Técnica |
|---|---|
| Orbs del login | `@keyframes orbFloat` con `animation-delay` escalonado |
| Sidebar drawer | `transition: transform 280ms cubic-bezier(0.4,0,0.2,1)` |
| Secciones SPA | Cambio de clase, sin animación (instantáneo) |
| Modales internos | `slideIn 160ms ease-out` con `animation-fill-mode: both` + 16ms delay anti-stutter |
| Modales de login | `animation: none` — vidrio + blur sin costo de animación |
| Cards del dashboard | `@keyframes fadeInUp` encadenado por índice |

---

## Tecnologías Utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 Semántico | Estructura de vistas y formularios |
| CSS3 Custom Properties | Temas por rol, variables de espaciado y color |
| JavaScript ES Modules | Arquitectura modular (`import/export`) |
| `window.location.hash` | Router SPA sin recarga de página |
| Lucide Icons (CDN) | Sistema de íconos SVG vectoriales |
| `backdrop-filter` | Efecto vidrio en login y modales |
| `localStorage` | Persistencia de sesión y tokens JWT |
| Fetch API | Comunicación con el backend Express |

---

## Flujo de Usuario Típico

```
1. Usuario abre index.html
   └─ Pantalla de login (liquid glass, orbs animados)
   
2. Ingresa credenciales → sistema valida contra backend → responde con JWT
   └─ Se activa la vista correspondiente al rol
   
3. Vista carga con sidebar cerrado, sección "Inicio" visible
   └─ Hero de bienvenida con nombre y rol del usuario
   
4. Usuario abre hamburguesa → sidebar aparece
   └─ Navega a otra sección → hash cambia → router muestra sección
   
5. Usuario hace clic en un botón de acción (ej. "Ver usuario")
   └─ URL cambia a #admin/usuarios/ver-usuario/3
   └─ Router resuelve el prefijo → abre modal con datos del usuario ID 3
   
6. Al navegar: formularios y filtros se resetean automáticamente
   └─ Tablas se recargan con datos actuales
   
7. Usuario hace logout → confirmación → vuelve a pantalla de login limpia
   └─ resetearEstadoRouter() limpia el historial interno
```
