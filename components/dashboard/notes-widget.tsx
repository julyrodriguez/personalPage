'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Plus, Pin, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Note } from '@/types';

export function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const json = await res.json();
        setNotes(json);
      }
    } catch (e) {
      console.error('Error fetching notes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          tags: ['Bitácora', 'QuickNote'],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setNotes((prev) => [created, ...prev]);
        setNewTitle('');
        setNewContent('');
        setShowInput(false);
      }
    } catch (e) {
      console.error('Error creating note:', e);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-sm flex flex-col">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Bitácora & Notas Rápidas</CardTitle>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {notes.length} notas guardadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInput(!showInput)}
            className="h-7 px-2 text-xs rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {showInput ? 'Cancelar' : 'Nota'}
          </Button>

          <Link
            href="/notas"
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Ver Todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between space-y-3">
        {/* Creation Drawer */}
        {showInput && (
          <form
            onSubmit={handleCreate}
            className="p-3 mb-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in slide-in-from-top-2"
          >
            <input
              type="text"
              placeholder="Título del apunte..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <textarea
              placeholder="Contenido breve o snippet..."
              rows={2}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={isCreating || !newTitle.trim() || !newContent.trim()}
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3"
              >
                Guardar Apunte
              </Button>
            </div>
          </form>
        )}

        {/* Notes Feed */}
        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Cargando bitácora...
            </div>
          ) : notes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay notas registradas. Crea tu primer apunte.
            </div>
          ) : (
            notes.slice(0, 4).map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-400/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {note.title}
                  </h5>
                  {note.pinned && (
                    <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-mono whitespace-pre-line">
                  {note.content.replace(/[#*`]/g, '')}
                </p>

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-white dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                    >
                      #{tag}
                    </span>
                  ))}
                  <span className="text-[9px] text-slate-400 ml-auto">
                    {note.createdAt ? new Date(note.createdAt).toLocaleDateString('es-AR') : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
