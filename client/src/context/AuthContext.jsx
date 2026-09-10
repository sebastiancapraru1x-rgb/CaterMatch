import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On first load, if we have a stored token, fetch the profile.
    const token = localStorage.getItem('cm_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        // Check staff status
        return api.get('/api/admin/me').catch(() => null);
      })
      .then((staffRes) => {
        if (staffRes?.data?.is_staff) setIsStaff(true);
      })
      .catch(() => {
        localStorage.removeItem('cm_token');
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem('cm_token');
    setUser(null);
    setIsStaff(false);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}