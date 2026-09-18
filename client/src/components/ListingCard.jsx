import { MapPin, Users, CalendarDays, Wallet, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TruckMark, EventMark } from './BrandMarks';

function money(n) {
  return n == null ? null : '$' + Number(n).toFixed(2);
}

function fmtPrice(listing) {
  if (listing.price_amount != null && !isNaN(listing.price_amount)) {
    return `From $${Number(listing.price_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  return null;
}

export default function ListingCard({ listing }) {
  const isVendor = listing.listing_type === 'vendor_service';
  const isBoosted = listing.is_boosted && new Date(listing.boost_expires_at) > new Date();

  return (
    <Link
      to={'/listings/' + listing.id}
      className={'group relative flex flex-col overflow-hidden card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift ' + (isBoosted ? 'ring-2 ring-brand-500/60' : '')}
    >
      {isBoosted && (
        <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-brand-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          <Star className="h-3 w-3 fill-current" /> Featured
        </span>
      )}

      <div className="h-44 w-full overflow-hidden bg-gradient-to-br from-brand-100 to-amber-100">
        {listing.photos && listing.photos.length > 0 ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
            {isVendor ? <TruckMark className="h-10 w-10" /> : <EventMark className="h-10 w-10" />}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-bold tracking-tight text-slate-900 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">
            {listing.title}
          </h3>
          {isVendor && fmtPrice(listing) && (
            <span className="shrink-0 rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {fmtPrice(listing)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" /> {listing.city}
          </span>
          {isVendor && listing.service_radius_km && (
            <span>· within {listing.service_radius_km} km</span>
          )}
          {!isVendor && listing.event_date && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" /> {listing.event_date}
            </span>
          )}
          {!isVendor && listing.expected_guests && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-slate-400" /> {listing.expected_guests}
            </span>
          )}
        </div>

        {!isVendor && listing.budget_estimate && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
            <Wallet className="h-4 w-4" /> Budget {money(listing.budget_estimate)}
          </span>
        )}

        <span className="mt-auto inline-block truncate pt-1 text-xs text-slate-400 dark:text-slate-500">
          {listing.category} · @{listing.owner_name}
        </span>
      </div>
    </Link>
  );
}
