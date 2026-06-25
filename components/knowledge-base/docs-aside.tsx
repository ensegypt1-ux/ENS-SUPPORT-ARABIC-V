"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Smile,
  Meh,
  Frown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCS_COPY } from "@/lib/docs-copy";

/** Inline "Was this helpful?" — article footer only. */
export function DocsFeedback() {
  const [feedback, setFeedback] = useState<"good" | "ok" | "bad" | null>(null);

  const options = [
    { key: "good", icon: Smile, label: "جيد" },
    { key: "ok", icon: Meh, label: "مقبول" },
    { key: "bad", icon: Frown, label: "سيء" },
  ] as const;

  return (
    <div
      className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4 sm:px-5"
      dir="rtl"
    >
      <p className="text-sm font-medium text-foreground">
        {DOCS_COPY.feedback.title}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {options.map((opt) => {
          const isActive = feedback === opt.key;
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFeedback(opt.key)}
              aria-label={`ملاحظات: ${opt.label}`}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-all",
                isActive
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
      {feedback ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {DOCS_COPY.feedback.thanks}
        </p>
      ) : null}
    </div>
  );
}

/** @deprecated Use DocsSupportStrip instead — kept for imports during migration. */
export function DocsHelpCard() {
  return (
    <Link
      href="/support/new"
      className="block rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-sm font-medium text-primary hover:bg-muted/40"
      dir="rtl"
    >
      {DOCS_COPY.supportStrip.cta}
    </Link>
  );
}

/** Removed from layout — related links added noise. */
export function DocsRelated() {
  return null;
}

/** @deprecated Right rail removed — use DocsSupportStrip on page footers. */
export function DocsRightRail() {
  return null;
}
