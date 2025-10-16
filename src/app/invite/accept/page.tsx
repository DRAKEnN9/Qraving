"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const q = new URLSearchParams(Array.from(params.entries()));
    router.replace(`/invite/register?${q.toString()}`);
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-slate-700">Redirecting to registration…</p>
      </div>
    </div>
  );
}
