'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Newspaper,
  Flame,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Calendar,
  X,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NewsArticle } from '@/types';

export function NewsCoverWidget() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/news')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setArticles(data);
      })
      .catch((e) => console.warn('Error loading cover news:', e))
      .finally(() => setLoading(false));
  }, []);

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

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const heroArticle = articles[0] || null;
  const secondaryArticles = articles.slice(1, 3);

  return (
    <>
      <div className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Portada & Noticias Destacadas
              </h2>
            </div>
          </div>

          <Link
            href="/noticias"
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            Ver Todas las Noticias ({articles.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Editorial Frontpage Grid */}
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <Newspaper className="w-6 h-6 animate-pulse mx-auto mb-2 opacity-50" />
            Cargando portada de noticias...
          </div>
        ) : !heroArticle ? (
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-white to-amber-50/20 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-amber-950/20 p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10">
                  <Sparkles className="w-3 h-3" /> Portada Lista
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tu muro de noticias está listo para recibir artículos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                  Tus agentes de IA pueden enviar resúmenes o artículos completos a tu servidor Express en{' '}
                  <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">
                    POST /api/personal/news
                  </code>
                </p>
              </div>

              <Link href="/noticias">
                <Button variant="outline" size="sm" className="text-xs rounded-xl h-8">
                  Abrir Sección Noticias
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Artículo Principal / Portada Hero (2 columnas) */}
            <Card
              onClick={() => setActiveArticle(heroArticle)}
              className="lg:col-span-2 group cursor-pointer border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-white via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <CardContent className="p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500 text-white dark:bg-amber-600 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                      <Flame className="w-3 h-3 mr-1" /> Portada
                    </Badge>
                    {heroArticle.category && (
                      <Badge variant="outline" className="text-[10px] uppercase font-medium">
                        {heroArticle.category}
                      </Badge>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(heroArticle.fetchedAt || heroArticle.publishedAt || heroArticle.createdAt)}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                    {heroArticle.title}
                  </h3>
                  {heroArticle.source && (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Fuente: <span className="text-slate-800 dark:text-slate-200">{heroArticle.source}</span>
                    </p>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {heroArticle.summary || heroArticle.content.slice(0, 200).replace(/[#*`]/g, '') + '...'}
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    Leer Artículo Completo <ArrowRight className="w-4 h-4" />
                  </span>

                  {heroArticle.url && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(heroArticle.url, '_blank');
                      }}
                      className="text-xs text-slate-400 hover:text-blue-500 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Enlace original
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Artículos Secundarios (1 columna) */}
            <div className="space-y-3 flex flex-col justify-between">
              {secondaryArticles.length > 0 ? (
                secondaryArticles.map((art) => (
                  <Card
                    key={art.id}
                    onClick={() => setActiveArticle(art)}
                    className="group cursor-pointer border-slate-200/80 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-amber-500/50 bg-white/80 dark:bg-slate-900/80 hover:shadow-xs transition-all flex-1 flex flex-col justify-between"
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-amber-600 dark:text-amber-400 uppercase text-[10px]">
                          {art.category || 'Noticia'}
                        </span>
                        <span className="font-mono">{formatDateTime(art.fetchedAt || art.publishedAt || art.createdAt)}</span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                        {art.title}
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {art.summary || art.content.slice(0, 100).replace(/[#*`]/g, '')}
                      </p>

                      <div className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-1 pt-1">
                        Leer nota <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-5 rounded-2xl text-center flex-1 flex flex-col items-center justify-center">
                  <BookOpen className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="text-xs font-medium text-slate-500">Más artículos aparecerán aquí</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

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
                <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {activeArticle.title}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(activeArticle.content)}
                  className="h-8 px-2 text-xs flex items-center gap-1"
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

            {/* Contenido Markdown */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4">
              {activeArticle.summary && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                  <strong>Resumen:</strong> {activeArticle.summary}
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
    </>
  );
}
