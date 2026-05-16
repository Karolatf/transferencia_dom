# Glosario de Términos — Sistema de Gestión de Tareas (SGT)

> Referencia rápida de todos los conceptos de JavaScript, HTML, CSS y arquitectura
> utilizados en este proyecto. Si el instructor pregunta por un término, buscalo aquí.

---

## Tipos de Datos en JavaScript

> Los **tipos de datos** son las distintas formas en que JS puede guardar información.
> El instructor puede preguntar: *"¿Qué tipo de dato es ese?"* — esta sección cubre la respuesta.

### String (cadena de texto)
Un **String** es texto. Puede ser una letra, una palabra, una oración o incluso estar vacío.
Se escribe entre comillas simples `'`, dobles `"` o backticks `` ` ``.
Se pronuncia y se dice: **"string"** (no se traduce).

```js
'hola'                      // string con comillas simples
"usuario@correo.com"        // string con comillas dobles
`Bienvenido ${nombre}`      // string con backtick — permite insertar variables
''                          // string vacío — también es un string
```

**Dónde aparece en el proyecto:** en absolutamente todo — mensajes de error `'El nombre es obligatorio'`, valores del servidor `'pendiente'`, HTML dinámico `'Guardar'`.

---

### Number (número)
Un **Number** es un valor numérico, entero o decimal. **No lleva comillas** — si lleva comillas es un String.
Se dice: **"número"** o **"number"**.

```js
3        // número entero
3.14     // número decimal (usa punto, no coma)
100      // número entero
-5       // número negativo
```

**Dónde aparece:** IDs de usuarios y tareas, calificaciones (0-100), contadores del dashboard, `rows = 3` en textareas.

---

### Boolean (booleano)
Un **Boolean** solo puede tener dos valores: `true` (verdadero) o `false` (falso).
Se pronuncia: **"boolean"** / en español se dice **"booleano"**.

```js
let esValido = true;        // la validación pasó
let hayError = false;       // no hay error
response.ok                 // true si el servidor respondió 200-299
usuario.is_active           // true si el usuario está activo
```

**Dónde aparece:** en todas las validaciones (`esValido = false`), en verificaciones del servidor (`response.ok`), en el estado de usuarios (`is_active`).

---

### `null`
Representa la **ausencia intencional** de un valor. Se pone explícitamente para decir "esto está vacío a propósito".
Se pronuncia: **"null"** (como suena en inglés).

```js
return null;        // la función no tiene nada que retornar (ej: falló el fetch)
let tarea = null;   // aún no se ha cargado la tarea
```

**Dónde aparece:** las funciones de `api/` retornan `null` cuando la petición falla para no romper la pantalla.

---

### `undefined`
Una variable que fue **declarada pero no tiene valor asignado** todavía.
La diferencia con `null`: `null` es intencional, `undefined` es porque aún no se le asignó nada.

```js
let contador;          // valor: undefined (se declaró pero no se asignó)
usuario?.name          // si usuario es null/undefined, esto retorna undefined (no error)
```

---

### Array (arreglo)
Una **lista ordenada de valores** encerrada entre corchetes `[]`.
Puede contener cualquier tipo de dato: strings, números, objetos, otros arreglos.
Se dice: **"array"** o **"arreglo"**.

```js
['Ana', 'Luis', 'María']        // arreglo de strings
[1, 2, 3]                       // arreglo de números
[{ id: 1, name: 'Ana' }, ...]   // arreglo de objetos (lo que llega del servidor)
[]                               // arreglo vacío
```

**Dónde aparece:** listas de tareas, usuarios, permisos. Los endpoints del servidor devuelven arreglos de objetos.

---

### Object (objeto)
Una **colección de pares clave: valor** encerrada entre llaves `{}`.
Cada clave es un nombre (string) y cada valor puede ser cualquier tipo de dato.
Se dice: **"objeto"** o **"object"**.

```js
{ name: 'Ana', role: 'user', id: 5 }          // objeto de usuario
{ status: 'pendiente', title: 'Tarea 1' }      // objeto de tarea
{}                                              // objeto vacío
```

**Dónde aparece:** todos los datos del servidor llegan como objetos. Las funciones de validación reciben objetos desestructurados.

---

## Operadores y Símbolos

> Esta sección explica **qué se llaman, cómo se leen en voz alta** y qué hacen todos los símbolos que aparecen en el código del proyecto.
> Útil para cuando el instructor señala una línea y pregunta: *"¿Qué hace ese símbolo?"*

---

### Operadores de Asignación

| Símbolo | Nombre | Cómo se lee | Qué hace |
|---|---|---|---|
| `=` | Asignación | "igual" / "asigna" | Guarda el valor de la derecha en la variable de la izquierda |
| `+=` | Suma y asigna | "más igual" | `a += 1` es lo mismo que `a = a + 1` |
| `-=` | Resta y asigna | "menos igual" | `a -= 1` es lo mismo que `a = a - 1` |

> ⚠️ **Confusión frecuente:** `=` **asigna** (guarda un valor). `===` **compara** (pregunta si son iguales). Son cosas distintas.

```js
let esValido = false;   // asignamos false a la variable
esValido = true;        // reasignamos — ahora vale true
```

---

### Operadores de Comparación

| Símbolo | Nombre | Cómo se lee en voz alta | Qué hace |
|---|---|---|---|
| `===` | Igualdad estricta | "triple igual" / "estrictamente igual" | Compara valor Y tipo de dato |
| `==` | Igualdad débil | "doble igual" | Compara solo el valor (hace conversión automática de tipo) |
| `!==` | Desigualdad estricta | "exclamación doble igual" / "diferente de" | Retorna true si el valor O el tipo son distintos |
| `!=` | Desigualdad débil | "exclamación igual" / "diferente" | Retorna true si los valores son distintos |
| `<` | Menor que | "menor que" | Retorna true si el de la izquierda es menor |
| `>` | Mayor que | "mayor que" | Retorna true si el de la izquierda es mayor |
| `<=` | Menor o igual que | "menor o igual que" | Retorna true si es menor O igual |
| `>=` | Mayor o igual que | "mayor o igual que" | Retorna true si es mayor O igual |

> **Regla de oro:** En este proyecto siempre usamos `===` y `!==` (estrictos) para evitar bugs de conversión de tipo.

```js
'3' == 3       // true  — compara solo el valor (convierte el string a número)
'3' === 3      // false — '3' es string y 3 es number → tipos distintos
valorName.length < 3    // true si el texto tiene menos de 3 caracteres
valorName.length > 100  // true si el texto tiene más de 100 caracteres
```

**Dónde aparece en el proyecto:** en `validaciones.js` para verificar largos de texto, en `modoUI.js` para comparar estados (`t.status === 'pendiente'`), en `sesion.js` para verificar si el usuario existe.

---

### Operadores Lógicos

| Símbolo | Nombre | Cómo se lee | Qué hace |
|---|---|---|---|
| `!` | NOT (negación) | "no" / "bang" | Invierte el valor booleano: `!true` → `false` |
| `&&` | AND (y) | "y" / "and" / "doble ampersand" | Retorna true solo si **ambos** lados son true |
| `\|\|` | OR (o) | "o" / "or" / "doble barra" | Retorna true si **al menos uno** de los lados es true |

```js
// ! — negación
if (!esValido) { ... }          // "si NO es válido"
if (!nameInput) return;         // "si el input NO existe, salimos"
if (!response.ok) throw ...;    // "si la respuesta NO fue exitosa, lanzamos error"

