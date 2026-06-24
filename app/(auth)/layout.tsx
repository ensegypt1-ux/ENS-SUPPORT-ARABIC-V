import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { getPublicHomeContent } from "@/lib/public-home-content";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = getPublicHomeContent();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader variant="auth" header={content.header} />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <PublicFooter content={content.footer} />
    </div>
  );
}
