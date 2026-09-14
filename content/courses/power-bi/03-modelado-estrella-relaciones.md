---
courseId: power-bi
lessonSlug: 03-modelado-estrella-relaciones
title: "Modelado Dimensional: Esquema en Estrella y Relaciones"
week: 1
day: "Miércoles"
order: 3
durationMinutes: 50
tags: ["Modelado", "Star Schema", "Kimball", "Relaciones"]
summary: "Diseña modelos dimensionales robustos según la metodología Kimball. Domina las diferencias entre tablas de hechos y dimensiones, cardinalidad y filtros unidireccionales."
---

# Modelado Dimensional: Esquema en Estrella y Relaciones

El modelado es el **corazón absoluto** de una solución en Power BI. Un mal modelo provocará fórmulas DAX complejas, lentitud extrema y resultados inconsistentes.

---

## 1. Esquema en Estrella (Star Schema)

En un esquema en estrella encontramos dos tipos de entidades claramente diferenciadas:

```
          +------------------+
          |  Dim_Calendario  |
          +--------+---------+
                   | 1
                   |
                   | *
+--------------+   |     +------------------+
| Dim_Cliente  +---+-----+  Dim_Producto    |
+-------+------+ * | *   +--------+---------+
        | 1        |              | 1
        +----+     |       +------+
             |     |       |
             | *   | *     | *
         +---+-----+-------+---+
         |     Fact_Ventas     |
         +---------------------+
```

- **Tablas de Hechos (Fact Tables):** Contienen métricas cuantitativas observables (Monto, Unidades, Descuento) y claves foráneas (`DateKey`, `CustomerKey`, `ProductKey`). Son tablas largas y angostas con millones de filas.
- **Tablas de Dimensiones (Dim Tables):** Contienen los atributos descriptivos que contextualizan los hechos (Nombre de Cliente, Categoría, Ciudad, Trimestre). Tienen claves primarias únicas y pocas filas.

---

## 2. Cardinalidad y Dirección de Filtro

> [!CAUTION]
> **Evita las relaciones bidireccionales (`Both`)** a menos que sea un caso estrictamente justificado de relación muchos a muchos. El filtro bidireccional puede causar ambigüedad de rutas y degradar el rendimiento del motor tabular.

| Tipo de Relación | Recomendación | Explicación |
| :--- | :--- | :--- |
| **1 a Varios (1:*)** | ✅ Estándar de Oro | La dimensión (1) filtra unidireccionalmente a la tabla de hechos (*). |
| **Varios a Varios (*:*)** | ⚠️ Precaución | Debe resolverse idealmente creando una dimensión puente (Bridge Table). |
| **1 a 1 (1:1)** | ℹ️ Rara vez | Generalmente indica que ambas tablas deberían haberse combinado en el ETL. |

---

## 3. Generación de Tabla Calendario con DAX

Nunca uses las jerarquías de fechas automáticas de Power BI Desktop para modelos de producción. Crea una tabla de calendario dedicada:

```dax
Dim_Calendario = 
VAR FechaInicio = DATE(2023, 1, 1)
VAR FechaFin = DATE(2026, 12, 31)
RETURN
    ADDCOLUMNS(
        CALENDAR(FechaInicio, FechaFin),
        "Año", YEAR([Date]),
        "MesNro", MONTH([Date]),
        "MesNombre", FORMAT([Date], "MMMM"),
        "Trimestre", "T" & FORMAT([Date], "Q"),
        "AñoMes", FORMAT([Date], "YYYY-MM"),
        "DiaSemanaNro", WEEKDAY([Date], 2),
        "DiaSemanaNombre", FORMAT([Date], "dddd"),
        "EsFinDeSemana", IF(WEEKDAY([Date], 2) >= 6, TRUE(), FALSE())
    )
```

> [!TIP]
> Recuerda marcar tu tabla creada como **"Marcar como tabla de fechas"** (Mark as Date Table) para que las funciones de inteligencia de tiempo operen de forma determinista.
