---
courseId: power-bi
lessonSlug: 04-introduccion-dax-calculadas-medidas
title: "Introducción a DAX: Columnas Calculadas vs Medidas"
week: 1
day: "Jueves"
order: 4
durationMinutes: 65
tags: ["DAX", "Medidas", "Columnas Calculadas", "Contexto de Filtro"]
summary: "Comprende la diferencia esencial entre el contexto de fila y el contexto de filtro, domina CALCULATE y aprende por qué las medidas no consumen RAM en reposo."
---

# Introducción a DAX: Columnas Calculadas vs Medidas

**DAX (Data Analysis Expressions)** es el lenguaje de fórmulas analíticas de Power BI, Analysis Services y Power Pivot en Excel. A diferencia de Excel tradicional, DAX trabaja sobre columnas y tablas, evaluando contextos dinámicos.

---

## 1. Columnas Calculadas vs Medidas

| Característica | Columna Calculada | Medida |
| :--- | :--- | :--- |
| **Momento de Cálculo** | Durante la carga / actualización de datos. | Al momento de renderizar el visual (en tiempo de consulta). |
| **Consumo de Memoria** | Consume espacio físico en RAM (comprimida por VertiPaq). | 0 MB en reposo; se calcula al vuelo en CPU. |
| **Contexto Inicial** | **Contexto de Fila** (evalúa fila por fila). | **Contexto de Filtro** (agregación sobre subconjunto filtrado). |
| **Cuándo Usar** | Para segmentar, crear rangos o agrupar en filtros / ejes. | Para cualquier cálculo numérico, ratios, KPI o sumas. |

---

## 2. Sintaxis y Mejores Prácticas de Medidas DAX

Nunca uses columnas calculadas para métricas agregadas. Define medidas explícitas:

```dax
// Medida Base 1: Total Ventas
[Total Ventas] = SUM(Fact_Ventas[MontoTotal])

// Medida Base 2: Costo Total
[Total Costo] = SUM(Fact_Ventas[CostoTotal])

// Medida Derivada: Margen Bruto
[Margen Bruto] = [Total Ventas] - [Total Costo]

// Medida de Ratio con DIVIDE para evitar divisiones por cero
[% Margen] = 
DIVIDE(
    [Margen Bruto], 
    [Total Ventas], 
    0
)
```

> [!NOTE]
> Nota cómo las medidas reutilizan medidas anteriores (`[Margen Bruto]` hace referencia a `[Total Ventas]`). Esto se conoce como **Measure Branching** (ramificación de medidas) y facilita el mantenimiento y optimización.

---

## 3. La Función Reina: CALCULATE

`CALCULATE` es la única función de DAX capaz de modificar el contexto de filtro existente:

```dax
Ventas Clientes VIP = 
CALCULATE(
    [Total Ventas],
    Dim_Cliente[Segmento] = "VIP",
    Dim_Calendario[Año] = 2025
)
```

### Transición de Contexto (Context Transition)
Cuando invocas `CALCULATE` dentro de una función iteradora como `SUMX` o en una columna calculada, el contexto de fila actual se transforma automáticamente en un contexto de filtro equivalente para todas las columnas de la tabla.

```dax
// Columna calculada en Dim_Cliente con Context Transition
Dim_Cliente[VentasTotalesPorCliente] = 
CALCULATE([Total Ventas])
```
