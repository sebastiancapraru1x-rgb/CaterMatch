import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Ice Cream', 'Tacos', 'BBQ', 'Desserts', 'Coffee/Beverage',
  'Pizza', 'Vegan', 'Halal', 'Other',
];

const DEFAULT_CITY_COORDS = { lat: 43.6532, lng: -79.3832 }; // Toronto (dev default)

export default function CreateListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState('vendor_service');
  const [form, setForm] = useState({
    title: '', description: '', category: 'Tacos',
    city: '', state_province: '', postal_code: '',
    service_radius_km: 50, price_tier: '$$',
    event_date: '', expected_guests: '', budget_estimate: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = {
        listing_type: type,
        latitude: DEFAULT_CITY_COORDS.lat,
        longitude: DEFAULT_CITY_COORDS.lng,
        ...form,
        expected_guests: form.expected_guests ? Number(form.expected_guests) : null,
        budget_estimate: form.budget_estimate ? Number(form.budget_estimate) : null,
        service_radius_km: type === 'vendor_service' ? Number(form.service_radius_km) : null,
        price_tier: type === 'vendor_service' ? form.price_tier : null,
      };
      await api.post('/listings', payload);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not create listing.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-extrabold text-slate-900">Post a listing</h1>
      <p className="mb-6 text-sm text-slate-500">100% free — no commissions, ever.</p>

      {/* Type selector */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
        <button
          onClick={() => setType('vendor_service')}
          className={`rounded-lg px-3 py-3 text-sm font-semibold ${type === 'vendor_service' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-orange-50'}`}
        >
          🚚 I'm a vendor (offer food service)
        </button>
        <button
          onClick={() => setType('host_gig')}
          className={`rounded-lg px-3 py-3 text-sm font-semibold ${type === 'host_gig' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-orange-50'}`}
        >
          🎪 I'm a host (need catering)
        </button>
      </div>

      {!user && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          You'll need to log in before posting.
        </p>
      )}

      <form onSubmit={submit} className="card space-y-4 p-6">
        {/* Common fields */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {type === 'vendor_service' ? 'Truck / business name' : 'Event title'}
          </label>
          <input value={form.title} onChange={set('title')} required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
          <select value={form.category} onChange={set('category')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea value={form.description} onChange={set('description')} required rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
            <input value={form.city} onChange={set('city')} required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">State / Province</label>
            <input value={form.state_province} onChange={set('state_province')} required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Postal code (opt.)</label>
            <input value={form.postal_code} onChange={set('postal_code')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>

        {/* Vendor-only fields */}
        {type === 'vendor_service' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Service radius (km)</label>
                <select value={form.service_radius_km} onChange={set('service_radius_km')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  {[10, 25, 50, 100].map((r) => <option key={r}>{r} km</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Price tier</label>
                <select value={form.price_tier} onChange={set('price_tier')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option>$</option><option>$$</option><option>$$$</option><option>$$$$</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Host-only fields */}
        {type === 'host_gig' && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Event date</label>
                <input type="date" value={form.event_date} onChange={set('event_date')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Expected guests</label>
                <input type="number" value={form.expected_guests} onChange={set('expected_guests')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Budget ($)</label>
                <input type="number" value={form.budget_estimate} onChange={set('budget_estimate')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy || !user}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? 'Posting…' : 'Post listing'}
        </button>

        {/* NEXT_PART */}
      </form>
    </div>
  );
}