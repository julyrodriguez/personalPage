# 🚀 Personal OS / Hub de Vida y Estudio

Un portal y dashboard personal todo-en-uno de alto rendimiento, diseñado con una arquitectura moderna en **Next.js (App Router)**, **TypeScript estricto**, **Tailwind CSS**, componentes estilo Bento Grid y soporte completo de **Dark / Light mode**.

Preparado tanto para el uso diario personal como para interactuar con **agentes autónomos, webhooks y scripts batch** mediante una API de ingesta protegida por token Bearer.

---

## 📸 Características Principales

### 1. 🎛️ Dashboard Principal (`/`) con Bento Grid
- **Widget del Clima en Tiempo Real:** Integración directa con la API gratuita de **Open-Meteo** (coordenadas de Buenos Aires por defecto), mostrando temperatura actual, sensación térmica, estado del clima (mapeo WMO con iconos dinámicos), velocidad del viento, humedad y **pronóstico a 3 días**.
- **Widget de Agenda & Daily Focus:** Lista de tareas categorizadas (*Hoy*, *Próximas*, *Completadas*), con checkbox optimista interactivo, filtro por prioridad (*Alta*, *Media*, *Baja*), selector de fecha y efectos de celebración (confetti) al completar metas.
- **Widget de Progreso de Estudio:** Seguimiento en tiempo real del curso activo (*Power BI: X de 10 clases completadas*), barra de progreso porcentual y botón de acceso directo a la última clase vista o pendiente.
- **Feed de Bitácora / Notas Rápidas:** Apuntes breves con etiquetas, snippets de código y guardado automático.
- **Gateway de Ingesta Externa:** Panel visual con el estado de los endpoints para agentes externos y comandos cURL listos para copiar.

### 2. 📚 Plataforma de Cursos y Aprendizaje (`/cursos` y `/cursos/[courseId]/[lessonSlug]`)
- **Catálogo de Cursos (`/cursos`):** Vista de tarjetas con los cursos disponibles (ej: *Power BI Masterclass* con 10 clases completas, y *Next.js Moderno*), horas estimadas, nivel, tags y porcentaje de avance.
- **Lector de Clases de Alto Rendimiento (`/cursos/[courseId]/[lessonSlug]`):**
  - **Sidebar Colapsable:** Temario completo del curso organizado por **Semanas** y **Días**, con checkmarks de estado y duración en minutos.
  - **Lector de Markdown/MDX Enriquecido:** Tipografía clara, tablas renderizadas, callouts de información (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`).
  - **Syntax Highlighting Profesional:** Soporte nativo para bloques de código en **DAX**, **M (Power Query)**, **SQL**, **TypeScript** y **Python**, con botón de copia con un clic y badges de lenguaje.
  - **Persistencia de Progreso:** Botón interactivo de "Marcar como completada" y botones de navegación rápida "Clase anterior" y "Siguiente clase".

### 3. 📋 Gestor de Tareas y Planificación (`/tareas`)
- **Vistas Duales:** Tablero **Kanban** visual (columnas *Pendiente*, *En Progreso*, *Completada*) y vista de **Lista Detallada**.
- Transición de estados con botones rápidos de avance y retroceso.
- Filtros por categoría (*Estudio*, *Desarrollo*, *Personal*) y por prioridad.
- Modal para creación de nuevas tareas con fecha límite.

### 4. 📝 Bitácora Personal & Cheat Sheets (`/notas`)
- Tablero de notas técnicas con soporte de Markdown completo.
- Fijado de notas arriba (*Pin to top*).
- Filtrado dinámico por tags (`#DAX`, `#PowerBI`, `#ETL`, etc.) y buscador en tiempo real.
- Botón para copiar el contenido en Markdown directo al portapapeles.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router con Server Components y Streaming SSR) |
| **Lenguaje** | TypeScript 5 (tipado estricto) |
| **Estilos** | Tailwind CSS con diseño Bento Grid modular y temas Dark/Light |
| **Iconografía & Animaciones** | Lucide React + Canvas Confetti + Framer Motion |
| **Renderizado Markdown** | `react-markdown` + `remark-gfm` + `gray-matter` |
| **Syntax Highlighting** | `prismjs` con gramáticas para DAX, Power Query (M), SQL, TS y Python |
| **Persistencia** | Capa de adaptador embebido (`lib/db.ts`) con almacenamiento en archivos JSON atómicos (`data/`) y fallback de semilla inicial |
| **Seguridad de Endpoints** | Middleware/Validador de Token Bearer estático (`lib/auth.ts`) |

