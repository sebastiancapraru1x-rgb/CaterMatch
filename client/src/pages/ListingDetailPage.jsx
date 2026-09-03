import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Wallet, MapPin, Star, ArrowLeft, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>

      <div className="card overflow-hidden">
        {/* banner */}
        <div className="relative flex h-56 w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50">
          {listing.photos?.length > 0 ? (
            <img src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-6xl">{isVendor ? '🚚' : '🎪'}</span>
          )}
          {isBoosted && (
            <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          )}
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{listing.title}</h1>
              <p className="text-sm text-slate-500">
                {listing.category} · posted by <span className="font-semibold">{listing.owner_name}</span>
              </p>
            </div>
            {isVendor && listing.price_tier && (
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-lg font-bold text-slate-700">
                {listing.price_tier}
              </span>
            )}
          </div>

          <p className="text-slate-700">{listing.description}</p>

          <div className="grid gap-2 rounded-xl bg-orange-50/60 p-4 text-sm text-slate-700 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" />
              {listing.city}, {listing.state_province}
            </span>

            {isVendor && (
              <span className="flex items-center gap-2">
                📍 Serves within {listing.service_radius_km} km
              </span>
            )}

            {!isVendor && listing.event_date && (
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-600" /> {listing.event_date}
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

          {/* Message CTA */}
          <div className="rounded-xl bg-slate-50 p-4">
            {isOwner ? (
              <p className="text-sm text-slate-500">
                This is your listing. Interested buyers and hosts can message you here.
              </p>
            ) : (
              <button
                onClick={handleMessage}
                disabled={messaging}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
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