---
courseId: power-bi
lessonSlug: 10-proyecto-final-dashboard-ejecutivo
title: "Proyecto Final: Construcción del Dashboard Ejecutivo Integral"
week: 2
day: "Viernes"
order: 10
durationMinutes: 90
tags: ["Proyecto Final", "Dashboard Ejecutivo", "DAX", "Storytelling"]
summary: "Consolida todos los conocimientos del curso desarrollando un Dashboard Ejecutivo Financiero y de Ventas con KPIs dinámicos, navegación avanzada y RLS."
---

# Proyecto Final: Construcción del Dashboard Ejecutivo Integral

¡Felicitaciones por llegar a la última lección del curso! Es momento de integrar todo lo aprendido en un caso de negocio realista.

---

## 1. El Reto de Negocio

La empresa multinacional *TechNova Solutions* necesita un panel de control ejecutivo para el C-Level que permita:
1. Evaluar el cumplimiento de la meta de facturación anual (Target vs Real).
2. Analizar el margen de rentabilidad por línea de negocio y país.
3. Detectar clientes en riesgo de abandono mediante análisis RFM (Recencia, Frecuencia, Monto).
4. Restringir la visualización según el país del gerente regional (RLS).

---

## 2. Definición del Data Model

```
Dim_Calendario (1)  ----< (*) Fact_Ventas (Monto, Costo, Unidades)
Dim_Producto   (1)  ----< (*) Fact_Ventas
Dim_Cliente    (1)  ----< (*) Fact_Ventas
Dim_Sucursal   (1)  ----< (*) Fact_Ventas
Dim_Objetivos  (1)  ----< (*) Fact_Ventas (Metas por Mes y Categoría)
```

---

## 3. Batería de Medidas DAX del Dashboard

```dax
// 1. Cumplimiento de Objetivo
[% Cumplimiento Meta] = 
DIVIDE(
    [Total Ventas],
    [Meta Ventas Presupuestada],
    0
)

// 2. Indicador KPI con formato condicional de color
Color KPI Cumplimiento = 
SWITCH(
    TRUE(),
    [% Cumplimiento Meta] >= 1.00, "#10B981", // Verde esmeralda
    [% Cumplimiento Meta] >= 0.85, "#F59E0B", // Ámbar alerta
    "#EF4444"                                // Rojo crítico
)

// 3. Ventas Promedio Diario
[Promedio Venta Diaria] = 
AVERAGEX(
    VALUES(Dim_Calendario[Date]),
    [Total Ventas]
)
```

---

## 4. Rúbrica de Evaluación Final

Para graduarte con honores en este curso:
- [ ] Tu modelo no debe contener relaciones bidireccionales injustificadas.
- [ ] Todas las transformaciones de limpieza deben tener Query Folding en Power Query.
- [ ] Las medidas de Time Intelligence deben utilizar la tabla `Dim_Calendario` explícita.
- [ ] La experiencia visual debe incluir navegación por botones, tooltips enriquecidos y diseño responsive.

¡Excelente trabajo! Has completado el programa completo de Power BI.
