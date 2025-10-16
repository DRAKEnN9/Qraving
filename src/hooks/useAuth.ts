import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string; // global role
  accountRole?: 'owner' | 'admin'; // role within current account context
  effectiveOwnerId?: string; // mapped owner id for account context
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    // Persist token for client fetches
    localStorage.setItem('token', data.token);
    // Also set a cookie so server routes can authenticate even if headers are stripped
    try {
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      document.cookie = `token=${data.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    } catch {}
    setUser(data.user);
    return data;
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    try {
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      document.cookie = `token=${data.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    } catch {}
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    try {
      // Expire the token cookie
      document.cookie = 'token=; Path=/; Max-Age=0; SameSite=Lax';
    } catch {}
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };
}