// && — ambos deben ser verdaderos
if (nota >= 0 && nota <= 100)   // "si la nota es >= 0 Y <= 100"

// || — basta con uno
const valor = campo.value || ''; // "el valor del campo, O vacío si no existe"
```

**Dónde aparece:** `!` en absolutamente todas las validaciones. `&&` en condiciones compuestas. `||` para valores por defecto.

---

### Operador Ternario (`?` y `:`)

El **operador ternario** es una forma corta de escribir un `if/else` en una sola línea.
Se lee: **"¿condición? si sí: si no"**

**Estructura:**
```
condición ? valorSiVerdadero : valorSiFalso
```

```js
// Del archivo validaciones.js (línea del screenshot):
const valorName = nameInput ? nameInput.value.trim() : '';
// Se lee: "¿nameInput existe? si sí: toma su valor; si no: usa string vacío"

// Otro ejemplo del proyecto:
const cantidad = tareas.length;
contador.textContent = `${cantidad} ${cantidad === 1 ? 'tarea' : 'tareas'}`;
// Se lee: "¿la cantidad es 1? si sí: 'tarea'; si no: 'tareas'"
```

> El `?` solo y el `?.` son **distintos**:
> - `?` solo → operador ternario (if/else corto)
> - `?.` juntos → optional chaining (accede a propiedad solo si existe)

**Dónde aparece:** en `validaciones.js`, `modoUI.js`, `tareasUI.js` para elegir texto según cantidad, rol o estado.

---

### Operadores Aritméticos

| Símbolo | Nombre | Cómo se lee | Qué hace |
|---|---|---|---|
| `+` | Suma / concatenación | "más" | Suma números, o une strings |
| `-` | Resta | "menos" | Resta números |
| `*` | Multiplicación | "por" / "asterisco" | Multiplica números |
| `/` | División | "dividido" / "slash" | Divide números |
| `%` | Módulo (residuo) | "módulo" / "porcentaje" | Retorna el residuo de la división |

```js
notas.length / 2               // división: promedio de dos valores
(indice + 1)                   // suma: el índice base 0 se convierte a base 1
Math.ceil(total / 3)           // Math.ceil redondea hacia arriba: ej 7/3 = 2.33 → 3
'Hola ' + nombre               // concatenación: une dos strings
```

---

### Otros Símbolos Frecuentes

| Símbolo | Nombre | Cómo se lee | Qué hace |
|---|---|---|---|
| `=>` | Flecha / Arrow | "flecha" / "fat arrow" | Separa parámetros del cuerpo en arrow functions |
| `...` | Spread / Rest | "tres puntos" / "spread" | Despliega arreglo u objeto (ver sección Spread operator) |
| `?.` | Optional chaining | "punto de interrogación punto" | Accede a propiedad solo si el objeto existe |
| `??` | Nullish coalescing | "doble signo de pregunta" | Valor por defecto si es null o undefined |
| `;` | Punto y coma | "punto y coma" / "semicolon" | Termina una instrucción JS (opcional pero buena práctica) |
| `{ }` | Llaves | "llaves" / "curly braces" | Bloque de código, objeto, o desestructuración |
| `[ ]` | Corchetes | "corchetes" / "brackets" | Arreglo, o acceso a elemento por índice |
| `( )` | Paréntesis | "paréntesis" | Llamada de función, agrupación de expresión |
| `:` | Dos puntos | "dos puntos" / "colon" | Separador clave:valor en objetos, o el "si no" del ternario |
| `` ` `` | Backtick | "backtick" / "acento grave" | Inicio y cierre de template literal (string con variables) |
| `//` | Doble barra | "doble barra" / "slash slash" | Comentario de una línea — JS ignora lo que sigue |
| `/* */` | Barra asterisco | "comentario de bloque" | Comentario de múltiples líneas |
| `\|` | Barra vertical | "pipe" / "barra vertical" | En CSS: separador; en regex: alternativa |

