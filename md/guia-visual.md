# Guía Visual — Lo que ve el usuario en pantalla

> Esta guía describe **todo lo que se ve visualmente** en el Sistema de Gestión de Tareas.
> Útil para la exposición: explica cada pantalla sin entrar en código.

---

## 1. Pantalla de Login (Inicio)

### Lo que ve el usuario
- **Fondo con efecto blur**: tres orbs de color (morado, azul y rosado) flotando detrás de una tarjeta de "vidrio" con transparencia y desenfoque. Este efecto se llama *Liquid Glass*.
- **Logo**: ícono de escudo con check en la parte superior de la tarjeta.
- **Formulario de login**: campo de correo electrónico y campo de contraseña con ícono de candado.
- **Botón ojo**: permite mostrar u ocultar la contraseña al hacer clic.
- **Botón "Ingresar al Sistema"**: envía las credenciales al servidor.
- **Enlace "Regístrate"**: abre el modal para crear cuenta nueva.
- **Enlace "¿Olvidó su contraseña?"**: abre el flujo de recuperación de 3 pasos.
- **Mensaje de bienvenida**: aparece brevemente con el nombre del usuario al completar el login.

### Validaciones visibles
- Si el correo o contraseña están vacíos: mensaje de error rojo debajo del campo.
- Si las credenciales son incorrectas: toast (mensaje emergente) rojo en la esquina superior derecha.
- Si el login es exitoso: toast verde de bienvenida y la pantalla cambia automáticamente al panel del rol correspondiente.

---

## 2. Panel del Estudiante (Vista Usuario — color morado)

### Estructura general
- **Barra superior (header)**: tres líneas (hamburguesa) a la izquierda. Título "Mi Portal de Tareas" en el centro.
- **Sidebar (menú lateral)**: se abre al hacer clic en la hamburguesa. Contiene: Inicio, Mis Tareas, Mis Notas, Cambiar contraseña, Cerrar sesión.
- **Fondo del sidebar**: overlay semitransparente que oscurece el contenido al abrir el menú. Se puede hacer clic en él para cerrarlo.

### Sección: Inicio
- **Hero (banner de bienvenida)**: muestra el nombre del estudiante y dos botones de acceso rápido: "Mis Tareas" y "Notas".
- **Dashboard de estadísticas**: 6 tarjetas con contadores de tareas por estado. Los contadores se llenan automáticamente al cargar.
  - Total (gris) | Pendientes (amarillo) | En Progreso (azul)
  - Por Aprobar (naranja) | Completadas (verde) | Reprobadas (rojo)
- **Columna izquierda**: tarjeta con los datos del perfil (ID/documento, nombre completo, correo).
- **Columna derecha**: calendario mensual interactivo con puntos de colores en los días que tienen eventos o tareas.

### Sección: Mis Tareas
- **Barra de búsqueda**: campo de texto para filtrar tareas por ID, título o estado.
- **Tabla de tareas**: columnas: #, Título, Descripción, Estado, Comentario, Acciones.
  - Columna "Estado": badge (pastilla) de color según el estado.
  - Columna "Acciones": botones de editar (lápiz) y ver (ojo).
- **Estado vacío**: mensaje "No tienes tareas asignadas" cuando la lista está vacía.

### Sección: Mis Notas
- **Panel de post-its**: notas personales de colores (amarillo, verde, azul, morado). El estudiante puede crear, editar el texto y eliminar notas.

---

## 3. Panel del Administrador (Vista Admin — color azul)

### Estructura general
- **Header azul**: hamburguesa (izq.) | Título "Panel de Administración" | Buscador de usuario por nombre o documento (der.).
- **Sidebar azul**: Inicio, Crear Tarea, Usuarios, Todas las Tareas, Cambiar contraseña, Cerrar sesión.

### Sección: Inicio
- **Hero**: saludo con el nombre del admin y accesos rápidos a "Crear Tarea" y "Usuarios".
- **Dashboard global**: las mismas 6 tarjetas de contadores pero sobre **todas** las tareas del sistema.
- **Cuadrícula de 3 columnas**:
  - **Actividad reciente**: log cronológico de las últimas acciones (login, creación de tareas, cambios de rol).
  - **Roles del sistema**: tarjetas para cada rol (Admin, Instructor, Estudiante) con ícono, descripción y botón "Ver permisos" que abre un modal con la lista de permisos del rol.
  - **Información del sistema**: datos del proyecto (institución, programa, tecnología, estado operativo).

### Sección: Crear Tarea
- **Formulario con 5 campos**: Título, Descripción (opcional), Estado inicial, Comentario (opcional), y un dropdown multi-selección para elegir los estudiantes a asignar.
- El dropdown personalizado muestra checkboxes con los nombres de todos los usuarios. Al elegir varios, el texto del botón se actualiza ("3 usuarios seleccionados").

