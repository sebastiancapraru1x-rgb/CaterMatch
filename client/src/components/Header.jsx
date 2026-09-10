import { Menu, PlusCircle, LogIn, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Header({ mode }) {
  const { user, logout, isStaff } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-600">
          <Menu className="h-5 w-5" />
          CaterMatch
        </Link>

        <p className="hidden text-xs text-slate-500 sm:block">
          {mode === 'vendor_service' ? '🚚 Browse Food Trucks' : '🎪 Browse Event Gigs'}
        </p>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              {isStaff && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                >
                  🛠️ Dev
                </Link>
              )}
              <Link
                to="/listings/new"
                className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <PlusCircle className="h-4 w-4" /> Post
              </Link>
              <Link to="/messages" className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" title="Messages">
                <MessageSquare className="h-4 w-4" /> Messages
              </Link>
              <span className="hidden text-sm text-slate-600 sm:inline">{user.full_name}</span>
              <button onClick={logout} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogIn className="h-4 w-4" /> Login / Sign up
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}