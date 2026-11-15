import { useId } from 'react';

export default function Textarea({ label, error, hint, className = '', rows = 4, ...rest }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-[16px] text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100 ${
          error ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/30 dark:border-slate-700'
        }`}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
