'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Square,
  Plus,
  ArrowRight,
  Filter,
  Flame,
  Calendar,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task, TaskPriority, TaskStatus } from '@/types';
import confetti from 'canvas-confetti';

type TabType = 'today' | 'upcoming' | 'completed';

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
          particleCount: 35,
          spread: 50,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore
      }
    }

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (e) {
      console.error('Error updating task:', e);
      fetchTasks(); // rollback on error
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

  // Categorize tasks
  const categorizedTasks = tasks.filter((t) => {
    // Priority filter
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

  const getPriorityBadge = (p: TaskPriority) => {
    if (p === 'high') {
      return (
        <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
          <Flame className="w-2.5 h-2.5" /> Alta
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
          Media
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-500/10 px-1.5 py-0.5 rounded">
        Baja
      </span>
    );
  };

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-sm flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Daily Focus & Agenda</CardTitle>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {tasks.filter((t) => t.status !== 'completed').length} tareas pendientes
              </p>
            </div>
          </div>

          <Link
            href="/tareas"
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Kanban Completo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Tab Selection & Filter */}
        <div className="flex items-center justify-between pt-3 gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'today'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Próximas
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Completadas
            </button>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-[11px] bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Prioridad: Todas</option>
            <option value="high">Solo Alta</option>
            <option value="medium">Solo Media</option>
            <option value="low">Solo Baja</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-between space-y-3">
        {/* Task List */}
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Cargando agenda...
            </div>
          ) : categorizedTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay tareas en esta sección.
            </div>
          ) : (
            categorizedTasks.map((t) => {
              const isDone = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  className={`group flex items-start gap-2.5 p-2.5 rounded-xl border transition-all duration-200 ${
                    isDone
                      ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/40 dark:border-slate-800/40 opacity-60'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 shadow-xs'
                  }`}
                >
                  <button
                    onClick={() => toggleTaskStatus(t)}
                    className="mt-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    aria-label={isDone ? 'Desmarcar tarea' : 'Completar tarea'}
                  >
                    {isDone ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium leading-snug break-words ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {t.title}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {getPriorityBadge(t.priority)}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" /> {t.category}
                      </span>
                      {t.dueDate && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" /> {t.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleQuickAdd} className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="Añadir tarea rápida..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 h-8 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="h-8 px-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="Estudio">Estudio</option>
            <option value="Desarrollo">Desarrollo</option>
            <option value="Personal">Personal</option>
          </select>
          <Button
            type="submit"
            size="sm"
            disabled={isAdding || !newTitle.trim()}
            className="h-8 px-3 rounded-xl text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
