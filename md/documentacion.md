# Documentación Técnica — Sistema de Transferencia DOM
**Proyecto:** Plataforma de gestión de tareas y usuarios por roles  
**Tecnología:** Vanilla JavaScript (ES Modules), HTML5, CSS3 — sin frameworks  
**Fecha:** Mayo 2026

---

## Descripción General

Sistema web tipo SPA (Single Page Application) que gestiona tres tipos de usuarios: **Aprendiz**, **Instructor** y **Administrador**. Cada rol tiene su propia vista con navegación lateral, secciones independientes y funcionalidades específicas. El sistema no requiere servidor backend para funcionar; opera completamente en el navegador.

---

## Arquitectura General

```
transferencia_dom/
├── index.html              ← Punto de entrada único (SPA)
├── styles.css              ← Estilos globales + por rol + componentes
├── src/
│   ├── router.js           ← Router SPA basado en hash (NUEVO)
│   ├── main.js             ← Inicialización y autenticación
│   ├── datos/              ← Módulos de datos (tareas, usuarios, notas)
│   ├── logica/             ← Lógica de negocio y validaciones
│   └── ui/
│       └── modoUI.js       ← Controlador principal de vistas y UI
└── assets/
    └── bg-inicio.jpg       ← Fondo de pantalla de login
```

---

## Módulos Nuevos

### `src/router.js` — Router SPA hash-based

Gestiona la navegación interna de cada vista sin recargar la página. Funciona sobre `window.location.hash`.

**API exportada:**

| Función | Descripción |
|---|---|
| `registrarRutas(mapa)` | Registra un objeto `{ hash: callback }` |
| `navegarA(hash)` | Cambia el hash activo y dispara el callback |
| `iniciarRouter()` | Escucha eventos `hashchange` (se llama una vez) |
| `limpiarHashActual()` | Elimina el hash de la URL sin navegar |

**Rutas por rol:**

| Rol | Secciones disponibles |
|---|---|
| Aprendiz | `#usuario/inicio` · `#usuario/tareas` · `#usuario/notas` |
| Administrador | `#admin/inicio` · `#admin/crear-tarea` · `#admin/usuarios` · `#admin/tareas` |
| Instructor | `#instructor/inicio` · `#instructor/crear-tarea` · `#instructor/estudiantes` · `#instructor/tareas` |

---

## Funcionalidades por Módulo

### 1. Sistema de autenticación y roles

- Login único en `index.html` con validación de credenciales
- Al autenticarse, se activa la vista correspondiente al rol (`activarModoUsuario`, `activarModoAdmin`, `activarModoInstructor`)
- El atributo `body[data-modo]` controla el esquema de color activo (`usuario`, `admin`, `instructor`)
- Logout disponible desde el footer del sidebar de cada vista

### 2. Pantalla de Login — Diseño Liquid Glass

La pantalla de inicio fue completamente rediseñada con una estética moderna:

- **Fondo:** imagen `bg-inicio.jpg` con overlay oscuro semitransparente
- **Orbs animados:** 3 esferas de color con `filter: blur` y animación flotante (`@keyframes orbFloat`) que crean profundidad de campo
- **Card de vidrio:** `backdrop-filter: blur(48px) saturate(160%)` con borde sutil y sombra multicapa
- **Logo:** ícono `shield-check` de Lucide Icons sobre fondo morado translúcido
- **Campos con íconos:** cada campo de formulario tiene un ícono prefijo (Lucide `mail` / `lock`) y el campo de contraseña incluye botón de mostrar/ocultar con ícono dinámico (`eye` / `eye-off`)
- **Botón de acceso:** gradiente morado con ícono `log-in`, sin animación de entrada para máxima fluidez
- **Modales secundarios** (Registro y Recuperar contraseña): estilo liquid glass consistente (`background: rgba(16,8,38,0.68)` + `backdrop-filter: blur(24px)`) con `animation: none` para eliminar lag de renderizado

**Íconos usados (Lucide Icons CDN):**

`shield-check` · `mail` · `lock` · `eye` · `eye-off` · `log-in` · `check-circle`

### 3. Navegación SPA — Sidebar + Menú Hamburguesa

Cada vista de rol incluye:

