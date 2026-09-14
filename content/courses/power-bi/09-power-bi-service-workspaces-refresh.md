---
courseId: power-bi
lessonSlug: 09-power-bi-service-workspaces-refresh
title: "Power BI Service: Workspaces, Gateways y Automatización"
week: 2
day: "Jueves"
order: 9
durationMinutes: 50
tags: ["Power BI Service", "Gateways", "Workspaces", "Automatización"]
summary: "Configura áreas de trabajo corporativas, implementa la puerta de enlace de datos local (On-Premises Gateway) y automatiza la actualización de modelos semánticos."
---

# Power BI Service: Workspaces, Gateways y Automatización

Publicar un informe es solo el inicio del ciclo de vida productivo. Para que la organización tome decisiones en tiempo real, el modelo semántico debe actualizarse de forma confiable.

---

## 1. Organización de Áreas de Trabajo (Workspaces)

Recomendamos separar el entorno por etapas de madurez:

```
[Desarrollo (DEV)] ---> [Validación (UAT)] ---> [Producción (PROD)]
```

- **Separación de Modelo Semántico e Informes:** Publica el modelo semántico (`.pbix` sin visuales o dataset centralizado) en un Workspace de ingeniería. Conecta los reportes visuales en modo **Live Connection** al modelo semántico publicado. Esto evita la duplicación de datos y garantiza una única fuente de la verdad (Single Source of Truth).

---

## 2. On-Premises Data Gateway (Puerta de Enlace)

Si tus bases de datos residen en infraestructura local (servidores On-Premises, redes VPN corporativas):

1. Instala el gateway en **Modo Estándar** en un servidor dedicado con alta disponibilidad.
2. Registra el clúster en Power BI Service.
3. Vincula las cadenas de conexión y credenciales cifradas (Basic, Windows, OAuth).
4. Configura el **Scheduled Refresh** (hasta 8 veces al día con licencia Pro, o hasta 48 veces al día con Premium/Fabric).

---

## 3. Disparar Actualización vía REST API con TypeScript / Python

Puedes orquestar la actualización de tu modelo desde un pipeline CI/CD o un script automatizado invocando la API REST de Power BI:

```typescript
// Script para refrescar Dataset en Power BI Service
async function triggerDatasetRefresh(workspaceId: string, datasetId: string, accessToken: string) {
  const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/refreshes`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ notifyOption: 'MailOnFailure' })
  });

  if (response.status === 202) {
    console.log('✅ Actualización del dataset iniciada exitosamente.');
  } else {
    console.error('❌ Error al solicitar refresh:', await response.text());
  }
}
```
