export default function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex-1 rounded-xl px-2 py-2.5 text-[13px] font-semibold leading-tight transition ${
            value === tab.value
              ? 'bg-white text-brand-700 shadow dark:bg-slate-700 dark:text-brand-300'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