- **Botón hamburguesa** (`.btn-hamburguesa`) con animación de apertura/cierre en X
- **Sidebar drawer** (`.sidebar`) que desliza desde la izquierda (`transform: translateX(-100%)` → `translateX(0)`)
- **Overlay oscuro** (`.sidebar-overlay`) para cerrar al hacer clic fuera
- **Sección hero de bienvenida** visible al iniciar sesión (`.spa-hero`) con nombre del usuario y rol

Las secciones de contenido (`.spa-seccion[data-seccion]`) se muestran/ocultan con la clase `.spa-seccion--oculta` sin recargar el DOM.

### 4. Vista Aprendiz

| Sección | Funcionalidad |
|---|---|
| Inicio | Dashboard con estadísticas de tareas (pendientes, en progreso, completadas) |
| Mis Tareas | Listado de tareas asignadas con filtros por estado, entrega de evidencias |
| Notas | Sistema de notas personales (crear, editar, eliminar) |

### 5. Vista Administrador

| Sección | Funcionalidad |
|---|---|
| Inicio | Dashboard global: resumen de usuarios, tareas por estado, roles registrados |
| Crear Tarea | Formulario con asignación múltiple de usuarios via dropdown con checkboxes |
| Usuarios | Gestión completa: ver, editar, cambiar rol, activar/desactivar |
| Tareas | Tabla de todas las tareas con filtros por estado, usuario y fecha |

### 6. Vista Instructor

| Sección | Funcionalidad |
|---|---|
| Inicio | Dashboard con resumen de sus estudiantes y tareas creadas |
| Crear Tarea | Formulario para asignar tareas a sus estudiantes |
| Estudiantes | Listado de sus aprendices con progreso por tarea |
| Tareas | Seguimiento de tareas que creó, con filtros |

### 7. Dropdown de asignación de usuarios

- Panel desplegable con lista de checkboxes para selección múltiple de usuarios
- Altura dinámica calculada en tiempo real: `maxHeight = window.innerHeight - btn.bottom - 8px`
- Esto evita que el dropdown desborde más allá del borde inferior de la pantalla
- Scroll interno con `overscroll-behavior: contain` para no propagar el scroll al fondo

### 8. Reset de formularios al navegar

Al navegar a otra sección y volver, el sistema limpia automáticamente:

- Campos de formulario (`form.reset()`)
- Mensajes de error (`.form__error` → `textContent = ''`)
- Clases de validación (`classList.remove('error')`)
- Checkboxes del dropdown de usuarios (desmarcados)
- Texto del dropdown restaurado a `'Seleccionar usuarios...'`
- Filtros de la sección Tareas restaurados a "Todos"
- Tabla de tareas recargada desde los datos actuales

### 9. Sistema de validaciones

- Módulo `src/logica/validaciones.js` centraliza todas las reglas de validación
- Al detectar error, añade clase `error` al campo correspondiente y muestra mensaje en `.form__error`
- Compatible con `input`, `select` y `textarea` dentro de formularios modales y de sección

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

> Los modales del login (Registro y Recuperar contraseña) tienen `animation: none` porque `backdrop-filter: blur()` aplicado durante una animación de entrada provoca lag perceptible en GPUs integradas. La solución es renderizar el modal sin transición de opacidad/transform.

---

## Tecnologías Utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 Semántico | Estructura de vistas y formularios |
| CSS3 Custom Properties | Temas por rol, variables de espaciado y color |
| JavaScript ES Modules | Arquitectura modular (`import/export`) |
| `window.location.hash` | Router SPA sin servidor |
| Lucide Icons (CDN) | Sistema de íconos SVG vectoriales |
| `backdrop-filter` | Efecto vidrio en login y modales |
| `localStorage` | Persistencia de sesión y datos del usuario |

---

## Flujo de Usuario Típico

```
1. Usuario abre index.html
   └─ Pantalla de login (liquid glass, orbs animados)
   
2. Ingresa credenciales → sistema valida rol
   └─ Se activa la vista correspondiente
   
3. Vista carga con sidebar cerrado, sección "Inicio" visible
   └─ Hero de bienvenida con nombre y rol del usuario
   
4. Usuario abre hamburguesa → sidebar aparece
   └─ Navega a otra sección → hash cambia → router muestra sección
   
5. Al navegar: formularios y filtros se resetean automáticamente
   └─ Tablas se recargan con datos actuales
   
6. Usuario hace logout → vuelve a pantalla de login limpia
```
