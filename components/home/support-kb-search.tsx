"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { HOME_COPY } from "@/lib/home-support-copy";
import { supportMotion } from "@/lib/home-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SupportKbSearchProps {
  className?: string;
  id?: string;
}

export function SupportKbSearch({ className, id = "kb-search" }: SupportKbSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    startTransition(() => {
      router.push(q ? `/docs?q=${encodeURIComponent(q)}` : "/docs");
    });
  };

  return (
    <form
      onSubmit={submit}
      className={className}
      role="search"
      aria-label={HOME_COPY.hero.searchLabel}
    >
      <label htmlFor={id} className="sr-only">
        {HOME_COPY.hero.searchLabel}
      </label>
      <div
        className={cn(
          "flex w-full flex-col gap-2 p-1 sm:flex-row sm:items-stretch sm:p-0.5",
          supportMotion.searchShell,
        )}
      >
        <div className="relative flex-1">
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 transition-colors duration-200",
              isFocused ? "text-primary" : "text-muted-foreground",
            )}
            aria-hidden
          />
          <Input
            id={id}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={HOME_COPY.hero.searchPlaceholder}
            disabled={isPending}
            className={cn(
              "h-11 rounded-xl border-border/70 bg-background pe-4 ps-10 text-[15px] shadow-inner shadow-black/[0.02] sm:h-12",
              "transition-[border-color,box-shadow] duration-200 ease-out",
              "focus-visible:border-primary/45 focus-visible:ring-0",
              isPending && "opacity-70",
            )}
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className={cn(
            "h-11 w-full rounded-xl px-6 font-semibold sm:h-12 sm:min-w-[5.5rem] sm:w-auto",
            supportMotion.button,
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span className="sr-only">جاري البحث</span>
            </>
          ) : (
            HOME_COPY.hero.searchButton
          )}
        </Button>
      </div>
    </form>
  );
}
