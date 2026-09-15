import fs from 'fs';
import path from 'path';
import { Task, Note, CourseProgress, TaskPriority, TaskStatus, NewsArticle } from '@/types';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), 'data');

const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');

function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // Ignore read-only FS errors
  }
}

function readJsonFile<T>(filePath: string, defaultData: T): T {
  ensureDataDirectory();
  try {
    if (!fs.existsSync(filePath)) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      } catch {
        // Ignore read-only FS write error
      }
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Error reading ${filePath}, using fallback:`, error);
    return defaultData;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDataDirectory();
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.warn(`Could not write to ${filePath} (e.g. read-only filesystem):`, error);
  }
}

// Initial Clean Data (Empty by default)
const INITIAL_TASKS: Task[] = [];
const INITIAL_NOTES: Note[] = [];
const INITIAL_PROGRESS: Record<string, CourseProgress> = {};
const INITIAL_NEWS: NewsArticle[] = [];

const BACKEND_TASKS_URL = process.env.DATA_PROCESSOR_URL
  ? `${process.env.DATA_PROCESSOR_URL}/api/personal/tasks`
  : 'https://apivacas.jariel.com.ar/api/personal/tasks';

// Database Adapter Interface
export const db = {
  // TASKS (Persistidas en MongoDB a través del backend en VPS)
  getTasks: async (): Promise<Task[]> => {
    try {
      const res = await fetch(BACKEND_TASKS_URL, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const tasks = await res.json();
        if (Array.isArray(tasks)) {
          writeJsonFile(TASKS_FILE, tasks);
          return tasks;
        }
      }
    } catch (err) {
      console.warn('⚠️ [db.ts] Backend MongoDB no disponible para getTasks, usando caché local:', err);
    }
    return readJsonFile<Task[]>(TASKS_FILE, INITIAL_TASKS);
  },

  getTaskById: async (id: string): Promise<Task | null> => {
    const tasks = await db.getTasks();
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
    try {
      const res = await fetch(BACKEND_TASKS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        const createdTask = result.data?.task || result.task || result;
        if (createdTask && createdTask.id) {
          const tasks = readJsonFile<Task[]>(TASKS_FILE, INITIAL_TASKS);
          tasks.unshift(createdTask);
          writeJsonFile(TASKS_FILE, tasks);
          return createdTask;
        }
      }
    } catch (err) {
      console.warn('⚠️ [db.ts] Backend MongoDB no disponible para createTask, guardando local:', err);
    }

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
    try {
      const res = await fetch(`${BACKEND_TASKS_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        const tasks = readJsonFile<Task[]>(TASKS_FILE, INITIAL_TASKS);
        const index = tasks.findIndex((t) => t.id === id);
        if (index !== -1) {
          tasks[index] = { ...tasks[index], ...updated };
          writeJsonFile(TASKS_FILE, tasks);
        }
        return updated;
      }
    } catch (err) {
      console.warn('⚠️ [db.ts] Backend MongoDB no disponible para updateTask, usando local:', err);
    }

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
    try {
      const res = await fetch(`${BACKEND_TASKS_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const tasks = readJsonFile<Task[]>(TASKS_FILE, INITIAL_TASKS);
        const filtered = tasks.filter((t) => t.id !== id);
        writeJsonFile(TASKS_FILE, filtered);
        return true;
      }
    } catch (err) {
      console.warn('⚠️ [db.ts] Backend MongoDB no disponible para deleteTask, usando local:', err);
    }

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

  // NEWS ARTICLES (Retención automática de 7 días / 1 semana)
  getNews: async (category?: string): Promise<NewsArticle[]> => {
    const rawArticles = readJsonFile<NewsArticle[]>(NEWS_FILE, INITIAL_NEWS);
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - SEVEN_DAYS_MS;

    const valid = rawArticles.filter((a) => {
      const time = new Date(a.fetchedAt || a.publishedAt || a.createdAt).getTime();
      return !isNaN(time) && time >= cutoff;
    });

    if (valid.length !== rawArticles.length) {
      writeJsonFile(NEWS_FILE, valid);
    }

    if (category) {
      return valid.filter((a) => a.category?.toLowerCase() === category.toLowerCase());
    }
    return valid;
  },

  getNewsById: async (id: string): Promise<NewsArticle | null> => {
    const articles = readJsonFile<NewsArticle[]>(NEWS_FILE, INITIAL_NEWS);
    return articles.find((a) => a.id === id) || null;
  },

  createNews: async (data: {
    title: string;
    content: string;
    summary?: string;
    source?: string;
    url?: string;
    imageUrl?: string;
    category?: string;
    tags?: string[];
    important?: boolean;
    fetchedAt?: string;
    publishedAt?: string;
  }): Promise<NewsArticle> => {
    const rawArticles = readJsonFile<NewsArticle[]>(NEWS_FILE, INITIAL_NEWS);
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - SEVEN_DAYS_MS;

    const valid = rawArticles.filter((a) => {
      const time = new Date(a.fetchedAt || a.publishedAt || a.createdAt).getTime();
      return !isNaN(time) && time >= cutoff;
    });

    const nowIso = new Date().toISOString();
    const newArticle: NewsArticle = {
      id: `news-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: data.title,
      content: data.content,
      summary: data.summary || '',
      source: data.source || 'Agente AI',
      url: data.url || '',
      imageUrl: data.imageUrl || '',
      category: data.category || 'General',
      tags: data.tags || [],
      important: data.important ?? true,
      fetchedAt: data.fetchedAt || nowIso,
      publishedAt: data.publishedAt || nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    valid.unshift(newArticle);
    writeJsonFile(NEWS_FILE, valid);
    return newArticle;
  },

  deleteNews: async (id: string): Promise<boolean> => {
    const articles = readJsonFile<NewsArticle[]>(NEWS_FILE, INITIAL_NEWS);
    const filtered = articles.filter((a) => a.id !== id);
    if (filtered.length === articles.length) return false;
    writeJsonFile(NEWS_FILE, filtered);
    return true;
  },
};
