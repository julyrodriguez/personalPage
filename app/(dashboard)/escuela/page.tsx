'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  School,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Code,
  Award,
  ArrowRight,
  RefreshCw,
  Search,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Clock,
  Laptop,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EscuelaCourseItem } from '@/types';

export default function EscuelaPage() {
  const [courses, setCourses] = useState<EscuelaCourseItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const parseJsonSafe = async (res: Response) => {
    try {
      const text = await res.text();
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, statsRes] = await Promise.all([
        fetch('/api/escuela/courses', { cache: 'no-store' }),
        fetch('/api/escuela/stats', { cache: 'no-store' }),
      ]);

      if (coursesRes.ok) {
        const cData = await parseJsonSafe(coursesRes);
        if (cData && cData.success && Array.isArray(cData.data)) {
          setCourses(cData.data);
        }
      }

      if (statsRes.ok) {
        const sData = await parseJsonSafe(statsRes);
        if (sData && sData.success && sData.data) {
          setStats(sData.data);
        }
      }
    } catch (e) {
      console.error('Error fetching escuela data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage('Conectando con Alumni Education e iniciando sincronización...');
      const res = await fetch('/api/escuela/sync', { method: 'POST' });
      const data = await parseJsonSafe(res);

      if (data && data.success) {
        setSyncMessage(data.message || 'Sincronización en curso en segundo plano...');
        
        // Sondeo cada 3 segundos para ir refrescando la lista a medida que se generan clases
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          await fetchData();
          if (attempts >= 4) {
            clearInterval(interval);
            setSyncing(false);
            setSyncMessage('¡Sincronización completada! Los cursos y clases están actualizados.');
            setTimeout(() => setSyncMessage(null), 6000);
          }
        }, 3000);
      } else {
        setSyncMessage(`Aviso: ${data?.error || 'No se pudo iniciar la sincronización'}`);
        setSyncing(false);
      }
    } catch (err: any) {
      setSyncMessage(`Error: ${err.message}`);
      setSyncing(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ['all', ...Array.from(set)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        search === '' ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.courseId.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' ||
        c.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [courses, search, selectedCategory]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Campus IT & Alumni 24h
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Generado con Google Gemini AI
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <School className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Escuela
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Tus cursos de Alumni Education sincronizados cada 24 horas. Extracción automática de
            diapositivas, desafíos y laboratorios estructurados en clases diarias con checkpoints interactivos.
          </p>
        </div>

        {/* Sync Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl gap-2 font-semibold shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-blue-500 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
          </Button>
        </div>
      </div>

      {/* Sync Status Banner if active */}
      {syncMessage && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm flex items-center justify-between animate-in fade-in duration-300">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            {syncMessage}
          </span>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Global Metrics Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cursos Activos</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats?.coursesCount ?? courses.length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Clases Generadas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats?.classesCount ?? 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Clases Leídas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats?.readCount ?? 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Prácticas Hechas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats?.practiceCount ?? 0}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por curso, IA, Python, N8N..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'Todos los Cursos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm">Cargando catálogo de Escuela...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          <School className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No se encontraron cursos</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'Intenta con otro término de búsqueda.' : 'Haz clic en "Sincronizar ahora" para extraer tus cursos de Alumni Education.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const pct = course.progressPercentage || 0;
            return (
              <Card
                key={course.courseId}
                className="flex flex-col justify-between border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs hover:shadow-md transition-all group overflow-hidden rounded-3xl"
              >
                <div>
                  {/* Card Header Banner */}
                  <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-transparent">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                        {course.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {course.isPending ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10">
                            Anticipado
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                            Oficial
                          </span>
                        )}
                        <Badge variant="warning" className="text-[10px] gap-1 font-semibold">
                          <Award className="w-3 h-3" />
                          Nivel {course.level || 1}
                        </Badge>
                      </div>
                    </div>

                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {course.title}
                    </CardTitle>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Card Content & Stats */}
                  <CardContent className="p-6 pt-4 space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          Progreso de lectura
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">
                          <strong className="text-slate-900 dark:text-white font-semibold">
                            {course.readCount || 0}
                          </strong>{' '}
                          / {course.totalClasses || 0} leídas
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                        <Code className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">
                          <strong className="text-slate-900 dark:text-white font-semibold">
                            {course.practiceCount || 0}
                          </strong>{' '}
                          prácticas
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <Link href={`/escuela/${course.courseId}`} className="w-full block">
                    <Button
                      variant="default"
                      className="w-full justify-between rounded-xl text-xs font-semibold group-hover:bg-blue-600 cursor-pointer"
                    >
                      <span>Ver Temario & Clases</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
