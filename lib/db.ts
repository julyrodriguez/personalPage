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

// Initial Clean Data (Empty by default)
const INITIAL_TASKS: Task[] = [];
const INITIAL_NOTES: Note[] = [];
const INITIAL_PROGRESS: Record<string, CourseProgress> = {};

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
