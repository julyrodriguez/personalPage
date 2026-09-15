'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Check,
  Plus,
  ArrowRight,
  Flame,
  Calendar,
  Sparkles,
  Trash2,
  ListTodo,
  CheckCircle2,
  Clock,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task, TaskPriority, TaskStatus } from '@/types';
import confetti from 'canvas-confetti';

type TabType = 'today' | 'upcoming' | 'completed';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Estudio: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
  },
  Desarrollo: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
  Personal: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  Finanzas: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
  },
};

export function TaskWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Estudio');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const json = await res.json();
        setTasks(json);
      }
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    if (nextStatus === 'completed') {
      try {
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.75 },
          colors: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b'],
        });
      } catch {}
    }

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (e) {
      console.error('Error updating task:', e);
      fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch {
      fetchTasks();
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          priority: 'medium',
          dueDate: new Date().toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        setNewTitle('');
      }
    } catch (e) {
      console.error('Error creating task:', e);
    } finally {
      setIsAdding(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Counters
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed' && (!t.dueDate || t.dueDate <= todayStr)),
    [tasks, todayStr]
  );
  const upcomingTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed' && t.dueDate && t.dueDate > todayStr),
    [tasks, todayStr]
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'completed'),
    [tasks]
  );

  // Total for today completion progress
  const totalTodayAndDone = useMemo(() => {
    const todayTotal = tasks.filter((t) => !t.dueDate || t.dueDate <= todayStr);
    const doneToday = todayTotal.filter((t) => t.status === 'completed');
    const percent = todayTotal.length > 0 ? Math.round((doneToday.length / todayTotal.length) * 100) : 0;
    return { total: todayTotal.length, done: doneToday.length, percent };
  }, [tasks, todayStr]);

  // Filtered tasks by tab and priority
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      if (activeTab === 'completed') {
        return t.status === 'completed';
      }

      if (t.status === 'completed') return false;

      if (activeTab === 'today') {
        return !t.dueDate || t.dueDate <= todayStr;
      }

      if (activeTab === 'upcoming') {
        return t.dueDate && t.dueDate > todayStr;
      }

      return true;
    });
  }, [tasks, priorityFilter, activeTab, todayStr]);

  const getPriorityBadge = (p: TaskPriority) => {
    if (p === 'high') {
      return (
        <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
          <Flame className="w-2.5 h-2.5 text-rose-500 fill-rose-500/20" /> Alta
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md shrink-0">
          Media
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-500/10 border border-slate-500/20 px-1.5 py-0.5 rounded-md shrink-0">
        Baja
      </span>
    );
  };

  const getCategoryStyle = (cat: string) => {
    return (
      CATEGORY_COLORS[cat] || {
        bg: 'bg-slate-500/10 dark:bg-slate-500/15',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-500/20',
      }
    );
  };

  return (
    <Card className="border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-sm rounded-2xl flex flex-col overflow-hidden relative group/card">
      {/* Decorative subtle background gradient */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Widget Header */}
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Daily Focus & Tareas
                </CardTitle>
                {todayTasks.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {todayTasks.length} {todayTasks.length === 1 ? 'pendiente hoy' : 'pendientes hoy'}
              </p>
            </div>
          </div>

          <Link
            href="/tareas"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 group/link transition-colors"
          >
            <span>Kanban</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>

        {/* Daily Progress Bar */}
        {totalTodayAndDone.total > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1.5">
              <span>Progreso de hoy</span>
              <strong className="text-slate-700 dark:text-slate-200">
                {totalTodayAndDone.done}/{totalTodayAndDone.total} ({totalTodayAndDone.percent}%)
              </strong>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
                style={{ width: `${Math.min(100, Math.max(4, totalTodayAndDone.percent))}%` }}
              />
            </div>
          </div>
        )}

        {/* Tab Selection & Filter */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-1">
          {/* Segmented Control */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs flex-1">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all text-[11px] flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Hoy</span>
              {todayTasks.length > 0 && (
                <span className="text-[10px] px-1.5 py-0 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                  {todayTasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all text-[11px] flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Próximas</span>
              {upcomingTasks.length > 0 && (
                <span className="text-[10px] px-1.5 py-0 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold">
                  {upcomingTasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all text-[11px] flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Hechas</span>
              {completedTasks.length > 0 && (
                <span className="text-[10px] px-1.5 py-0 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  {completedTasks.length}
                </span>
              )}
            </button>
          </div>

          {/* Priority filter */}
          <div className="relative shrink-0">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 rounded-xl pl-2.5 pr-6 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer border border-transparent focus:border-blue-500/40"
            >
              <option value="all">Todas</option>
              <option value="high">🔥 Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </CardHeader>

      {/* Task List */}
      <CardContent className="p-4 pt-3 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2 max-h-[270px] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400 animate-pulse flex flex-col items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500 animate-spin" />
              <span>Cargando tareas...</span>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                {activeTab === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {activeTab === 'today'
                  ? '¡Estás al día por hoy!'
                  : activeTab === 'upcoming'
                  ? 'No hay tareas programadas para los próximos días.'
                  : 'Aún no completaste tareas hoy.'}
              </p>
              <p className="text-[11px] text-slate-400">
                {activeTab === 'today' && 'Agrega una nueva tarea rápida abajo.'}
              </p>
            </div>
          ) : (
            visibleTasks.map((t) => {
              const isDone = t.status === 'completed';
              const catStyle = getCategoryStyle(t.category);
              const isDueToday = t.dueDate === todayStr;

              return (
                <div
                  key={t.id}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    isDone
                      ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-blue-500/40 hover:shadow-xs hover:translate-x-0.5'
                  }`}
                >
                  {/* Interactive Custom Circular Checkbox */}
                  <button
                    onClick={() => toggleTaskStatus(t)}
                    className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer ${
                      isDone
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-sm shadow-emerald-500/20'
                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 group-hover:scale-105'
                    }`}
                    aria-label={isDone ? 'Desmarcar tarea' : 'Completar tarea'}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <p
                      className={`text-xs font-semibold leading-snug break-words transition-all ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {t.title}
                    </p>

                    {/* Meta Badges */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px]">
                      {/* Priority Badge */}
                      {getPriorityBadge(t.priority)}

                      {/* Category Badge */}
                      <span
                        className={`px-1.5 py-0.5 rounded-md font-medium border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                      >
                        {t.category}
                      </span>

                      {/* Due date */}
                      {t.dueDate && (
                        <span
                          className={`flex items-center gap-1 font-mono ${
                            isDueToday
                              ? 'text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-slate-400'
                          }`}
                        >
                          <Calendar className="w-2.5 h-2.5" />
                          {isDueToday ? 'Hoy' : t.dueDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Delete Button on Hover */}
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all absolute right-2 top-2 cursor-pointer"
                    title="Eliminar tarea"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Add Bar */}
        <form
          onSubmit={handleQuickAdd}
          className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Nueva tarea rápida... (presiona Enter)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full h-9 pl-3 pr-24 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />

            {/* Quick Category Selector */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="h-6 text-[10px] font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg px-2 focus:outline-none cursor-pointer"
              >
                <option value="Estudio">Estudio</option>
                <option value="Desarrollo">Desarrollo</option>
                <option value="Personal">Personal</option>
                <option value="Finanzas">Finanzas</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isAdding || !newTitle.trim()}
            className="h-9 w-9 p-0 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer"
            title="Agregar tarea"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
