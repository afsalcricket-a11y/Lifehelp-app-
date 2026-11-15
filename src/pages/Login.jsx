import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertTriangle } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth, authErrorKey } from '../context/AuthContext';
import { validateEmail } from '../lib/validators';

export default function Login() {
  const { t } = useLanguage();
  const toast = useToast();
  const { signIn, configured } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    const next = {
      email: validateEmail(form.email),
      password: form.password ? '' : 'err.passwordRequired',
    };
    setErrors(next);
    if (next.email || next.password) return;

    setBusy(true);
    try {
      await signIn(form.email, form.password);
      toast.success(t('login.success'));
      // Navigation happens automatically: PublicOnlyRoute redirects once the session exists.
    } catch (err) {
      toast.error(t(authErrorKey(err)));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            {t('login.register')}
          </Link>
        </>
      }
    >
      {!configured && (
        <div className="mb-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">{t('auth.notConfigured')}</p>
            <p className="mt-0.5 text-xs">{t('auth.notConfiguredText')}</p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label={t('auth.email')}
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          maxLength={254}
          value={form.email}
          onChange={set('email')}
          error={errors.email && t(errors.email)}
        />
        <Input
          label={t('auth.password')}
          icon={Lock}
          type="password"
          autoComplete="current-password"
          maxLength={72}
          value={form.password}
          onChange={set('password')}
          error={errors.password && t(errors.password)}
        />
        <Button type="submit" fullWidth loading={busy} disabled={!configured} icon={LogIn}>
          {t('login.submit')}
        </Button>
      </form>
    </AuthShell>
  );
}
