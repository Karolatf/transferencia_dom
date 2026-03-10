# Asignacion de trabajo - Paulo

Guia: Modelos y separacion de responsabilidades
Rol: Desarrollador backend
Rama de trabajo: desarrollador
Repositorio: servidor_backend_parejas (trabajas desde tu fork)

---

## Contexto

Tu trabajo es crear los archivos de rutas del proyecto y el README de documentacion.

Las rutas son archivos que le dicen al servidor que endpoint corresponde a que
funcion del controlador. Por ejemplo, cuando llega una peticion GET /api/users,
la ruta le dice al servidor que ejecute la funcion getUsers del controlador.

Las rutas no tienen logica propia. Solo conectan la peticion con el controlador.

Trabajas en la carpeta src/routes. Sebastian trabaja en src/models y src/controllers
al mismo tiempo, por eso no hay conflictos entre ustedes.

---

## Antes de empezar

Si llegas a tu computador y no tienes los cambios recientes del proyecto,
ejecuta esto en GitBash antes de empezar:

    cd ruta/a/tu/fork/servidor_backend_parejas
    git checkout desarrollador
    git fetch upstream
    git pull upstream release
    git push origin desarrollador

Si aun no tienes configurado upstream (el repo original de Karol), primero ejecuta:

    git remote add upstream URL_DEL_REPO_DE_KAROL

Luego si el pull upstream release.

---

## Tarea 1 - Crear el archivo de rutas de usuarios

Archivo a crear: src/routes/userRoutes.js

Este archivo importa express, crea un router con express.Router()
e importa las funciones del userController que creo Sebastian.

Luego define las rutas usando router.get(), router.post(), etc.
Al final exporta el router con module.exports.

Las rutas que debe tener son:

    GET    /              -> obtener todos los usuarios
    GET    /:id           -> obtener un usuario por id
    POST   /              -> crear un usuario
    PUT    /:id           -> actualizar un usuario
    DELETE /:id           -> eliminar un usuario
    PATCH  /:id/status    -> activar o desactivar un usuario
    GET    /:userId/tasks -> obtener las tareas de un usuario

Nota: el prefijo /api/users lo agrega Karol en app.js,
aqui solo escribes la parte final de cada ruta.

Cuando termines el archivo en VS Code, en GitBash:

    git add src/routes/userRoutes.js
    git commit -m "feat: crear userRoutes con endpoints CRUD y tareas por usuario"
    git push origin desarrollador

Commit para copiar y pegar:

    feat: crear userRoutes con endpoints CRUD y tareas por usuario

---

## Tarea 2 - Crear el archivo de rutas de tareas

Archivo a crear: src/routes/taskRoutes.js

Igual que el anterior pero para tareas. Importa el taskController de Sebastian.

Las rutas que debe tener son:

    GET    /                        -> obtener todas las tareas
    GET    /filter                  -> filtrar tareas por usuario o estado
    GET    /:id                     -> obtener una tarea por id
    POST   /                        -> crear una tarea
    PUT    /:id                     -> actualizar una tarea
    DELETE /:id                     -> eliminar una tarea
    PATCH  /:id/status              -> cambiar estado de una tarea
    POST   /:taskId/assign          -> asignar tarea a multiples usuarios
    GET    /:taskId/users           -> ver que usuarios tiene asignados una tarea
    DELETE /:taskId/users/:userId   -> quitar un usuario de una tarea
    GET    /dashboard               -> estadisticas generales para el admin

Nota: el prefijo /api/tasks lo agrega Karol en app.js.

Cuando termines:

    git add src/routes/taskRoutes.js
    git commit -m "feat: crear taskRoutes con todos los endpoints de tareas"
    git push origin desarrollador

Commit para copiar y pegar:

    feat: crear taskRoutes con todos los endpoints de tareas

---

## Tarea 3 - Crear el README del proyecto backend

Archivo a crear: README.md en la raiz del repositorio servidor_backend_parejas

Este archivo documenta el proyecto. Debe tener:
- Nombre del proyecto y descripcion breve
- Como ejecutarlo (npm run dev)
- En que puerto corre (localhost:3000)
- La tabla completa de endpoints con metodo, ruta, rol y descripcion
  (puedes copiarla directamente de la guia)
- Nombres del equipo

Este archivo es parte de la evidencia que pide la guia.

Cuando termines:

    git add README.md
    git commit -m "docs: crear README con descripcion del proyecto y tabla de endpoints"
    git push origin desarrollador

Commit para copiar y pegar:

    docs: crear README con descripcion del proyecto y tabla de endpoints

---

## Pull Request

Cuando todos tus archivos esten subidos, crea el PR desde tu fork hacia release
en el repo de Karol.

    Titulo: feat: rutas de usuarios y tareas mas documentacion del proyecto

    Comentario:
    Que se hizo:
    Se crearon los archivos de rutas que conectan los endpoints HTTP con los
    controladores del proyecto. Tambien se creo el README de documentacion.
    - userRoutes.js: rutas CRUD para usuarios y consulta de tareas por usuario
    - taskRoutes.js: rutas completas de tareas con asignacion, filtros y dashboard
    - README.md: documentacion del proyecto con tabla de endpoints

    Por que:
    Las rutas son el primer punto de contacto entre el cliente y el sistema.
    Sin ellas el servidor no sabe a donde dirigir cada peticion.
    El README es evidencia requerida por la guia.

    Archivos nuevos:
    - src/routes/userRoutes.js
    - src/routes/taskRoutes.js
    - README.md

    Nota:
    Karol debe importar estas rutas en app.js para que queden activas.
    Depende de que el PR de Sebastian este mergeado primero porque
    las rutas importan los controladores que el creo.