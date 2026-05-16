# Guía — Clonar, compilar y exponer con `dist`

> Sigue este orden exacto. La carpeta `dist/` no está en el repositorio —
> hay que generarla con `npm run build` después de clonar.

---

## PARTE 1 — Pasos completos desde cero (día de la presentación)

### PASO 1 — Clonar los repositorios

Abrir dos terminales. En cada una ejecutar uno de estos:

```bash
# Terminal 1 — frontend
git clone https://github.com/Karolatf/transferencia_dom.git
```

```bash
# Terminal 2 — backend
git clone https://github.com/TU_USUARIO/servidor_backend_parejas.git
```

---

### PASO 2 — Instalar dependencias

En cada carpeta clonada ejecutar `npm install`:

```bash
# Terminal 1 — frontend
cd transferencia_dom
npm install
```

```bash
# Terminal 2 — backend
cd servidor_backend_parejas
npm install
```

> `npm install` descarga `node_modules/`. Puede tardar 1–2 minutos la primera vez.

---

### PASO 3 — Arrancar el backend

En la **Terminal 2** (carpeta `servidor_backend_parejas`):

1. Crear el archivo `.env` con las credenciales (ver `md/guia-inicio-presentacion.md` del backend)
2. Ejecutar:

```bash
npm run dev
```

Verificar en consola:
```
Servidor escuchando en http://localhost:3000
Conexión con MySQL establecida correctamente
```

> El backend debe estar corriendo **antes** de compilar el frontend.

---

### PASO 4 — Compilar el frontend (genera `dist/`)

En la **Terminal 1** (carpeta `transferencia_dom`):

```bash
npm run build
```

Vite compila todo y muestra algo como:

```
vite v7.x.x building for production...
✓ 42 modules transformed.
dist/index.html                   0.50 kB
dist/assets/index-Cd3k9Xmz.js   312.00 kB
dist/assets/index-Bx7YqLmA.css   28.00 kB
✓ built in 2.1s
```

Ahora existe la carpeta `dist/` con los archivos compilados.

---

### PASO 5 — Servir `dist/` en el navegador

En la **Terminal 1**, verificar que sigues dentro de `transferencia_dom/` (NO entrar a `dist/`):

```bash
# Correcto — ejecutar desde la raíz del proyecto
cd transferencia_dom
npm run preview

# Incorrecto — no entrar a dist, no hay package.json ahí
cd transferencia_dom/dist   ← NO hacer esto
```

> Todos los comandos de npm (`dev`, `build`, `preview`) se ejecutan siempre desde
> `transferencia_dom/`. Vite sabe solo que debe servir la carpeta `dist/` que está adentro.

Ejecutar **uno** de estos dos (son equivalentes):

**Opción A — con Vite (recomendada, no necesita nada extra):**
```bash
npm run preview
```
Abre el navegador en: **`http://localhost:4173`**

**Opción B — con `npx serve` (si el instructor lo pide):**
```bash
npx serve dist
```
Abre el navegador en el puerto que muestre en consola (normalmente `http://localhost:3000`).

> Con `npx serve`, la primera vez pregunta si desea instalar el paquete `serve` — escribir `y` y Enter.

---

### PASO 6 — Verificar que todo funciona

1. Abrir el navegador en la URL del paso anterior
2. Debería aparecer la pantalla de **login**
3. Hacer login con las credenciales del admin
4. Verificar que las tareas, usuarios y calendario cargan correctamente

Si aparece pantalla en blanco o error de CORS → el backend no está corriendo (volver al Paso 3).

---

## PARTE 2 — ¿`dist` funciona igual que `npm run dev`?

**Sí, funciona exactamente igual.**

`dist` es el mismo código fuente pero compilado y comprimido. Las peticiones al servidor no cambian:

- La URL del backend sigue siendo `http://localhost:3000` (fija en `src/utils/config.js`)
- Login, tareas, calendario, notas — todo habla con el backend y MySQL normalmente
- No es "solo visual" — es la aplicación completa funcionando

La única diferencia es técnica:

| | `npm run dev` | `npm run preview` / `dist` |
|---|---|---|
| Puerto frontend | 5173 | 4173 |
| Backend | 3000 | 3000 (igual) |
| Base de datos | MySQL (igual) | MySQL (igual) |
| Archivos JS | Separados (legibles) | Un solo archivo comprimido |
| Para qué sirve | Desarrollar | Presentar / producción |

---

## PARTE 3 — ¿Por qué `dist` no está en el repositorio?

`dist/` está en `.gitignore` — no se sube al repo porque:

- Es código **generado automáticamente** a partir del código fuente (`src/`)
- Cualquiera que clone el repo puede regenerarlo con `npm run build` en segundos
- Subir archivos generados ensucia el historial de git innecesariamente

Por eso el proceso siempre es: **clonar → `npm install` → `npm run build` → `npm run preview`**.

---

## Resumen de comandos en orden

```
# 1. Clonar
git clone <url-del-repo>

# 2. Instalar dependencias
npm install

# 3. Compilar (genera dist/)
npm run build

# 4. Servir dist/
npm run preview          → abre en http://localhost:4173
# o
npx serve dist           → abre en el puerto que muestre en consola
```
