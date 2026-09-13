import { useState, useEffect, useCallback } from 'react';
import { Truck, CalendarDays, SlidersHorizontal, SearchX } from 'lucide-react';
import api from '../services/api';
import MarketplaceToggle from '../components/MarketplaceToggle';
import RadiusPicker from '../components/RadiusPicker';
import ListingCard from '../components/ListingCard';
import Header from '../components/Header';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'Ice Cream', label: 'Ice Cream' },
  { value: 'Tacos', label: 'Tacos' },
  { value: 'BBQ', label: 'BBQ' },
  { value: 'Desserts', label: 'Desserts' },
  { value: 'Coffee/Beverage', label: 'Coffee/Beverage' },
  { value: 'Pizza', label: 'Pizza' },
  { value: 'Vegan', label: 'Vegan' },
  { value: 'Halal', label: 'Halal' },
  { value: 'Other', label: 'Other' },
];

const RADIUS_OPTIONS = [10, 25, 50, 100];

export default function BrowsePage() {
  const [mode, setMode] = useState('vendor_service');
  const [radius, setRadius] = useState(50);
  const [category, setCategory] = useState('all');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catOpen, setCatOpen] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/listings', {
        params: {
          type: mode,
          radius,
          category: category === 'all' ? undefined : category,
        },
      });
      setListings(res.data.listings || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load listings.');
    } finally {
      setLoading(false);
    }
  }, [mode, radius, category]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const selectedCat = CATEGORIES.find((c) => c.value === category) || CATEGORIES[0];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header mode={mode} />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 shadow-sm ring-1 ring-orange-200/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-500/90 dark:text-orange-400/80">
              The open marketplace
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-slate-100">
              {mode === 'vendor_service'
                ? 'Book the best food trucks near you'
                : 'Find your next event gig'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              100% free — talk directly to {mode === 'vendor_service' ? 'vendors' : 'hosts'}. No commissions, ever.
            </p>
            <div className="mt-5">
              <MarketplaceToggle mode={mode} onChange={setMode} />
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-md ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-900 sm:flex sm:items-center sm:gap-3 sm:p-4">
          <RadiusPicker radius={radius} onChange={setRadius} options={RADIUS_OPTIONS} />

          <div className="relative mt-2 sm:mt-0 sm:flex-1">
            <button
              onClick={() => setCatOpen(!catOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-brand-400 dark:border-slate-600 dark:text-slate-300"
            >
              <span>{selectedCat.label}</span>
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            </button>

            {catOpen && (
              <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 z-10">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => { setCategory(c.value); setCatOpen(false); }}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      category === c.value
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={fetchListings}
            className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 sm:mt-0"
          >
            Refresh
          </button>
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-slate-100">
              {mode === 'vendor_service' ? (
                <span className="inline-flex items-center gap-2"><Truck className="h-5 w-5 text-brand-600" /> Food trucks near you</span>
              ) : (
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-5 w-5 text-brand-600" /> Event gigs near you</span>
              )}
            </h1>
            <span className="ml-auto rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              {listings.length} {listings.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {loading && <p className="py-10 text-center text-slate-500">Loading listings…</p>}
          {error && <p className="py-10 text-center text-red-600">{error}</p>}

          {!loading && !error && listings.length === 0 && (
            <div className="py-16 text-center">
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <SearchX className="h-8 w-8 text-slate-400" />
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                No {mode === 'vendor_service' ? 'food trucks' : 'event gigs'} found.
              </p>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                Try adjusting your filters — or be the first to post one!
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}