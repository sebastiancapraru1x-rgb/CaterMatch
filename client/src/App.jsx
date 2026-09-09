import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import BrowsePage from './pages/BrowsePage';
import AuthPage from './pages/AuthPage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailPage from './pages/ListingDetailPage';
import MessagesPage from './pages/MessagesPage';
import BoostPage from './pages/BoostPage';
import AdminPage from './pages/AdminPage';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/listings/new"
            element={<Protected><CreateListingPage /></Protected>}
          />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route
            path="/messages"
            element={<Protected><MessagesPage /></Protected>}
          />
          <Route path="/boost" element={<BoostPage />} />
<Route path="/admin" element={<Protected><AdminPage /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}