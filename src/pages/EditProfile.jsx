import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, MapPin, Phone, ShieldCheck, User, UserCog } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BLOOD_GROUPS, emptyToNull, errorKey, unwrap } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { ROLE_VALUES, hasErrors, validateName, validatePhone, validateRole, validateText } from '../lib/validators';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Notice from '../components/ui/Notice';
import PageLoader from '../components/ui/PageLoader';

export default function EditProfile() {
  const { t, lang } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || '',
      role: profile.role || 'public',
      phone: profile.phone || '',
      city: profile.city || '',
      district: profile.district || '',
      state: profile.state || '',
      blood_group: profile.blood_group || '',
      is_volunteer: Boolean(profile.is_volunteer),
      ngo_name: profile.ngo_name || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  if (!profile || !form) return <PageLoader />;

  const set = (f) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((x) => ({ ...x, [f]: v }));
    setErrors((x) => ({ ...x, [f]: '' }));
  };

  async function save() {
    const next = {
      full_name: validateName(form.full_name),
      role: validateRole(form.role),
      phone: validatePhone(form.phone, { required: false }),
      city: validateText(form.city, { max: 60, required: false }),
      district: validateText(form.district, { max: 60, required: false }),
      state: validateText(form.state, { max: 60, required: false }),
      blood_group: !form.blood_group || BLOOD_GROUPS.includes(form.blood_group) ? '' : 'err.selectOne',
      ngo_name: validateText(form.ngo_name, { max: 100, required: false }),
    };
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      const fullName = form.full_name.replace(/\s+/g, ' ').trim();
      unwrap(
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            role: form.role,
            phone: emptyToNull(form.phone),
            city: emptyToNull(form.city),
            district: emptyToNull(form.district),
            state: emptyToNull(form.state),
            blood_group: form.blood_group || null,
            is_volunteer: form.is_volunteer,
            ngo_name: emptyToNull(form.ngo_name),
            preferred_language: lang,
          })
          .eq('id', user.id)
      );
      // Keep the sign-up metadata in sync so the greeting and role badge update everywhere.
      await supabase.auth.updateUser({ data: { full_name: fullName, role: form.role } });
      await refreshProfile();
      toast.success(t('pe.saved'));
      navigate('/profile');
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="animate-fade-up">
        <Link to="/profile" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" />
          {t('profile.title')}
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('pe.title')}</h1>
      </div>

      <Card className="space-y-4">
        <Input label={t('auth.fullName')} icon={User} maxLength={60} value={form.full_name} onChange={set('full_name')} error={errors.full_name && t(errors.full_name)} />
        <Select
          label={t('auth.role')}
          icon={UserCog}
          placeholder={t('auth.rolePlaceholder')}
          options={ROLE_VALUES.map((r) => ({ value: r, label: t(`role.${r}`) }))}
          value={form.role}
          onChange={set('role')}
          error={errors.role && t(errors.role)}
        />
        <Input label={`${t('common.phone')} (${t('common.optional')})`} icon={Phone} type="tel" inputMode="tel" maxLength={15} value={form.phone} onChange={set('phone')} hint={t('pe.phoneNote')} error={errors.phone && t(errors.phone)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('common.city')} icon={MapPin} maxLength={60} value={form.city} onChange={set('city')} error={errors.city && t(errors.city)} />
          <Input label={t('common.district')} maxLength={60} value={form.district} onChange={set('district')} error={errors.district && t(errors.district)} />
        </div>
        <Input label={t('common.state')} maxLength={60} value={form.state} onChange={set('state')} error={errors.state && t(errors.state)} />
        <Select
          label={`${t('blood.group')} (${t('common.optional')})`}
          icon={Droplets}
          placeholder="—"
          options={BLOOD_GROUPS.map((g) => ({ value: g, label: g }))}
          value={form.blood_group}
          onChange={set('blood_group')}
          error={errors.blood_group && t(errors.blood_group)}
        />

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3.5 dark:border-slate-700">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{t('pe.volunteer')}</span>
          <input type="checkbox" checked={form.is_volunteer} onChange={set('is_volunteer')} className="h-6 w-11 shrink-0 cursor-pointer accent-brand-600" />
        </label>

        {(form.role === 'ngo' || form.ngo_name) && (
          <div className="space-y-2">
            <Input label={`${t('pe.ngoName')} (${t('common.optional')})`} maxLength={100} value={form.ngo_name} onChange={set('ngo_name')} error={errors.ngo_name && t(errors.ngo_name)} />
            {profile.ngo_verified ? (
              <Badge tone="green" icon={ShieldCheck}>
                {t('pe.ngoVerified')}
              </Badge>
            ) : (
              <Notice>{t('pe.ngoPending')}</Notice>
            )}
          </div>
        )}

        <Button fullWidth loading={busy} onClick={save}>
          {t('common.save')}
        </Button>
      </Card>
    </div>
  );
}
