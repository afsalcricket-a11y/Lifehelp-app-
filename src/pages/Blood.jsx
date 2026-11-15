import { useState } from 'react';
import { Droplets } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import Notice from '../components/ui/Notice';
import DonorSearch from '../components/blood/DonorSearch';
import BloodRequests from '../components/blood/BloodRequests';
import MyDonorProfile from '../components/blood/MyDonorProfile';

export default function Blood() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('donors');
  return (
    <div className="space-y-5">
      <PageHeader title={t('blood.title')} subtitle={t('blood.subtitle')} icon={Droplets} tile="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" />
      <Notice tone="warn">{t('blood.disclaimer')}</Notice>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'donors', label: t('blood.tab.donors') },
          { value: 'requests', label: t('blood.tab.requests') },
          { value: 'mine', label: t('blood.tab.mine') },
        ]}
      />
      {tab === 'donors' && <DonorSearch />}
      {tab === 'requests' && <BloodRequests />}
      {tab === 'mine' && <MyDonorProfile />}
    </div>
  );
}
