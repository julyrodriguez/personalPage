'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  CheckSquare,
  FileText,
  Webhook,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  LogOut,
  Newspaper,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Resumen & Bento Grid',
  },
  {
    name: 'Servidor',
    href: '/servidor',
    icon: Server,
    description: 'Hardware, Logs & Control',
    badge: 'Live',
  },
  {
    name: 'Cursos',
    href: '/cursos',
    icon: GraduationCap,
    description: 'Power BI Masterclass',
    badge: '10 Clases',
  },
  {
    name: 'Tareas',
    href: '/tareas',
    icon: CheckSquare,
    description: 'Planificador & Kanban',
  },
  {
    name: 'Notas',
    href: '/notas',
    icon: FileText,
    description: 'Bitácora & Cheat Sheets',
  },
  {
    name: 'Noticias',
    href: '/noticias',
    icon: Newspaper,
    description: 'Artículos & Curaduría AI',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If on login page, don't show sidebar
  if (pathname === '/login') {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {/* Mobile Top Header Bar (100% width on top of screen) */}
      <div className="md:hidden sticky top-0 z-40 w-full flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-[#080c14]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              Personal OS
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400">
              Hub de Vida & Estudio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container: completely hidden on mobile unless mobileOpen is true */}
      <aside
        className={cn(
          'w-72 bg-white dark:bg-slate-900/95 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-200',
          mobileOpen
            ? 'fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200'
            : 'hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:flex-col'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  Personal OS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hub de Vida y Estudio</p>
            </div>
          </Link>

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Módulos Principales
            </p>
          </div>

          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block leading-none">{item.name}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                      {item.description}
                    </span>
                  </div>
                </div>

                {item.badge ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 text-slate-400 transition-transform duration-200 opacity-0 group-hover:opacity-100',
                      active && 'opacity-100 text-blue-500 translate-x-0.5'
                    )}
                  />
                )}
              </Link>
            );
          })}

          {/* Integration Status Badge */}
          <div className="pt-6 px-3">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Conexión Externa
            </p>
          </div>

          <div className="mx-1 mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Webhook className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Data Processor Sync
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                apivacas.jariel.com.ar
              </span>
            </div>
          </div>
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                JU
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  Julián Rodríguez
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Buenos Aires, AR
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
