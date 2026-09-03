export default function CategoryFilter({ category, onChange, categories = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const isActive = category === c;
        const label = c === 'all' ? 'All' : c;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}