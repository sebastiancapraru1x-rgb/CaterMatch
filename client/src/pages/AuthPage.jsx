import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone_number: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) {
        await register(form.email, form.password, form.full_name, form.phone_number);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-[#FAFAF8] to-slate-100 px-4 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-soft dark:from-brand-600 dark:to-brand-800">
            🚚
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">CaterMatch</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRegister ? 'Create your free account' : 'Welcome back — log in'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
              <input
                value={form.full_name}
                onChange={set('full_name')}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
              <input
                value={form.phone_number}
                onChange={set('phone_number')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                placeholder="555-123-4567"
              />
            </div>
          )}

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {isRegister ? 'Already have an account?' : 'New to CaterMatch?'}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="font-semibold text-brand-600 hover:underline"
          >
            {isRegister ? 'Log in' : 'Sign up free'}
          </button>
        </p>
      </div>
    </div>
  );
}