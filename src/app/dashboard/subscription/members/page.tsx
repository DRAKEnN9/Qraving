"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function MembersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings?tab=team');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-slate-700">Redirecting to Team settings…</p>
      </div>
    </div>
  );
}
