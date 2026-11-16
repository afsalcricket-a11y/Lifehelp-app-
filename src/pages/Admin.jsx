import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/ui/PageHeader';
import FilterChips from '../components/ui/FilterChips';
import AdminOverview from '../components/admin/AdminOverview';
import AdminVerification from '../components/admin/AdminVerification';
import AdminReports from '../components/admin/AdminReports';
import AdminUsers from '../components/admin/AdminUsers';
import AdminActivity from '../components/admin/AdminActivity';

export default function Admin() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('overview');
  const tabs = ['overview', 'verification', 'reports', 'users', 'activity'].map((v) => ({ value: v, label: t(`admin.tab.${v}`) }));

  return (
    <div className="space-y-5">
      <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')} icon={ShieldCheck} tile="bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" />
      <FilterChips label={t('admin.title')} options={tabs} value={tab} onChange={setTab} />
      {tab === 'overview' && <AdminOverview />}
      {tab === 'verification' && <AdminVerification />}
      {tab === 'reports' && <AdminReports />}
      {tab === 'users' && <AdminUsers />}
      {tab === 'activity' && <AdminActivity />}
    </div>
  );
}
