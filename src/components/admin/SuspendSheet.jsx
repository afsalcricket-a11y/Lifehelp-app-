import { useState } from 'react';
import { Ban } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { emptyToNull, errorKey, unwrap } from '../../lib/db';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import Sheet from '../ui/Sheet';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Notice from '../ui/Notice';

// user: { id, full_name }
export default function SuspendSheet({ user, onClose, onDone }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      unwrap(await supabase.rpc('admin_set_suspended', { p_user_id: user.id, p_suspended: true, p_reason: emptyToNull(reason) }));
      toast.success(t('common.updated'));
      setReason('');
      onDone();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={Boolean(user)} onClose={onClose} title={`${t('admin.users.suspendTitle')}: ${user?.full_name || ''}`}>
      <div className="space-y-4">
        <Notice tone="warn">{t('admin.users.suspendText')}</Notice>
        <Textarea label={t('admin.users.reason')} rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button variant="danger" fullWidth icon={Ban} loading={busy} onClick={confirm}>
          {t('admin.users.suspend')}
        </Button>
      </div>
    </Sheet>
  );
}
