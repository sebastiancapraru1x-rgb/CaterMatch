import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

async function checkStaff() {
  try {
    const res = await api.get('/api/admin/me');
    return res.data?.is_staff === true;
  } catch {
    return false;
  }
}

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
        return checkStaff();
      })
      .then((staff) => setIsStaff(staff))
      .catch(() => {
        localStorage.removeItem('cm_token');
      })
      .finally(() => setLoading(false));
  }, []);

  function login(email, password) {
    return api.post('/auth/login', { email, password }).then((res) => {
      localStorage.setItem('cm_token', res.data.token);
      setUser(res.data.user);
      checkStaff().then((staff) => setIsStaff(staff));
      return res.data.user;
    });
  }

  function register(email, password, fullName, phone) {
    return api.post('/auth/register', { email, password, full_name: fullName, phone_number: phone }).then((res) => {
      localStorage.setItem('cm_token', res.data.token);
      setUser(res.data.user);
      checkStaff().then((staff) => setIsStaff(staff));
      return res.data.user;
    });
  }

  function logout() {
    localStorage.removeItem('cm_token');
    setUser(null);
    setIsStaff(false);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, login, register, loading, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}