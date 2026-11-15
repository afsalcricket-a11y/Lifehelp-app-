import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserCog, UserPlus, AlertTriangle } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth, authErrorKey } from '../context/AuthContext';
import { ROLE_VALUES, validateEmail, validateName, validatePassword, validateRole } from '../lib/validators';

export default function Register() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { signUp, configured } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', role: '', password: '', confirm: '', consent: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const roleOptions = ROLE_VALUES.map((v) => ({ value: v, label: t(`role.${v}`) }));

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    const next = {
      fullName: validateName(form.fullName),
      email: validateEmail(form.email),
      role: validateRole(form.role),
      password: validatePassword(form.password),
      confirm: form.confirm !== form.password ? 'err.passwordMismatch' : '',
      consent: form.consent ? '' : 'err.consentRequired',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(form);
      if (needsConfirmation) {
        toast.success(t('register.confirmEmail'));
        navigate('/login', { replace: true });
      } else {
        toast.success(t('register.success'));
      }
    } catch (err) {
      toast.error(t(authErrorKey(err)));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <>
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            {t('register.login')}
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
          label={t('auth.fullName')}
          icon={User}
          autoComplete="name"
          maxLength={60}
          value={form.fullName}
          onChange={set('fullName')}
          error={errors.fullName && t(errors.fullName)}
        />
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
        <Select
          label={t('auth.role')}
          icon={UserCog}
          placeholder={t('auth.rolePlaceholder')}
          options={roleOptions}
          value={form.role}
          onChange={set('role')}
          error={errors.role && t(errors.role)}
        />
        <Input
          label={t('auth.password')}
          icon={Lock}
          type="password"
          autoComplete="new-password"
          maxLength={72}
          value={form.password}
          onChange={set('password')}
          hint={t('auth.passwordHint')}
          error={errors.password && t(errors.password)}
        />
        <Input
          label={t('auth.confirmPassword')}
          icon={Lock}
          type="password"
          autoComplete="new-password"
          maxLength={72}
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm && t(errors.confirm)}
        />

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={set('consent')}
              className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-slate-300 accent-brand-600"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">{t('register.consent')}</span>
          </label>
          {errors.consent && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{t(errors.consent)}</p>}
        </div>

        <Button type="submit" fullWidth loading={busy} disabled={!configured} icon={UserPlus}>
          {t('register.submit')}
        </Button>
      </form>
    </AuthShell>
  );
}
