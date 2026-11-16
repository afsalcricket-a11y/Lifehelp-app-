import { useState } from 'react';
import { Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { emptyToNull, errorKey, unwrap } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { validateText } from '../../lib/validators';
import Sheet from '../ui/Sheet';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Notice from '../ui/Notice';

const REASONS = ['spam', 'scam', 'inappropriate', 'harassment', 'false_info', 'other'];

// type: help_request | job | education | donation | blood_request | profile
export default function ReportButton({ type, id, className = '' }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (!user || user.id === id) return null; // nobody reports their own profile

  async function submit() {
    const next = {
      reason: REASONS.includes(reason) ? '' : 'err.selectOne',
      details: validateText(details, { max: 500, required: false }),
    };
    setErrors(next);
    if (next.reason || next.details) return;
    setBusy(true);
    try {
      unwrap(
        await supabase.from('reports').insert({
          reporter_id: user.id,
          target_type: type,
          target_id: id,
          reason,
          details: emptyToNull(details),
        })
      );
      toast.success(t('report.sent'));
      setOpen(false);
      setReason('');
      setDetails('');
    } catch (e) {
      toast.error(e?.code === '23505' ? t('report.already') : t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-slate-500 transition hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 ${className}`}
      >
        <Flag className="h-3.5 w-3.5" />
        {t('report.button')}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={`${t('report.title')} · ${t(`report.type.${type}`)}`}>
        <div className="space-y-4">
          <Notice>{t('report.note')}</Notice>
          <Select
            label={t('report.reason')}
            placeholder={t('err.selectOne')}
            options={REASONS.map((r) => ({ value: r, label: t(`report.reason.${r}`) }))}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((x) => ({ ...x, reason: '' }));
            }}
            error={errors.reason && t(errors.reason)}
          />
          <Textarea
            label={t('report.details')}
            rows={3}
            maxLength={500}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            error={errors.details && t(errors.details)}
          />
          <Button fullWidth icon={Flag} loading={busy} onClick={submit}>
            {t('report.submit')}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
