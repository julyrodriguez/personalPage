import fs from 'fs';
import path from 'path';
import { Task, Note, CourseProgress, TaskPriority, TaskStatus } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');

const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultData: T): T {
  ensureDataDirectory();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}, restoring default:`, error);
    return defaultData;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDataDirectory();
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

// Initial Seed Data
const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Completar Lección 04: Medidas DAX y Contexto de Evaluación',
    description: 'Revisar fórmulas CALCULATE y FILTER con el dataset financiero de práctica.',
    dueDate: new Date().toISOString().split('T')[0], // Hoy
    priority: 'high',
    status: 'in_progress',
    category: 'Estudio',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Configurar API Ingestion con script en Python para tareas periódicas',
    description: 'Crear script cron que consuma /api/ingest/task usando la API_SECRET_KEY.',
    dueDate: new Date().toISOString().split('T')[0], // Hoy
    priority: 'medium',
    status: 'pending',
    category: 'Desarrollo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Refactorizar consultas de Power Query con folding de consultas M',
    description: 'Verificar que las transformaciones se deleguen al motor SQL subyacente.',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // Próximas
    priority: 'high',
    status: 'pending',
    category: 'Estudio',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Rutina de entrenamiento y revisión de hábitos semanales',
    description: '30 min de cardio + meditación antes de comenzar el bloque de estudio.',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'low',
    status: 'completed',
    category: 'Personal',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-5',
    title: 'Crear backup del archivo .pbix y publicar al Workspace de producción',
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    priority: 'medium',
    status: 'pending',
    category: 'Desarrollo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Diferencia crucial entre CALCULATE y CALCULATETABLE',
    content: `En DAX, **CALCULATE** evalúa una expresión escalar en un contexto modificado por filtros, mientras que **CALCULATETABLE** devuelve una tabla.\n\nAmbas realizan **Transition Context** (transición de contexto de fila a contexto de filtro equivalente) cuando se invocan dentro de un iterador como SUMX o una columna calculada.\n\n\`\`\`dax\nVentas YTD = \nCALCULATE(\n    [Total Ventas],\n    DATESYTD('Calendario'[Date])\n)\n\`\`\``,
    tags: ['DAX', 'Power BI', 'Cheat Sheet'],
    pinned: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    title: 'Optimización de Carga con Query Folding en Power Query (M)',
    content: `Para garantizar que Power Query no descargue tablas completas en memoria:\n1. Colocar filtros, uniones y agrupaciones en los primeros pasos.\n2. Evitar funciones personalizadas de M que rompan el folding.\n3. Clic derecho en el paso aplicado: si "Ver consulta nativa" está activo, hay folding.`,
    tags: ['Power Query', 'ETL', 'M'],
    pinned: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-3',
    title: 'Ideas para el Dashboard Bento: Integraciones y Webhooks',
    content: `Próximos agentes a conectar vía \`/api/ingest/task\`:\n- Bot de Telegram para capturar notas de voz transcribiendo a tareas.\n- Script de GitHub Actions que registre commits como notas de bitácora diaria.`,
    tags: ['Productividad', 'Arquitectura', 'Ideas'],
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_PROGRESS: Record<string, CourseProgress> = {
  'power-bi': {
    courseId: 'power-bi',
    completedLessons: [
      '01-fundamentos-power-bi',
      '02-power-query-etl',
      '03-modelado-estrella-relaciones',
    ],
    lastLessonSlug: '04-introduccion-dax-calculadas-medidas',
    updatedAt: new Date().toISOString(),
  },
};

