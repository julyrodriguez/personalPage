---
courseId: nextjs-fullstack
lessonSlug: 02-server-actions-mutaciones
title: "Server Actions: Mutaciones Type-Safe y Revalidación"
week: 1
day: "Martes"
order: 2
durationMinutes: 50
tags: ["Server Actions", "Next.js", "Mutaciones", "TypeScript"]
summary: "Implementa Server Actions con validación Zod y revalidación de caché mediante revalidatePath."
---

# Server Actions: Mutaciones Type-Safe y Revalidación

Las Server Actions permiten ejecutar funciones del lado del servidor invocadas directamente desde componentes de cliente o formularios HTML estándar.

```typescript
'use server'

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function addTaskAction(formData: FormData) {
  const title = formData.get('title') as string;
  const category = formData.get('category') as string;

  await db.createTask({
    title,
    category,
    priority: 'medium',
    status: 'pending',
  });

  revalidatePath('/');
}
```
