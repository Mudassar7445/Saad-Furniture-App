'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ShopRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams ? searchParams.toString() : '';
    const target = params ? `/?tab=shop&${params}` : '/?tab=shop';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-serif">
          Opening Atelier Showroom...
        </span>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShopRedirectContent />
    </Suspense>
  );
}

