import { useEffect } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';
import { useToast } from '../../context/ToastContext';
import { RADIUS_OPTIONS } from '../../lib/geo';
import Button from '../ui/Button';

function Chip({ active, disabled, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

// near = value of useNearFilter()
export default function NearFilters({ near }) {
  const { t } = useLanguage();
  const toast = useToast();
  const { gps, status, origin, city, cities, locate, loadCities, setCity } = useLocation();
  const { sortNearest, setSortNearest, radius, setRadius } = near;

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  async function useGps() {
    const pos = await locate();
    if (pos) {
      toast.success(t('geo.found'));
      setSortNearest(true);
    }
  }

  function chooseCity(e) {
    const row = (cities || []).find((c) => c.name === e.target.value) || null;
    setCity(row);
    if (row) setSortNearest(true);
  }

  const source =
    origin?.source === 'gps'
      ? t('geo.gpsActive')
      : origin?.source === 'city'
      ? `${t('geo.usingCity')} ${origin.name}`
      : origin?.source === 'profile'
      ? t('geo.profileOrigin')
      : t('geo.needOrigin');

  return (
    <div className="space-y-2.5 rounded-3xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
      <Button fullWidth variant={gps ? 'secondary' : 'primary'} icon={LocateFixed} loading={status === 'locating'} onClick={useGps}>
        {t('geo.useGps')}
      </Button>
      {status.startsWith('geo.') && <p className="text-xs font-medium text-red-600 dark:text-red-400">{t(status)}</p>}

      <label className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
        <select
          value={city?.name || ''}
          onChange={chooseCity}
          aria-label={t('geo.chooseCity')}
          className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">{t('geo.chooseCity')}</option>
          {(cities || []).map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.state})
            </option>
          ))}
        </select>
      </label>

      <p className="text-xs text-slate-500 dark:text-slate-400">{source}</p>

      <div className="-mx-1 flex flex-wrap gap-2 px-1">
        <Chip active={sortNearest} disabled={!origin} onClick={() => setSortNearest(!sortNearest)}>
          {t('geo.sortNearest')}
        </Chip>
        <Chip active={radius === 'all'} onClick={() => setRadius('all')}>
          {t('geo.radiusAll')}
        </Chip>
        {RADIUS_OPTIONS.map((km) => (
          <Chip key={km} active={radius === String(km)} disabled={!origin} onClick={() => setRadius(String(km))}>
            {km} {t('geo.km')}
          </Chip>
        ))}
      </div>
    </div>
  );
}
