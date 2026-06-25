import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicTicketForm } from "@/components/tickets/public-ticket-form";
import { getAppMetadata } from "@/lib/settings-utils";
import { getPublicHomeContent } from "@/lib/public-home-content";
import { ENS_BRAND } from "@/lib/ens-brand";

export async function generateMetadata(): Promise<Metadata> {
  const app = await getAppMetadata();
  const appName =
    typeof app.title === "string" ? app.title : ENS_BRAND.portalTitle;
  return {
    title: `افتح تذكرة | ${appName}`,
    description:
      "أرسل تذكرة دعم إلى ENS — لا يلزم حساب. صِف مشكلتك وسيتابعها فريق الدعم عبر البريد.",
  };
}

export default function PublicNewTicketPage() {
  const content = getPublicHomeContent();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader variant="landing" header={content?.header} />
      <main className="relative isolate flex-1" dir="rtl">
        <div
          aria-hidden
          className="support-hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(420px,55vh)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-gradient-to-b from-muted/40 via-background to-background"
        />
        <Suspense fallback={null}>
          <PublicTicketForm />
        </Suspense>
      </main>
      <PublicFooter content={content?.footer} />
    </div>
  );
}
