import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Mail, Phone, CalendarDays, Moon, Sun, LogOut, PlusCircle,
  Building2, Sparkles, Check,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import { fmtDate } from '../lib/format';

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'preferences' ? 'preferences' : 'account';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    let alive = true;
    api.get('/listings?mine=true')
      .then((res) => { if (alive) setListings(res.data.listings || []); })
      .catch(() => { if (alive) setListings([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('dark', next);
    document.documentElement.classList.toggle('dark', next);
  }

  const joined = user?.created_at ? fmtDate(user.created_at) : null;

  const TABS = [
    { key: 'account', label: 'Account', icon: Building2 },
    { key: 'preferences', label: 'Preferences', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-slate-950">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <BackButton className="mb-4" />

      <section className="card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-brand-500 via-brand-600 to-amber-500" />
        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-10 flex items-end gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sand-50 text-2xl font-extrabold text-brand-600 ring-4 ring-sand-50 dark:bg-slate-900 dark:text-brand-400 dark:ring-slate-900">
              {initials(user?.full_name)}
            </span>
            <div className="pb-1">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {user?.full_name || 'Your profile'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-sand-100 p-3 dark:bg-slate-800/60">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5" /> Email
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user?.email || '—'}
              </dd>
            </div>
            <div className="rounded-xl bg-sand-100 p-3 dark:bg-slate-800/60">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Phone className="h-3.5 w-3.5" /> Phone
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user?.phone_number || 'Not added'}
              </dd>
            </div>
            <div className="rounded-xl bg-sand-100 p-3 dark:bg-slate-800/60">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" /> Member since
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                {joined || '—'}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-5 flex gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setParams(key === 'account' ? {} : { tab: key }, { replace: true })}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              tab === key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-sand-300 bg-sand-50 text-slate-600 hover:bg-sand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'account' ? (
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              My listings ({listings.length})
            </h2>
            <Link
              to="/listings/new"
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              <PlusCircle className="h-4 w-4" /> Post a listing
            </Link>
          </div>

          {loading ? (
            <p className="card p-6 text-center text-sm text-slate-500">Loading your listings…</p>
          ) : listings.length === 0 ? (
            <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center">
              <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You haven&apos;t posted anything yet.
              </p>
              <Link
                to="/listings/new"
                className="mt-1 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Post your first listing
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </section>
      ) : (
        <section className="card mt-4 divide-y divide-sand-200 dark:divide-slate-800">
          <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Appearance</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {dark ? 'Dark mode is on' : 'Light mode is on'}
              </p>
            </div>
            <button
              onClick={toggleDark}
              className="flex items-center gap-2 rounded-xl border border-sand-300 bg-sand-50 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {dark ? 'Light' : 'Dark'}
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 sm:p-5">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Direct messaging</p>
              <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Always free — no commissions, ever
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <button
              onClick={() => { logout(); navigate('/auth'); }}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
