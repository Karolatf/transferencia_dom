# Asignacion de trabajo - Karol

Guia: Modelos y separacion de responsabilidades
Rol: Lider del proyecto
Rama de trabajo: desarrolladora
Repositorios: servidor_backend_parejas y transferencia_dom
Tag al finalizar: v2.2.0 (minor porque se agregan funcionalidades nuevas)

---

## Contexto

Tu trabajo esta dividido en dos partes. Primero haces un ajuste en el backend
para registrar las nuevas rutas en app.js, y luego trabajas todo el frontend.
Puedes empezar con el frontend desde el principio porque no se pisa con el trabajo
de Sebastian ni de Paulo. Solo para el paso de app.js debes esperar a que ellos
confirmen que sus archivos ya estan en release.

---

## Antes de empezar

Abre GitBash y actualiza los dos repositorios:

Backend:

    cd /c/sena/servidor_backend_parejas
    git checkout desarrolladora
    git pull origin release

Frontend:

    cd /c/sena/transferencia_dom
    git checkout desarrolladora
    git pull origin release

---

## Tarea 1 - Modificar app.js para registrar las nuevas rutas

Repositorio: servidor_backend_parejas
Archivo a modificar: src/app.js

Espera a que Sebastian y Paulo confirmen que sus archivos estan en release.
Luego jala los cambios y abre app.js en VS Code.
Dentro de app.js importa los archivos de rutas que creo Paulo
y registralos con app.use() usando los prefijos /api/users y /api/tasks.

Cuando termines, en GitBash:

    cd /c/sena/servidor_backend_parejas
    git pull origin release
    git add src/app.js
    git commit -m "feat: registrar rutas de usuarios y tareas en app.js"
    git push origin desarrolladora

Commit para copiar y pegar:

    feat: registrar rutas de usuarios y tareas en app.js

Pull Request:

    Titulo: feat: conectar rutas de usuarios y tareas en el servidor

    Comentario:
    Que se hizo:
    Se actualizo app.js para importar y registrar con app.use las rutas
    de usuarios (/api/users) y tareas (/api/tasks) creadas por Paulo.

    Por que:
    Sin este paso el servidor no reconoce los endpoints y el flujo
    Ruta - Controlador - Modelo no funciona de punta a punta.

    Archivos modificados:
    - src/app.js

    Nota:
    Este PR debe mergearse despues de los PRs de Sebastian y Paulo.

---

## Tarea 2 - Modificar el formulario de asignacion de tareas

Repositorio: transferencia_dom
Archivo a modificar: el archivo dentro de src/ui/ que contiene el formulario
donde actualmente se selecciona un solo usuario al asignar una tarea.

Busca el campo select de usuario en ese archivo y cambialo para que permita
seleccionar varios usuarios al tiempo. Puedes usar un select con el atributo
multiple o varios checkboxes, uno por usuario.

Cuando termines:

    cd /c/sena/transferencia_dom
    git add src/ui/
    git commit -m "feat: modificar formulario de tareas para seleccion multiple de usuarios"
    git push origin desarrolladora

Commit para copiar y pegar:

    feat: modificar formulario de tareas para seleccion multiple de usuarios

---

## Tarea 3 - Crear la vista de administracion de usuarios

Repositorio: transferencia_dom
Archivo a crear: src/ui/adminUsuarios.js

Esta vista debe mostrar la lista de todos los usuarios del sistema y permitir
crear un usuario nuevo, editar uno existente y eliminarlo.
Debe consumir los endpoints /api/users del backend.

Cuando termines:

    git add src/ui/adminUsuarios.js
    git commit -m "feat: crear vista de administracion de usuarios"
    git push origin desarrolladora

Commit para copiar y pegar:

    feat: crear vista de administracion de usuarios

---

## Tarea 4 - Actualizar las funciones de consumo de API

Repositorio: transferencia_dom
Archivo a modificar o crear: src/api/ (el archivo que maneja las llamadas al
backend para usuarios, por ejemplo users.js si no existe aun)

Agrega las funciones fetch que llaman a los endpoints de usuarios:
obtener todos, obtener uno por id, crear, actualizar, eliminar.
Tambien agrega la funcion para obtener las tareas asignadas a un usuario.

Cuando termines:

    git add src/api/
    git commit -m "feat: agregar funciones de consumo de API para modulo de usuarios"
    git push origin desarrolladora

Commit para copiar y pegar:

    feat: agregar funciones de consumo de API para modulo de usuarios

---

## Tarea 5 - Ajustar estilos CSS

Repositorio: transferencia_dom
Archivo a modificar: styles.css

Agrega los estilos para la vista de administracion de usuarios y para el
nuevo campo de seleccion multiple del formulario de tareas.
No es necesario redisenar todo, solo que las nuevas secciones se vean ordenadas.

Cuando termines:

    git add styles.css
    git commit -m "style: estilos para panel de usuarios y selector multiple"
    git push origin desarrolladora

Commit para copiar y pegar:

    style: estilos para panel de usuarios y selector multiple

Pull Request del frontend:

    Titulo: feat: frontend actualizado con panel de usuarios y formulario multiple

    Comentario:
    Que se hizo:
    Se modifico el formulario de tareas para seleccion multiple de usuarios.
    Se creo la vista de administracion de usuarios con acciones CRUD.
    Se agregaron las funciones fetch para los endpoints de usuarios.
    Se actualizaron los estilos CSS para las nuevas secciones.

    Por que:
    La guia pide integrar las nuevas funcionalidades del backend en el frontend,
    manteniendo la conexion entre ambos repositorios.

    Archivos modificados:
    - src/ui/ (formulario de tareas y adminUsuarios.js)
    - src/api/ (funciones de usuarios)
    - styles.css

---

## Al finalizar - Merge de release a main y creacion del tag

Cuando todos los PRs esten mergeados en release, haces esto en GitBash:

Backend:

    cd /c/sena/servidor_backend_parejas
    git checkout main
    git pull origin main
    git merge release
    git push origin main
    git tag v1.0.0
    git push origin v1.0.0

Frontend:

    cd /c/sena/transferencia_dom
    git checkout main
    git pull origin main
    git merge release
    git push origin main
    git tag v2.2.0
    git push origin v2.2.0V