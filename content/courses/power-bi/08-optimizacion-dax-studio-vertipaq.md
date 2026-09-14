---
courseId: power-bi
lessonSlug: 08-optimizacion-dax-studio-vertipaq
title: "Optimización y Rendimiento: VertiPaq, DAX Studio y Tabular Editor"
week: 2
day: "Miércoles"
order: 8
durationMinutes: 70
tags: ["Optimización", "VertiPaq", "DAX Studio", "Performance"]
summary: "Aprende cómo funciona el motor columnar VertiPaq, analiza la huella en memoria con VertiPaq Analyzer y reduce tiempos de renderizado mediante DAX Studio."
---

# Optimización y Rendimiento: VertiPaq, DAX Studio y Tabular Editor

Cuando los modelos crecen a millones de registros, el rendimiento depende directamente de la compresión del motor tabular **VertiPaq** y de la eficiencia del plan de ejecución de DAX.

---

## 1. ¿Cómo Funciona el Motor VertiPaq?

VertiPaq es una base de datos columnar en memoria que aplica tres tipos de compresión:
1. **Value Encoding:** Aplica una transformación matemática (por ejemplo, restar el valor mínimo) para reducir la cantidad de bits necesarios.
2. **Dictionary Encoding:** Construye un diccionario de valores únicos enteros. **La cardinalidad (cantidad de valores distintos) define el tamaño en memoria.**
3. **Run-Length Encoding (RLE):** Comprime secuencias de valores repetidos contiguos.

> [!IMPORTANT]
> Las columnas de alta cardinalidad (como Timestamps con milisegundos o IDs GUID) destruyen la compresión del diccionario. Divide siempre la fecha y la hora en dos columnas separadas y elimina los IDs que no sean claves de relación.

---

## 2. Análisis con DAX Studio y VertiPaq Analyzer

DAX Studio se conecta al puerto local expuesto por Power BI Desktop:

1. Abre **DAX Studio** y conéctate al modelo activo.
2. En la pestaña **Advanced**, selecciona **View Metrics**.
3. Revisa la columna `% DB` (porcentaje del tamaño total de la base de datos).
4. Localiza las 3 columnas más pesadas. En el 80% de los casos suelen ser campos innecesarios o fechas con granularidad de segundos.

```sql
-- Ejemplo de reducción de cardinalidad previa en SQL
SELECT 
    VentaID,
    CAST(FechaHoraVenta AS DATE) AS FechaVenta,  -- Separa la fecha
    DATEPART(HOUR, FechaHoraVenta) AS HoraVenta, -- Solo la hora en número entero
    MontoTotal
FROM dbo.VentasRaw;
```

---

## 3. Optimización de Medidas con Performance Analyzer

En Power BI Desktop, utiliza el **Analizador de Rendimiento**:
- Mide tres componentes: **Consulta DAX**, **Presentación visual** y **Otros**.
- Si la consulta DAX supera los 200 ms, inspecciona la fórmula para evitar `FILTER` sobre tablas completas en lugar de columnas individuales.
