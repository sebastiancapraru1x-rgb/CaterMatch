import { useState, useEffect } from 'react';
import api from '../services/api';

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
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <a href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← Back to browse
      </a>
      <h1 className="text-3xl font-bold">⚙️ Dev Panel</h1>
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Logged in as</h2>
        <p><span className="font-medium">Name:</span> {me.user.full_name}</p>
        <p><span className="font-medium">Email:</span> {me.user.email}</p>
        <p><span className="font-medium">Staff:</span> ✅ Yes</p>
      </section>
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Users" value={stats.users} />
          <StatCard label="Active Listings" value={stats.active_listings} />
          <StatCard label="Boosted" value={stats.boosted_listings} />
          <StatCard label="Revenue" value={`$${stats.boost_revenue}`} />
        </section>
      )}
      <StaffSection staff={staff} emailInput={emailInput} setEmailInput={setEmailInput} addStaff={addStaff} removeStaff={removeStaff} />
      <UsersSection users={users} />
      <TransactionsSection txns={txns} />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function StaffSection({ staff, emailInput, setEmailInput, addStaff, removeStaff }) {
  return (
    <section className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Staff Members</h2>
      <form onSubmit={addStaff} className="flex gap-2 mb-4">
        <input
          type="email"
          placeholder="Add email…"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
          required
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
      </form>
      <ul className="divide-y">
        {staff.map((s) => (
          <li key={s.email} className="py-2 flex justify-between items-center">
            <span>{s.email} <span className="text-xs text-slate-400">(added by {s.added_by})</span></span>
            <button onClick={() => removeStaff(s.email)} className="text-red-500 text-sm hover:underline">Remove</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UsersSection({ users }) {
  return (
    <section className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Registered Users ({users.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr><th>Email</th><th>Name</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-2">{u.email}</td>
                <td>{u.full_name}</td>
                <td className="text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TransactionsSection({ txns }) {
  return (
    <section className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Boost Transactions ({txns.length})</h2>
      {txns.length === 0 ? (
        <p className="text-slate-500">No transactions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b">
              <tr><th>User</th><th>Listing</th><th>Amount</th><th>Days</th><th>Date</th></tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2">{t.user_email}</td>
                  <td>{t.listing_title}</td>
                  <td>${t.amount_paid}</td>
                  <td>{t.boost_duration_days}</td>
                  <td className="text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

