'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import toast from 'react-hot-toast';

function SignupPageContent() {
  const router = useRouter();
  const search = useSearchParams();
  const selectedPlan = (search.get('plan') === 'advance' ? 'advance' : 'basic');
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGooglePasswordForm, setShowGooglePasswordForm] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store token
      localStorage.setItem('token', data.token);
      
      // Redirect to subscription flow with selected plan
      router.push(`/billing/subscribe?plan=${selectedPlan}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    const result = await signInWithGoogle();
    
    if (result) {
      try {
        // Send Google ID token to backend
        const response = await fetch('/api/auth/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            idToken: result.idToken,
            isNewUser: result.isNewUser 
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Google sign-up failed');
        }

        // If this is a new Google user, require password setup
        if (data.user.isNewGoogleUser) {
          setGoogleUserData(data);
          setName(data.user.name);
          setEmail(data.user.email);
          setShowGooglePasswordForm(true);
          toast.success('Google account connected! Please create a password to continue.');
        } else {
          // Existing user, proceed directly
          localStorage.setItem('token', data.token);
          toast.success('Signed up successfully!');
          router.push(`/billing/subscribe?plan=${selectedPlan}`);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleGooglePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Update user with backup password
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${googleUserData.token}`
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password');
      }

      localStorage.setItem('token', googleUserData.token);
      toast.success('Account created successfully!');
      router.push(`/billing/subscribe?plan=${selectedPlan}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-gray-600">Start managing your restaurant menu today</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          {showGooglePasswordForm ? (
            <form onSubmit={handleGooglePasswordSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                <p><strong>Google Account Connected!</strong></p>
                <p>Please create a password to complete your account setup.</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Create a password for email/password login (minimum 6 characters)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !password || password.length < 6}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading || googleLoading}
                className="mt-3 w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? 'Signing up with Google...' : 'Sign up with Google'}
              </button>
            </div>
            </>
          )}
          
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}
