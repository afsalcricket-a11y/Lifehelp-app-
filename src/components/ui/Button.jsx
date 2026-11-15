import Spinner from './Spinner';

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-brand-600 to-teal-500 text-white shadow-lg shadow-brand-600/25 hover:brightness-110 focus-visible:ring-brand-500',
  danger: 'bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-700 focus-visible:ring-red-500',
  secondary:
    'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800',
};

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  loading = false,
  icon: Icon,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...rest
}) {
  const isButton = Tag === 'button';
  return (
    <Tag
      {...(isButton ? { type: rest.type || 'button', disabled: disabled || loading } : {})}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900 ${
        VARIANTS[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : Icon ? <Icon className="h-5 w-5" /> : null}
      {children}
    </Tag>
  );
}
