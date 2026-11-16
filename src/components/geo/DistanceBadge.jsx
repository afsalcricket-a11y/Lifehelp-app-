import { Navigation } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Badge from '../ui/Badge';

// Distances are approximate (stored locations are ~1 km or the city centre), hence the "~".
export default function DistanceBadge({ km, className = '' }) {
  const { t } = useLanguage();
  if (km == null) return null;
  const text = km < 1 ? t('geo.under1') : `~${km < 10 ? km.toFixed(1) : Math.round(km)} ${t('geo.kmAway')}`;
  return (
    <Badge tone="blue" icon={Navigation} className={className}>
      {text}
    </Badge>
  );
}
