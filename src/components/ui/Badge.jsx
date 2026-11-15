const TONES = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  blue: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
};

export const STATUS_TONE = {
  open: 'blue',
  in_progress: 'amber',
  completed: 'green',
  cancelled: 'slate',
  fulfilled: 'green',
  closed: 'slate',
  available: 'green',
  reserved: 'amber',
  donated: 'brand',
  withdrawn: 'slate',
  pending: 'amber',
  accepted: 'green',
  declined: 'slate',
  verified: 'green',
  unverified: 'slate',
  normal: 'slate',
  urgent: 'amber',
  critical: 'red',
};

export default function Badge({ tone = 'slate', icon: Icon, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}
