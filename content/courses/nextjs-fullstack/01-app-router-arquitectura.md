---
courseId: nextjs-fullstack
lessonSlug: 01-app-router-arquitectura
title: "App Router: Server Components y Streaming SSR"
week: 1
day: "Lunes"
order: 1
durationMinutes: 45
tags: ["Next.js", "React 19", "RSC", "Arquitectura"]
summary: "Comprende los fundamentos de React Server Components, Suspense y streaming con App Router."
---

# App Router: Server Components y Streaming SSR

El App Router de Next.js transforma radicalmente la forma de concebir aplicaciones React al convertir los componentes de servidor (**Server Components**) en el valor predeterminado.

---

## 1. ¿Por qué Server Components?

- **Cero Bundle Size:** Las dependencias utilizadas en componentes de servidor (ejemplo: `gray-matter`, clientes SQL) no se envían al navegador del cliente.
- **Acceso Directo al Backend:** Lectura de archivos locales o bases de datos sin necesidad de crear endpoints de API intermedios.
- **Seguridad Mejorada:** Tokens y secretos de entorno nunca se filtran al cliente.

```typescript
// app/dashboard/page.tsx - Server Component
import { db } from '@/lib/db';

export default async function DashboardPage() {
  // Consulta directa a la base de datos sin fetch de red
  const tasks = await db.getTasks();

  return (
    <div>
      <h1>Tareas Activas: {tasks.length}</h1>
    </div>
  );
}
```
