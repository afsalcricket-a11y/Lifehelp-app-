import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({ label, icon: Icon, error, options, placeholder, className = '', ...rest }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />}
        <select
          id={id}
          aria-invalid={Boolean(error)}
          className={`h-12 w-full appearance-none rounded-2xl border bg-white pr-10 text-[15px] text-slate-900 transition focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100 ${
            Icon ? 'pl-11' : 'pl-4'
          } ${
            error
              ? 'border-red-400 focus:ring-red-400/40'
              : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/30 dark:border-slate-700'
          }`}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