```js
// Ejemplos de arrow function con =>
const saludar = (nombre) => 'Hola ' + nombre;
tareas.forEach(t => console.log(t.title));

// Ejemplo de objeto con : (dos puntos clave:valor)
const config = { color: '#7c3aed', icono: 'shield' };

// Ejemplo de backtick con variables
const url = `${API_BASE_URL}/tasks/${id}`;
```

---

### Signos dentro de Strings y Regex

Estos signos aparecen dentro de expresiones regulares (regex) en `validaciones.js`:

| Símbolo | Nombre | Qué significa en regex |
|---|---|---|
| `^` | Circunflejo / caret | Inicio del string |
| `$` | Signo pesos / dollar | Fin del string |
| `+` | Más | "uno o más" del patrón anterior |
| `*` | Asterisco | "cero o más" del patrón anterior |
| `\d` | Barra-d | Cualquier dígito (0-9) |
| `\s` | Barra-s | Cualquier espacio en blanco |
| `[ ]` | Corchetes | Conjunto de caracteres permitidos |
| `[^ ]` | Corchetes con caret | Conjunto de caracteres NO permitidos |

```js
/^\d+$/.test('12345')  // ^ inicio, \d+ uno o más dígitos, $ final → solo números
/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test('Ana López')  // solo letras y espacios
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('a@b.com')       // formato básico de email
```

---

## JavaScript — Fundamentos

### `const`
Declara una variable cuyo **nombre** no se puede reasignar. El valor puede mutar si es objeto o arreglo.
```js
const nombre = 'Ana';     // no se puede hacer: nombre = 'Luis'
const usuario = {};       // pero sí: usuario.rol = 'admin'  (el objeto se puede modificar)
```
**Dónde aparece en el proyecto:** en absolutamente todo — cada variable que no necesita cambiar de referencia se declara con `const`.

---

### `let`
Declara una variable que **sí puede reasignarse**. Se usa cuando el valor va a cambiar.
```js
let contador = 0;
contador = 1;  // válido
```
**Dónde aparece:** `let esValido = true;` en las funciones de validación, `let usuarioActual = null;` en `tareasService.js`.

---

### `var`
Versión antigua de declaración de variables. Tiene scope de función (no de bloque). **No se usa en este proyecto** — todo es `const` y `let`.

---

### Función tradicional vs Arrow function
```js
// Función tradicional — tiene su propio 'this'
function saludar(nombre) { return 'Hola ' + nombre; }

// Arrow function — hereda el 'this' del contexto donde fue definida
const saludar = (nombre) => 'Hola ' + nombre;

// Versión corta sin paréntesis si tiene un solo parámetro
const saludar = nombre => 'Hola ' + nombre;
```
**Dónde aparece:** Las arrow functions aparecen en todos los `.forEach`, `.map`, `.filter`, listeners de eventos. Las funciones tradicionales se usan donde necesitamos hoisting o `this` propio (callbacks de `addEventListener` con `this`).

