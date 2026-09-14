'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Newspaper, ExternalLink, ArrowRight, Bookmark, Sparkles, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewsArticle } from '@/types';

export function NewsWidget() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setArticles(data.slice(0, 4));
      })
      .catch((e) => console.warn('Error loading news widget:', e))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              Noticias & Artículos
            </CardTitle>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Curaduría de Agentes y Fuentes</p>
          </div>
        </div>

        <Link
          href="/noticias"
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Ver Todas <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-2.5">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">Cargando noticias...</div>
        ) : articles.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-slate-600 dark:text-slate-300">Sin noticias aún</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tu agente puede inyectar artículos mediante la API
            </p>
          </div>
        ) : (
          articles.map((article) => (
            <Link
              key={article.id}
              href={`/noticias?id=${article.id}`}
              className="block p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {article.category && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {article.category}
                      </Badge>
                    )}
                    {article.source && (
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {article.source}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      • {formatDate(article.publishedAt || article.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1 transition-colors">
                    {article.title}
                  </h4>
                  {article.summary && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {article.summary}
                    </p>
                  )}
                </div>

                <div className="p-1 rounded-md text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