---

## 🤖 API de Ingesta Externa para Agentes y Webhooks

Todos los endpoints de ingesta se encuentran bajo `/api/ingest/` y requieren la cabecera:
```http
Authorization: Bearer pos_hub_secret_token_2025_power_user
```
*(O el valor que configures en la variable `API_SECRET_KEY` de tu archivo `.env.local`).*

### 1. Ingesta de Tareas
```bash
POST /api/ingest/task
Content-Type: application/json
Authorization: Bearer <API_SECRET_KEY>

{
  "title": "Optimizar cardinalidad de timestamps en Fact_Ventas",
  "description": "Dividir fecha y hora en columnas separadas para reducir memoria en VertiPaq",
  "priority": "high",
  "category": "Estudio",
  "dueDate": "2026-09-20"
}
```

### 2. Ingesta de Notas / Apuntes
```bash
POST /api/ingest/note
Content-Type: application/json
Authorization: Bearer <API_SECRET_KEY>

{
  "title": "Regla de Oro: Medidas vs Columnas Calculadas",
  "content": "Las columnas calculadas ocupan memoria RAM en reposo dentro del archivo .pbix. Las medidas explícitas se evalúan en tiempo de consulta en el CPU.",
  "tags": ["DAX", "BuenasPrácticas", "PowerBI"],
  "pinned": true
}
```

### 3. Ingesta / Actualización de Clases de Cursos
```bash
POST /api/ingest/course-lesson
Content-Type: application/json
Authorization: Bearer <API_SECRET_KEY>

{
  "courseId": "power-bi",
  "lessonSlug": "11-power-bi-embedded-react",
  "title": "Integración de Reportes con Power BI Embedded en React",
  "week": 3,
  "day": "Lunes",
  "order": 11,
  "durationMinutes": 60,
  "tags": ["Embedded", "React", "SDK"],
  "summary": "Aprende a embeber informes en aplicaciones web usando el SDK de Power BI para JavaScript.",
  "markdownContent": "# Power BI Embedded\n\nContenido de la clase en markdown..."
}
```

### 4. Proxy del Clima (Público con Caché ISR)
```bash
GET /api/weather
# Opcional con parámetros: ?lat=-34.6037&lon=-58.3816&city=Buenos%20Aires,%20AR
```

---

## 📁 Estructura del Proyecto

```text
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx               // Bento Grid principal
│   │   ├── tareas/page.tsx        // Gestor de tareas (Kanban y Lista)
│   │   └── notas/page.tsx         // Bitácora personal y snippets
│   ├── cursos/
│   │   ├── page.tsx               // Catálogo de cursos
│   │   └── [courseId]/
│   │       └── [lessonSlug]/
│   │           └── page.tsx       // Lector de lecciones con sidebar dinámica
│   ├── api/
│   │   ├── ingest/
│   │   │   ├── task/route.ts
│   │   │   ├── note/route.ts
│   │   │   └── course-lesson/route.ts
│   │   ├── tasks/route.ts
│   │   ├── notes/route.ts
│   │   ├── progress/route.ts
│   │   └── weather/route.ts
│   ├── layout.tsx                 // ThemeProvider + Sidebar persistente
│   └── globals.css                // Variables de tema, tokens Prism y scrollbar
├── components/
│   ├── ui/                        // Button, Card, Badge, Input
│   ├── layout/                    // Sidebar, Header, ThemeToggle
│   ├── dashboard/                 // WeatherWidget, TaskWidget, StudyProgressWidget, NotesWidget, SystemStatusWidget
│   └── course/                    // LessonReader, LessonSidebar, CodeBlock
├── content/
│   └── courses/
│       ├── power-bi/              // 10 clases redactadas con frontmatter y código
│       └── nextjs-fullstack/      // Clases del curso de Next.js
├── lib/
│   ├── courses.ts                 // Parser de markdown/frontmatter con gray-matter
│   ├── db.ts                      // Adaptador de base de datos embebida con datos iniciales
│   └── auth.ts                    // Validador de API_SECRET_KEY
├── types/
│   └── index.ts                   // Tipos TypeScript unificados
├── .env.example
├── .env.local
└── package.json
```

---

## 🚀 Puesta en Marcha Local

1. Clona o abre el repositorio:
   ```bash
   npm install
   ```

2. Configura las variables de entorno (ya configuradas en `.env.local` por defecto):
   ```bash
   cp .env.example .env.local
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre en tu navegador:
   ```text
   http://localhost:3000
   ```
