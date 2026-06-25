import Link from "next/link";

import { LayoutLogo } from "@/components/layout/logo";
import { ENS_BRAND } from "@/lib/ens-brand";

export function AuthPortalChrome({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-muted/25">
      <header className="sticky top-0 z-20 shrink-0 border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="shrink-0 transition-opacity hover:opacity-90"
            aria-label={ENS_BRAND.portalFullTitle}
          >
            <LayoutLogo width={112} height={36} className="h-7 w-auto" />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/docs"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              قاعدة المعرفة
            </Link>
            <Link
              href="/"
              className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              مركز الدعم
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="shrink-0 border-t border-border/40 bg-background/60 px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          {ENS_BRAND.copyright(year)} · {ENS_BRAND.portalFullTitle}
        </p>
      </footer>
    </div>
  );
}
