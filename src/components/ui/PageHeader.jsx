import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, subtitle, icon: Icon, tile, action }) {
  return (
    <div className="animate-fade-up">
      <Link to="/explore" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        LIFEHELP
      </Link>
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tile}`}>
            <Icon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
