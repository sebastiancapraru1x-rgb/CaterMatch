import { Menu, PlusCircle, LogIn, LogOut, MessageSquare, User, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TruckMark } from './BrandMarks';

export default function Header({ mode }) {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('dark') === 'true';
    setDark(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('dark', next);
    document.documentElement.classList.toggle('dark', next);
  }

  function handleProfile() {
    setMenuOpen(false);
    navigate('/profile');
  }

  function handleSettings() {
    setMenuOpen(false);
    navigate('/profile?tab=preferences');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/80 bg-sand-50/85 dark:border-slate-700/70 dark:bg-slate-900/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-1.5 text-slate-600 transition hover:bg-sand-200 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              {menuOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-52 rounded-xl border border-sand-200 bg-sand-50 py-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <button
                    onClick={handleProfile}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-sand-200 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <User className="h-4 w-4" /> Profile
                  </button>
                  <button
                    onClick={handleSettings}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-sand-200 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                  <hr className="my-1 border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={() => { logout(); setMenuOpen(false); navigate('/auth'); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
            <TruckMark className="h-6 w-6" />
            <span>CaterMatch</span>
          </Link>
        </div>

        <nav className="flex items-center gap-2.5">
          {user ? (
            <>
              {isStaff && (
                <Link
                  to="/admin"
                  className="hidden items-center gap-1 rounded-xl border border-amber-300/70 bg-amber-50/70 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 md:flex dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  Dev Tab
                </Link>
              )}
              <Link
                to="/listings/new"
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-soft dark:bg-brand-500"
              >
                <PlusCircle className="h-4 w-4" /> Post
              </Link>
              <Link
                to="/messages"
                title="Messages"
                className="flex items-center gap-1.5 rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-sm text-slate-600 transition hover:bg-sand-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <MessageSquare className="h-4 w-4" /> <span className="hidden md:inline">Messages</span>
              </Link>
              <button
                onClick={toggleDark}
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-sand-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>
              <span className="hidden items-center rounded-full border border-sand-300 bg-sand-200/70 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {user.full_name}
              </span>
            </>
          ) : (
            <>
              <button
                onClick={toggleDark}
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-sand-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>
              <Link
                to="/auth"
                className="flex items-center gap-1.5 rounded-xl border border-sand-300 bg-sand-50 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sand-100"
              >
                <LogIn className="h-4 w-4" /> Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}