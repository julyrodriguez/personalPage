'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Tag,
  Copy,
  Check,
  Calendar,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Note } from '@/types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NotasPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'reader'>('list');

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [newPinned, setNewPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        if (data.length > 0 && !activeNote) {
          setActiveNote(data[0]);
        }
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

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    const tags = newTagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          tags: tags.length ? tags : ['General'],
          pinned: newPinned,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setNotes((prev) => [created, ...prev]);
        setActiveNote(created);
        setShowAddModal(false);
        setNewTitle('');
        setNewContent('');
        setNewTagsStr('');
        setNewPinned(false);
      }
    } catch (e) {
      console.error('Error creating note:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePin = async (note: Note) => {
    const nextPinned = !note.pinned;
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, pinned: nextPinned } : n))
    );
    if (activeNote?.id === note.id) {
      setActiveNote({ ...activeNote, pinned: nextPinned });
    }

    try {
      await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: nextPinned }),
      });
    } catch (e) {
      console.error('Error toggling pin:', e);
      fetchNotes();
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('¿Eliminar este apunte?')) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNote?.id === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setActiveNote(remaining.length > 0 ? remaining[0] : null);
    }

    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting note:', e);
      fetchNotes();
    }
  };

  const copyNoteContent = (note: Note) => {
    navigator.clipboard.writeText(note.content);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Collect all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  // Filter notes
  const filteredNotes = notes
    .filter((n) => {
      if (
        search &&
        !n.title.toLowerCase().includes(search.toLowerCase()) &&
        !n.content.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (selectedTag !== 'all' && !n.tags?.includes(selectedTag)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Pinned first, then newest
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-600" />
            Bitácora Personal & Cheat Sheets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Apuntes técnicos, fórmulas DAX, notas de reuniones y snippets clave.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 h-9"
        >
          <Plus className="w-4 h-4" />
          Nuevo Apunte
        </Button>
      </div>

      {/* Tag Pills & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por palabra o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedTag === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todos
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
        <button
          onClick={() => setMobileView('list')}
          className={cn(
            'flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all',
            mobileView === 'list'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          )}
        >
          Lista de Apuntes ({filteredNotes.length})
        </button>
        <button
          onClick={() => setMobileView('reader')}
          className={cn(
            'flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all',
            mobileView === 'reader'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          )}
        >
          Visor de Apunte
        </button>
      </div>

      {/* Main 2-Column Layout: Notes List + Active Note Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Notes Cards (5 cols) */}
        <div
          className={cn(
            'lg:col-span-5 space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1',
            mobileView === 'reader' && 'hidden lg:block'
          )}
        >
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Cargando notas...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No se encontraron notas con ese criterio.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNote(note);
                    setMobileView('reader');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                      {note.title}
                    </h4>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(note);
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          note.pinned
                            ? 'text-amber-500 hover:text-amber-600'
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={note.pinned ? 'Desfijar' : 'Fijar arriba'}
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar apunte"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed font-mono">
                    {note.content.replace(/[#*`]/g, '')}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 flex-wrap">
                      {note.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {note.createdAt ? new Date(note.createdAt).toLocaleDateString('es-AR') : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Note Markdown Reader (7 cols) */}
        <div className={cn('lg:col-span-7', mobileView === 'list' && 'hidden lg:block')}>
          {/* Mobile Back Button */}
          <button
            onClick={() => setMobileView('list')}
            className="lg:hidden text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-3 px-1 py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la lista de notas</span>
          </button>

          {activeNote ? (
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {activeNote.pinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Pin className="w-2.5 h-2.5 fill-current" /> Fijada
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      {activeNote.createdAt
                        ? new Date(activeNote.createdAt).toLocaleString('es-AR')
                        : ''}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {activeNote.title}
                  </h2>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyNoteContent(activeNote)}
                  className="rounded-xl text-xs gap-1.5 h-8 shrink-0"
                >
                  {copiedId === activeNote.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Markdown</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 mb-6 flex-wrap">
                {activeNote.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    #{t}
                  </Badge>
                ))}
              </div>

              {/* Rendered Markdown Body */}
              <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeNote.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 p-8 text-center">
              <FileText className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">Selecciona un apunte para visualizarlo</p>
            </div>
          )}
        </div>
      </div>

      {/* New Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Nuevo Apunte / Cheat Sheet
            </h3>

            <form onSubmit={handleCreateNote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fórmulas DAX para Ventas YTD..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Etiquetas (separadas por coma)
                </label>
                <input
                  type="text"
                  placeholder="DAX, Power BI, Fórmulas, CheatSheet"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contenido Markdown *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Escribe en Markdown (# Título, listas, bloques de código ```dax...)"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono resize-y"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinnedCheck"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="pinnedCheck"
                  className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Fijar apunte en la parte superior
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                  className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Apunte'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
