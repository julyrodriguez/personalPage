---
courseId: power-bi
lessonSlug: 01-fundamentos-power-bi
title: "Fundamentos y Arquitectura de Power BI"
week: 1
day: "Lunes"
order: 1
durationMinutes: 45
tags: ["Arquitectura", "Power BI Desktop", "Fundamentos"]
summary: "Comprende la estructura central de la suite Power BI, el flujo de trabajo moderno y las mejores prácticas para iniciar proyectos analíticos."
---

# Fundamentos y Arquitectura de Power BI

Bienvenido a la primera clase del curso integral de **Power BI**. En esta sesión sentaremos las bases de la arquitectura moderna de Business Intelligence de Microsoft, comprendiendo la interacción entre **Power BI Desktop**, el servicio en la nube (**Power BI Service**) y las aplicaciones móviles.

---

## 1. La Trilogía de Power BI

El ciclo de vida de un proyecto de Business Intelligence moderno se divide en tres fases fundamentales:

| Componente | Rol Principal | Destinatarios |
| :--- | :--- | :--- |
| **Power BI Desktop** | Desarrollo local, extracción ETL (Power Query), modelado dimensional y diseño de reportes. | Ingenieros de Datos, Analistas de BI |
| **Power BI Service** | Publicación, gobernanza, seguridad RLS, programación de gateways y distribución en Apps. | Usuarios de Negocio, Directores, Stakeholders |
| **Power BI Mobile** | Consumo interactivo, visualización optimizada y alertas push en smartphones/tablets. | Ejecutivos y fuerza de ventas en terreno |

> [!NOTE]
> Power BI Desktop es una herramienta **gratuita** para Windows que se actualiza mensualmente con nuevos conectores visuales y mejoras en el motor VertiPaq.

---

## 2. El Flujo de Trabajo Analítico de Punta a Punta

El flujo estándar sigue rigurosamente el pipeline de ingeniería analítica:

1. **Ingesta y Transformación (ETL):** Conexión a bases de datos relacionales (PostgreSQL, SQL Server), APIs REST o archivos planos mediante el motor de **Power Query (lenguaje M)**.
2. **Modelado de Datos:** Definición de un esquema en estrella (Star Schema) con tablas de hechos y dimensiones, evitando relaciones muchos a muchos bidireccionales.
3. **Cálculos Analíticos (DAX):** Formulación de medidas agregadas y cálculos dinámicos contextuales.
4. **Visualización & Storytelling:** Creación de dashboards intuitivos guiados por la jerarquía visual.
5. **Gobernanza & Distribución:** Publicación en un Workspace seguro con Row-Level Security (RLS).

---

## 3. Primer Vistazo a una Consulta SQL de Ingesta

Antes de cargar los datos a Power BI, es una buena práctica filtrar a nivel de base de datos relacional para no sobrecargar el ancho de banda:

```sql
-- Extracción optimizada de ventas y clientes activos
SELECT 
    f.VentaID,
    f.Fecha,
    f.ClienteID,
    f.ProductoID,
    f.MontoTotal,
    f.CantidadVendida,
    c.Region,
    c.Segmento
FROM dbo.FactVentas f
INNER JOIN dbo.DimCliente c ON f.ClienteID = c.ClienteID
WHERE f.Fecha >= DATEADD(YEAR, -2, GETDATE())
  AND c.Estado = 'Activo';
```

> [!TIP]
> Siempre que sea posible, delega las transformaciones pesadas al motor SQL o permite que **Power Query realice Query Folding** hacia el origen de datos.

---

## 4. Checklist de la Lección
- [x] Conocer los 3 pilares de la suite Power BI.
- [ ] Descargar e instalar Power BI Desktop última versión.
- [ ] Configurar las opciones regionales a estándares ISO (YYYY-MM-DD y separadores numéricos).
- [ ] Preparar el dataset de práctica para la siguiente lección de Power Query.
