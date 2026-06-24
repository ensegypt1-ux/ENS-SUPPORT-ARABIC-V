import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

import { OfflineRetryButton } from "@/components/pwa/offline-retry-button";
import { ENS_BRAND } from "@/lib/ens-brand";

export const metadata: Metadata = {
  title: "غير متصل",
  description: "تظهر هذه الصفحة عند انقطاع الاتصال بالإنترنت.",
};

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#edf0f4] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_5%,rgba(59,130,246,0.14),transparent_45%)]"
      />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/70 bg-white px-8 py-10 text-center shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <WifiOff className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          أنت غير متصل
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          تحتاج {ENS_BRAND.portalTitle} إلى اتصال بالإنترنت.  التحقق من
          اتصالك والمحاولة مرة أخرى.
        </p>
        <div className="mt-8 flex justify-center">
          <OfflineRetryButton />
        </div>
      </div>
    </main>
  );
}
