'use client';

import { useEffect } from 'react';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-4 max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong!</h1>
          <p className="text-gray-600">
            An unexpected error occurred. Please try again or go back to the home page.
          </p>
          {error.message && (
            <p className="mt-2 text-sm text-gray-500">Error: {error.message}</p>
          )}
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
