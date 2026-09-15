'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Newspaper,
  Search,
  ExternalLink,
  BookOpen,
  Calendar,
  Tag,
  Trash2,
  X,
  Share2,
  Check,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewsArticle } from '@/types';

export default function NoticiasPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Deseas eliminar este artículo de noticias?')) return;
    try {
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        if (activeArticle?.id === id) setActiveArticle(null);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = ['all', ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))];

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary?.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.source?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || a.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

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
      return `${dateStr} • ${timeStr} hs`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-amber-500" />
            Noticias & Artículos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Artículos completos y noticias curadas por agentes externos
          </p>
        </div>

        <Badge variant="outline" className="px-3 py-1 text-xs self-start sm:self-auto font-mono">
          {articles.length} artículos disponibles
        </Badge>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar noticias o contenido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/70 dark:bg-slate-900/70"
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

        {/* Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat as string)}
              className="text-xs h-8 capitalize rounded-lg whitespace-nowrap"
            >
              {cat === 'all' ? 'Todas' : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Noticias */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          <Newspaper className="w-8 h-8 animate-pulse mx-auto mb-2 text-slate-300 dark:text-slate-700" />
          Cargando feed de noticias...
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/40 p-8">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No se encontraron artículos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            {search || selectedCategory !== 'all'
              ? 'Prueba cambiando los filtros o el término de búsqueda.'
              : 'Puedes inyectar artículos completos desde tu servidor con POST /api/personal/news.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              onClick={() => setActiveArticle(article)}
              className="group cursor-pointer hover:border-amber-500/50 dark:hover:border-amber-500/40 hover:shadow-md transition-all flex flex-col justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {article.category && (
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {article.category}
                      </Badge>
                    )}
                    {article.important && (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] border-0 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" /> Destacado
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(article.fetchedAt || article.publishedAt || article.createdAt)}
                  </span>
                </div>

                <CardTitle className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </CardTitle>

                {article.source && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Fuente: <span className="text-slate-700 dark:text-slate-300">{article.source}</span>
                  </p>
                )}
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {article.summary || article.content.slice(0, 160).replace(/[#*`]/g, '') + '...'}
                </p>

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Leer Artículo <ArrowRight className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Ver fuente original"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => handleDelete(article.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Eliminar artículo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Lector de Artículo Completo */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {activeArticle.category && (
                    <Badge variant="outline" className="text-xs uppercase">
                      {activeArticle.category}
                    </Badge>
                  )}
                  {activeArticle.source && (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {activeArticle.source}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    • {formatDateTime(activeArticle.fetchedAt || activeArticle.publishedAt || activeArticle.createdAt)}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {activeArticle.title}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(activeArticle.content)}
                  className="h-8 px-2 text-xs flex items-center gap-1"
                  title="Copiar contenido"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
                </Button>

                {activeArticle.url && (
                  <a href={activeArticle.url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Fuente</span>
                    </Button>
                  </a>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveArticle(null)}
                  className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Contenido Markdown del Artículo */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4">
              {activeArticle.summary && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                  <strong>Resumen ejecutivo:</strong> {activeArticle.summary}
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeArticle.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1">
                {activeArticle.tags?.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[11px]">
                    #{t}
                  </span>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveArticle(null)}
                className="text-xs h-7"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
