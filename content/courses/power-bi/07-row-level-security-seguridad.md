---
courseId: power-bi
lessonSlug: 07-row-level-security-seguridad
title: "Seguridad a Nivel de Fila (RLS): Estática y Dinámica"
week: 2
day: "Martes"
order: 7
durationMinutes: 50
tags: ["Seguridad", "RLS", "USERPRINCIPALNAME", "Gobernanza"]
summary: "Implementa seguridad por roles a nivel de fila estática y dinámica para garantizar que cada usuario solo visualice los datos autorizados."
---

# Seguridad a Nivel de Fila (RLS): Estática y Dinámica

**Row-Level Security (RLS)** permite restringir el acceso a filas específicas de una tabla en función de la identidad del usuario que consulta el reporte en Power BI Service.

---

## 1. RLS Estática

En RLS estática, creas roles fijos basados en valores constantes (por ejemplo, rol `Zona_Norte`):

```dax
// Filtro DAX asignado al rol Zona_Norte en la tabla Dim_Region
[Region] = "Norte"
```

> [!WARNING]
> La RLS estática se vuelve inmanejable cuando la organización tiene decenas de sucursales, gerencias o países, ya que requeriría crear y mantener un rol separado por cada una.

---

## 2. RLS Dinámica con `USERPRINCIPALNAME()`

En el enfoque dinámico, se utiliza una tabla de seguridad vinculada al modelo que relaciona el correo corporativo del usuario con las entidades a las que tiene acceso:

### Estructura de la Tabla de Permisos:
```sql
-- Dim_SeguridadUsuarios
CREATE TABLE dbo.Dim_SeguridadUsuarios (
    UserEmail VARCHAR(255) NOT NULL,
    RegionID INT NOT NULL,
    PRIMARY KEY (UserEmail, RegionID)
);
```

### Expresión DAX para el Rol Dinámico:
```dax
// Filtro aplicado sobre Dim_SeguridadUsuarios
Dim_SeguridadUsuarios[UserEmail] = USERPRINCIPALNAME()
```

Al activar la relación unidireccional entre `Dim_SeguridadUsuarios` y `Dim_Region` con la opción de filtro cruzado adecuada, el reporte filtra en cascada todas las tablas de hechos para mostrar únicamente lo que le corresponde al usuario logueado.

---

## 3. Comprobación de Roles en Desktop

Antes de publicar al servicio:
1. Dirígete a la pestaña **Modelado > Administrar roles**.
2. Haz clic en **Ver como** (View as).
3. Marca el rol y escribe un correo corporativo de prueba (`usuario.prueba@empresa.com`).
4. Valida que las tablas de hechos y gráficos muestren exclusivamente los registros autorizados.
