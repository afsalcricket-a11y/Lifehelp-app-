import { useState } from 'react';
import { GraduationCap, Plus, ExternalLink, CalendarClock, Eye, EyeOff, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanTerm, emptyToNull, errorKey, timeAgo, unwrap } from '../lib/db';
import { useAsync, useDebounced } from '../lib/useAsync';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { hasErrors, validateText, validateUrl } from '../lib/validators';
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

const CATS = ['study_material', 'scholarship', 'course', 'exam_prep'];
const LANGS = ['en', 'ta', 'both'];
const BLANK = { title: '', description: '', category: '', url: '', language: 'en', deadline: '' };

export default function Education() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [cat, setCat] = useState('');
  const [resLang, setResLang] = useState('');
  const [text, setText] = useState('');
  const dText = useDebounced(text, 400);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const query = useAsync(async () => {
    let q = supabase.from('education_resources').select('*').order('created_at', { ascending: false }).limit(100);
    if (cat) q = q.eq('category', cat);
    if (resLang) q = q.in('language', resLang === 'both' ? ['both'] : [resLang, 'both']);
    const term = cleanTerm(dText);
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    return unwrap(await q);
  }, [cat, resLang, dText]);

  const set = (f) => (e) => {
    setForm((x) => ({ ...x, [f]: e.target.value }));
    setErrors((x) => ({ ...x, [f]: '' }));
  };

  async function submit() {
    const next = {
      title: validateText(form.title, { min: 3, max: 120 }),
      description: validateText(form.description, { max: 1000, required: false }),
      category: CATS.includes(form.category) ? '' : 'err.selectOne',
      url: validateUrl(form.url),
    };
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      unwrap(
        await supabase.from('education_resources').insert({
          posted_by: user.id,
          title: form.title.trim(),
          description: emptyToNull(form.description),
          category: form.category,
          url: form.url.trim(),
          language: form.language,
          deadline: form.deadline || null,
        })
      );
      toast.success(t('common.posted'));
      setFormOpen(false);
      setForm(BLANK);
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(r) {
    try {
      unwrap(await supabase.from('education_resources').update({ is_active: !r.is_active }).eq('id', r.id));
      toast.success(t('common.updated'));
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    }
  }

  async function remove(r) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      unwrap(await supabase.from('education_resources').delete().eq('id', r.id));
      toast.success(t('common.deleted'));
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    }
  }

  const catOptions = [{ value: '', label: t('common.all') }, ...CATS.map((c) => ({ value: c, label: t(`edu.cat.${c}`) }))];
  const langOptions = [{ value: '', label: t('common.all') }, ...LANGS.map((l) => ({ value: l, label: t(`edu.lang.${l}`) }))];

  return (
    <div className="space-y-5">
      <PageHeader title={t('edu.title')} subtitle={t('edu.subtitle')} icon={GraduationCap} tile="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
      <Button fullWidth icon={Plus} onClick={() => { setErrors({}); setFormOpen(true); }}>
        {t('edu.new')}
      </Button>
      <Notice>{t('edu.note')}</Notice>

      <div className="space-y-2.5">
        <SearchBar value={text} onChange={setText} placeholder={t('common.searchText')} />
        <FilterChips label={t('common.category')} options={catOptions} value={cat} onChange={setCat} />
        <FilterChips label={t('edu.language')} options={langOptions} value={resLang} onChange={setResLang} />
      </div>

      <QueryState query={query} isEmpty={(d) => !d.length} emptyTitle={t('edu.empty')}>
        {(rows) => (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={r.id} className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={r.category === 'scholarship' ? 'amber' : 'brand'}>{t(`edu.cat.${r.category}`)}</Badge>
                  <Badge>{t(`edu.lang.${r.language}`)}</Badge>
                  {!r.is_active && <Badge tone="slate">{t('edu.hidden')}</Badge>}
                  {r.is_hidden && <Badge tone="red">{t('mod.hidden')}</Badge>}
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{r.title}</p>
                {r.description && <p className="text-sm text-slate-600 dark:text-slate-300">{r.description}</p>}
                {r.deadline && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {t('edu.ends')}: {new Date(r.deadline).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN')}
                  </p>
                )}
                <p className="text-xs text-slate-400">{timeAgo(r.created_at, lang)}</p>
                <Button as="a" href={r.url} target="_blank" rel="noopener noreferrer nofollow" fullWidth icon={ExternalLink}>
                  {t('edu.openLink')}
                </Button>
                {r.posted_by !== user.id && <ReportButton type="education" id={r.id} />}
                {r.posted_by === user.id && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" icon={r.is_active ? EyeOff : Eye} onClick={() => toggle(r)}>
                      {r.is_active ? t('edu.hide') : t('edu.show')}
                    </Button>
                    <Button variant="ghost" icon={Trash2} onClick={() => remove(r)} className="text-red-600 dark:text-red-400">
                      {t('common.delete')}
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </QueryState>

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title={t('edu.new')}>
        <div className="space-y-4">
          <Input label={t('common.title')} maxLength={120} value={form.title} onChange={set('title')} error={errors.title && t(errors.title)} />
          <Select
            label={t('common.category')}
            placeholder={t('err.selectOne')}
            options={CATS.map((c) => ({ value: c, label: t(`edu.cat.${c}`) }))}
            value={form.category}
            onChange={set('category')}
            error={errors.category && t(errors.category)}
          />
          <Input label={t('edu.url')} type="url" inputMode="url" autoCapitalize="none" maxLength={500} value={form.url} onChange={set('url')} error={errors.url && t(errors.url)} />
          <Textarea label={`${t('common.description')} (${t('common.optional')})`} rows={3} maxLength={1000} value={form.description} onChange={set('description')} error={errors.description && t(errors.description)} />
          <div className="grid grid-cols-2 gap-3">
            <Select label={t('edu.language')} placeholder="" options={LANGS.map((l) => ({ value: l, label: t(`edu.lang.${l}`) }))} value={form.language} onChange={set('language')} />
            <Input label={`${t('edu.deadline')} (${t('common.optional')})`} type="date" value={form.deadline} onChange={set('deadline')} />
          </div>
          <Button fullWidth loading={busy} onClick={submit}>
            {t('common.post')}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
