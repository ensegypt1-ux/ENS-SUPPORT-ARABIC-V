"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCS_COPY } from "@/lib/docs-copy";

type DocsSearchInputProps = {
  variant?: "hero" | "compact";
  className?: string;
};

export function DocsSearchInput({
  variant = "compact",
  className,
}: DocsSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const query = searchParams.get("q") ?? "";

  const setQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isHero = variant === "hero";

  return (
    <div className={cn("relative w-full", className)} dir="rtl">
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground/60",
          isHero ? "start-4 h-5 w-5" : "start-3.5 h-4 w-4"
        )}
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={DOCS_COPY.searchPlaceholder}
        aria-label={DOCS_COPY.searchPlaceholder}
        className={cn(
          "w-full rounded-2xl border border-border bg-background text-foreground outline-none transition-[border-color,box-shadow]",
          "placeholder:text-muted-foreground/65 focus:border-primary/40 focus:ring-4 focus:ring-primary/10",
          isHero
            ? "h-14 pe-16 ps-12 text-base shadow-sm sm:h-[3.75rem] sm:text-[17px]"
            : "h-10 pe-14 ps-10 text-sm bg-muted/40 focus:bg-background"
        )}
      />
      <kbd
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
          isHero ? "end-4 hidden sm:inline-block" : "end-3"
        )}
      >
        {DOCS_COPY.searchShortcut}
      </kbd>
      {isHero ? (
        <p className="mt-2.5 text-center text-xs text-muted-foreground sm:text-start">
          {DOCS_COPY.searchHint}
        </p>
      ) : null}
    </div>
  );
}

export function useDocsSearchQuery(): string {
  const searchParams = useSearchParams();
  return (searchParams.get("q") ?? "").trim().toLowerCase();
}
