import { Siren, Droplets, Briefcase, HandHeart, GraduationCap, Gift } from 'lucide-react';

// Tailwind needs full class names written out, so they are listed explicitly.
export const MODULES = [
  {
    slug: 'emergency',
    path: '/emergency',
    icon: Siren,
    titleKey: 'module.emergency',
    descKey: 'module.emergency.desc',
    tile: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    available: true,
  },
  {
    slug: 'blood',
    path: '/module/blood',
    icon: Droplets,
    titleKey: 'module.blood',
    descKey: 'module.blood.desc',
    tile: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  },
  {
    slug: 'jobs',
    path: '/module/jobs',
    icon: Briefcase,
    titleKey: 'module.jobs',
    descKey: 'module.jobs.desc',
    tile: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  },
  {
    slug: 'community',
    path: '/module/community',
    icon: HandHeart,
    titleKey: 'module.community',
    descKey: 'module.community.desc',
    tile: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  {
    slug: 'education',
    path: '/module/education',
    icon: GraduationCap,
    titleKey: 'module.education',
    descKey: 'module.education.desc',
    tile: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
  {
    slug: 'donation',
    path: '/module/donation',
    icon: Gift,
    titleKey: 'module.donation',
    descKey: 'module.donation.desc',
    tile: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  },
];

export const EMERGENCY_NUMBERS = [
  { number: '100', labelKey: 'emergency.police' },
  { number: '101', labelKey: 'emergency.fire' },
  { number: '108', labelKey: 'emergency.ambulance' },
  { number: '181', labelKey: 'emergency.women' },
  { number: '1098', labelKey: 'emergency.child' },
];
