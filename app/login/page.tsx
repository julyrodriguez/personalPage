'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Contraseña incorrecta');
      }
    } catch (err) {
      setError('Error de conexión al autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl rounded-3xl overflow-hidden backdrop-blur-md">
        <CardHeader className="p-6 sm:p-8 text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Acceso Personal OS
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ingresa tu contraseña para acceder a tu Hub de Vida y Estudio
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-0 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Contraseña del Sistema
              </label>
              <input
                id="password"
                type="password"
                required
                autoFocus
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 gap-2"
            >
              {loading ? 'Verificando...' : 'Entrar al Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-2">
            La contraseña se configura en la variable <code className="font-mono">DASHBOARD_PASSWORD</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
