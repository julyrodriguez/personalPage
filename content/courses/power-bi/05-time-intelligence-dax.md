---
courseId: power-bi
lessonSlug: 05-time-intelligence-dax
title: "Time Intelligence: YTD, MTD, YoY y Comparativas Temporales"
week: 1
day: "Viernes"
order: 5
durationMinutes: 60
tags: ["DAX", "Time Intelligence", "YTD", "YoY", "SAMEPERIODLASTYEAR"]
summary: "Domina los cálculos de acumulación anual (YTD), variaciones año contra año (YoY) y medias móviles temporales en DAX con tablas calendario continuas."
---

# Time Intelligence: YTD, MTD, YoY y Comparativas Temporales

El análisis de series de tiempo es una de las necesidades más frecuentes en Business Intelligence. En esta lección aprenderás a implementar métricas acumuladas y variaciones interanuales de forma precisa.

---

## 1. Requisitos para Time Intelligence

Para que las funciones de inteligencia de tiempo funcionen sin fallos:
1. Debes contar con una **tabla de calendario** con días continuos, sin fechas faltantes.
2. La columna de fecha debe ser de tipo `Date` o `DateTime`.
3. Debe existir una relación activa unidireccional de 1 a varios entre el calendario y la tabla de hechos.

---

## 2. Acumulados Anuales (YTD) y Mensuales (MTD)

Existen dos sintaxis válidas para calcular el acumulado del año a la fecha:

```dax
// Método 1: Función sintáctica azucarada
[Ventas YTD_Simple] = 
TOTALYTD(
    [Total Ventas], 
    Dim_Calendario[Date]
)

// Método 2: Expresión con CALCULATE y DATESYTD (Recomendada por flexibilidad)
[Ventas YTD] = 
CALCULATE(
    [Total Ventas],
    DATESYTD(Dim_Calendario[Date], "12-31")
)
```

---

## 3. Comparativa Año contra Año (YoY)

Para comparar el rendimiento actual con el mismo periodo del año anterior:

```dax
// 1. Ventas del mismo periodo el año pasado
[Ventas SPLY] = 
CALCULATE(
    [Total Ventas],
    SAMEPERIODLASTYEAR(Dim_Calendario[Date])
)

// 2. Variación Absoluta
[Variacion Ventas YoY $] = [Total Ventas] - [Ventas SPLY]

// 3. Crecimiento Porcentual Año contra Año
[% Crecimiento YoY] = 
DIVIDE(
    [Variacion Ventas YoY $],
    [Ventas SPLY],
    BLANK()
)
```

> [!TIP]
> Si deseas calcular un desfase de meses arbitrario (por ejemplo, comparar contra hace 3 meses o contra el mes previo), utiliza la función `DATEADD(Dim_Calendario[Date], -1, MONTH)`.

---

## 4. Media Móvil de 3 Meses (Moving Average)

```dax
[Ventas Media Movil 3M] = 
CALCULATE(
    AVERAGEX(
        DATESINPERIOD(
            Dim_Calendario[Date],
            MAX(Dim_Calendario[Date]),
            -3,
            MONTH
        ),
        [Total Ventas]
    )
)
```
