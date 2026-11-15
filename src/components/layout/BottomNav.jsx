import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Siren, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const ITEMS = [
  { to: '/', icon: Home, key: 'nav.home', end: true },
  { to: '/explore', icon: LayoutGrid, key: 'nav.explore' },
  { to: '/emergency', icon: Siren, key: 'nav.emergency', alert: true },
  { to: '/profile', icon: User, key: 'nav.profile' },
];

export default function BottomNav() {
  const { t } = useLanguage();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-2">
        {ITEMS.map(({ to, icon: Icon, key, end, alert }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  isActive
                    ? alert
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                      isActive ? (alert ? 'bg-red-100 dark:bg-red-500/15' : 'bg-brand-100 dark:bg-brand-500/15') : ''
                    }`}
                  >
                    <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {t(key)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
