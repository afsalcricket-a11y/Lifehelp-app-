import { LocateFixed, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';

// "Use current GPS location". Calls onFix({lat, lon}) with the fresh position.
export default function GpsButton({ onFix, done = false, label, doneLabel }) {
  const { t } = useLanguage();
  const { locate, status } = useLocation();
  const toast = useToast();

  async function click() {
    const pos = await locate();
    if (pos) {
      toast.success(t('geo.found'));
      onFix?.(pos);
    }
  }

  return (
    <div className="space-y-1.5">
      <Button variant="secondary" fullWidth icon={done ? Check : LocateFixed} loading={status === 'locating'} onClick={click}>
        {done ? doneLabel || t('geo.attached') : label || t('geo.useGps')}
      </Button>
      {status.startsWith('geo.') && <p className="text-xs font-medium text-red-600 dark:text-red-400">{t(status)}</p>}
    </div>
  );
}
