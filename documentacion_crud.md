# DOCUMENTACIÓN TÉCNICA
## Sistema de Gestión de Tareas

**Autores:** Karol Nicolle Torres Fuentes, Juan Sebastian Patiño Hernandez  
**Fecha:** 11-02-2026  
**Institución:** SENA

---

## DESCRIPCIÓN
Aplicación web para buscar usuarios y gestionar tareas (crear, editar y eliminar) mediante manipulación del DOM y consumo de API RESTful.

---

## ARCHIVOS

### index.html
Estructura HTML con 6 secciones principales:
1. **Header** - Título de la aplicación
2. **Formulario de búsqueda** - Input para documento de usuario
3. **Datos del usuario** - Muestra ID, nombre y email
4. **Formulario de tareas** - Título, descripción y estado
5. **Tabla de tareas** - Lista de tareas con botones de Editar y Eliminar
6. **Modal de edición** - Ventana emergente para modificar una tarea existente

### Módulos JavaScript
El código fue modularizado. Cada archivo tiene una única responsabilidad:

| Archivo | Responsabilidad |
|---|---|
| `config.js` | Constante `API_BASE_URL` |
| `state.js` | Variables de estado y sus funciones de modificación |
| `dom.js` | Selección de todos los elementos del DOM |
| `validation.js` | Validación de formularios y manejo de errores visuales |
| `ui.js` | Manipulación visual: mostrar/ocultar secciones, crear filas, modal |
| `api.js` | Peticiones HTTP (GET, POST, PATCH, DELETE) |
| `handlers.js` | Manejadores de eventos de formularios y tabla |
| `events.js` | Registro de todos los event listeners |
| `barril.js` | Re-exporta todo desde un único punto de entrada |
| `main.js` | Punto de entrada: inicializa la app |

**Variables de estado (`state.js`):**
- `currentUser` - Usuario actual
- `registeredTasks` - Array de tareas
- `taskCounter` - Contador de tareas

**Funciones clave:**
- `validateSearchForm()` / `validateTaskForm()` - Validación de formularios
- `searchUserByDocument()` - Busca usuario en servidor (GET)
- `registerTask()` - Registra tarea en servidor (POST)
- `updateTask()` - Actualiza tarea en servidor (PATCH)
- `deleteTask()` - Elimina tarea en servidor (DELETE)
- `createTaskRow()` - Crea elemento `<tr>` con datos de tarea y botones de acción
- `addTaskToTable()` - Inserta fila en tabla con `appendChild()`
- `updateTaskRow()` - Actualiza una fila existente en el DOM
- `removeTaskRow()` - Elimina una fila del DOM y actualiza el contador
- `showEditModal()` / `hideEditModal()` - Controla el modal de edición
- `handleTableClick()` - Delegación de eventos para editar y eliminar

---

## FLUJO DE LA APLICACIÓN

```
1. Usuario ingresa documento -> Validación
2. Búsqueda en servidor (GET /users)
3. Si existe: Muestra datos y habilita formulario de tareas
4. Usuario completa formulario -> Validación
5. Registro en servidor (POST /tasks)
6. Creación de fila en tabla (createElement + appendChild)
7. Actualización de contador

-- NUEVO: EDITAR TAREA --
8. Usuario hace clic en "Editar" -> Se abre modal con datos precargados
9. Usuario modifica campos -> Envío a servidor (PATCH /tasks/:id)
10. Actualización de la fila en el DOM sin recargar la página

-- NUEVO: ELIMINAR TAREA --
11. Usuario hace clic en "Eliminar" -> Confirmación con confirm()
12. Si confirma -> Envío a servidor (DELETE /tasks/:id)
13. Eliminación de la fila del DOM y actualización del contador
```

---

## MANIPULACIÓN DEL DOM

**Elementos creados dinámicamente:**
- `<tr>` - Fila de tabla por cada tarea
- `<td>` - 6 celdas: número, título, descripción, estado, usuario, acciones
- `<button>` - Botones Editar y Eliminar dentro de cada fila

**Métodos utilizados:**
- `getElementById()` / `querySelector()` - Selección de elementos
- `createElement()` - Creación de elementos
- `appendChild()` - Inserción en el DOM
- `remove()` - Eliminación de elementos del DOM
- `textContent` - Modificación de contenido
- `classList.add()` / `classList.remove()` - Manejo de clases
- `dataset` - Almacenamiento de IDs en atributos `data-*`
- `closest()` - Navegación hacia el padre más cercano (delegación de eventos)

**Delegación de eventos:**
Se registra un único listener en `tasksTableBody` en lugar de uno por cada botón. Los clics burbujean desde el botón hasta el tbody, donde se identifica la acción (`data-action`) y el ID de la tarea (`data-id`).

---

## REQUISITOS

**JSON Server:**
```bash
npm init -y
npm install
npx json-server server.json
```

**server.json:**
```json
{
  "users": [
    {"id": 1097497124, "name": "Karol Torres", "email": "karoln.oficiall@gmail.com"}
  ],
  "tasks": []
}
```

**Endpoints:**
- `GET /users` - Obtener usuarios
- `POST /tasks` - Crear tarea
- `PATCH /tasks/:id` - Actualizar tarea
- `DELETE /tasks/:id` - Eliminar tarea

---

## USO

1. Iniciar servidor: `npx json-server server.json`
2. Abrir `index.html` en navegador
3. Buscar usuario por ID
4. Registrar tareas completando el formulario
5. Ver tareas en la tabla
6. Hacer clic en **Editar** para modificar una tarea
7. Hacer clic en **Eliminar** para borrar una tarea (pide confirmación)

---

## CONCEPTOS DOM

- **Selección**: `document.getElementById()`, `querySelector()`
- **Creación**: `document.createElement()`
- **Inserción**: `element.appendChild()`
- **Eliminación**: `element.remove()`
- **Eventos**: `addEventListener()`
- **Delegación de eventos**: listener en el padre que captura clics de hijos dinámicos
- **Validación**: JavaScript personalizada

---

**Documentación básica de estilos**

**Variables**
- Definen colores, tipografía, tamaños y espaciados reutilizables.
- Se declaran en :root y se usan con var(--nombre).

**Reset**
- Elimina márgenes y paddings por defecto.
- Usa box-sizing: border-box.

**Estructura principal**
- body: tipografía, color de texto, fondo rosado suave.
- .container: centra y limita el ancho, organiza en columna.

**Componentes**
- Header (.header): título y subtítulo centrados, fondo blanco con sombra.
- Card (.card): contenedor blanco con sombra, usado en formularios y datos.
- Formularios (.form__group, .form__input): inputs con estados de foco y error.
- Botón (.btn, .btn--primary): estilo morado, hover y active con sombra.
- Botón secundario (.btn--secondary): estilo gris neutro, usado en el modal para Cancelar.
- Botones de acción (.btn-action--edit / .btn-action--delete): botones compactos azul/rojo dentro de la tabla.
- User info (.user-info): muestra datos del usuario en bloques grises.
- Tasks (.tasks-section): tabla de tareas con encabezado, badges de estado y estado vacío.
- Modal (.modal-overlay / .modal): ventana emergente centrada con overlay oscuro para editar tareas.
- Footer (.footer): texto centrado, fondo blanco.

**Utilidades**
- .hidden: oculta elementos.
- Animación slideIn: entrada suave con opacidad y desplazamiento.

**Responsive**
- Ajustes para pantallas menores a 768px: menos padding, títulos más pequeños, botones al 100%.

---

**Fin de la Documentación**

