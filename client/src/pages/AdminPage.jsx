import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, ArrowLeft, ShieldCheck, Users, LayoutGrid,
  Zap, Wallet, Plus, Trash2,
} from 'lucide-react';
import api from '../services/api';
import BackButton from '../components/BackButton';

export default function AdminPage() {
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [txns, setTxns] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await api.get('/admin/me');
        setMe(meRes.data);
        const [s, u, st, t] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/staff'),
          api.get('/admin/transactions'),
        ]);
        setStats(s.data);
        setUsers(u.data.users);
        setStaff(st.data.staff);
        setTxns(t.data.transactions);
      } catch (err) {
        setError(err.response?.data?.error || 'Access denied');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addStaff(e) {
    e.preventDefault();
    try {
      await api.post('/admin/staff', { email: emailInput });
      setEmailInput('');
      const res = await api.get('/admin/staff');
      setStaff(res.data.staff);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  }

  async function removeStaff(email) {
    if (!confirm(`Remove ${email} from staff?`)) return;
    await api.delete(`/admin/staff/${encodeURIComponent(email)}`);
    const res = await api.get('/admin/staff');
    setStaff(res.data.staff);
  }

  if (loading) return <p className="p-8 text-center text-slate-500">Loading…</p>;
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;
  if (!me?.is_staff) return <p className="p-8 text-center text-red-500">Staff access required</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackButton label="Back to browse" className="mb-4" />

      <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-brand-600 p-5 text-white shadow-brand-glow">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <Settings className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">Dev Panel</h1>
              <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-white/20">
                internal
              </span>
            </div>
            <p className="text-sm text-white/80">Internal tools — staff only.</p>
          </div>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" /> {me.user.email}
          </span>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-sand-200 bg-sand-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Logged in as</h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="text-slate-800 dark:text-slate-200">{me.user.full_name}</span>
          <span className="text-slate-500 dark:text-slate-400">{me.user.email}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Staff
          </span>
        </div>
      </section>

      {stats && (
        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Users" value={stats.users} icon={Users} accent="bg-brand-100 text-brand-700" />
          <StatCard label="Active listings" value={stats.active_listings} icon={LayoutGrid} accent="bg-sky-100 text-sky-700" />
          <StatCard label="Boosted" value={stats.boosted_listings} icon={Zap} accent="bg-amber-100 text-amber-700" />
          <StatCard label="Revenue" value={`$${stats.boost_revenue}`} icon={Wallet} accent="bg-green-100 text-green-700" />
        </section>
      )}

      <StaffSection staff={staff} emailInput={emailInput} setEmailInput={setEmailInput} addStaff={addStaff} removeStaff={removeStaff} />
      <UsersSection users={users} />
      <TransactionsSection txns={txns} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-sand-200 bg-sand-50 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lift dark:border-slate-700 dark:bg-slate-900">
      <span className={`absolute inset-x-0 top-0 h-1 ${accent.replace('text-', 'bg-').split(' ')[0]} opacity-70 transition-opacity group-hover:opacity-100`} />
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-6 rounded-2xl border border-sand-200 bg-sand-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        <span className="inline-block h-1 w-5 rounded-full bg-brand-500" />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StaffSection({ staff, emailInput, setEmailInput, addStaff, removeStaff }) {
  return (
    <Section title="Staff members">
      <form onSubmit={addStaff} className="flex gap-2">
        <input
          type="email"
          placeholder="Add email..."
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          required
        />
        <button className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 dark:bg-brand-500">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      {staff.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No staff members yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
          {staff.map((s) => (
            <li key={s.email} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{s.email}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Added by {s.added_by || 'system'}</p>
              </div>
              <button
                onClick={() => removeStaff(s.email)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function UsersSection({ users }) {
  return (
    <Section title={`Registered users (${users.length})`}>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2.5">User</th>
              <th className="px-3 py-2.5">Email</th>
              <th className="px-3 py-2.5">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-sand-50 dark:hover:bg-slate-800">
                <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">{u.full_name}</td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{u.email}</td>
                <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">
                  {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function TransactionsSection({ txns }) {
  return (
    <Section title={`Boost transactions (${txns.length})`}>
      {txns.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No transactions yet. Boosts will appear here.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2.5">User</th>
                <th className="px-3 py-2.5">Listing</th>
                <th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">Days</th>
                <th className="px-3 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {txns.map((t) => (
                <tr key={t.id} className="hover:bg-sand-50 dark:hover:bg-slate-800">
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{t.user_email}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">{t.listing_title}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100">${t.amount_paid}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{t.boost_duration_days}</td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">
                    {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}