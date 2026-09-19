import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Users, Wallet, MapPin, Star,
  ArrowLeft, MessageSquare, Sparkles
} from 'lucide-react';
import api from '../services/api';
import BackButton from '../components/BackButton';
import { fmtDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { TruckMark, EventMark } from '../components/BrandMarks';

function money(n) {
  return n == null ? null : `$${Number(n).toFixed(2)}`;
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/listings/${id}`);
        setListing(res.data.listing);
      } catch (err) {
        setError(err?.response?.data?.error || 'Listing not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleMessage() {
    if (!user) { navigate('/auth'); return; }
    setMessaging(true);
    try {
      const res = await api.post('/conversations', { listing_id: id });
      navigate(`/messages?conv=${res.data.conversation.id}`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not start a conversation.');
    } finally {
      setMessaging(false);
    }
  }

  if (loading) return <p className="p-8 text-center text-slate-500">Loading…</p>;
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-600">{error}</p>
      <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">← Back to listings</Link>
    </div>
  );

  const isVendor = listing.listing_type === 'vendor_service';
  const isBoosted = listing.is_boosted && new Date(listing.boost_expires_at) > new Date();
  const isOwner = user?.id === listing.user_id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <BackButton label="Back to listings" className="mb-4" />

      <div className="card overflow-hidden border border-slate-200/70 shadow-xl transition-shadow hover:shadow-2xl">
        <div className="relative h-64 w-full">
          {listing.photos?.length > 0 ? (
            <img src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover object-center" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-amber-100 text-slate-300 dark:from-slate-800 dark:to-slate-800 dark:text-slate-600">
              {isVendor ? <TruckMark className="h-16 w-16" /> : <EventMark className="h-16 w-16" />}
            </div>
          )}

          {isBoosted && (
            <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-md">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          )}
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{listing.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {listing.category} · posted by <span className="font-semibold">{listing.owner_name}</span>
              </p>
            </div>
            {isVendor && listing.price_amount != null && (
              <span className="rounded-lg bg-brand-50 px-3 py-1 text-lg font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                From ${Number(listing.price_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>

          <p className="text-slate-700 dark:text-slate-300">{listing.description}</p>

          <div className="grid gap-2 rounded-xl bg-sand-100 p-4 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" />
              {listing.city}, {listing.state_province}
            </span>
            {isVendor && (
              <span className="flex items-center gap-2">📍 Serves within {listing.service_radius_km} km</span>
            )}
            {!isVendor && listing.event_date && (
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-600" /> {fmtDate(listing.event_date)}
              </span>
            )}
            {!isVendor && listing.expected_guests && (
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-600" /> {listing.expected_guests} guests expected
              </span>
            )}
            {!isVendor && listing.budget_estimate && (
              <span className="flex items-center gap-2 font-semibold text-brand-600">
                <Wallet className="h-4 w-4" /> Budget {money(listing.budget_estimate)}
              </span>
            )}
          </div>

          <div className="rounded-xl bg-sand-100 p-4 dark:bg-slate-800/60">
            {isOwner ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This is your listing. Interested parties can message you directly.
                </p>
                {isBoosted ? (
                  <p className="flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
                    <Star className="h-4 w-4 fill-current" /> Featured
                    {listing.boost_expires_at && (
                      <span className="font-normal text-slate-500 dark:text-slate-400">
                        · until {new Date(listing.boost_expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                ) : (
                  <Link
                    to={`/boost?listing_id=${listing.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-600 bg-sand-50 px-4 py-3 font-semibold text-brand-700 hover:bg-brand-50 transition dark:border-brand-500 dark:bg-slate-900 dark:text-brand-300 dark:hover:bg-slate-800"
                  >
                    <Sparkles className="h-5 w-5" /> Boost this listing
                  </Link>
                )}
              </div>
            ) : (
              <button
                onClick={handleMessage}
                disabled={messaging}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition"
              >
                <MessageSquare className="h-5 w-5" />
                {messaging ? 'Opening chat…' : `Message ${listing.owner_name}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
