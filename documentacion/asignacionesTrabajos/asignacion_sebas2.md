# Asignacion de trabajo - Sebastian

Guia: Modelos y separacion de responsabilidades
Rol: Desarrollador backend
Rama de trabajo: developer
Repositorio: servidor_backend_parejas (trabajas desde tu fork)

---

## Contexto

Tu trabajo es crear los modelos y los controladores del proyecto.
Estos son los archivos que forman el centro de la arquitectura MVC.

El modelo es el archivo que gestiona los datos. No envia respuestas HTTP,
solo retorna informacion al controlador.

El controlador es el archivo que recibe la peticion desde la ruta, llama al
modelo, y envia la respuesta HTTP al cliente con el codigo correcto (200, 201, 500).

Trabajas en dos carpetas que ya existen en el proyecto: src/controllers y src/models.
Creas cuatro archivos en total. Paulo trabaja en src/routes al mismo tiempo,
por eso no hay conflictos entre ustedes.

---

## Antes de empezar

Si llegas a tu computador y no tienes los cambios recientes del proyecto,
ejecuta esto en GitBash antes de empezar:

    cd ruta/a/tu/fork/servidor_backend_parejas
    git checkout developer
    git fetch upstream
    git pull upstream release
    git push origin developer

Si aun no tienes configurado upstream (el repo original de Karol), primero ejecuta:

    git remote add upstream URL_DEL_REPO_DE_KAROL

Luego si el pull upstream release.

---

## Tarea 1 - Crear el modelo de usuarios

Archivo a crear: src/models/userModel.js

Este archivo representa la capa de datos para usuarios.
Debe contener funciones para: obtener todos los usuarios, obtener uno por id,
crear un usuario, actualizar un usuario y eliminar un usuario.

Por ahora los datos pueden ser un arreglo declarado dentro del mismo archivo
(no hay base de datos real todavia). Las funciones solo operan sobre ese arreglo
y retornan el resultado. No usan res ni req, no envian nada al cliente.

Cuando termines el archivo en VS Code, en GitBash:

    git add src/models/userModel.js
    git commit -m "feat: crear userModel con operaciones CRUD"
    git push origin developer

Commit para copiar y pegar:

    feat: crear userModel con operaciones CRUD

---

## Tarea 2 - Crear el modelo de tareas

Archivo a crear: src/models/taskModel.js

Igual que el anterior pero para tareas.
Debe manejar un arreglo de tareas donde cada tarea tiene un campo
assignedUsers que es un arreglo (permite asignar varios usuarios a una tarea).
Tambien debe tener una funcion para actualizar el estado de una tarea.

Los estados posibles son: pendiente, en progreso, completada.

Cuando termines:

    git add src/models/taskModel.js
    git commit -m "feat: crear taskModel con asignacion multiple y manejo de estados"
    git push origin developer

Commit para copiar y pegar:

    feat: crear taskModel con asignacion multiple y manejo de estados

---

## Tarea 3 - Crear el controlador de usuarios

Archivo a crear: src/controllers/userController.js

Este archivo importa userModel y expone una funcion por cada operacion.
Cada funcion recibe (req, res), llama al modelo, y responde al cliente con
res.status().json(). Los codigos de respuesta son:
- GET: 200
- POST: 201
- PUT: 200
- DELETE: 200
- Error: 500 (usa try/catch)

Cuando termines:

    git add src/controllers/userController.js
    git commit -m "feat: crear userController con metodos CRUD y codigos HTTP"
    git push origin developer

Commit para copiar y pegar:

    feat: crear userController con metodos CRUD y codigos HTTP

---

## Tarea 4 - Crear el controlador de tareas

Archivo a crear: src/controllers/taskController.js

Igual que el anterior pero para tareas. Importa taskModel.
Ademas de las funciones CRUD basicas, debe tener funciones para:
- Asignar una tarea a multiples usuarios
- Actualizar el estado de una tarea
- Obtener los usuarios asignados a una tarea
- Filtrar tareas (por usuario o estado)
- Retornar datos generales para el dashboard

Cuando termines:

    git add src/controllers/taskController.js
    git commit -m "feat: crear taskController con CRUD, asignacion multiple y filtros"
    git push origin developer

Commit para copiar y pegar:

    feat: crear taskController con CRUD, asignacion multiple y filtros

---

## Pull Request

Cuando todos tus archivos esten subidos, crea el PR desde tu fork hacia release
en el repo de Karol.

    Titulo: feat: modelos y controladores de usuarios y tareas

    Comentario:
    Que se hizo:
    Se crearon los modelos y controladores para la arquitectura MVC del proyecto.
    - userModel.js: arreglo de usuarios con funciones CRUD
    - taskModel.js: arreglo de tareas con asignacion multiple y estados
    - userController.js: recibe peticion, llama modelo, responde con HTTP
    - taskController.js: igual pero con funciones extra de filtrado y dashboard

    Por que:
    La guia exige separar responsabilidades. El modelo solo gestiona datos,
    el controlador maneja la peticion y envia la respuesta HTTP.

    Archivos nuevos:
    - src/models/userModel.js
    - src/models/taskModel.js
    - src/controllers/userController.js
    - src/controllers/taskController.js

    Nota:
    Paulo crea las rutas que importan estos controladores.
    Karol conecta todo en app.js.