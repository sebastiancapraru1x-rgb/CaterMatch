import { useState, useEffect, useCallback } from 'react';
import { Truck, CalendarDays, SlidersHorizontal } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header mode={mode} />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <MarketplaceToggle mode={mode} onChange={setMode} />

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:flex sm:items-center sm:gap-3 sm:p-4">
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

        <section className="mt-6">
          <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            {mode === 'vendor_service' ? (
              <><Truck className="h-5 w-5 text-brand-600" /> Food trucks near you</>
            ) : (
              <><CalendarDays className="h-5 w-5 text-brand-600" /> Event gigs near you</>
            )}
          </h1>

          {loading && <p className="py-10 text-center text-slate-500">Loading listings…</p>}
          {error && <p className="py-10 text-center text-red-600">{error}</p>}

          {!loading && !error && listings.length === 0 && (
            <div className="py-16 text-center">
              <div className="mb-4 text-5xl">📭</div>
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