---

### `async / await`
Permite escribir código asíncrono (que espera al servidor) de forma legible, como si fuera código normal.
```js
async function cargarUsuarios() {
    const datos = await fetchConAuth(url);  // ESPERA la respuesta del servidor
    return datos.json();
}
```
**Dónde aparece:** Todas las funciones en `api/` son `async`. Las funciones en `modoUI.js` que llaman al servidor son `async` (ej: `activarModoAdmin`, `cargarDashboard`).

---

### `Promise`
Un objeto que representa una operación que **aún no terminó**. Puede resolverse (éxito) o rechazarse (error).
```js
const promesa = new Promise((resolve, reject) => {
    if (ok) resolve('resultado');
    else    reject(new Error('falló'));
});
```
**Dónde aparece:** `mostrarModalToggleEstado` y `mostrarModalEliminarUsuario` en `notificaciones.js` retornan `new Promise(...)` para esperar la decisión del usuario.

---

### `try / catch`
Captura errores sin romper la aplicación. Lo que está en `try` se ejecuta; si hay error, `catch` lo atrapa.
```js
try {
    const datos = await fetchConAuth(url);
} catch (error) {
    console.error('falló:', error);
    return null;  // retornamos valor seguro para no romper la pantalla
}
```
**Dónde aparece:** Todas las funciones de `api/` usan `try/catch` para manejar errores de red.

---

### Template literals (backticks)
Permiten insertar variables dentro de un texto sin concatenar con `+`.
```js
const url = `${API_BASE_URL}${API_PREFIX}/tasks/${id}`;
// equivale a: API_BASE_URL + API_PREFIX + '/tasks/' + id
```
**Dónde aparece:** En la construcción de todas las URLs del proyecto, en `cssText` de elementos creados dinámicamente.

---

### Destructuring (desestructuración)
Extrae valores de un objeto o arreglo en variables individuales en una sola línea.
```js
// De objeto
const { accessToken, refreshToken, user } = json.data;

// Con renombre
const { name: nombreCompleto } = usuario;

// En parámetros de función
export function guardarSesion({ accessToken, refreshToken, user }) { ... }
```
**Dónde aparece:** En `sesion.js` (`guardarSesion`), en `validaciones.js` (todas las funciones reciben un objeto desestructurado), en `modoUI.js` al leer la respuesta del servidor.

---

### Spread operator (`...`)
"Despliega" los elementos de un arreglo o las propiedades de un objeto.
```js
// Copia de arreglo sin modificar el original
const copia = [...tareasRegistradas];

// En filtros.js — si no hay filtro, retornamos una copia de la lista original
if (!estadoActivo && !usuarioActivo) return [...tareas];
```
**Dónde aparece:** `filtros.js`, `ordenamiento.js` (`.slice()` cumple la misma función).

---

### Optional chaining (`?.`)
Accede a propiedades de un objeto solo si este existe. Evita errores de "Cannot read property of undefined".
```js
const nombre = usuario?.name;       // si usuario es null/undefined, retorna undefined (no error)
const color  = meta?.color ?? '#7c3aed'; // si meta.color no existe, usa el color por defecto
```
**Dónde aparece:** En `modoUI.js` al acceder a elementos del DOM que pueden no existir.

---

### Nullish coalescing (`??`)
Retorna el valor de la derecha solo si el de la izquierda es `null` o `undefined` (no si es `0` o `''`).
```js
const permisos = PERMISOS_POR_ROL[rol] ?? [];
const colorAcento = coloresPorModo[modo] ?? '#7c3aed';
```
**Dónde aparece:** `notificaciones.js`, `modoUI.js`, `ordenamiento.js`.

---

## JavaScript — Métodos de Arreglo

### `.forEach()`
Recorre cada elemento de un arreglo y ejecuta una función. No retorna nada.
```js
usuarios.forEach(function(usuario) {
    console.log(usuario.name);
});
```
**Dónde aparece:** En todas partes — para recorrer tareas, usuarios, permisos, errores.

---

### `.map()`
Recorre un arreglo y **retorna un nuevo arreglo** con cada elemento transformado.
```js
const nombres = usuarios.map(u => u.name);
// retorna: ['Ana', 'Luis', 'María']
```
**Dónde aparece:** En `modoUI.js` para transformar listas de datos del servidor en elementos HTML.

---

