# Sistema de Gestión de Tareas - transferencia_dom · Software Factory SENA

**Metodología:** *"Del Requerimiento al Producto"*

Este repositorio es la base técnica y administrativa del proyecto frontend de gestión de tareas. No es solo un contenedor de código: es una simulación de un entorno profesional donde se aplican estándares de calidad, gestión ágil y flujos de trabajo colaborativos reales.

---

## INTRODUCCIÓN Y PROPÓSITO

El objetivo de este proyecto es desarrollar una aplicación web funcional para la gestión de tareas, priorizando:

- Arquitectura limpia y modular (capas: api / services / ui / utils)
- Código escalable y sin efectos secundarios entre capas
- Trazabilidad total de cada cambio mediante Issues, PRs y Commits Convencionales

### El "Por qué" (Justificación)

Dominar el ciclo de vida del software es tan importante como programar. Esta metodología alinea las habilidades técnicas con las exigencias de la industria, garantizando que cada línea de código tenga un propósito claro y demostrable.

---

## CENTRO DE DOCUMENTACIÓN (WIKI DEL PROYECTO)

Antes de escribir la primera línea de código o ejecutar un comando, es obligatorio revisar las guías de trabajo.

### Nivel 1. Sistema
**Ubicación:** `docs/01-guia-sistema/`
- `blindaje-ramas.md` — Configuración de Rulesets en GitHub
- `creacion_milestones.md` — Gestión de Hitos
- `creacion-issues.md` — Gestión de Issues
- `tablero-kanban.md` — Configuración del tablero Kanban

### Nivel 2. Metodología
**Ubicación:** `docs/02-guia-metodologia/`
- `gitflow.md` — Flujo de ramas y ciclo de vida del código
- `conventional-commits.md` — Estándar de mensajes de commit
- `GUIA_ISSUES.md` — Cómo usar las plantillas de Issues
- `GUIA_PULL_REQUEST.md` — Cómo pedir revisión de código

### Nivel 3. Formatos
**Ubicación:** `docs/03-formatos-maestros/`
- Plantillas oficiales de Issues y Pull Requests

---

## ROLES DE LA CÉLULA ÁGIL

### Líder (Arquitecto)
- **Responsable:** Karol Torres (`@Karolatf`)
- **Tareas en GitHub:** Protección de ramas · Gestión de Milestones · Aprobación de Pull Requests

### Desarrolladores (Albañiles)
- **Sebastian Patiño** (`@SebasPatino`) — Fork propio, rama `developer`
- **Paulo Zapata** (`@Pauloz17`) — Fork propio, rama `desarrollador`
- **Tareas en GitHub:** Desarrollo en ramas `feat/` · Reporte de avances · Solicitud de revisión técnica

---

## CONFIGURACIÓN DEL ENTORNO (LOCAL)

```bash
# Paso 1. Clonar el repositorio (o tu fork)
git clone https://github.com/Karolatf/transferencia_dom.git

# Paso 2. Instalar dependencias
npm install

# Paso 3. Ejecutar el servidor local
npm run dev
```

> El servidor de datos debe estar corriendo en `http://localhost:3000` (json-server o backend propio).

---

## ARQUITECTURA Y ESTRUCTURA DEL PROYECTO

```
/
├── .github/                    # Plantillas de Issues y Pull Requests
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
├── docs/                       # Guías metodológicas
│   ├── 01-guia-sistema/
│   ├── 02-guia-metodologia/
│   └── 03-formatos-maestros/
├── public/                     # Recursos estáticos
│   └── bg-inicio.jpg
├── src/                        # Código fuente principal
│   ├── api/                    # Peticiones HTTP (fetch) — solo comunicación
│   │   ├── tareasApi.js
│   │   └── usuariosApi.js
│   ├── services/               # Lógica de negocio — coordina api y ui
│   │   └── tareasService.js
│   ├── ui/                     # Manipulación del DOM — solo visual
│   │   ├── adminPanel.js
│   │   ├── buscarUsuario.js
│   │   ├── modoUI.js
│   │   └── tareasUI.js
│   ├── utils/                  # Funciones puras reutilizables
│   │   ├── config.js
│   │   ├── exportacion.js
│   │   ├── filtros.js
│   │   ├── notificaciones.js
│   │   ├── ordenamiento.js
│   │   └── validaciones.js
│   └── main.js                 # Punto de entrada de la aplicación
├── .gitignore
├── index.html
├── package.json
├── styles.css
├── README.md
└── TEAM_AGREEMENT.md
```

---

## METODOLOGÍA DE TRABAJO (GITFLOW)

El flujo de trabajo es el corazón de nuestra colaboración.
Está estrictamente prohibido hacer commits directos sobre las ramas `main` o `release`.

### Flujo del Desarrollador

```bash
# 1. Sincronizar con la rama de integración del repo principal
git checkout developer        # (o desarrollador según tu fork)
git pull upstream release

# 2. Crear rama de tarea
git checkout -b feat/nombre-tarea

# 3. Desarrollar y commitear
git add .
git commit -m "feat(modulo): descripcion de lo que hace (#ID-issue)"

# 4. Sincronizar antes de subir
git checkout release
git pull upstream release
git checkout feat/nombre-tarea
git merge release

# 5. Subir y abrir PR
git push origin feat/nombre-tarea
```

> El PR debe apuntar hacia la rama `release` del repo de Karol.

### Flujo del Líder

- Recibe PRs en `release` → revisa → aprueba o solicita cambios
- Al completar un Milestone: crea rama `release/vX.X.X` → pruebas → merge a `main` → tag de versión

---

## BLINDAJE DE RAMAS

- **`main`** → Solo recibe desde `release` al cerrar un Milestone. PR obligatorio.
- **`release`** → Rama de integración. Todo entra por PR. Nadie hace push directo.

---

## ESTÁNDARES DE CALIDAD (DEFINITION OF DONE)

Antes de que el Líder apruebe un Pull Request, el desarrollador debe garantizar:

- **Limpieza:** Cero `console.log`, variables sin uso o código comentado
- **Responsive:** El diseño no se rompe en móviles
- **Sincronización:** La rama está actualizada con `release` y sin conflictos
- **Automatización:** El PR incluye `Closes #ID` para cerrar la Issue automáticamente

---

## CRITERIOS DE ENTREGA Y EVALUACIÓN

La fase se considera exitosa únicamente cuando:

- El **Milestone** en GitHub marca el **100%** de progreso
- Todas las **Issues** del hito están cerradas y vinculadas a un PR aprobado
- El proyecto está desplegado y funciona sin errores

---

## DIRECCIÓN DEL PROYECTO

- **Institución:** Servicio Nacional de Aprendizaje (SENA)
- **Programa:** Técnico en Programación de Software
- **Proyecto:** Ejercicio DOM — Transferencia del Conocimiento

---

*Este repositorio es propiedad del equipo de desarrollo y se rige por las políticas de formación profesional integral del SENA.*
