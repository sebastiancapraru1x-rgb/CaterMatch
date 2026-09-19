import { MapPin } from 'lucide-react';

export default function RadiusPicker({ radius, onChange, options = [10, 25, 50, 100] }) {
  return (
    <label className="flex shrink-0 items-center gap-2 rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <MapPin className="h-4 w-4 text-slate-400" />
      <span className="font-medium text-slate-600 dark:text-slate-400">Radius</span>
      <select
        value={radius}
        onChange={(e) => onChange(Number(e.target.value))}
        className="text-sm font-semibold text-slate-800 focus:outline-none dark:bg-slate-800 dark:text-slate-200"
      >
        {options.map((r) => (
          <option key={r} value={r}>{r} km</option>
        ))}
      </select>
    </label>
  );
}