### `.filter()`
Recorre un arreglo y retorna solo los elementos que cumplen la condición.
```js
const pendientes = tareas.filter(t => t.status === 'pendiente');
```
**Dónde aparece:** En `filtros.js` para filtrar tareas por estado y usuario.

---

### `.find()`
Retorna el **primer** elemento que cumple la condición, o `undefined` si no hay ninguno.
```js
const tarea = tareas.find(t => t.id === 5);
```
**Dónde aparece:** En `modoUI.js` para encontrar una tarea específica por su ID.

---

### `.some()`
Retorna `true` si **al menos un** elemento cumple la condición.
```js
const hayPendientes = tareas.some(t => t.status === 'pendiente');
```
**Dónde aparece:** En `filtros.js` para verificar si algún documento coincide con el filtro.

---

### `.sort()`
Ordena los elementos de un arreglo según una función de comparación. **Modifica el arreglo original**.
```js
tareas.sort((a, b) => a.title.localeCompare(b.title, 'es'));
```
**Dónde aparece:** En `ordenamiento.js` (sobre una copia con `.slice()` para no mutar el original).

---

### `.slice()`
Retorna una copia de una porción del arreglo sin modificar el original.
```js
const copia = tareas.slice();   // copia completa
const primeros = tareas.slice(0, 3); // primeros 3 elementos
```
**Dónde aparece:** En `ordenamiento.js` y `auditoria.js` para no mutar los arreglos originales.

---

### `.includes()`
Retorna `true` si el arreglo (o string) contiene el valor buscado.
```js
const tienePermiso = permisos.includes('tasks.create');
```
**Dónde aparece:** En `filtros.js` para verificar coincidencias de texto.

---

### `.split()`
Divide un string en un arreglo usando un separador.
```js
'tasks.create'.split('.');  // retorna: ['tasks', 'create']
```
**Dónde aparece:** En `modoUI.js` para agrupar permisos por su prefijo.

---

### `.join()`
Une todos los elementos de un arreglo en un string.
```js
['Ana', 'Luis'].join(', ');  // retorna: 'Ana, Luis'
```
**Dónde aparece:** En `modoUI.js` para construir el texto de usuarios asignados a una tarea.

---

### `.reduce()`
Acumula todos los elementos de un arreglo en un único valor.
```js
const total = [10, 20, 30].reduce((acum, n) => acum + n, 0);  // retorna: 60
```
**Dónde aparece:** En `modoUI.js` para calcular promedios de calificaciones de estudiantes.

---

## JavaScript — Objetos

### `Object.keys()`
Retorna un arreglo con las claves de un objeto.
```js
Object.keys({ admin: ..., instructor: ..., user: ... })
// retorna: ['admin', 'instructor', 'user']
```
**Dónde aparece:** En `modoUI.js` para iterar sobre `METADATOS_ROL` y `PERMISOS_POR_ROL`.

---

### `Object.entries()`
Retorna un arreglo de pares `[clave, valor]` de un objeto.
```js
for (const [hash, handler] of Object.entries(mapa)) { ... }
```
**Dónde aparece:** En `router.js` para registrar múltiples rutas a la vez.

---

### `JSON.stringify()`
Convierte un objeto JavaScript a texto JSON (para enviarlo al servidor).
```js
body: JSON.stringify({ email, password })  // convierte a: '{"email":"...","password":"..."}'
```
**Dónde aparece:** En todas las peticiones POST y PUT en los archivos de `api/`.

---

### `JSON.parse()`
Convierte texto JSON a un objeto JavaScript (para leer lo guardado en localStorage).
```js
const usuario = JSON.parse(localStorage.getItem('usuarioActual'));
```
**Dónde aparece:** En `sesion.js` para leer los datos del usuario del navegador.

---

## JavaScript — DOM (Document Object Model)

### `document.getElementById()`
Busca y retorna el elemento HTML que tiene el ID indicado.
```js
const tabla = document.getElementById('usersTableBody');
```
**Dónde aparece:** En todas partes — es la forma principal de acceder al HTML desde JS.

---

### `document.querySelector()`
Busca el primer elemento que coincida con el selector CSS indicado.
```js
const link = sidebar.querySelector('.sidebar__link[data-seccion="tareas"]');
```
**Dónde aparece:** En `modoUI.js` y `router.js` para buscar elementos con selectores CSS complejos.

---

### `document.querySelectorAll()`
Retorna todos los elementos que coincidan con el selector CSS. Retorna una `NodeList`.
```js
document.querySelectorAll('.spa-seccion').forEach(s => s.classList.add('oculta'));
```
**Dónde aparece:** En `modoUI.js` para mostrar/ocultar secciones, activar links del sidebar.

---

