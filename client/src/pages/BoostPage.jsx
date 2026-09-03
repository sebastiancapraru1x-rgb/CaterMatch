import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function BoostPage() {
  const [tiers, setTiers] = useState([]);
  const [busy, setBusy] = useState(false);

  useState(() => {
    api.get('/boosts').then((res) => setTiers(res.data.tiers || [])).catch(() => {});
  }, []);

  async function buy(days) {
    setBusy(true);
    // Stripe checkout is wired in M4 — this fires a clear 501 for now.
    try {
      const res = await api.post('/boosts/checkout', { listing_id: null, days });
      if (res.data?.url) window.location.href = res.data.url;
    } catch (err) {
      alert(err?.response?.data?.error || 'Boost checkout is coming in M4.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="mb-2 flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <Sparkles className="h-6 w-6 text-brand-600" /> Boost your listing
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Pin your listing to the top of search results in your area, with a Featured badge.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.days} className="card flex flex-col p-5">
            <h3 className="font-bold text-slate-900">{t.label}</h3>
            <p className="mt-2 text-3xl font-extrabold text-brand-600">${t.amount}</p>
            <p className="mt-1 text-xs text-slate-500">one-time, you keep your earnings</p>
            <button
              onClick={() => buy(t.days)}
              disabled={busy}
              className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Boost now
            </button>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Payments are processed by Stripe. CaterMatch charges only the boost fee — never a commission on your bookings.
      </p>
    </div>
  );
}