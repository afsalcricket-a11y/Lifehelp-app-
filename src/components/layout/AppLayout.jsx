import { Outlet } from 'react-router-dom';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageToggle from '../ui/LanguageToggle';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-lg font-extrabold tracking-wide text-slate-900 dark:text-white">LIFEHELP</span>
          </div>
          <div className="flex items-center text-slate-600 dark:text-slate-300">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
