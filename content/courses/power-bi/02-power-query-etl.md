---
courseId: power-bi
lessonSlug: 02-power-query-etl
title: "Extracción y Transformación con Power Query y Lenguaje M"
week: 1
day: "Martes"
order: 2
durationMinutes: 60
tags: ["Power Query", "Lenguaje M", "ETL", "Query Folding"]
summary: "Aprende a limpiar, transformar y preparar datasets heterogéneos con Power Query y a dominar el código M subyacente para lograr Query Folding eficiente."
---

# Extracción y Transformación con Power Query y Lenguaje M

Power Query es el motor de preparación y extracción de datos (ETL) integrado en Power BI. Todo lo que construyes mediante la interfaz gráfica se compila internamente en un script declarativo del **lenguaje M**.

---

## 1. Anatomía de un Script M

Una consulta en M siempre sigue la estructura de un bloque `let ... in`:

```powerquery
let
    // 1. Origen de datos desde archivo CSV o API
    Origen = Csv.Document(File.Contents("C:\Data\Ventas_Raw.csv"), [Delimiter=",", Columns=6, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    
    // 2. Promover la primera fila como encabezados de columna
    EncabezadosPromovidos = Table.PromoteHeaders(Origen, [PromoteAllScalars=true]),
    
    // 3. Tipado fuerte de datos
    TiposCambiados = Table.TransformColumnTypes(EncabezadosPromovidos, {
        {"ID_Venta", Int64.Type}, 
        {"Fecha", type date}, 
        {"Cliente", type text}, 
        {"Monto", type number}, 
        {"Descuento", type number},
        {"Impuesto", Percentage.Type}
    }),
    
    // 4. Filtrar registros con montos erróneos o nulos
    FilasFiltradas = Table.SelectRows(TiposCambiados, each [Monto] > 0 and [Monto] <> null),
    
    // 5. Agregar columna calculada en M para Monto Neto
    ColumnaMontoNeto = Table.AddColumn(FilasFiltradas, "MontoNeto", each [Monto] * (1 - [Descuento]), type number)
in
    ColumnaMontoNeto
```

> [!IMPORTANT]
> El lenguaje M es **case-sensitive** (distingue mayúsculas y minúsculas). `Table.SelectRows` no es lo mismo que `table.selectrows`.

---

## 2. El Principio de Query Folding

**Query Folding** es la capacidad de Power Query de traducir tus pasos de transformación directamente en sentencias SQL nativas que se ejecutan en el servidor de base de datos remoto.

### Transformaciones que admiten Folding:
- Filtros (`WHERE`)
- Agrupaciones (`GROUP BY`)
- Joins simples con claves primarias (`INNER JOIN`, `LEFT JOIN`)
- Renombrado y selección de columnas (`SELECT col1, col2`)

### Transformaciones que rompen el Folding:
- Reemplazar errores por valores predeterminados basados en lógica compleja.
- Dividir columnas por delimitadores arbitrarios con conteos variables.
- Funciones personalizadas no traducibles a SQL.

> [!TIP]
> Para comprobar si una transformación está haciendo folding, haz clic derecho sobre el paso aplicado en la barra lateral derecha. Si la opción **"Ver consulta nativa"** está habilitada, el motor delegará el procesamiento al servidor.

---

## 3. Python para Preprocesamiento Avanzado

Cuando necesites imputación estadística o machine learning preliminar, puedes inyectar scripts de Python directamente en Power Query:

```python
# 'dataset' contiene el DataFrame entrante de Power Query
import pandas as pd
import numpy as np

# Imputar valores faltantes en la columna 'ScoreCredito' con la mediana por segmento
dataset['ScoreCredito'] = dataset.groupby('Segmento')['ScoreCredito'].transform(
    lambda x: x.fillna(x.median())
)

# Salida resultante
output = dataset
```
