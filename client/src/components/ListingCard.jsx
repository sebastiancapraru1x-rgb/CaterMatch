import { MapPin, Users, CalendarDays, Wallet, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

function money(n) {
  return n == null ? null : '$' + Number(n).toFixed(2);
}

export default function ListingCard({ listing }) {
  const isVendor = listing.listing_type === 'vendor_service';
  const isBoosted = listing.is_boosted && new Date(listing.boost_expires_at) > new Date();

  return (
    <Link
      to={'/listings/' + listing.id}
      className={'group relative flex flex-col overflow-hidden card transition-transform hover:-translate-y-0.5 hover:shadow-lg ' + (isBoosted ? 'ring-2 ring-brand-500' : '')}
    >
      {isBoosted && (
        <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
          <Star className="h-3 w-3 fill-current" /> Featured
        </span>
      )}

      <div className="h-40 w-full bg-gradient-to-br from-orange-100 to-amber-50">
        {listing.photos && listing.photos.length > 0 ? (
          <img src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {isVendor ? '🚚' : '🎪'}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-bold text-slate-900 group-hover:text-brand-600">
            {listing.title}
          </h3>
          {isVendor && listing.price_tier && (
            <span className="shrink-0 text-sm font-bold text-slate-500">{listing.price_tier}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {listing.city}
          </span>
          {isVendor && listing.service_radius_km && (
            <span>📍 serves within {listing.service_radius_km} km</span>
          )}
          {!isVendor && listing.event_date && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {listing.event_date}
            </span>
          )}
          {!isVendor && listing.expected_guests && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {listing.expected_guests}
            </span>
          )}
        </div>

        {!isVendor && listing.budget_estimate && (
          <span className="flex items-center gap-1 text-sm font-bold text-brand-600">
            <Wallet className="h-4 w-4" /> Budget {money(listing.budget_estimate)}
          </span>
        )}

        <span className="mt-auto inline-block pt-2 text-xs text-slate-400">
          {listing.category} · @{listing.owner_name}
        </span>
      </div>
    </Link>
  );
}
