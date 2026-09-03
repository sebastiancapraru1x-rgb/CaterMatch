import { useState, useEffect, useCallback } from 'react';
import { Truck, CalendarDays } from 'lucide-react';
import api from '../services/api';
import MarketplaceToggle from '../components/MarketplaceToggle';
import RadiusPicker from '../components/RadiusPicker';
import CategoryFilter from '../components/CategoryFilter';
import ListingCard from '../components/ListingCard';
import Header from '../components/Header';

const CATEGORIES = [
  'all', 'Ice Cream', 'Tacos', 'BBQ', 'Desserts', 'Coffee/Beverage',
  'Pizza', 'Vegan', 'Halal', 'Other',
];

const RADIUS_OPTIONS = [10, 25, 50, 100];

export default function BrowsePage() {
  const [mode, setMode] = useState('vendor_service'); // 'vendor_service' | 'host_gig'
  const [radius, setRadius] = useState(50);
  const [category, setCategory] = useState('all');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="min-h-screen">
      <Header mode={mode} />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Dual marketplace toggle */}
        <MarketplaceToggle mode={mode} onChange={setMode} />

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <RadiusPicker radius={radius} onChange={setRadius} options={RADIUS_OPTIONS} />
          <CategoryFilter category={category} onChange={setCategory} categories={CATEGORIES} />

          <button
            onClick={fetchListings}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Refresh
          </button>
        </div>

        {/* Feed */}
        <section className="mt-6">
          <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
            {mode === 'vendor_service' ? (
              <><Truck className="h-5 w-5 text-brand-600" /> Food trucks near you</>
            ) : (
              <><CalendarDays className="h-5 w-5 text-brand-600" /> Event gigs near you</>
            )}
          </h1>

          {loading && <p className="py-10 text-center text-slate-500">Loading listings…</p>}
          {error && <p className="py-10 text-center text-red-600">{error}</p>}

          {!loading && !error && listings.length === 0 && (
            <p className="py-10 text-center text-slate-500">
              No {mode === 'vendor_service' ? 'food trucks' : 'event gigs'} found yet.
              {mode === 'host_gig' ? ' Check back soon!' : ' Be the first to post one!'}
            </p>
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