'use client';

import React, { useState, useEffect } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';
import Prism from 'prismjs';

// Import required languages
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-dax';
import 'prismjs/components/prism-powerquery';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export function CodeBlock({ language = 'text', code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const cleanCode = code.replace(/\n$/, '');

  const langMap: Record<string, string> = {
    dax: 'dax',
    m: 'powerquery',
    powerquery: 'powerquery',
    pq: 'powerquery',
    sql: 'sql',
    ts: 'typescript',
    typescript: 'typescript',
    js: 'javascript',
    javascript: 'javascript',
    py: 'python',
    python: 'python',
    json: 'json',
    bash: 'bash',
    sh: 'bash',
  };

  const normalizedLang = langMap[language.toLowerCase()] || 'text';

  const displayLang: Record<string, string> = {
    dax: 'DAX',
    powerquery: 'M (Power Query)',
    sql: 'SQL',
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    python: 'Python',
    json: 'JSON',
    bash: 'Bash',
    text: 'Code',
  };

  const languageLabel = displayLang[normalizedLang] || language.toUpperCase();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Run highlight
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');

  useEffect(() => {
    if (Prism.languages[normalizedLang]) {
      const html = Prism.highlight(cleanCode, Prism.languages[normalizedLang], normalizedLang);
      setHighlightedHtml(html);
    } else {
      setHighlightedHtml(
        cleanCode
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      );
    }
  }, [cleanCode, normalizedLang]);

  return (
    <div className="relative my-5 rounded-2xl overflow-hidden border border-slate-800 bg-[#0d1117] text-slate-100 shadow-lg">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-slate-500 font-mono text-[10px] ml-1">|</span>
          <span className="flex items-center gap-1 font-mono font-semibold text-slate-300 text-[11px]">
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            {languageLabel}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all text-xs font-medium cursor-pointer"
          title="Copiar código al portapapeles"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-mono text-[11px]">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-slate-400 font-mono text-[11px]">Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
        {highlightedHtml ? (
          <pre
            className={`language-${normalizedLang}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre className={`language-${normalizedLang}`}>
            <code>{cleanCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
