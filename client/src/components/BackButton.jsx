import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Smart back button — uses browser history when available,
 * otherwise falls back to the marketplace home.
 */
export default function BackButton({ label = 'Back', className = '' }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-sand-50 px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
