import { MapPin } from 'lucide-react';

export default function RadiusPicker({ radius, onChange, options = [10, 25, 50, 100] }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <MapPin className="h-4 w-4 text-slate-400" />
      <span className="font-medium text-slate-600">Radius</span>
      <select
        value={radius}
        onChange={(e) => onChange(Number(e.target.value))}
        className="text-sm font-semibold text-slate-800 focus:outline-none"
      >
        {options.map((r) => (
          <option key={r} value={r}>{r} km</option>
        ))}
      </select>
    </label>
  );
}