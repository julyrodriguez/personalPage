import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Sidebar } from '@/components/layout/sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Personal OS | Hub de Vida y Estudio',
  description:
    'Portal personal todo-en-uno con Bento Grid, Cursos con visor Markdown/MDX, Tareas, Bitácora y API de Ingesta Segura.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-50/50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 transition-colors`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            {/* Persistent Global Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 md:pl-72 flex flex-col min-w-0">
              <div className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
