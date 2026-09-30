'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  BookOpen,
  Code,
  Trophy,
  ExternalLink,
  Download,
  FileText,
  Save,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Laptop,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/course/code-block';
import { EscuelaClassItem } from '@/types';

export default function ClassReaderPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const classId = params?.classId as string;

  const [classData, setClassData] = useState<EscuelaClassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const parseJsonSafe = async (res: Response) => {
    try {
      const text = await res.text();
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  };

  const fetchClass = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/escuela/classes/${classId}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await parseJsonSafe(res);
        if (json && json.success && json.data) {
          setClassData(json.data);
          setNotes(json.data.checkpoint?.personalNotes || '');
        }
      }
    } catch (e) {
      console.error('Error fetching class:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchClass();
    }
  }, [classId]);

  const triggerConfetti = async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (_) {}
  };

  const updateCheckpointField = async (
    field: 'read' | 'practiceCompleted' | 'challengeCompleted',
    currentVal: boolean
  ) => {
    if (!classData) return;
    const nextVal = !currentVal;
    setUpdating(true);

    if (nextVal) {
      triggerConfetti();
    }

    try {
      const res = await fetch(`/api/escuela/classes/${classId}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: nextVal }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setClassData((prev) =>
            prev ? { ...prev, checkpoint: json.data } : null
          );
        }
      }
    } catch (err) {
      console.error('Error updating checkpoint:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!classData) return;
    try {
      const res = await fetch(`/api/escuela/classes/${classId}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalNotes: notes }),
      });
      if (res.ok) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3">
        <BookOpen className="w-8 h-8 animate-pulse mx-auto text-blue-500" />
        <p className="text-sm">Cargando clase diaria...</p>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Clase no encontrada</h2>
        <Link href={`/escuela/${courseId}`}>
          <Button variant="outline" className="rounded-xl">Volver al Temario</Button>
        </Link>
      </div>
    );
  }

  const cp = classData.checkpoint || {
    read: false,
    practiceCompleted: false,
    challengeCompleted: false,
    personalNotes: '',
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/escuela/${courseId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Temario del Curso
        </Link>

        {/* Prev / Next controls */}
        <div className="flex items-center gap-2">
          {classData.prevClass && (
            <Link href={`/escuela/${courseId}/${classData.prevClass.classId}`}>
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
            </Link>
          )}

          {classData.nextClass && (
            <Link href={`/escuela/${courseId}/${classData.nextClass.classId}`}>
              <Button variant="default" size="sm" className="rounded-xl text-xs gap-1.5 cursor-pointer">
                <span className="hidden sm:inline">Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Header Info Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Clase {classData.classNumber} • Módulo {classData.moduleNumber}
            </span>
            <span className="text-xs text-slate-500">
              {classData.courseId.toUpperCase()}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Generada con IA de Google
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
          {classData.title}
        </h1>

        {classData.summary && (
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-l-2 border-blue-500 pl-3 italic">
            {classData.summary}
          </p>
        )}
      </div>

      {/* Checkpoints Bar (Sticky / Interactive) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 via-indigo-50/40 to-slate-50/50 dark:from-slate-900/90 dark:via-indigo-950/20 dark:to-slate-900/90 shadow-sm backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Checkpoints de Aprendizaje
          </h3>
          <span className="text-[11px] text-slate-500">Persistidos en MongoDB</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Checkpoint 1: Read */}
          <button
            onClick={() => updateCheckpointField('read', cp.read)}
            disabled={updating}
            className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
              cp.read
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  cp.read ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-600'
                }`}
              >
                {cp.read && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs">1. Clase Leída</span>
            </div>
            <BookOpen className="w-4 h-4 opacity-70" />
          </button>

          {/* Checkpoint 2: Practice */}
          <button
            onClick={() => updateCheckpointField('practiceCompleted', cp.practiceCompleted)}
            disabled={updating}
            className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
              cp.practiceCompleted
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  cp.practiceCompleted ? 'bg-blue-500 text-white' : 'border border-slate-300 dark:border-slate-600'
                }`}
              >
                {cp.practiceCompleted && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs">2. Práctica Hecha</span>
            </div>
            <Code className="w-4 h-4 opacity-70" />
          </button>

          {/* Checkpoint 3: Challenge */}
          <button
            onClick={() => updateCheckpointField('challengeCompleted', cp.challengeCompleted)}
            disabled={updating}
            className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
              cp.challengeCompleted
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  cp.challengeCompleted ? 'bg-amber-500 text-white' : 'border border-slate-300 dark:border-slate-600'
                }`}
              >
                {cp.challengeCompleted && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs">3. Desafío Resuelto</span>
            </div>
            <Trophy className="w-4 h-4 opacity-70" />
          </button>
        </div>
      </div>

      {/* Main Theoretical Class (Markdown Body) */}
      <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6 sm:p-10">
          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-sm sm:text-base">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-6 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-blue-600 rounded-full" />
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-6 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => <p className="mb-4 text-slate-700 dark:text-slate-300 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-slate-700 dark:text-slate-300">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-slate-700 dark:text-slate-300">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-r-xl text-slate-700 dark:text-slate-300 italic">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-slate-100 dark:bg-slate-800 p-3 font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="p-3 border-b border-slate-100 dark:border-slate-800/80">{children}</td>
                ),
                code: ({ className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');

                  if (match) {
                    return <CodeBlock language={match[1]} code={codeString} />;
                  }

                  return (
                    <code
                      className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-xs"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {classData.markdownContent}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Consignas de Práctica Diaria */}
      {classData.consignas && classData.consignas.length > 0 && (
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-6 pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-emerald-50/40 to-transparent dark:from-emerald-950/10">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-500" />
              Consignas de Práctica de Laboratorio
            </CardTitle>
            <p className="text-xs text-slate-500">
              Ejercicios prácticos guiados paso a paso para aplicar en tu entorno de desarrollo.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {classData.consignas.map((c, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {c.title}
                  </h4>
                </div>

                {c.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {c.description}
                  </p>
                )}

                {c.stepByStep && c.stepByStep.length > 0 && (
                  <div className="space-y-1.5 pl-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Pasos a seguir:
                    </p>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {c.stepByStep.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold shrink-0">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.expectedOutcome && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <strong className="text-emerald-600 dark:text-emerald-400 font-semibold block mb-0.5">
                      Resultado esperado:
                    </strong>
                    <span className="text-slate-600 dark:text-slate-300">{c.expectedOutcome}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Desafío del Día */}
      {classData.challenge && classData.challenge.instructions && (
        <Card className="border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/40 via-white to-transparent dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-6 pb-3 border-b border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                {classData.challenge.title || 'Desafío del Día'}
              </CardTitle>
              <Badge variant="warning" className="text-xs">
                Reto Autónomo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {classData.challenge.instructions}
            </p>

            {classData.challenge.criteria && classData.challenge.criteria.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Criterios de Aceptación:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {classData.challenge.criteria.map((crit, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {classData.challenge.hints && classData.challenge.hints.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showHints ? 'Ocultar pistas' : 'Ver pistas de resolución'}
                </button>

                {showHints && (
                  <ul className="mt-2 pl-4 list-disc space-y-1 text-xs text-slate-600 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                    {classData.challenge.hints.map((hint, hIdx) => (
                      <li key={hIdx}>{hint}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Materiales Originales de Alumni Education */}
      {classData.rawResources && classData.rawResources.length > 0 && (
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-6 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Recursos Originales del Campus (Alumni Education)
            </CardTitle>
            <p className="text-xs text-slate-500">
              Diapositivas oficiales, PDFs y documentos analizados por la IA para crear esta clase.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classData.rawResources.map((res: any, idx: number) => {
                const isPdf = res.type === 'pdf';
                const hasUrl = res.url && res.url.startsWith('http');

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {res.type ? res.type.toUpperCase() : 'DOC'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {res.name}
                        </p>
                        {res.originalName && (
                          <p className="text-[10px] text-slate-500 truncate">
                            {res.originalName}
                          </p>
                        )}
                      </div>
                    </div>

                    {hasUrl && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors shadow-2xs shrink-0"
                        title="Abrir recurso"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Notes & Study Reflections */}
      <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-6 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Tus Apuntes y Conclusiones de la Clase
            </CardTitle>
            <p className="text-xs text-slate-500">
              Espacio personal sincronizado con MongoDB para registrar notas, comandos clave o dudas.
            </p>
          </div>

          <Button
            onClick={handleSaveNotes}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-blue-500" />
            {notesSaved ? '¡Guardado!' : 'Guardar Notas'}
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escribe aquí tus apuntes sobre esta clase, snippets de código, dudas o ideas para proyectos..."
            rows={4}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
          />
        </CardContent>
      </Card>
    </div>
  );
}
