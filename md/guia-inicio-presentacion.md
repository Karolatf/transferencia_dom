# Guía de Inicio — Configuración y Arranque del Proyecto (Frontend)

> Sigue este orden exacto antes de empezar la presentación.
> El frontend depende de que el backend esté corriendo primero.

---

## PASO 1 — Clonar los repositorios

Abrir la terminal y ejecutar uno por uno:

```bash
# Clonar el frontend
git clone https://github.com/TU_USUARIO/transferencia_dom.git
cd transferencia_dom

# En otra terminal, clonar el backend (necesario para que el frontend funcione)
git clone https://github.com/TU_USUARIO/servidor_backend_parejas.git
cd servidor_backend_parejas
```

---

## PASO 2 — Instalar dependencias

En cada repositorio, ejecutar `npm install` (o `npm i`) para descargar todos los paquetes de `package.json`:

```bash
# En la carpeta del frontend
cd transferencia_dom
npm install

# En la carpeta del backend
cd servidor_backend_parejas
npm install
```

> En el frontend, `npm install` descarga principalmente **Vite** — la herramienta que levanta el servidor de desarrollo y permite usar módulos ES6 (`import/export`) en el navegador.

---

## PASO 3 — Verificar la dirección del backend en `config.js`

El frontend tiene la dirección del servidor backend configurada en un solo archivo. Abrirlo y verificar que apunte al puerto correcto:

**Ruta:** `src/utils/config.js`

```js
export const API_BASE_URL = 'http://localhost:3000';
export const API_PREFIX   = '/api';
```

> Si el backend corre en un puerto diferente, cambiar solo este archivo y todas las peticiones se actualizan automáticamente. No hay archivo `.env` en el frontend — la configuración está directamente en `config.js`.

---

## PASO 4 — Configurar y arrancar el backend

El frontend no funciona sin el backend. Antes de arrancar el frontend, completar la configuración del backend:

1. Crear el archivo `.env` en la raíz del backend con las credenciales de la base de datos y JWT.
2. Configurar MySQL: crear el usuario `app_user`, ejecutar `schema.sql` y `rbac.sql`.
3. Arrancar el backend: `npm run dev` en la carpeta `servidor_backend_parejas`.
4. Verificar en consola del backend:
   - `Servidor escuchando en http://localhost:3000`
   - `Conexión con MySQL establecida correctamente`

> Ver el archivo `md/guia-inicio-presentacion.md` del backend para los pasos detallados.

---

## PASO 5 — Arrancar el servidor de desarrollo del frontend

```bash
cd transferencia_dom
npm run dev
```

La terminal muestra algo como:

```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Abrir el navegador en `http://localhost:5173`.

---

## PASO 6 — Verificar que la conexión con el backend funciona

1. En el navegador, abrir la pantalla de login (`http://localhost:5173`).
2. Abrir las Herramientas de Desarrollador (F12) → pestaña **Console**.
3. Debe aparecer el mensaje: `Backend esperado en: http://localhost:3000` sin errores de CORS.
4. Intentar hacer login con las credenciales del admin.

Si aparece un error de CORS o `Failed to fetch`, el backend no está corriendo — volver al paso 4.

---

## PASO 7 — Importar la colección de Postman (para demostrar las peticiones)

1. Abrir Postman.
2. Hacer clic en **Import**.
3. Importar el archivo `.json` de la colección (está en la carpeta `postman/` del backend).
4. Importar también el archivo de **environment** con las variables `baseUrl` y `token`.
5. Seleccionar el environment importado en el selector de Postman (esquina superior derecha).

---

## PASO 8 — Abrir los archivos de documentación en VSCode

Antes de arrancar la presentación:

- Frontend: abrir `md/guia-exposicion.md` para seguir el guión
- Frontend: tener a mano `md/preguntas-frecuentes.md` por si el instructor pregunta
- Backend: tener abierto `md/flujos-capas.md` para explicar procesos completos

---

## PASO 9 — Empezar la presentación

- Navegador en `http://localhost:5173` mostrando la pantalla de login
- Cerrar sesión si hay alguna activa
- VSCode con el explorador de archivos del frontend visible a la izquierda
- Seguir la `guia-exposicion.md` paso a paso

---

## Estructura de carpetas del frontend (referencia rápida)

```
transferencia_dom/
  index.html        ← el único HTML — punto de entrada del navegador
  styles.css        ← todos los estilos de la aplicación
  src/
    main.js         ← primer archivo que ejecuta el navegador
    router.js       ← sistema de navegación SPA por hash (#)
    rutas.js        ← constantes con todas las rutas registradas
    api/            ← solo peticiones HTTP al servidor (fetch)
      authApi.js
      usuariosApi.js
      tareasApi.js
      calendarApi.js
      notesApi.js
    services/       ← coordina api + ui (lógica de negocio)
      tareasService.js
    ui/             ← dibuja en pantalla (manipula el DOM)
      modoUI.js     ← el más grande — activa los 3 paneles
      tareasUI.js
      adminPanel.js
      buscarUsuario.js
    utils/          ← funciones reutilizables sin acceso a servidor ni DOM
      fetchConAuth.js   ← envuelve fetch() con el token y el Silent Refresh
      sesion.js         ← único acceso al localStorage
      validaciones.js   ← valida formularios antes de enviar al servidor
      config.js         ← URL del backend (único lugar para cambiarla)
      filtros.js
      ordenamiento.js
      exportacion.js
      auditoria.js
      notificaciones.js
      rolesPermisos.js
      eventosCalendario.js
```

---

## Checklist rápido antes de la presentación

- [ ] Backend corriendo en `http://localhost:3000` (ver consola del backend)
- [ ] MySQL conectado (mensaje en consola del backend)
- [ ] Frontend corriendo en `http://localhost:5173`
- [ ] Login funciona: ingresar como admin, instructor y estudiante
- [ ] Datos de prueba cargados (usuarios de los 3 roles, tareas en varios estados)
- [ ] DevTools del navegador cerradas (se abren solo cuando se van a mostrar)
- [ ] Postman con la colección y el environment listos
- [ ] VSCode con el explorador visible mostrando la carpeta `transferencia_dom`
- [ ] Documentación abierta: `md/guia-exposicion.md` y `md/preguntas-frecuentes.md`
