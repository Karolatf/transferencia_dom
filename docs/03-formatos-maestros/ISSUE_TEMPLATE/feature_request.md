---
name: "🛠️ Requerimiento Técnico"
about: Plantilla para la creación de nuevas funcionalidades o tareas del proyecto.
title: "[FEAT]: "
labels: enhancement
assignees: ''
---

## Descripción del Requerimiento
*Describe de forma clara qué funcionalidad se va a implementar y por qué es necesaria para la aplicación.*

> **Ejemplo:** "Como usuario, quiero poder marcar una tarea como completada para llevar un control de mi progreso."

---

## Criterios de Aceptación (Definition of Done)
*Estos son los puntos que el Líder verificará para aprobar tu Pull Request:*
- [ ] La funcionalidad cumple con el diseño responsivo (Móvil/Desktop).
- [ ] No existen errores en la consola del navegador.
- [ ] El código respeta la estructura de capas definida en el `README.md` (api / services / ui / utils).
- [ ] Se ha probado la persistencia de datos con el servidor local (json-server o backend).

---

## Tareas Técnicas (Albañilería)
*Divide el requerimiento en pasos pequeños:*
1. [ ] Identificar en qué capa(s) impacta el cambio (api / services / ui / utils).
2. [ ] Implementar la lógica en la capa correspondiente.
3. [ ] Actualizar la UI si es necesario (sin usar innerHTML).
4. [ ] Realizar pruebas locales en el navegador.

---

## Evidencia y Recursos
*Adjunta capturas de pantalla o enlaces a la guía de aprendizaje si es necesario.*

---
**Recuerda:** Al terminar esta tarea, debes abrir un Pull Request hacia `release` y vincularlo usando la frase `Closes #ID_DE_ESTA_ISSUE`.
