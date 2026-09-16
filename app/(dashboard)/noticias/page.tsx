'use client';

import { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Newspaper,
  Search,
  ExternalLink,
  Calendar,
  Trash2,
  X,
  Copy,
  Check,
  Flame,
  ChevronDown,
  ChevronsUpDown,
  Sparkles,
  BookOpen,
  Share2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NewsArticle } from '@/types';

export default function NoticiasPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setArticles(data);
      }
    } catch (e) {
      console.error('Error fetching news:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Reset pagination when searching or changing categories
  useEffect(() => {
    setVisibleCount(10);
  }, [search, selectedCategory]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const categories: string[] = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ['all', ...Array.from(set)];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        search === '' ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.summary?.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase()) ||
        a.source?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' ||
        a.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [articles, search, selectedCategory]);

  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, visibleCount);
  }, [filteredArticles, visibleCount]);

  const toggleAll = () => {
    if (expandedIds.size === displayedArticles.length && displayedArticles.length > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(displayedArticles.map((a) => a.id)));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Deseas eliminar este artículo de noticias?')) return;
    try {
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handleCopy = (id: string, content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `Hoy ${timeStr} hs`;
      }
      const dateStr = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
      return `${dateStr} · ${timeStr} hs`;
    } catch {
      return '';
    }
  };

  const getCategoryColor = (category?: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('tec') || cat.includes('hard') || cat.includes('ai')) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
    if (cat.includes('ciber') || cat.includes('segur') || cat.includes('cloud') || cat.includes('dev')) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
    if (cat.includes('eco') || cat.includes('finan') || cat.includes('dólar')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (cat.includes('arg') || cat.includes('polít')) {
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    }
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  };

  const allExpanded =
    displayedArticles.length > 0 && expandedIds.size === displayedArticles.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Noticias & Briefings Ejecutivos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Toca cualquier título para desplegar el análisis completo y recursos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            disabled={displayedArticles.length === 0}
            className="rounded-xl text-xs gap-1.5 h-9 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            <span>{allExpanded ? 'Colapsar Todo' : 'Expandir Todo'}</span>
          </Button>

          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700/60">
            {filteredArticles.length > 0
              ? `Mostrando ${Math.min(visibleCount, filteredArticles.length)} de ${filteredArticles.length}`
              : '0 noticias'}
          </span>
        </div>
      </div>

      {/* Buscador y Categorías */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, contenido o fuente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categorías Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'all'
                ? articles.length
                : articles.filter((a) => a.category?.toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat === 'all' ? 'Todas' : cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Noticias Expandibles */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 space-y-2">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Cargando noticias...</p>
        </div>
      ) : displayedArticles.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/40 p-8 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No se encontraron artículos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {search || selectedCategory !== 'all'
              ? 'Prueba cambiando los filtros o el término de búsqueda.'
              : 'Las noticias se sincronizan automáticamente según el cronograma programado en tu servidor.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedArticles.map((article) => {
            const isExpanded = expandedIds.has(article.id);
            const categoryClass = getCategoryColor(article.category);

            return (
              <div
                key={article.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-white dark:bg-slate-900 border-amber-500/40 dark:border-amber-500/40 shadow-sm'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                {/* Header de la Noticia: SOLO TÍTULO Y METADATOS COMPACTOS (Click para expandir) */}
                <div
                  onClick={() => toggleExpand(article.id)}
                  className="p-3.5 sm:p-4 cursor-pointer select-none flex items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
                    {/* Metadatos superiores */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      {article.category && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${categoryClass}`}
                        >
                          {article.category}
                        </span>
                      )}

                      {article.source && (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {article.source}
                        </span>
                      )}

                      <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(
                          article.fetchedAt || article.publishedAt || article.createdAt
                        )}
                      </span>

                      {article.important && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded">
                          <Flame className="w-2.5 h-2.5" /> Destacada
                        </span>
                      )}
                    </div>

                    {/* TÍTULO ELEGANTE */}
                    <h3
                      className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug break-words ${
                        isExpanded ? 'text-amber-600 dark:text-amber-400' : ''
                      }`}
                    >
                      {article.title}
                    </h3>
                  </div>

                  {/* Indicador de Despliegue (Chevron rotatorio) */}
                  <div className="flex items-center gap-1 flex-shrink-0 pt-1 sm:pt-0">
                    <button
                      type="button"
                      className={`p-2 rounded-xl text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-amber-500' : ''
                      }`}
                      aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CONTENIDO EXPANDIDO (Se muestra al hacer click) */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in-50 duration-200">
                    {/* Bajada / Resumen Destacado */}
                    {article.summary && (
                      <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border-l-4 border-amber-500 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                        {article.summary}
                      </div>
                    )}

                    {/* Contenido Completo en Markdown */}
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h2: ({ children }) => (
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1 border-b border-slate-200/60 dark:border-slate-800 pb-1">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5 mb-1">
                              {children}
                            </h3>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 my-2">
                              {children}
                            </ul>
                          ),
                          p: ({ children }) => (
                            <p className="my-1.5 leading-relaxed">{children}</p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-slate-900 dark:text-white">
                              {children}
                            </strong>
                          ),
                        }}
                      >
                        {article.content}
                      </ReactMarkdown>
                    </div>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Barra de Acciones al pie del artículo */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Fuente original</span>
                          </a>
                        )}

                        <button
                          onClick={(e) => handleCopy(article.id, article.content, e)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors"
                        >
                          {copiedId === article.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar texto</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDelete(article.id, e)}
                          className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Eliminar noticia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>

                        <button
                          onClick={() => toggleExpand(article.id)}
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
                        >
                          Colapsar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Botón de Cargar Más Noticias */}
          {visibleCount < filteredArticles.length && (
            <div className="pt-6 pb-2 text-center flex flex-col items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="rounded-2xl px-6 py-2.5 border-amber-500/30 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold text-xs shadow-xs gap-2 transition-all h-10"
              >
                <ChevronDown className="w-4 h-4" />
                <span>Cargar más noticias (+10)</span>
              </Button>
              <p className="text-[11px] text-slate-400 font-mono">
                Quedan {filteredArticles.length - visibleCount} noticias más en el historial
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