### `document.createElement()`
Crea un nuevo elemento HTML en memoria (no lo agrega al DOM aún).
```js
const fila = document.createElement('tr');
```
**Dónde aparece:** En `modoUI.js`, `notificaciones.js`, `buscarUsuario.js` — todos los elementos dinámicos se crean así.

---

### `.appendChild()`
Inserta un elemento como último hijo de otro elemento ya existente en el DOM.
```js
tbody.appendChild(fila);  // agrega la fila al final de la tabla
```
**Dónde aparece:** En toda construcción dinámica del DOM.

---

### `.removeChild()`
Elimina un elemento hijo del DOM.
```js
while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);
```
**Dónde aparece:** Patrón para limpiar un contenedor antes de volver a llenarlo. Está en `modoUI.js`, `auditoria.js`.

---

### `.classList.add() / .remove() / .toggle() / .contains()`
Agrega, quita, alterna o verifica clases CSS en un elemento.
```js
elemento.classList.add('hidden');     // oculta el elemento
elemento.classList.remove('hidden'); // muestra el elemento
elemento.classList.toggle('activo'); // alterna: si tiene la clase la quita; si no la tiene la pone
elemento.classList.contains('error'); // retorna true si tiene la clase
```
**Dónde aparece:** En todo el proyecto para mostrar/ocultar elementos, activar estilos de error, marcar links activos.

---

### `.textContent`
Lee o escribe el texto visible de un elemento HTML. No interpreta HTML.
```js
span.textContent = usuario.name;  // texto seguro — no interpreta etiquetas
```
**Dónde aparece:** Preferido sobre `.innerHTML` para texto sin etiquetas (evita XSS).

---

### `.innerHTML`
Lee o escribe el contenido HTML de un elemento. Interpreta etiquetas.
```js
labelTexto.innerHTML = 'Motivo <span style="color:red">*</span>';
```
**Dónde aparece:** En `notificaciones.js` para el asterisco rojo, en `modoUI.js` para contenido con HTML interno.

---

### `.setAttribute()`
Asigna el valor de un atributo HTML a un elemento.
```js
icono.setAttribute('data-lucide', 'shield');  // Lucide lee este atributo para saber qué SVG dibujar
input.setAttribute('aria-expanded', 'true');
```
**Dónde aparece:** En todos los íconos de Lucide creados dinámicamente.

---

### `dataset`
Accede a los atributos `data-*` de un elemento HTML.
```js
document.body.dataset.modo = 'admin';  // pone data-modo="admin" en el body
const seccion = link.dataset.seccion;  // lee data-seccion del link del sidebar
```
**Dónde aparece:** El atributo `data-modo` del body controla los colores del tema. `data-seccion` en los links del sidebar controla la navegación.

---

### `addEventListener()`
Registra una función que se ejecuta cuando ocurre un evento en un elemento.
```js
boton.addEventListener('click', function() { cerrar(); });
input.addEventListener('focus', function() { this.style.borderColor = 'blue'; });
```
**Dónde aparece:** En absolutamente todo — clics, envíos de formulario, focus/blur, hashchange.

---

### Eventos comunes usados en el proyecto
| Evento | Cuándo se dispara |
|---|---|
| `click` | El usuario hace clic en el elemento |
| `submit` | El usuario envía un formulario (tecla Enter o botón submit) |
| `focus` | El usuario hace clic en un input/textarea |
| `blur` | El usuario sale de un input/textarea |
| `hashchange` | La parte `#` de la URL cambia |
| `mouseenter` | El mouse entra al área del elemento |
| `mouseleave` | El mouse sale del área del elemento |
| `keydown` | El usuario presiona una tecla |
| `input` | El usuario escribe en un campo |

---

## JavaScript — Módulos ES6

### `import / export`
Permite dividir el código en archivos separados y reutilizar funciones entre ellos.
```js
// En sesion.js — exportamos las funciones
export function guardarSesion(datos) { ... }
export function cerrarSesion() { ... }

// En modoUI.js — importamos solo lo que necesitamos
import { guardarSesion, cerrarSesion } from './sesion.js';
```
**Dónde aparece:** Todos los archivos del proyecto usan `import/export`. Es lo que hace que Vite agrupe todo en un solo bundle al compilar.

---

### `export default`
Exporta un valor único como el "principal" del módulo. Se importa sin llaves.
```js
export default function saludar() { ... }
import saludar from './saludar.js';  // sin llaves
```
**No se usa en este proyecto** — preferimos exports nombrados (con llaves) para mayor claridad.

---

## JavaScript — APIs del Navegador

