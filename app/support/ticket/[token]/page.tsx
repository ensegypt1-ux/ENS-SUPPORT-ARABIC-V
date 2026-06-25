import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { GuestTicketView } from "@/components/tickets/guest-ticket-view";
import { getAppMetadata } from "@/lib/settings-utils";
import { getPublicHomeContent } from "@/lib/public-home-content";

export async function generateMetadata(): Promise<Metadata> {
  const app = await getAppMetadata();
  const appName = typeof app.title === "string" ? app.title : "Support";
  return {
    title: `Your Ticket | ${appName}`,
    description: "اعرض حالة تذكرة الدعم ورد على فريقنا.",
    robots: { index: false, follow: false },
  };
}

export default async function GuestTicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const content = getPublicHomeContent();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader variant="landing" header={content?.header} />
      <main className="relative isolate flex-1" dir="rtl">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/50 via-background to-background"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-primary/[0.07] to-transparent"
        />
        <GuestTicketView token={token} />
      </main>
      <PublicFooter content={content?.footer} />
    </div>
  );
}
