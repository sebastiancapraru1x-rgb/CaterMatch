import { Truck, CalendarDays } from 'lucide-react';

const MODES = [
  { key: 'vendor_service', label: 'Browse Food Trucks', icon: Truck },
  { key: 'host_gig', label: 'Browse Event Gigs', icon: CalendarDays },
];

export default function MarketplaceToggle({ mode, onChange }) {
  return (
    <div className="grid w-full grid-cols-2 gap-2 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
      {MODES.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          aria-pressed={mode === key}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
            mode === key
              ? 'bg-brand-600 text-white shadow'
              : 'text-slate-600 hover:bg-orange-50'
          }`}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </div>
  );
}