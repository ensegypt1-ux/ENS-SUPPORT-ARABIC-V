import Link from "next/link";
import { LifeBuoy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCS_COPY } from "@/lib/docs-copy";
import { cn } from "@/lib/utils";

export function DocsSupportStrip({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "mt-10 flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/25 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
        className
      )}
      dir="rtl"
    >
      <div className="flex items-start gap-3 sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {DOCS_COPY.supportStrip.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {DOCS_COPY.supportStrip.description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <Button asChild size="sm" className="h-10 rounded-xl px-4">
          <Link href="/support/new">{DOCS_COPY.supportStrip.cta}</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="h-10 rounded-xl">
          <Link
            href="/#faq"
            className="inline-flex items-center gap-1 text-muted-foreground"
          >
            {DOCS_COPY.supportStrip.faq}
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
