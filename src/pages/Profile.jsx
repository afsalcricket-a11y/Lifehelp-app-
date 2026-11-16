import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplets, HandHeart, LogOut, MapPin, Moon, Pencil, ShieldCheck, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import InstallCard from '../components/InstallCard';

function Segmented({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
            value === o.value ? 'bg-white text-brand-700 shadow dark:bg-slate-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const name = profile?.full_name || user?.user_metadata?.full_name || '—';
  const role = profile?.role || user?.user_metadata?.role;
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const place = [profile?.city, profile?.district].filter(Boolean).join(', ');

  async function onSignOut() {
    setBusy(true);
    try {
      await signOut();
      toast.info(t('profile.signedOut'));
    } catch {
      toast.error(t('err.generic'));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="animate-fade-up text-2xl font-extrabold text-slate-900 dark:text-white">{t('profile.title')}</h1>

      <Card className="animate-fade-up space-y-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-teal-400 text-2xl font-bold text-white">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900 dark:text-white">{name}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {role && <Badge tone="brand">{t(`role.${role}`)}</Badge>}
          {profile?.is_volunteer && <Badge tone="green" icon={HandHeart}>{t('pe.volunteerBadge')}</Badge>}
          {profile?.blood_group && <Badge tone="red" icon={Droplets}>{profile.blood_group}</Badge>}
          {place && <Badge icon={MapPin}>{place}</Badge>}
          {profile?.ngo_verified && <Badge tone="green" icon={ShieldCheck}>{t('pe.ngoVerified')}</Badge>}
        </div>
        <Button as={Link} to="/profile/edit" variant="secondary" fullWidth icon={Pencil}>
          {t('pe.button')}
        </Button>
        {profile?.is_admin && (
          <Button as={Link} to="/admin" fullWidth icon={ShieldCheck}>
            {t('admin.open')}
          </Button>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('profile.appearance')}</p>
          <Segmented
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: t('profile.light'), icon: <Sun className="h-4 w-4" /> },
              { value: 'dark', label: t('profile.dark'), icon: <Moon className="h-4 w-4" /> },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('profile.language')}</p>
          <Segmented
            value={lang}
            onChange={setLang}
            options={[
              { value: 'en', label: 'English' },
              { value: 'ta', label: 'தமிழ்' },
            ]}
          />
        </div>
      </Card>

      <InstallCard />

      <Button variant="secondary" fullWidth icon={LogOut} loading={busy} onClick={onSignOut}>
        {t('profile.signOut')}
      </Button>
      <p className="text-center text-xs text-slate-400">LIFEHELP v0.4.0</p>
    </div>
  );
}