### Sección: Usuarios del Sistema
- **Tabla de usuarios**: columnas: #, Nombre, Documento, Correo, Rol (badge de color), Estado (activo/inactivo), Acciones.
- **Acciones por usuario**:
  - Ojo: ver detalles del usuario
  - Lápiz: editar nombre, documento o correo
  - Escudo: cambiar el rol (admin / instructor / user)
  - Activar/Desactivar: bloquear o habilitar el acceso
  - Papelera: eliminar permanentemente

### Sección: Todas las Tareas
- **Barra de filtros**: desplegable de estado, campo de texto para filtrar por usuario, desplegable de ordenamiento (A-Z, Z-A, por estado, por usuario).
- **Botones de acción**: palomita (aplicar filtros), X (limpiar), descarga (exportar JSON).
- **Tabla de tareas**: columnas: #, Título, Descripción, Estado, Usuario asignado, Fecha de creación, Acciones.

---

## 4. Panel del Instructor (Vista Instructor — color verde)

### Estructura general
- **Header verde**: hamburguesa | Título "Panel Docente" | Buscador (der.).
- **Sidebar verde**: Inicio, Crear Tarea, Estudiantes, Todas las Tareas, Cambiar contraseña, Cerrar sesión.

### Sección: Inicio
- **Hero**: saludo y accesos rápidos a "Crear Tarea" y "Estudiantes".
- **Dashboard**: mismas 6 tarjetas de contadores sobre todas las tareas del sistema.
- **Dos widgets lado a lado**:
  - **Calendario**: igual al del estudiante pero el instructor puede crear eventos y asignarlos a un estudiante específico.
  - **Panel de calificación rápida**: tarjetas de tareas en estado "Por aprobar" que el instructor puede calificar directamente desde el inicio.

### Sección: Crear Tarea
- Mismo formulario que el admin, con los mismos campos y dropdown de multi-selección de estudiantes.

### Sección: Estudiantes
- **Tabla de estudiantes**: columnas: #, Documento, Nombre, Correo, Estado, Calificación (promedio), Acciones.
- El instructor puede ver el perfil del estudiante pero no puede eliminar ni cambiar roles.

### Sección: Todas las Tareas
- Igual a la del admin pero con botones de color verde. Incluye columnas de calificación.

---

## 5. Modales (Ventanas emergentes)

### Modal Editar Tarea
- Se abre al hacer clic en el lápiz de cualquier fila de la tabla de tareas.
- Campos: Título, Descripción, Estado (opciones según el rol), Comentario.
- Para el **instructor** además aparece el campo de Nota (0-100) y Motivo si ya había nota antes.
- Para el **admin** aparece la nota como solo lectura (no puede editarla).
- Para el **estudiante** solo puede cambiar el estado a "En Progreso" o "Por aprobar".

### Modal Ver Tarea
- Solo lectura. Muestra: Título, Descripción, Estado (badge de color), Comentario, Calificación (si tiene), Usuarios asignados.

### Modal Registro
- Formulario de 5 campos en 2 columnas: Nombre completo, Documento | Correo | Contraseña, Confirmar contraseña.
- Botón "Crear cuenta". Nota de privacidad al final.

### Modal Cambio de Contraseña
- 3 campos: Contraseña actual, Nueva contraseña, Confirmar nueva contraseña.

### Modal Recuperar Contraseña (3 pasos)
- **Paso 1**: el usuario escribe su correo. El sistema envía un código de 6 dígitos.
- **Paso 2**: el usuario escribe el código recibido. El sistema lo verifica.
- **Paso 3**: el usuario escribe y confirma la nueva contraseña.

### Modales nativos del Admin
- **Desactivar/Activar usuario**: cuadro rojo o verde con campo obligatorio de "Motivo" (mínimo 10 caracteres).
- **Eliminar usuario**: cuadro rojo con dos opciones: eliminación estándar (solo si sin tareas pendientes) y eliminación forzosa (siempre). También requiere motivo.

---

## 6. Elementos Visuales Globales

### Toast notifications (mensajes emergentes)
- Aparecen en la esquina superior derecha de la pantalla.
- Desaparecen automáticamente en 3 segundos con una barra de progreso.
- Colores: verde (éxito), rojo (error), amarillo (advertencia), azul (información).
- El color del borde depende del rol activo (morado/azul/verde).

### Badges de estado
Pastillas de color que indican el estado de cada tarea:
| Estado | Color |
|---|---|
| Pendiente | Amarillo |
| En Progreso | Azul |
| Por Aprobar | Naranja |
| Completada | Verde |
| Reprobada | Rojo |

### Cards contraíbles
Las secciones principales de los paneles admin e instructor tienen un botón flecha (▼) que contrae o expande el contenido. La flecha rota 180° al contraer.

### Sidebar hamburguesa
El menú lateral se abre deslizándose desde la izquierda con animación. El fondo detrás se oscurece. Se cierra al: hacer clic en la X, hacer clic en el overlay oscuro, o navegar a una sección desde un link del sidebar.

### Calendario
- Navega por meses con botones `<` y `>`.
- Los días con eventos muestran un punto de color.
- Al hacer clic en un día, aparece un popover (burbuja) con los detalles del evento o tarea.
- El instructor puede hacer clic en un día vacío para crear un evento nuevo.
