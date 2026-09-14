'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  Tag,
  Info,
  Lightbulb,
  AlertTriangle,
  AlertOctagon,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from './code-block';
import { Lesson, LessonMeta } from '@/types';
import confetti from 'canvas-confetti';

interface LessonReaderProps {
  lesson: Lesson;
  prevLesson?: LessonMeta | null;
  nextLesson?: LessonMeta | null;
  isInitiallyCompleted: boolean;
}

export function LessonReader({
  lesson,
  prevLesson,
  nextLesson,
  isInitiallyCompleted,
}: LessonReaderProps) {
  const [completed, setCompleted] = useState(isInitiallyCompleted);
  const [updating, setUpdating] = useState(false);

  const toggleCompletion = async () => {
    setUpdating(true);
    const nextState = !completed;
    setCompleted(nextState);

    if (nextState) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    }

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: lesson.courseId,
          lessonSlug: lesson.lessonSlug,
          completed: nextState,
        }),
      });
    } catch (e) {
      console.error('Error toggling completion:', e);
      setCompleted(!nextState);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <article className="max-w-4xl mx-auto space-y-8">
      {/* Lesson Header Card */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 sm:p-8 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Semana {lesson.week} • {lesson.day}
            </span>
            {lesson.durationMinutes && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" /> {lesson.durationMinutes} min
              </span>
            )}
          </div>

          {/* Mark completed button */}
          <Button
            onClick={toggleCompletion}
            disabled={updating}
            variant={completed ? 'secondary' : 'default'}
            size="sm"
            className={`w-full sm:w-auto rounded-xl text-xs gap-2 font-semibold transition-all ${
              completed
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Clase Completada</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                <span>Marcar como completada</span>
              </>
            )}
          </Button>
        </div>

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {lesson.title}
        </h1>

        {lesson.summary && (
          <p className="text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
            {lesson.summary}
          </p>
        )}

        {lesson.tags && lesson.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            {lesson.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Content Rendered */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 sm:p-8 lg:p-10 shadow-sm backdrop-blur-sm">
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings
              h1: ({ children }) => (
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-8 mb-3">
                  {children}
                </h3>
              ),
              h3: ({ children }) => (
                <h4 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white mt-6 mb-2">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed my-3 text-base">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-outside pl-6 my-4 space-y-1.5 text-slate-700 dark:text-slate-300">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-outside pl-6 my-4 space-y-1.5 text-slate-700 dark:text-slate-300">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              hr: () => <hr className="my-8 border-slate-200 dark:border-slate-800" />,
              // Tables
              table: ({ children }) => (
                <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {children}
                </tr>
              ),
              th: ({ children }) => <th className="p-3 text-xs uppercase tracking-wider">{children}</th>,
              td: ({ children }) => <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{children}</td>,

              // Blockquotes and Alerts
              blockquote: ({ children }) => {
                // Check for alert markers
                const contentStr = String(children);

                // Check if children is an array or contains string with [!NOTE], etc.
                let alertType: 'note' | 'tip' | 'important' | 'warning' | 'caution' | null = null;
                const match = contentStr.match(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
                if (match) {
                  alertType = match[1].toLowerCase() as any;
                }

                if (alertType) {
                  const alertStyles = {
                    note: {
                      bg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 text-blue-900 dark:text-blue-100',
                      icon: <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />,
                      title: 'Nota',
                    },
                    tip: {
                      bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-100',
                      icon: <Lightbulb className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
                      title: 'Consejo Pro',
                    },
                    important: {
                      bg: 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 text-indigo-900 dark:text-indigo-100',
                      icon: <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />,
                      title: 'Importante',
                    },
                    warning: {
                      bg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-100',
                      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
                      title: 'Advertencia',
                    },
                    caution: {
                      bg: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-100',
                      icon: <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
                      title: 'Precaución Crítica',
                    },
                  }[alertType];

                  return (
                    <div
                      className={`my-5 p-4 rounded-2xl border-l-4 flex gap-3.5 items-start ${alertStyles.bg}`}
                    >
                      {alertStyles.icon}
                      <div className="flex-1 text-sm leading-relaxed space-y-1">
                        <strong className="block font-semibold">{alertStyles.title}</strong>
                        <div className="opacity-95">{children}</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <blockquote className="my-5 border-l-4 border-slate-300 dark:border-slate-700 pl-4 italic text-slate-600 dark:text-slate-400">
                    {children}
                  </blockquote>
                );
              },

              // Code Syntax Highlighting
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match && !String(children).includes('\n');

                if (isInline) {
                  return (
                    <code
                      className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[13px]"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                const lang = match ? match[1] : 'text';
                return <CodeBlock language={lang} code={String(children)} />;
              },
            }}
          >
            {lesson.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Bottom Navigation: Prev / Next */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm">
        {prevLesson ? (
          <Link
            href={`/cursos/${lesson.courseId}/${prevLesson.lessonSlug}`}
            className="w-full sm:w-auto flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group border border-slate-100 dark:border-slate-800 sm:border-none"
          >
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Clase Anterior
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                {prevLesson.title}
              </span>
            </div>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}

        <Button
          onClick={toggleCompletion}
          disabled={updating}
          variant={completed ? 'secondary' : 'default'}
          className="w-full sm:w-auto rounded-xl px-5 py-2.5 sm:py-2 text-xs font-semibold"
        >
          {completed ? '✓ Completada' : 'Marcar como completada'}
        </Button>

        {nextLesson ? (
          <Link
            href={`/cursos/${lesson.courseId}/${nextLesson.lessonSlug}`}
            className="w-full sm:w-auto flex items-center justify-end sm:justify-end gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-right border border-slate-100 dark:border-slate-800 sm:border-none"
          >
            <div className="min-w-0">
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Siguiente Clase
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                {nextLesson.title}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>
    </article>
  );
}