### `localStorage`
Almacenamiento persistente en el navegador. Los datos sobreviven al recargar la página.
```js
localStorage.setItem('accessToken', token);     // guarda el valor
localStorage.getItem('accessToken');            // lee el valor
localStorage.removeItem('accessToken');         // elimina el valor
```
**Dónde aparece:** En `sesion.js` — es el único archivo que accede al localStorage. Guarda tokens JWT y datos del usuario.

---

### `fetch()`
Hace peticiones HTTP al servidor. Retorna una Promise con la respuesta.
```js
const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
});
const json = await response.json();
```
**Dónde aparece:** En `fetchConAuth.js` (wrapper que agrega el JWT) y en `authApi.js` (login sin token).

---

### `Blob`
Objeto que representa datos binarios (archivos) en memoria.
```js
const blob = new Blob([contenidoJSON], { type: 'application/json' });
const url  = URL.createObjectURL(blob);  // URL temporal para el archivo en memoria
```
**Dónde aparece:** En `exportacion.js` para generar archivos JSON descargables sin servidor.

---

### `window.location.hash`
Lee o cambia la parte `#` de la URL actual.
```js
window.location.hash = 'admin/usuarios';  // navega a esa ruta
const ruta = window.location.hash.slice(1); // lee la ruta actual (sin el #)
```
**Dónde aparece:** En `router.js` — toda la navegación SPA se basa en cambiar este hash.

---

### `history.replaceState()`
Cambia la URL del navegador sin agregar una nueva entrada al historial de navegación.
```js
history.replaceState(null, '', window.location.pathname);  // limpia el hash
```
**Dónde aparece:** En `router.js` al cerrar modales o limpiar la navegación.

---

## Fetch API — Detalles

### Métodos HTTP
| Método | Para qué |
|---|---|
| `GET` | Pedir datos al servidor (leer) |
| `POST` | Enviar datos nuevos al servidor (crear) |
| `PUT` | Reemplazar todos los datos de un recurso (actualizar completo) |
| `PATCH` | Actualizar solo algunos campos (actualización parcial) |
| `DELETE` | Eliminar un recurso del servidor |

**Dónde aparece:** En todos los archivos de `api/`. GET para cargar, POST para crear, PUT para editar, PATCH para cambiar solo el estado, DELETE para eliminar.

---

### Headers
Metadatos que se envían junto a la petición.
```js
headers: {
    'Content-Type': 'application/json',     // le dice al servidor que enviamos JSON
    'Authorization': `Bearer ${token}`       // el token JWT para autenticación
}
```
**Dónde aparece:** En `fetchConAuth.js` — agrega automáticamente el `Authorization` a todas las peticiones.

---

### `response.ok`
Propiedad booleana: `true` si el código HTTP es 200-299, `false` si es 400, 401, 500, etc.
```js
if (!response.ok) throw new Error(json.message || 'Error del servidor');
```
**Dónde aparece:** En todas las funciones de `api/` para verificar si el servidor respondió exitosamente.

---

## JWT (JSON Web Token)

### ¿Qué es?
Un token firmado que el servidor entrega al hacer login. El cliente lo guarda y lo envía en cada petición para demostrar que está autenticado.

### Estructura
```
eyJhbGc...   ←  Header (algoritmo)
.eyJ1c2V...  ←  Payload (datos del usuario: id, rol, expiración)
.SflKxwRJ... ←  Signature (firma del servidor)
```

### Access Token vs Refresh Token
| | Access Token | Refresh Token |
|---|---|---|
| Duración | 1 hora | 7 días |
| Para qué | Autenticar peticiones | Obtener nuevo Access Token |
| Dónde se usa | Header `Authorization` | Endpoint `/auth/refresh` |

**Dónde aparece:** `sesion.js` los guarda. `fetchConAuth.js` los usa. `authApi.js` los obtiene del servidor.

---

### Silent Refresh (Renovación silenciosa)
Cuando el servidor responde con error 401 (token expirado), `fetchConAuth.js` automáticamente pide un nuevo token con el Refresh Token y repite la petición original — sin que el usuario tenga que hacer nada.

---

## Arquitectura del Proyecto

### SPA (Single Page Application)
Una sola página HTML (`index.html`) que no se recarga — el JavaScript cambia lo que se ve en pantalla según la navegación.

### Hash-based routing
En lugar de cambiar de página, cambiamos el fragmento `#` de la URL. Ejemplo: `http://localhost:5173/#admin/usuarios`.
- El router (`router.js`) escucha el evento `hashchange`
- Cada hash tiene una función asociada que dibuja la sección correspondiente

### Arquitectura en capas
```
api/          ← solo habla con el servidor (fetch)
services/     ← coordina api + ui
ui/           ← dibuja en pantalla con createElement
utils/        ← funciones reutilizables (validar, filtrar, exportar)
```

