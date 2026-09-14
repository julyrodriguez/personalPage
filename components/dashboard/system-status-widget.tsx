'use client';

import { useState } from 'react';
import { ShieldCheck, Copy, Check, Terminal, Webhook, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function SystemStatusWidget() {
  const [copied, setCopied] = useState(false);

  const curlExample = `curl -X POST http://localhost:3000/api/ingest/task \\
  -H "Authorization: Bearer pos_hub_secret_token_2025_power_user" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Analizar métricas de ventas Q3", "priority": "high", "category": "Estudio"}'`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-slate-950 shadow-sm">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Gateway de Ingesta Externa</CardTitle>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Webhooks & Automatización para Agentes
            </p>
          </div>
        </div>

        <Badge variant="success" className="text-[10px] gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Bearer Auth Ready
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Inyecta datos desde bots de Telegram, cron jobs en Python o agentes autónomos hacia tu Hub Personal:
        </p>

        {/* Endpoints List */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">POST</span> /api/ingest/task
          </div>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-blue-600 dark:text-blue-400 font-bold">POST</span> /api/ingest/note
          </div>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-purple-600 dark:text-purple-400 font-bold">POST</span> /api/ingest/course-lesson
          </div>
        </div>

        {/* Code Snippet */}
        <div className="relative rounded-xl bg-slate-950 p-3 text-xs text-slate-300 font-mono overflow-x-auto border border-slate-800">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-emerald-400" />
              Ejemplo de Ingesta con cURL
            </span>
            <button
              onClick={copyCurl}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-[10px] sm:text-[11px] leading-relaxed select-all whitespace-pre-wrap break-all sm:break-normal">
            {curlExample}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
