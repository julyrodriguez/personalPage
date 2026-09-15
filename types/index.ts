export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD or ISO string
  priority: TaskPriority;
  status: TaskStatus;
  category: string; // e.g. 'Estudio', 'Desarrollo', 'Personal', etc.
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonMeta {
  courseId: string;
  lessonSlug: string;
  title: string;
  week: number;
  day: string;
  order: number;
  durationMinutes?: number;
  tags?: string[];
  summary?: string;
}

export interface Lesson extends LessonMeta {
  content: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  estimatedHours: number;
  tags: string[];
  lessonsCount?: number;
  completedCount?: number;
  progressPercentage?: number;
  lessons?: LessonMeta[];
}

export interface CourseProgress {
  courseId: string;
  completedLessons: string[]; // array of lessonSlugs
  lastLessonSlug?: string;
  updatedAt: string;
}

export interface DailyWeather {
  date: string;
  minTemp: number;
  maxTemp: number;
  weatherCode: number;
  weatherDescription: string;
  precipitationProbability?: number;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeed: number;
  humidity: number;
  isDay: boolean;
  city: string;
  time: string;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyWeather[];
  cachedAt?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string; // Artículo completo en Markdown
  summary?: string;
  source?: string;
  url?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  important?: boolean;
  fetchedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalonAppointment {
  id: string;
  clientNameSnapshot: string;
  clientId?: string;
  dayKey: string; // YYYY-MM-DD
  startAt: string;
  amount: number;
  paid: boolean;
  description?: string;
  canceled?: boolean;
}
