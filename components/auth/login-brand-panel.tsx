import Link from "next/link";
import { BookOpen, Headset, Ticket } from "lucide-react";

import { LayoutLogo } from "@/components/layout/logo";
import { ENS_BRAND } from "@/lib/ens-brand";
import { cn } from "@/lib/utils";

const HIGHLIGHT_ICONS = [Ticket, Headset, BookOpen] as const;

interface LoginBrandPanelProps {
  variant?: "full" | "compact";
  className?: string;
}

export function LoginBrandPanel({
  variant = "full",
  className,
}: LoginBrandPanelProps) {
  const isCompact = variant === "compact";

  return (
    <aside
      className={cn(
        "relative overflow-hidden text-foreground",
        isCompact
          ? "border-b border-border/50 bg-background px-4 py-8 sm:px-6"
          : "flex flex-col justify-between bg-background px-8 py-10 xl:px-12",
        className
      )}
      aria-label="معلومات بوابة الدعم"
    >
      {!isCompact && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -start-24 top-0 h-72 w-72 rounded-full bg-primary/[0.07] blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -end-16 bottom-0 h-56 w-56 rounded-full bg-primary/[0.05] blur-3xl"
          />
        </>
      )}

      <div className={cn("relative", isCompact && "mx-auto w-full max-w-md")}>
        <div className={cn("flex items-center gap-3", isCompact && "justify-center")}>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary",
              isCompact ? "h-11 w-11" : "h-12 w-12"
            )}
          >
            <Headset className={isCompact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={1.75} />
          </div>
          <div className={cn(isCompact && "text-center")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {ENS_BRAND.tagline}
            </p>
            <h1
              className={cn(
                "font-bold tracking-tight text-foreground",
                isCompact ? "text-xl" : "text-2xl xl:text-[1.65rem]"
              )}
            >
              {ENS_BRAND.loginHeroTitle}
            </h1>
          </div>
        </div>

        <p
          className={cn(
            "mt-4 max-w-md text-sm leading-relaxed text-muted-foreground",
            isCompact ? "mx-auto text-center" : "text-start"
          )}
        >
          {ENS_BRAND.loginHeroDescription}
        </p>

        {!isCompact && (
          <ul className="mt-10 space-y-4">
            {ENS_BRAND.loginHighlights.map((item, index) => {
              const Icon = HIGHLIGHT_ICONS[index] ?? Ticket;
              return (
                <li
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/70 px-4 py-3.5 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/20"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 text-start">
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!isCompact && (
        <div className="relative mt-10 flex items-center justify-between gap-4 border-t border-border/40 pt-6">
          <LayoutLogo width={96} height={32} className="h-6 w-auto opacity-90" />
          <Link
            href="https://ens.eg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            ens.eg
          </Link>
        </div>
      )}
    </aside>
  );
}
