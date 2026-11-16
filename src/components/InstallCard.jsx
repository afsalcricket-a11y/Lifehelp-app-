import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Card from './ui/Card';
import Button from './ui/Button';

const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// "Add to Home Screen": uses the browser's install prompt where available, otherwise shows how to do it.
export default function InstallCard() {
  const { t } = useLanguage();
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onBefore = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    promptEvent.prompt();
    try {
      await promptEvent.userChoice;
    } finally {
      setPromptEvent(null);
    }
  }

  if (installed) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
        {t('install.done')}
      </p>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white">{t('install.title')}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('install.text')}</p>
        </div>
      </div>
      {promptEvent ? (
        <Button fullWidth icon={Download} onClick={install}>
          {t('install.button')}
        </Button>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">{isIos() ? t('install.ios') : t('install.manual')}</p>
      )}
    </Card>
  );
}