### Vite
Herramienta que compila y empaqueta todos los archivos JS, CSS y HTML en archivos optimizados para producción. Se ejecuta con `npm run dev` (desarrollo) o `npm run build` (producción).

---

## CSS — Conceptos Usados

### Variables CSS (Custom Properties)
Variables definidas en `:root` que se pueden reutilizar en todo el CSS.
```css
:root { --color-primario: #7c3aed; }
.btn { background: var(--color-primario); }
```
**Dónde aparece:** En `styles.css` — todas las propiedades de color, espacio y radio usan variables.

---

### `data-modo` y theming por rol
El color del sistema cambia según el rol del usuario. Esto se logra poniendo un atributo en el body:
```css
body[data-modo="admin"]      { --color-primario: #0284c7; }  /* azul */
body[data-modo="instructor"] { --color-primario: #059669; }  /* verde */
body[data-modo="usuario"]    { --color-primario: #7c3aed; }  /* morado */
```
**Dónde aparece:** `modoUI.js` cambia `document.body.dataset.modo`. `styles.css` define los colores para cada modo.

---

### BEM (Block Element Modifier)
Convención de nombres para clases CSS: `bloque__elemento--modificador`.
```html
<div class="stat-card stat-card--pendiente">
    <span class="stat-card__label">Pendientes</span>
    <span class="stat-card__valor">5</span>
</div>
```
**Dónde aparece:** En todo el CSS y HTML del proyecto.

---

### Flexbox
Sistema de diseño CSS para distribuir elementos en fila o columna.
```css
display: flex;
align-items: center;     /* centra verticalmente */
justify-content: space-between; /* separa los elementos */
flex-direction: column;  /* apila verticalmente */
gap: 1rem;               /* espacio entre elementos */
```
**Dónde aparece:** En prácticamente todas las reglas CSS del proyecto.

---

### Grid CSS
Sistema de diseño en cuadrícula de filas y columnas.
```css
display: grid;
grid-template-columns: 1fr 1fr;  /* dos columnas iguales */
gap: 1rem;
```
**Dónde aparece:** En `.dashboard-stats`, `.admin-inicio-grid`, `.modal--registro-v2__fila`.

---

### Media Queries
Cambian los estilos según el tamaño de la pantalla.
```css
@media (max-width: 768px) {
    .sidebar { width: 100%; }
}
```
**Dónde aparece:** En `styles.css` para hacer el proyecto responsivo en móviles y tablets.

---

## Expresiones Regulares (Regex)

Patrones para validar texto. Se usan con `.test()` que retorna `true` o `false`.
```js
/^\d+$/.test('12345')            // true — solo dígitos
/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test('Ana López') // true — solo letras y espacios
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('test@correo.com') // true — formato email básico
```
**Dónde aparece:** En `validaciones.js` para validar documento, nombre y correo electrónico.

---

## Otras Funciones Importantes

### `Boolean()`
Convierte cualquier valor a `true` o `false` de forma explícita.
```js
Boolean(null)      // false
Boolean('token')   // true
Boolean('')        // false
```
**Dónde aparece:** En `sesion.js` — `return Boolean(localStorage.getItem(KEYS.ACCESS_TOKEN))`.

---

### `Number()`
Convierte un valor a número.
```js
Number('42')  // 42
Number('3.14') // 3.14
```
**Dónde aparece:** En `ordenamiento.js` — `Number(a.id) - Number(b.id)` para ordenar por fecha usando el ID.

---

### `encodeURIComponent()`
Convierte caracteres especiales de una URL para que sean seguros de enviar.
```js
const url = `/users/by-document/${encodeURIComponent(documento)}`;
```
**Dónde aparece:** En `tareasApi.js` al buscar usuario por documento.

---

### `setTimeout()`
Ejecuta una función después de un tiempo indicado en milisegundos.
```js
setTimeout(() => URL.revokeObjectURL(url), 1000); // libera memoria 1 segundo después
setTimeout(() => textarea.focus(), 100);           // enfoca el campo 100ms después de abrir
```
**Dónde aparece:** En `exportacion.js` para liberar URLs temporales, en `notificaciones.js` para animar cierres.

---

### `Date.now()`
Retorna la cantidad de milisegundos desde el 1 de enero de 1970 (timestamp Unix).
```js
eventos.push({ tipo, descripcion, ts: Date.now() });
```
**Dónde aparece:** En `auditoria.js` para marcar la hora exacta de cada evento.

---

### `localeCompare()`
Compara dos strings respetando las reglas del idioma indicado (tildes, ñ, etc.).
```js
'árbol'.localeCompare('zapato', 'es')  // en español 'árbol' va antes de 'zapato'
```
**Dónde aparece:** En `ordenamiento.js` para ordenar por título o usuario en español.
