'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="mx-4 max-w-md text-center">
            <div className="mb-8">
              <div className="mb-4 text-9xl font-bold text-gray-300">500</div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong!</h1>
              <p className="text-gray-600">
                A critical error occurred. Please try refreshing the page.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => reset()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
