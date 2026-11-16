import { useState } from 'react';
import { Briefcase, Building2, MapPin, Plus, Wallet, ExternalLink, Trash2, Lock, Unlock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanTerm, contactHref, emptyToNull, errorKey, formatSalary, locationFilter, timeAgo, unwrap } from '../lib/db';
import { useAsync, useDebounced } from '../lib/useAsync';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { hasErrors, validateSalary, validateText } from '../lib/validators';
import PageHeader from '../components/ui/PageHeader';
import FilterChips from '../components/ui/FilterChips';
import SearchBar from '../components/ui/SearchBar';
import QueryState from '../components/ui/QueryState';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Sheet from '../components/ui/Sheet';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Notice from '../components/ui/Notice';
import ReportButton from '../components/report/ReportButton';

const TYPES = ['full_time', 'part_time', 'contract', 'internship', 'daily_wage'];
const BLANK = { title: '', company: '', description: '', requirements: '', city: '', district: '', job_type: '', salary_min: '', salary_max: '', apply_contact: '' };

export default function Jobs() {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();
  const toast = useToast();
  const [text, setText] = useState('');
  const [loc, setLoc] = useState('');
  const [type, setType] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const dText = useDebounced(text, 400);
  const dLoc = useDebounced(loc, 400);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const query = useAsync(async () => {
    let q = supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(100);
    if (type) q = q.eq('job_type', type);
    if (mineOnly) q = q.eq('posted_by', user.id);
    const term = cleanTerm(dText);
    if (term) q = q.or(`title.ilike.%${term}%,company.ilike.%${term}%`);
    q = locationFilter(q, dLoc);
    return unwrap(await q);
  }, [type, mineOnly, dText, dLoc]);

  const set = (f) => (e) => {
    setForm((x) => ({ ...x, [f]: e.target.value }));
    setErrors((x) => ({ ...x, [f]: '' }));
  };

  function openForm() {
    setForm({ ...BLANK, city: profile?.city || '', district: profile?.district || '', company: profile?.ngo_name || '' });
    setErrors({});
    setFormOpen(true);
  }

  async function submit() {
    const next = {
      title: validateText(form.title, { min: 3, max: 100 }),
      company: validateText(form.company, { min: 2, max: 100 }),
      description: validateText(form.description, { min: 10, max: 2000 }),
      requirements: validateText(form.requirements, { max: 1000, required: false }),
      city: validateText(form.city, { min: 2, max: 60 }),
      district: validateText(form.district, { max: 60, required: false }),
      job_type: TYPES.includes(form.job_type) ? '' : 'err.selectOne',
      salary_min: validateSalary(form.salary_min, form.salary_max),
      apply_contact: validateText(form.apply_contact, { min: 3, max: 200 }),
    };
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      unwrap(
        await supabase.from('jobs').insert({
          posted_by: user.id,
          title: form.title.trim(),
          company: form.company.trim(),
          description: form.description.trim(),
          requirements: emptyToNull(form.requirements),
          city: form.city.trim(),
          district: emptyToNull(form.district),
          job_type: form.job_type,
          salary_min: form.salary_min === '' ? null : Number(form.salary_min),
          salary_max: form.salary_max === '' ? null : Number(form.salary_max),
          apply_contact: form.apply_contact.trim(),
        })
      );
      toast.success(t('common.posted'));
      setFormOpen(false);
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(job) {
    try {
      unwrap(await supabase.from('jobs').update({ is_active: !job.is_active }).eq('id', job.id));
      toast.success(t('common.updated'));
      setSelected(null);
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    }
  }

  async function remove(job) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      unwrap(await supabase.from('jobs').delete().eq('id', job.id));
      toast.success(t('common.deleted'));
      setSelected(null);
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    }
  }

  const typeOptions = [{ value: '', label: t('common.all') }, ...TYPES.map((x) => ({ value: x, label: t(`jobs.type.${x}`) }))];
  const j = selected;
  const href = j ? contactHref(j.apply_contact) : null;

  return (
    <div className="space-y-5">
      <PageHeader title={t('jobs.title')} subtitle={t('jobs.subtitle')} icon={Briefcase} tile="bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" />
      <Button fullWidth icon={Plus} onClick={openForm}>
        {t('jobs.new')}
      </Button>

      <div className="space-y-2.5">
        <SearchBar value={text} onChange={setText} placeholder={t('common.searchText')} />
        <div className="flex gap-2">
          <SearchBar className="flex-1" value={loc} onChange={setLoc} placeholder={t('common.location')} />
          <button
            onClick={() => setMineOnly((m) => !m)}
            aria-pressed={mineOnly}
            className={`shrink-0 rounded-2xl border px-3.5 text-sm font-semibold transition ${
              mineOnly ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {t('common.mine')}
          </button>
        </div>
        <FilterChips label={t('jobs.type')} options={typeOptions} value={type} onChange={setType} />
      </div>

      <QueryState query={query} isEmpty={(d) => !d.length} emptyTitle={t('jobs.empty')}>
        {(rows) => (
          <div className="space-y-3">
            {rows.map((job) => (
              <Card as="button" key={job.id} onClick={() => setSelected(job)} className="block w-full space-y-2 text-left transition active:scale-[0.99]">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{job.title}</p>
                  {job.is_hidden && <Badge tone="red">{t('mod.hidden')}</Badge>}
                  {!job.is_active && <Badge>{t('jobs.closed')}</Badge>}
                </div>
                <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <Building2 className="h-4 w-4 shrink-0" />
                  {job.company}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="blue">{t(`jobs.type.${job.job_type}`)}</Badge>
                  <Badge tone="green" icon={Wallet}>
                    {formatSalary(job.salary_min, job.salary_max, t)}
                  </Badge>
                </div>
                <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {[job.city, job.district].filter(Boolean).join(', ')} · {timeAgo(job.created_at, lang)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </QueryState>

      <Sheet open={Boolean(j)} onClose={() => setSelected(null)} title={j?.title || ''}>
        {j && (
          <div className="space-y-4">
            <p className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
              <Building2 className="h-4 w-4" />
              {j.company}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="blue">{t(`jobs.type.${j.job_type}`)}</Badge>
              <Badge tone="green" icon={Wallet}>
                {formatSalary(j.salary_min, j.salary_max, t)}
              </Badge>
              <Badge icon={MapPin}>{[j.city, j.district].filter(Boolean).join(', ')}</Badge>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">{t('common.description')}</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{j.description}</p>
            </div>
            {j.requirements && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">{t('jobs.requirements')}</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{j.requirements}</p>
              </div>
            )}
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">{t('jobs.applyHow')}</h3>
              <p className="break-words text-sm text-slate-600 dark:text-slate-300">{j.apply_contact}</p>
            </div>
            {href && j.is_active && (
              <Button as="a" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" fullWidth icon={ExternalLink}>
                {t('jobs.apply')}
              </Button>
            )}
            {j.posted_by !== user.id && <ReportButton type="job" id={j.id} />}
            <Notice tone="warn">{t('jobs.safety')}</Notice>
            {j.posted_by === user.id && (
              <div className="grid gap-2">
                <Button variant="secondary" icon={j.is_active ? Lock : Unlock} onClick={() => toggleActive(j)}>
                  {j.is_active ? t('jobs.closeListing') : t('jobs.reopen')}
                </Button>
                <Button variant="ghost" icon={Trash2} onClick={() => remove(j)} className="text-red-600 dark:text-red-400">
                  {t('common.delete')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Sheet>

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title={t('jobs.new')}>
        <div className="space-y-4">
          <Input label={t('common.title')} maxLength={100} value={form.title} onChange={set('title')} error={errors.title && t(errors.title)} />
          <Input label={t('jobs.company')} maxLength={100} value={form.company} onChange={set('company')} error={errors.company && t(errors.company)} />
          <Select
            label={t('jobs.type')}
            placeholder={t('err.selectOne')}
            options={TYPES.map((x) => ({ value: x, label: t(`jobs.type.${x}`) }))}
            value={form.job_type}
            onChange={set('job_type')}
            error={errors.job_type && t(errors.job_type)}
          />
          <Textarea label={t('common.description')} maxLength={2000} value={form.description} onChange={set('description')} error={errors.description && t(errors.description)} />
          <Textarea label={`${t('jobs.requirements')} (${t('common.optional')})`} rows={3} maxLength={1000} value={form.requirements} onChange={set('requirements')} error={errors.requirements && t(errors.requirements)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('common.city')} maxLength={60} value={form.city} onChange={set('city')} error={errors.city && t(errors.city)} />
            <Input label={`${t('common.district')} (${t('common.optional')})`} maxLength={60} value={form.district} onChange={set('district')} error={errors.district && t(errors.district)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('jobs.salaryMin')} type="number" inputMode="numeric" min="0" value={form.salary_min} onChange={set('salary_min')} error={errors.salary_min && t(errors.salary_min)} />
            <Input label={t('jobs.salaryMax')} type="number" inputMode="numeric" min="0" value={form.salary_max} onChange={set('salary_max')} />
          </div>
          <Input label={t('jobs.applyContact')} maxLength={200} value={form.apply_contact} onChange={set('apply_contact')} error={errors.apply_contact && t(errors.apply_contact)} />
          <Button fullWidth loading={busy} onClick={submit}>
            {t('common.post')}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
