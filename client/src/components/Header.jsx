import { Menu, PlusCircle, LogIn, LogOut, MessageSquare, User, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
    navigate('/auth');
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-brand-600 dark:text-brand-400">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-amber-600">🚚 CaterMatch</span>
          </Link>
        </div>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              {isStaff && (
                <Link
                  to="/admin"
                  className="hidden items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 md:flex"
                >
                  Dev Tab
                </Link>
              )}
              <Link
                to="/listings/new"
                className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <PlusCircle className="h-4 w-4" /> Post
              </Link>
              <Link to="/messages" className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" title="Messages">
                <MessageSquare className="h-4 w-4" /> Messages
              </Link>
              <button
                onClick={toggleDark}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">{user.full_name}</span>
            </>
          ) : (
            <>
              <button
                onClick={toggleDark}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link
                to="/auth"
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LogIn className="h-4 w-4" /> Login
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Hamburger dropdown — aligned left to match button */}
      {menuOpen && user && (
        <div className="absolute top-14 left-4 z-20 w-56 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="p-2">
            <button
              onClick={handleProfile}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <User className="h-4 w-4" /> Profile
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
              <Settings className="h-4 w-4" /> Settings
            </button>
            <hr className="my-1 border-slate-200 dark:border-slate-700" />
            <button
              onClick={() => { logout(); setMenuOpen(false); navigate('/auth'); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}