// Database Adapter Interface
export const db = {
  // TASKS
  getTasks: async (): Promise<Task[]> => {
    return readJsonFile<Task[]>(TASKS_FILE, INITIAL_TASKS);
  },

  getTaskById: async (id: string): Promise<Task | null> => {
    const tasks = readJsonFile<Task[]>(TASKS_FILE, INITIAL_TASKS);
    return tasks.find((t) => t.id === id) || null;
  },

  createTask: async (data: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    category?: string;
  }): Promise<Task> => {
    const tasks = readJsonFile<Task[]>(TASKS_FILE, INITIAL_TASKS);
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: data.title,
      description: data.description || '',
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      category: data.category || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    writeJsonFile(TASKS_FILE, tasks);
    return newTask;
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task | null> => {
    const tasks = readJsonFile<Task[]>(TASKS_FILE, INITIAL_TASKS);
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(TASKS_FILE, tasks);
    return tasks[index];
  },

  deleteTask: async (id: string): Promise<boolean> => {
    const tasks = readJsonFile<Task[]>(TASKS_FILE, INITIAL_TASKS);
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;
    writeJsonFile(TASKS_FILE, filtered);
    return true;
  },

  // NOTES
  getNotes: async (): Promise<Note[]> => {
    return readJsonFile<Note[]>(NOTES_FILE, INITIAL_NOTES);
  },

  getNoteById: async (id: string): Promise<Note | null> => {
    const notes = readJsonFile<Note[]>(NOTES_FILE, INITIAL_NOTES);
    return notes.find((n) => n.id === id) || null;
  },

  createNote: async (data: {
    title: string;
    content: string;
    tags?: string[];
    pinned?: boolean;
  }): Promise<Note> => {
    const notes = readJsonFile<Note[]>(NOTES_FILE, INITIAL_NOTES);
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      pinned: data.pinned ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
    writeJsonFile(NOTES_FILE, notes);
    return newNote;
  },

  updateNote: async (id: string, updates: Partial<Note>): Promise<Note | null> => {
    const notes = readJsonFile<Note[]>(NOTES_FILE, INITIAL_NOTES);
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) return null;

    notes[index] = {
      ...notes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(NOTES_FILE, notes);
    return notes[index];
  },

  deleteNote: async (id: string): Promise<boolean> => {
    const notes = readJsonFile<Note[]>(NOTES_FILE, INITIAL_NOTES);
    const filtered = notes.filter((n) => n.id !== id);
    if (filtered.length === notes.length) return false;
    writeJsonFile(NOTES_FILE, filtered);
    return true;
  },

  // COURSE PROGRESS
  getCourseProgress: async (courseId: string): Promise<CourseProgress> => {
    const allProgress = readJsonFile<Record<string, CourseProgress>>(PROGRESS_FILE, INITIAL_PROGRESS);
    if (!allProgress[courseId]) {
      allProgress[courseId] = {
        courseId,
        completedLessons: [],
        lastLessonSlug: undefined,
        updatedAt: new Date().toISOString(),
      };
      writeJsonFile(PROGRESS_FILE, allProgress);
    }
    return allProgress[courseId];
  },

  getAllCourseProgress: async (): Promise<Record<string, CourseProgress>> => {
    return readJsonFile<Record<string, CourseProgress>>(PROGRESS_FILE, INITIAL_PROGRESS);
  },

  toggleLessonCompletion: async (
    courseId: string,
    lessonSlug: string,
    completed?: boolean
  ): Promise<CourseProgress> => {
    const allProgress = readJsonFile<Record<string, CourseProgress>>(PROGRESS_FILE, INITIAL_PROGRESS);
    const current = allProgress[courseId] || {
      courseId,
      completedLessons: [],
      lastLessonSlug: lessonSlug,
      updatedAt: new Date().toISOString(),
    };

    const isCurrentlyCompleted = current.completedLessons.includes(lessonSlug);
    const shouldBeCompleted = completed !== undefined ? completed : !isCurrentlyCompleted;

    if (shouldBeCompleted && !isCurrentlyCompleted) {
      current.completedLessons.push(lessonSlug);
    } else if (!shouldBeCompleted && isCurrentlyCompleted) {
      current.completedLessons = current.completedLessons.filter((s) => s !== lessonSlug);
    }

    current.lastLessonSlug = lessonSlug;
    current.updatedAt = new Date().toISOString();
    allProgress[courseId] = current;
    writeJsonFile(PROGRESS_FILE, allProgress);
    return current;
  },

  setLastVisitedLesson: async (courseId: string, lessonSlug: string): Promise<CourseProgress> => {
    const allProgress = readJsonFile<Record<string, CourseProgress>>(PROGRESS_FILE, INITIAL_PROGRESS);
    const current = allProgress[courseId] || {
      courseId,
      completedLessons: [],
      lastLessonSlug: lessonSlug,
      updatedAt: new Date().toISOString(),
    };
    current.lastLessonSlug = lessonSlug;
    current.updatedAt = new Date().toISOString();
    allProgress[courseId] = current;
    writeJsonFile(PROGRESS_FILE, allProgress);
    return current;
  },
};
