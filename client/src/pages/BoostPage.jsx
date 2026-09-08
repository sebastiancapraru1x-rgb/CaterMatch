import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowLeft, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BoostPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const preselectedListing = params.get('listing_id');
  const [tiers, setTiers] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(preselectedListing || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stripeInfo, setStripeInfo] = useState(null);

  useEffect(() => {
    api.get('/boosts').then((res) => setTiers(res.data.tiers || [])).catch(() => {});
    api.get('/boosts/stripe-status').then((res) => setStripeInfo(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/listings', { params: { mine: 'true' } })
      .then((res) => {
        const mine = res.data.listings || [];
        setMyListings(mine);
        // If a listing was preselected via URL, keep it.
        if (preselectedListing) setSelectedListing(preselectedListing);
        else if (mine.length && !selectedListing) setSelectedListing(mine[0].id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, preselectedListing]);

  async function buy(days) {
    setMessage(''); setError(''); setBusy(true);
    try {
      const res = await api.post('/boosts/checkout', { listing_id: selectedListing, days });
      if (res.data?.url) {
        window.location.href = res.data.url; // real Stripe redirect
      } else if (res.data?.dev_activated) {
        setMessage(`🎉 ${res.data.message}`);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const isSuccess = params.get('success') === '1';
  const isCanceled = params.get('canceled') === '1';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="mb-2 flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <Sparkles className="h-6 w-6 text-brand-600" /> Boost your listing
      </h1>
      <p className="mb-2 text-sm text-slate-500">
        Pin your listing to the top of search results in your area, with a <b>Featured</b> badge. No commissions — ever.
      </p>
      <p className="mb-6 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
        🚚 <b>Food trucks</b> boost to win more gigs. 🎪 <b>Event hosts</b> boost when you need caterers <b>fast</b> (urgent date, last-minute guest count) — matches the "Urgent / ASAP" urgency of an event gig.
      </p>

      {/* Stripe payment mode indicator — staff/dev only */}
      {stripeInfo?.is_staff && (
        <div className={`mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
          stripeInfo.enabled
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}>
          <Zap className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <b>{stripeInfo.enabled ? 'Stripe connected' : 'Dev mode — payments simulated'}</b>
            <p className="mt-0.5 text-xs opacity-90">{stripeInfo.message}</p>
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <b>Payment successful!</b> Your listing is now boosted and showing as Featured. 🎉
          </div>
        </div>
      )}
      {isCanceled && (
        <div className="mb-4 rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
          Payment canceled — no charge was made. You can try again anytime.
        </div>
      )}

      {!user ? (
        <div className="card p-6 text-center">
          <p className="text-slate-600">Log in to boost your listing.</p>
          <Link to="/auth" className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700">
            Log in
          </Link>
        </div>
      ) : (
        <>
          {/* Pick which listing */}
          <div className="card mb-6 p-5">
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Which listing do you want to boost?
            </label>
            {myListings.length === 0 ? (
              <p className="text-sm text-slate-500">
                You don't have any active listings yet.{' '}
                <Link to="/listings/new" className="text-brand-600 hover:underline">Post one first →</Link>
              </p>
            ) : (
              <>
                <select
                  value={selectedListing}
                  onChange={(e) => setSelectedListing(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {myListings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.listing_type === 'host_gig' ? '🎪' : '🚚'} {l.title}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Boosting works for both your food-truck services <b>and</b> event-gig requests.
                </p>
              </>
            )}
          </div>

          {/* Tier cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {tiers.map((t) => (
              <div key={t.days} className="card flex flex-col p-5">
                <h3 className="font-bold text-slate-900">{t.label}</h3>
                <p className="mt-2 text-3xl font-extrabold text-brand-600">${t.amount.toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-500">one-time · you keep your earnings</p>
                <button
                  onClick={() => buy(t.days)}
                  disabled={busy || !selectedListing}
                  className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {busy ? 'Please wait…' : `Boost — ${t.days} days`}
                </button>
              </div>
            ))}
          </div>

          {message && (
            <p className="mt-4 rounded-lg bg-orange-50 p-4 text-sm text-orange-800">{message}</p>
          )}
          {error && <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}

          <p className="mt-6 flex items-start gap-1 text-xs text-slate-400">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Payments are handled by Stripe. CaterMatch only charges the boost fee — never a commission on your bookings.
          </p>
        </>
      )}
    </div>
  );
}