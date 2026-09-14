---
courseId: power-bi
lessonSlug: 06-visualizaciones-storytelling
title: "Storytelling con Datos, Jerarquía Visual e Interactividad"
week: 2
day: "Lunes"
order: 6
durationMinutes: 55
tags: ["Storytelling", "Visualización", "Bookmarks", "Tooltips"]
summary: "Aprende a diseñar reportes claros con paletas accesibles, micrográficos de tendencias (sparklines), marcadores (bookmarks) y tooltips personalizados."
---

# Storytelling con Datos, Jerarquía Visual e Interactividad

Un reporte analítico no debe ser un volcado indiscriminado de gráficos. Debe contar una historia orientada a la toma de decisiones ejecutivas.

---

## 1. Principios de Diseño para Dashboards Ejecutivos

1. **Ley de Proximidad y Jerarquía:** Coloca los KPIs principales (Total Ingresos, Margen, Ticket Promedio) en la esquina superior izquierda, donde inicia el barrido visual natural.
2. **Uso Estratégico del Color:** Limita la paleta a 1 o 2 colores primarios y un color de alerta (ejemplo: rojo o ámbar) exclusivamente para desvíos negativos.
3. **Evitar Gráficos Circulares Complejos:** Los gráficos de pastel o dona con más de 3 segmentos dificultan la comparación angular precisa. Emplea barras horizontales ordenadas de mayor a menor.

---

## 2. Interactividad con Marcadores (Bookmarks) y Botones

Los marcadores permiten guardar el estado de una página (filtros, visibilidad de objetos, posición de paneles) para crear experiencias de navegación fluidas:

- **Paneles Colapsables de Filtros:** Oculta los segmentadores dentro de un panel flotante para maximizar el área de datos.
- **Alternar Vistas Gráficas:** Cambia entre vista de tabla de datos y gráfico de tendencias con un solo clic.

> [!TIP]
> Al configurar un marcador que solo debe mostrar u ocultar elementos visuales sin alterar los filtros seleccionados por el usuario, desmarca la casilla **"Datos"** en las opciones del Bookmark.

---

## 3. Tooltips Personalizados de Página (Report Page Tooltips)

Puedes crear una página oculta de dimensiones reducidas (ej. 320x240 px) para que se despliegue dinámicamente cuando el usuario pose el cursor sobre una barra o punto de datos:

```text
[Gráfico Principal: Ventas por Región]
         |
      (Hover sobre 'Región Norte')
         v
+------------------------------------+
| Mini Tooltip de Detalle:           |
| - Top 3 Productos en Norte         |
| - Tendencia últimos 6 meses        |
| - Margen medio de la región        |
+------------------------------------+
```
